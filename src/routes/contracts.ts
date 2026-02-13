import { FastifyInstance } from 'fastify';
import { getDb } from '../db';
import { executeSandboxed } from '../sandbox';
import { validateInput, validateOutput } from '../validator';
import { settlePayment } from '../wallet';

export async function contractRoutes(app: FastifyInstance) {
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

    const { data, error } = await db.from('contracts').insert({
      client_id: clientId, provider_id: providerId,
      skill_id: skillId, input: input || {}, price: skill.price,
      status: 'created',
    }).select().single();

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(201).send(formatContract(data));
  });

  app.post('/contracts/:id/deliver', async (request, reply) => {
    const { id } = request.params as any;
    const db = getDb();

    const { data: contract } = await db.from('contracts').select('*').eq('id', id).single();
    if (!contract) return reply.status(404).send({ error: 'Contract not found' });

    // Only the provider can deliver
    if (contract.provider_id !== request.authAgent!.id) {
      return reply.status(403).send({ error: 'Only the contract provider can deliver' });
    }

    if (contract.status !== 'created' && contract.status !== 'escrowed') {
      return reply.status(400).send({ error: `Contract is in '${contract.status}' status, cannot deliver` });
    }

    const { data: skill } = await db.from('skills').select('*').eq('id', contract.skill_id).single();
    if (!skill) return reply.status(404).send({ error: 'Skill not found' });

    const result = await executeSandboxed(skill.code, contract.input, skill.timeout_ms, skill.max_memory_mb);

    if (!result.success) {
      await db.from('contracts').update({ status: 'disputed', updated_at: new Date().toISOString() }).eq('id', id);
      return reply.status(500).send({
        contractId: id, status: 'disputed', phase: 'execution', error: result.error,
      });
    }

    const validation = validateOutput(skill.output_schema, result.output);

    await db.from('contracts').update({
      output: result.output, validation_result: validation,
      status: validation.valid ? 'validated' : 'disputed',
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    if (!validation.valid) {
      return reply.status(400).send({
        contractId: id, status: 'disputed', phase: 'output_validation',
        errors: validation.errors, output: result.output,
      });
    }

    let txSignature: string | null = null;
    if (contract.price > 0) {
      const { data: provider } = await db.from('agents')
        .select('wallet_address').eq('id', contract.provider_id).single();
      if (provider?.wallet_address) {
        txSignature = await settlePayment(provider.wallet_address, contract.price);
      }
    }

    await db.from('contracts').update({
      status: 'settled', settle_tx: txSignature, updated_at: new Date().toISOString(),
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
      payment: { amount: contract.price, txSignature, settled: !!txSignature },
    };
  });

  app.get('/contracts/:id', async (request, reply) => {
    const { id } = request.params as any;
    const db = getDb();

    const { data } = await db.from('contracts').select('*').eq('id', id).single();
    if (!data) return reply.status(404).send({ error: 'Contract not found' });
    return formatContract(data);
  });

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
    price: c.price, status: c.status, escrowTx: c.escrow_tx,
    settleTx: c.settle_tx, validationResult: c.validation_result,
    createdAt: c.created_at, updatedAt: c.updated_at,
  };
}
