import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db';
import { executeSandboxed } from '../sandbox';
import { validateInput, validateOutput } from '../validator';
import { settlePayment } from '../wallet';

export async function contractRoutes(app: FastifyInstance) {
  // Create a job contract (client requests work from provider via skill)
  app.post('/contracts', async (request, reply) => {
    const { clientId, providerId, skillId, input } = request.body as any;

    if (!clientId || !providerId || !skillId) {
      return reply.status(400).send({ error: 'clientId, providerId, and skillId are required' });
    }

    const db = getDb();

    // Verify all parties exist
    const client = db.prepare('SELECT id FROM agents WHERE id = ?').get(clientId);
    const provider = db.prepare('SELECT id FROM agents WHERE id = ?').get(providerId);
    const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(skillId) as any;

    if (!client) return reply.status(404).send({ error: 'Client agent not found' });
    if (!provider) return reply.status(404).send({ error: 'Provider agent not found' });
    if (!skill) return reply.status(404).send({ error: 'Skill not found' });

    // Validate input if provided
    if (input) {
      const inputSchema = JSON.parse(skill.inputSchema);
      const validation = validateInput(inputSchema, input);
      if (!validation.valid) {
        return reply.status(400).send({
          error: 'Input validation failed',
          details: validation.errors,
        });
      }
    }

    const id = uuid();

    db.prepare(`
      INSERT INTO contracts (id, clientId, providerId, skillId, input, price, status)
      VALUES (?, ?, ?, ?, ?, ?, 'created')
    `).run(id, clientId, providerId, skillId, JSON.stringify(input || {}), skill.price);

    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id) as any;

    return reply.status(201).send({
      ...contract,
      input: JSON.parse(contract.input),
    });
  });

  // Deliver work on a contract — executes skill, validates, settles
  app.post('/contracts/:id/deliver', async (request, reply) => {
    const { id } = request.params as any;
    const db = getDb();

    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id) as any;
    if (!contract) return reply.status(404).send({ error: 'Contract not found' });
    if (contract.status !== 'created' && contract.status !== 'escrowed') {
      return reply.status(400).send({ error: `Contract is in '${contract.status}' status, cannot deliver` });
    }

    const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(contract.skillId) as any;
    if (!skill) return reply.status(404).send({ error: 'Skill not found' });

    const input = JSON.parse(contract.input);
    const outputSchema = JSON.parse(skill.outputSchema);

    // Execute skill in sandbox
    const result = await executeSandboxed(skill.code, input, skill.timeoutMs, skill.maxMemoryMb);

    if (!result.success) {
      db.prepare(`
        UPDATE contracts SET status = 'disputed', updatedAt = datetime('now')
        WHERE id = ?
      `).run(id);

      return reply.status(500).send({
        contractId: id,
        status: 'disputed',
        phase: 'execution',
        error: result.error,
      });
    }

    // Validate output
    const validation = validateOutput(outputSchema, result.output);

    db.prepare(`
      UPDATE contracts SET output = ?, validationResult = ?, status = ?, updatedAt = datetime('now')
      WHERE id = ?
    `).run(
      JSON.stringify(result.output),
      JSON.stringify(validation),
      validation.valid ? 'validated' : 'disputed',
      id,
    );

    if (!validation.valid) {
      return reply.status(400).send({
        contractId: id,
        status: 'disputed',
        phase: 'output_validation',
        errors: validation.errors,
        output: result.output,
      });
    }

    // Settle payment
    let txSignature: string | null = null;
    if (contract.price > 0) {
      const provider = db.prepare('SELECT walletAddress FROM agents WHERE id = ?').get(contract.providerId) as any;
      if (provider?.walletAddress) {
        txSignature = await settlePayment(provider.walletAddress, contract.price);
      }
    }

    db.prepare(`
      UPDATE contracts SET status = 'settled', settleTx = ?, updatedAt = datetime('now')
      WHERE id = ?
    `).run(txSignature, id);

    // Update reputation
    db.prepare('UPDATE agents SET reputation = reputation + 1 WHERE id = ?').run(contract.providerId);
    db.prepare('UPDATE skills SET executionCount = executionCount + 1, updatedAt = datetime(\'now\') WHERE id = ?').run(contract.skillId);

    return {
      contractId: id,
      status: 'settled',
      output: result.output,
      validated: true,
      executionTimeMs: result.executionTimeMs,
      payment: {
        amount: contract.price,
        txSignature,
        settled: !!txSignature,
      },
    };
  });

  // Get contract status
  app.get('/contracts/:id', async (request, reply) => {
    const { id } = request.params as any;
    const db = getDb();

    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id) as any;
    if (!contract) return reply.status(404).send({ error: 'Contract not found' });

    return {
      ...contract,
      input: JSON.parse(contract.input),
      output: contract.output ? JSON.parse(contract.output) : null,
      validationResult: contract.validationResult ? JSON.parse(contract.validationResult) : null,
    };
  });

  // List contracts
  app.get('/contracts', async (request) => {
    const db = getDb();
    const { agentId, status, limit = '20', offset = '0' } = request.query as any;

    let query = 'SELECT * FROM contracts WHERE 1=1';
    const params: any[] = [];

    if (agentId) {
      query += ' AND (clientId = ? OR providerId = ?)';
      params.push(agentId, agentId);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const contracts = db.prepare(query).all(...params) as any[];

    return {
      contracts: contracts.map(c => ({
        ...c,
        input: JSON.parse(c.input),
        output: c.output ? JSON.parse(c.output) : null,
        validationResult: c.validationResult ? JSON.parse(c.validationResult) : null,
      })),
      count: contracts.length,
    };
  });
}
