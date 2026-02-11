import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db';
import { executeSandboxed } from '../sandbox';
import { validateInput, validateOutput } from '../validator';
import { settlePayment } from '../wallet';

export async function executeRoutes(app: FastifyInstance) {
  // Execute a skill — the core flow:
  // 1. Validate input against schema
  // 2. Run code in sandbox
  // 3. Validate output against schema
  // 4. Settle payment via AgentWallet
  // 5. Update reputation
  app.post('/execute/:skillId', async (request, reply) => {
    const { skillId } = request.params as any;
    const { callerId, input } = request.body as any;

    if (!callerId) {
      return reply.status(400).send({ error: 'callerId is required' });
    }

    const db = getDb();

    // Load skill
    const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(skillId) as any;
    if (!skill) {
      return reply.status(404).send({ error: 'Skill not found' });
    }

    // Verify caller exists
    const caller = db.prepare('SELECT * FROM agents WHERE id = ?').get(callerId) as any;
    if (!caller) {
      return reply.status(404).send({ error: 'Caller agent not found' });
    }

    const executionId = uuid();
    const inputSchema = JSON.parse(skill.inputSchema);
    const outputSchema = JSON.parse(skill.outputSchema);

    // Create execution record
    db.prepare(`
      INSERT INTO executions (id, skillId, callerId, input, status)
      VALUES (?, ?, ?, ?, 'running')
    `).run(executionId, skillId, callerId, JSON.stringify(input || {}));

    // Step 1: Validate input
    const inputValidation = validateInput(inputSchema, input || {});
    if (!inputValidation.valid) {
      db.prepare(`
        UPDATE executions SET status = 'failed', error = ?, completedAt = datetime('now')
        WHERE id = ?
      `).run(`Input validation failed: ${inputValidation.errors?.join(', ')}`, executionId);

      return reply.status(400).send({
        executionId,
        status: 'failed',
        phase: 'input_validation',
        errors: inputValidation.errors,
      });
    }

    // Step 2: Execute in sandbox
    const result = await executeSandboxed(
      skill.code,
      input || {},
      skill.timeoutMs,
      skill.maxMemoryMb,
    );

    if (!result.success) {
      const status = result.error?.includes('timed out') ? 'timeout' : 'failed';
      db.prepare(`
        UPDATE executions SET status = ?, error = ?, executionTimeMs = ?, completedAt = datetime('now')
        WHERE id = ?
      `).run(status, result.error, result.executionTimeMs, executionId);

      return reply.status(500).send({
        executionId,
        status,
        phase: 'execution',
        error: result.error,
        executionTimeMs: result.executionTimeMs,
      });
    }

    // Step 3: Validate output
    const outputValidation = validateOutput(outputSchema, result.output);

    // Step 4: Settle payment
    let txSignature: string | null = null;
    if (outputValidation.valid && skill.price > 0) {
      const owner = db.prepare('SELECT walletAddress FROM agents WHERE id = ?').get(skill.ownerId) as any;
      if (owner?.walletAddress) {
        txSignature = await settlePayment(owner.walletAddress, skill.price);
      }
    }

    // Step 5: Update execution record
    db.prepare(`
      UPDATE executions
      SET status = 'success', output = ?, validated = ?, executionTimeMs = ?,
          txSignature = ?, completedAt = datetime('now')
      WHERE id = ?
    `).run(
      JSON.stringify(result.output),
      outputValidation.valid ? 1 : 0,
      result.executionTimeMs,
      txSignature,
      executionId,
    );

    // Update skill execution count
    db.prepare('UPDATE skills SET executionCount = executionCount + 1, updatedAt = datetime(\'now\') WHERE id = ?')
      .run(skillId);

    // Update caller's execution count
    db.prepare('UPDATE agents SET skillsExecuted = skillsExecuted + 1 WHERE id = ?')
      .run(callerId);

    // Update owner reputation on successful validated execution
    if (outputValidation.valid) {
      db.prepare('UPDATE agents SET reputation = reputation + 1 WHERE id = ?')
        .run(skill.ownerId);
    }

    return {
      executionId,
      status: 'success',
      phases: {
        inputValidation: { valid: true },
        execution: {
          success: true,
          executionTimeMs: result.executionTimeMs,
        },
        outputValidation: {
          valid: outputValidation.valid,
          errors: outputValidation.errors,
        },
        payment: {
          amount: skill.price,
          txSignature,
          settled: !!txSignature,
        },
      },
      output: result.output,
      validated: outputValidation.valid,
    };
  });

  // Get execution details
  app.get('/executions/:executionId', async (request, reply) => {
    const { executionId } = request.params as any;
    const db = getDb();

    const exec = db.prepare('SELECT * FROM executions WHERE id = ?').get(executionId) as any;
    if (!exec) {
      return reply.status(404).send({ error: 'Execution not found' });
    }

    return {
      ...exec,
      input: JSON.parse(exec.input),
      output: exec.output ? JSON.parse(exec.output) : null,
      validated: !!exec.validated,
    };
  });
}
