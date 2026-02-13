import { FastifyInstance } from 'fastify';
import { getDb } from '../db';
import { getReputationBreakdown } from '../reputation';

export async function agentRoutes(app: FastifyInstance) {
  app.post('/agents', async (request, reply) => {
    const { name, description } = request.body as any;
    const walletAddress = request.authAgent!.walletAddress;

    if (!name) {
      return reply.status(400).send({ error: 'name is required' });
    }

    // Input length validation
    if (typeof name !== 'string' || name.length > 100) {
      return reply.status(400).send({ error: 'name must be a string of at most 100 characters' });
    }
    if (description && (typeof description !== 'string' || description.length > 1000)) {
      return reply.status(400).send({ error: 'description must be at most 1000 characters' });
    }

    const db = getDb();

    // Check duplicate wallet
    const { data: existing } = await db.from('agents')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (existing) {
      return reply.status(409).send({ error: 'Agent already registered for this wallet' });
    }

    const { data, error } = await db.from('agents')
      .insert({ name, description: description || '', wallet_address: walletAddress })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation on wallet_address
      if (error.code === '23505') {
        return reply.status(409).send({ error: 'Agent already registered for this wallet' });
      }
      return reply.status(500).send({ error: error.message });
    }
    return reply.status(201).send(formatAgent(data));
  });

  app.get('/agents/:agentId', async (request, reply) => {
    const { agentId } = request.params as any;
    const db = getDb();

    const { data: agent, error } = await db.from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (error || !agent) return reply.status(404).send({ error: 'Agent not found' });

    const [{ data: skills }, breakdown] = await Promise.all([
      db.from('skills')
        .select('id, name, version, price, execution_count, avg_rating')
        .eq('owner_id', agentId),
      getReputationBreakdown(agentId),
    ]);

    return {
      ...formatAgent(agent),
      reputationBreakdown: breakdown,
      skills: (skills || []).map((s: any) => ({
        id: s.id, name: s.name, version: s.version,
        price: s.price, executionCount: s.execution_count, avgRating: s.avg_rating,
      })),
    };
  });

  app.get('/agents', async (request) => {
    const db = getDb();
    const { limit = '20', offset = '0' } = request.query as any;

    // Clamp limit/offset
    const clampedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const clampedOffset = Math.max(Number(offset) || 0, 0);

    const { data, error } = await db.from('agents')
      .select('*')
      .order('reputation', { ascending: false })
      .range(clampedOffset, clampedOffset + clampedLimit - 1);

    const agents = (data || []).map(formatAgent);
    return { agents, count: agents.length };
  });
}

function formatAgent(a: any) {
  return {
    id: a.id, name: a.name, description: a.description,
    walletAddress: a.wallet_address, reputation: a.reputation,
    skillsExecuted: a.skills_executed, createdAt: a.created_at,
  };
}
