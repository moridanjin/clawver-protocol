import { FastifyInstance } from 'fastify';
import { getDb } from '../db';
import { executeSandboxed } from '../sandbox';
import { validateInput, validateOutput } from '../validator';
import { settlePayment } from '../wallet';
import { isX402Payment } from '../wallet';
import { isX402Enabled, extractPaymentHeader, createPaymentRequired, verifyAndSettle, encodePaymentResponse } from '../x402';
import { computeExecutionHash } from '../proof';

export async function executeRoutes(app: FastifyInstance) {
  app.post('/execute/:skillId', async (request, reply) => {
    const { skillId } = request.params as any;
    const { input } = request.body as any;
    const callerId = request.authAgent!.id;

    const db = getDb();

    const { data: skill } = await db.from('skills').select('*').eq('id', skillId).single();
    if (!skill) return reply.status(404).send({ error: 'Skill not found' });

    const { data: caller } = await db.from('agents').select('*').eq('id', callerId).single();
    if (!caller) return reply.status(404).send({ error: 'Caller agent not found' });

    // -- x402 Payment Gate --
    // If skill has a price, check for x402 payment before executing
    let x402TxHash: string | null = null;
    let x402Requirements: any = null;

    if (skill.price > 0 && isX402Enabled()) {
      const headers = request.headers as Record<string, string | string[] | undefined>;
      const paymentHeader = extractPaymentHeader(headers);

      if (!paymentHeader) {
        // No payment header — return 402 Payment Required
        const { data: owner } = await db.from('agents')
          .select('wallet_address').eq('id', skill.owner_id).single();
        const payTo = owner?.wallet_address || '';
        const resourceUrl = `${request.protocol}://${request.hostname}/execute/${skillId}`;

        const { status, body, requirements } = await createPaymentRequired(
          skill.price, payTo, resourceUrl,
        );
        return reply.status(status).send(body);
      }

      // Payment header present — verify and settle via facilitator
      const { data: owner } = await db.from('agents')
        .select('wallet_address').eq('id', skill.owner_id).single();
      const payTo = owner?.wallet_address || '';
      const resourceUrl = `${request.protocol}://${request.hostname}/execute/${skillId}`;

      // Re-create requirements for verification (must match what was sent in 402)
      const { requirements } = await createPaymentRequired(skill.price, payTo, resourceUrl);
      x402Requirements = requirements;

      const settlement = await verifyAndSettle(paymentHeader, requirements);
      if (!settlement.success) {
        return reply.status(402).send({
          error: 'Payment failed',
          details: settlement.error,
        });
      }
      x402TxHash = settlement.txHash;
    }

    // Create execution record
    const { data: execution } = await db.from('executions').insert({
      skill_id: skillId, caller_id: callerId,
      input: input || {}, status: 'running',
    }).select().single();

    const executionId = execution!.id;

    // Step 1: Validate input
    const inputValidation = validateInput(skill.input_schema, input || {});
    if (!inputValidation.valid) {
      await db.from('executions').update({
        status: 'failed',
        error: `Input validation failed: ${inputValidation.errors?.join(', ')}`,
        completed_at: new Date().toISOString(),
      }).eq('id', executionId);

      return reply.status(400).send({
        executionId, status: 'failed', phase: 'input_validation',
        errors: inputValidation.errors,
      });
    }

    // Step 2: Execute in sandbox
    const result = await executeSandboxed(
      skill.code, input || {}, skill.timeout_ms, skill.max_memory_mb,
    );

    if (!result.success) {
      const status = result.error?.includes('timed out') ? 'timeout' : 'failed';
      await db.from('executions').update({
        status, error: result.error,
        execution_time_ms: result.executionTimeMs,
        completed_at: new Date().toISOString(),
      }).eq('id', executionId);

      return reply.status(500).send({
        executionId, status, phase: 'execution',
        error: result.error, executionTimeMs: result.executionTimeMs,
      });
    }

    // Step 3: Validate output
    const outputValidation = validateOutput(skill.output_schema, result.output);

    // Step 4: Settle payment
    let txSignature: string | null = x402TxHash;

    // If x402 was not used (disabled or free skill), fall back to AgentWallet
    if (!txSignature && outputValidation.valid && skill.price > 0 && !isX402Enabled()) {
      const { data: owner } = await db.from('agents')
        .select('wallet_address').eq('id', skill.owner_id).single();
      if (owner?.wallet_address) {
        txSignature = await settlePayment(owner.wallet_address, skill.price);
      }
    }

    // Step 5: Compute execution proof hash
    const completedAt = new Date().toISOString();
    const proof = computeExecutionHash(
      executionId, skillId, callerId,
      input || {}, result.output, completedAt,
    );

    // Step 6: Update records
    await db.from('executions').update({
      status: 'success', output: result.output,
      validated: outputValidation.valid,
      execution_time_ms: result.executionTimeMs,
      tx_signature: txSignature,
      execution_hash: proof.executionHash,
      completed_at: completedAt,
    }).eq('id', executionId);

    // Atomic counter increments (no read-then-write race conditions)
    await db.rpc('increment_execution_count', { p_skill_id: skillId });
    await db.rpc('increment_skills_executed', { p_agent_id: callerId });

    if (outputValidation.valid) {
      await db.rpc('increment_reputation', { agent_id: skill.owner_id, amount: 1 });
    }

    // Add PAYMENT-RESPONSE header if x402 was used
    if (x402TxHash) {
      reply.header('PAYMENT-RESPONSE', encodePaymentResponse({
        success: true,
        transaction: x402TxHash,
        network: process.env.X402_NETWORK || 'solana-devnet',
      }));
    }

    return {
      executionId,
      status: 'success',
      phases: {
        inputValidation: { valid: true },
        execution: { success: true, executionTimeMs: result.executionTimeMs },
        outputValidation: { valid: outputValidation.valid, errors: outputValidation.errors },
        payment: {
          method: x402TxHash ? 'x402' : (txSignature ? 'agent-wallet' : 'none'),
          amount: skill.price,
          txSignature,
          settled: !!txSignature,
        },
      },
      output: result.output,
      validated: outputValidation.valid,
      executionHash: proof.executionHash,
    };
  });

  // Get execution details
  app.get('/executions/:executionId', async (request, reply) => {
    const { executionId } = request.params as any;
    const db = getDb();

    const { data, error } = await db.from('executions').select('*').eq('id', executionId).single();
    if (error || !data) return reply.status(404).send({ error: 'Execution not found' });

    return {
      id: data.id, skillId: data.skill_id, callerId: data.caller_id,
      input: data.input, output: data.output, status: data.status,
      validated: data.validated, executionTimeMs: data.execution_time_ms,
      error: data.error, txSignature: data.tx_signature,
      executionHash: data.execution_hash,
      createdAt: data.created_at, completedAt: data.completed_at,
    };
  });

  // Verify execution proof — anyone can recompute the hash to verify integrity
  app.get('/executions/:executionId/verify', async (request, reply) => {
    const { executionId } = request.params as any;
    const db = getDb();

    const { data, error } = await db.from('executions').select('*').eq('id', executionId).single();
    if (error || !data) return reply.status(404).send({ error: 'Execution not found' });

    if (data.status !== 'success' || !data.execution_hash) {
      return reply.status(400).send({
        error: 'No proof available',
        reason: data.status !== 'success'
          ? 'Execution did not complete successfully'
          : 'Execution predates proof system',
      });
    }

    // Recompute hash from stored data
    const proof = computeExecutionHash(
      data.id, data.skill_id, data.caller_id,
      data.input, data.output, data.completed_at,
    );

    const verified = proof.executionHash === data.execution_hash;

    return {
      verified,
      executionId: data.id,
      executionHash: data.execution_hash,
      recomputedHash: proof.executionHash,
      proof: {
        skillId: proof.skillId,
        callerId: proof.callerId,
        inputHash: proof.inputHash,
        outputHash: proof.outputHash,
        timestamp: proof.timestamp,
      },
      txSignature: data.tx_signature,
    };
  });
}
