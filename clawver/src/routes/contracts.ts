import { FastifyInstance } from 'fastify';
import { getDb } from '../db';
import { executeSandboxed } from '../sandbox';
import { validateInput, validateOutput } from '../validator';
import { settlePayment } from '../wallet';
import { isX402Enabled, extractPaymentHeader, createPaymentRequired, verifyAndSettle, encodePaymentResponse } from '../x402';
import { computeExecutionHash } from '../proof';

export async function contractRoutes(app: FastifyInstance) {

  // Create contract — escrow funds immediately
  app.post('/contracts', async (request, reply) => {
    const { providerId, skillId, input } = request.body as any;
    const clientId = request.authAgent!.id;

    if (!providerId || !skillId) {
      return reply.status(400).send({ error: 'providerId and skillId are required' });
    }

    const db = getDb();

    const [{ data: provider }, { data: skill }] = await Promise.all([
      db.from('agents').select('id').eq('id', providerId).single(),
      db.from('skills').select('*').eq('id', skillId).single(),
    ]);

    if (!provider) return reply.status(404).send({ error: 'Provider agent not found' });
    if (!skill) return reply.status(404).send({ error: 'Skill not found' });

    if (input) {
      const validation = validateInput(skill.input_schema, input);
      if (!validation.valid) {
        return reply.status(400).send({ error: 'Input validation failed', details: validation.errors });
      }
    }

    // Escrow payment via x402 or legacy
    let escrowTx: string | null = null;

    if (skill.price > 0 && isX402Enabled()) {
      const headers = request.headers as Record<string, string | string[] | undefined>;
      const paymentHeader = extractPaymentHeader(headers);

      if (!paymentHeader) {
        // Return 402 — client must pay escrow upfront
        const { data: owner } = await db.from('agents')
          .select('wallet_address').eq('id', skill.owner_id).single();
        const payTo = owner?.wallet_address || '';
        const resourceUrl = `${request.protocol}://${request.hostname}/contracts`;

        const { status, body } = await createPaymentRequired(skill.price, payTo, resourceUrl);
        return reply.status(status).send(body);
      }

      // Verify and settle escrow payment
      const { data: owner } = await db.from('agents')
        .select('wallet_address').eq('id', skill.owner_id).single();
      const payTo = owner?.wallet_address || '';
      const resourceUrl = `${request.protocol}://${request.hostname}/contracts`;

      const { requirements } = await createPaymentRequired(skill.price, payTo, resourceUrl);
      const settlement = await verifyAndSettle(paymentHeader, requirements);

      if (!settlement.success) {
        return reply.status(402).send({ error: 'Escrow payment failed', details: settlement.error });
      }
      escrowTx = settlement.txHash;
    } else if (skill.price > 0) {
      // Legacy escrow marker
      escrowTx = `escrow:${Date.now()}:${skill.price}`;
    }

    const { data, error } = await db.from('contracts').insert({
      client_id: clientId, provider_id: providerId,
      skill_id: skillId, input: input || {}, price: skill.price,
      status: 'escrowed',
      escrow_tx: escrowTx,
      escrowed_at: new Date().toISOString(),
    }).select().single();

    if (error) return reply.status(500).send({ error: error.message });

    // Add PAYMENT-RESPONSE header if x402 was used
    if (escrowTx && !escrowTx.startsWith('escrow:')) {
      reply.header('PAYMENT-RESPONSE', encodePaymentResponse({
        success: true,
        transaction: escrowTx,
        network: process.env.X402_NETWORK || 'solana-devnet',
      }));
    }

    return reply.status(201).send(formatContract(data));
  });

  // Deliver contract — provider executes skill, validated output releases escrow
  app.post('/contracts/:id/deliver', async (request, reply) => {
    const { id } = request.params as any;
    const db = getDb();

    const { data: contract } = await db.from('contracts').select('*').eq('id', id).single();
    if (!contract) return reply.status(404).send({ error: 'Contract not found' });

    // Only the provider can deliver
    if (contract.provider_id !== request.authAgent!.id) {
      return reply.status(403).send({ error: 'Only the contract provider can deliver' });
    }

    if (contract.status !== 'escrowed') {
      return reply.status(400).send({ error: `Contract is '${contract.status}', expected 'escrowed'` });
    }

    const { data: skill } = await db.from('skills').select('*').eq('id', contract.skill_id).single();
    if (!skill) return reply.status(404).send({ error: 'Skill not found' });

    const result = await executeSandboxed(skill.code, contract.input, skill.timeout_ms, skill.max_memory_mb);

    if (!result.success) {
      await db.from('contracts').update({
        status: 'disputed',
        dispute_reason: `Execution failed: ${result.error}`,
        disputed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', id);
      return reply.status(500).send({
        contractId: id, status: 'disputed', phase: 'execution', error: result.error,
      });
    }

    const validation = validateOutput(skill.output_schema, result.output);

    if (!validation.valid) {
      await db.from('contracts').update({
        output: result.output, validation_result: validation,
        status: 'disputed',
        dispute_reason: `Output validation failed: ${validation.errors?.join(', ')}`,
        disputed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', id);
      return reply.status(400).send({
        contractId: id, status: 'disputed', phase: 'output_validation',
        errors: validation.errors, output: result.output,
      });
    }

    // Output validated — release escrow to provider
    // If x402 escrow was used, the payment already went through on-chain.
    // For legacy escrow, settle via AgentWallet.
    let txSignature: string | null = null;
    const isX402Escrow = contract.escrow_tx && !contract.escrow_tx.startsWith('escrow:');

    if (isX402Escrow) {
      // x402 escrow already settled on-chain during contract creation
      txSignature = contract.escrow_tx;
    } else if (contract.price > 0) {
      // Legacy: settle via AgentWallet
      const { data: provider } = await db.from('agents')
        .select('wallet_address').eq('id', contract.provider_id).single();
      if (provider?.wallet_address) {
        txSignature = await settlePayment(provider.wallet_address, contract.price);
      }
    }

    // Compute execution proof
    const completedAt = new Date().toISOString();
    const proof = computeExecutionHash(
      id, contract.skill_id, contract.client_id,
      contract.input, result.output, completedAt,
    );

    await db.from('contracts').update({
      output: result.output, validation_result: validation,
      status: 'settled', settle_tx: txSignature,
      updated_at: completedAt,
    }).eq('id', id);

    // Atomic counter increments
    await db.rpc('increment_reputation', { agent_id: contract.provider_id, amount: 1 });
    await db.rpc('increment_execution_count', { p_skill_id: contract.skill_id });

    return {
      contractId: id, status: 'settled', output: result.output,
      validated: true, executionTimeMs: result.executionTimeMs,
      executionHash: proof.executionHash,
      payment: {
        method: isX402Escrow ? 'x402' : (txSignature ? 'agent-wallet' : 'none'),
        amount: contract.price,
        txSignature,
        settled: !!txSignature,
      },
    };
  });

  // Dispute a contract — client challenges the result
  // System re-executes the skill to verify deterministic output
  app.post('/contracts/:id/dispute', async (request, reply) => {
    const { id } = request.params as any;
    const { reason } = request.body as any;
    const db = getDb();

    const { data: contract } = await db.from('contracts').select('*').eq('id', id).single();
    if (!contract) return reply.status(404).send({ error: 'Contract not found' });

    // Only client can dispute
    if (contract.client_id !== request.authAgent!.id) {
      return reply.status(403).send({ error: 'Only the contract client can dispute' });
    }

    // Can dispute settled or escrowed contracts
    if (contract.status !== 'settled' && contract.status !== 'escrowed') {
      return reply.status(400).send({
        error: `Cannot dispute contract in '${contract.status}' status`,
      });
    }

    const { data: skill } = await db.from('skills').select('*').eq('id', contract.skill_id).single();
    if (!skill) return reply.status(404).send({ error: 'Skill not found' });

    // Mark as disputed
    await db.from('contracts').update({
      status: 'disputed',
      dispute_reason: reason || 'Client disputed the result',
      disputed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    // Auto-resolution: re-execute the skill with same input
    const reExecution = await executeSandboxed(
      skill.code, contract.input, skill.timeout_ms, skill.max_memory_mb,
    );

    // If re-execution fails → client wins, refund
    if (!reExecution.success) {
      await db.from('contracts').update({
        status: 'refunded',
        resolution: 'client_wins',
        resolution_reason: `Re-execution failed: ${reExecution.error}`,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', id);

      return {
        contractId: id,
        status: 'refunded',
        resolution: 'client_wins',
        reason: `Re-execution failed: ${reExecution.error}`,
      };
    }

    // Validate re-execution output
    const validation = validateOutput(skill.output_schema, reExecution.output);

    if (!validation.valid) {
      // Output doesn't validate → client wins, refund
      await db.from('contracts').update({
        status: 'refunded',
        resolution: 'client_wins',
        resolution_reason: `Re-execution output invalid: ${validation.errors?.join(', ')}`,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', id);

      return {
        contractId: id,
        status: 'refunded',
        resolution: 'client_wins',
        reason: `Re-execution output failed validation`,
      };
    }

    // Re-execution succeeds and validates → provider wins
    // If contract was settled, payment stands. If escrowed, release to provider.
    let txSignature: string | null = contract.settle_tx;
    if (contract.status === 'escrowed' && contract.price > 0 && !txSignature) {
      const isX402Escrow = contract.escrow_tx && !contract.escrow_tx.startsWith('escrow:');
      if (isX402Escrow) {
        txSignature = contract.escrow_tx;
      } else {
        const { data: provider } = await db.from('agents')
          .select('wallet_address').eq('id', contract.provider_id).single();
        if (provider?.wallet_address) {
          txSignature = await settlePayment(provider.wallet_address, contract.price);
        }
      }
    }

    await db.from('contracts').update({
      status: 'settled',
      resolution: 'provider_wins',
      resolution_reason: 'Re-execution produced valid output — dispute rejected',
      resolved_at: new Date().toISOString(),
      settle_tx: txSignature,
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    return {
      contractId: id,
      status: 'settled',
      resolution: 'provider_wins',
      reason: 'Re-execution produced valid output — dispute rejected',
      reExecutionOutput: reExecution.output,
    };
  });

  // Get contract details
  app.get('/contracts/:id', async (request, reply) => {
    const { id } = request.params as any;
    const db = getDb();

    const { data } = await db.from('contracts').select('*').eq('id', id).single();
    if (!data) return reply.status(404).send({ error: 'Contract not found' });
    return formatContract(data);
  });

  // List contracts
  app.get('/contracts', async (request, reply) => {
    const db = getDb();
    const { agentId, status, limit = '20', offset = '0' } = request.query as any;

    // Clamp limit/offset
    const clampedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const clampedOffset = Math.max(Number(offset) || 0, 0);

    let query = db.from('contracts').select('*').order('created_at', { ascending: false })
      .range(clampedOffset, clampedOffset + clampedLimit - 1);

    if (agentId) {
      // Validate UUID format to prevent PostgREST filter injection
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(agentId)) {
        return reply.status(400).send({ error: 'Invalid agentId format' });
      }
      query = query.or(`client_id.eq.${agentId},provider_id.eq.${agentId}`);
    }

    if (status) {
      // Validate against known status values
      const validStatuses = ['escrowed', 'settled', 'disputed', 'refunded'];
      if (!validStatuses.includes(status)) {
        return reply.status(400).send({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      }
      query = query.eq('status', status);
    }

    const { data } = await query;
    return { contracts: (data || []).map(formatContract), count: (data || []).length };
  });
}

function formatContract(c: any) {
  return {
    id: c.id, clientId: c.client_id, providerId: c.provider_id,
    skillId: c.skill_id, input: c.input, output: c.output,
    price: c.price, status: c.status,
    escrowTx: c.escrow_tx, escrowedAt: c.escrowed_at,
    settleTx: c.settle_tx,
    validationResult: c.validation_result,
    disputeReason: c.dispute_reason, disputedAt: c.disputed_at,
    resolution: c.resolution, resolutionReason: c.resolution_reason,
    resolvedAt: c.resolved_at, refundTx: c.refund_tx,
    createdAt: c.created_at, updatedAt: c.updated_at,
  };
}
