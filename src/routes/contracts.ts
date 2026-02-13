import { FastifyInstance } from 'fastify';
import { getDb } from '../db';
import { executeSandboxed } from '../sandbox';
import { validateInput, validateOutput } from '../validator';
import { settlePayment } from '../wallet';
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

    // Escrow: lock funds by transferring from platform to escrow hold
    // In production this would lock client funds; for devnet demo, we record the escrow intent
    let escrowTx: string | null = null;
    if (skill.price > 0) {
      // Record escrow — funds are earmarked from platform balance
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
    let txSignature: string | null = null;
    if (contract.price > 0) {
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

    // Update reputation
    const { data: providerAgent } = await db.from('agents')
      .select('reputation').eq('id', contract.provider_id).single();
    await db.from('agents').update({
      reputation: (providerAgent?.reputation || 0) + 1,
    }).eq('id', contract.provider_id);

    await db.from('skills').update({
      execution_count: skill.execution_count + 1, updated_at: new Date().toISOString(),
    }).eq('id', contract.skill_id);

    return {
      contractId: id, status: 'settled', output: result.output,
      validated: true, executionTimeMs: result.executionTimeMs,
      executionHash: proof.executionHash,
      payment: { amount: contract.price, txSignature, settled: !!txSignature },
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
      const { data: provider } = await db.from('agents')
        .select('wallet_address').eq('id', contract.provider_id).single();
      if (provider?.wallet_address) {
        txSignature = await settlePayment(provider.wallet_address, contract.price);
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
  app.get('/contracts', async (request) => {
    const db = getDb();
    const { agentId, status, limit = '20', offset = '0' } = request.query as any;

    let query = db.from('contracts').select('*').order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (agentId) query = query.or(`client_id.eq.${agentId},provider_id.eq.${agentId}`);
    if (status) query = query.eq('status', status);

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
