import { FastifyInstance } from 'fastify';
import { getDb } from '../db';
import { executeSandboxed } from '../sandbox';
import { validateInput, validateOutput } from '../validator';
import { settlePayment } from '../wallet';

export async function executeRoutes(app: FastifyInstance) {
  app.post('/execute/:skillId', async (request, reply) => {
    const { skillId } = request.params as any;
    const { callerId, input } = request.body as any;

    if (!callerId) {
      return reply.status(400).send({ error: 'callerId is required' });
    }

    const db = getDb();

    const { data: skill } = await db.from('skills').select('*').eq('id', skillId).single();
    if (!skill) return reply.status(404).send({ error: 'Skill not found' });

    const { data: caller } = await db.from('agents').select('*').eq('id', callerId).single();
    if (!caller) return reply.status(404).send({ error: 'Caller agent not found' });

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
    let txSignature: string | null = null;
    if (outputValidation.valid && skill.price > 0) {
      const { data: owner } = await db.from('agents')
        .select('wallet_address').eq('id', skill.owner_id).single();
      if (owner?.wallet_address) {
        txSignature = await settlePayment(owner.wallet_address, skill.price);
      }
    }

    // Step 5: Update records
    await db.from('executions').update({
      status: 'success', output: result.output,
      validated: outputValidation.valid,
      execution_time_ms: result.executionTimeMs,
      tx_signature: txSignature,
      completed_at: new Date().toISOString(),
    }).eq('id', executionId);

    await db.from('skills').update({
      execution_count: skill.execution_count + 1,
      updated_at: new Date().toISOString(),
    }).eq('id', skillId);

    await db.from('agents').update({
      skills_executed: caller.skills_executed + 1,
    }).eq('id', callerId);

    if (outputValidation.valid) {
      const { data: ownerAgent } = await db.from('agents')
        .select('reputation').eq('id', skill.owner_id).single();
      await db.from('agents').update({
        reputation: (ownerAgent?.reputation || 0) + 1,
      }).eq('id', skill.owner_id);
    }

    return {
      executionId,
      status: 'success',
      phases: {
        inputValidation: { valid: true },
        execution: { success: true, executionTimeMs: result.executionTimeMs },
        outputValidation: { valid: outputValidation.valid, errors: outputValidation.errors },
        payment: { amount: skill.price, txSignature, settled: !!txSignature },
      },
      output: result.output,
      validated: outputValidation.valid,
    };
  });

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
      createdAt: data.created_at, completedAt: data.completed_at,
    };
  });
}
