import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db';

export async function agentRoutes(app: FastifyInstance) {
  // Register a new agent
  app.post('/agents', async (request, reply) => {
    const { name, description, walletAddress } = request.body as any;

    if (!name || !walletAddress) {
      return reply.status(400).send({ error: 'name and walletAddress are required' });
    }

    const db = getDb();
    const id = uuid();

    db.prepare(`
      INSERT INTO agents (id, name, description, walletAddress)
      VALUES (?, ?, ?, ?)
    `).run(id, name, description || '', walletAddress);

    const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
    return reply.status(201).send(agent);
  });

  // Get agent by ID
  app.get('/agents/:agentId', async (request, reply) => {
    const { agentId } = request.params as any;
    const db = getDb();

    const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(agentId);
    if (!agent) {
      return reply.status(404).send({ error: 'Agent not found' });
    }

    // Get agent's skills
    const skills = db.prepare('SELECT id, name, version, price, executionCount, avgRating FROM skills WHERE ownerId = ?').all(agentId);

    return { ...(agent as any), skills };
  });

  // List all agents
  app.get('/agents', async (request) => {
    const db = getDb();
    const { limit = '20', offset = '0' } = request.query as any;
    const agents = db.prepare('SELECT * FROM agents ORDER BY reputation DESC LIMIT ? OFFSET ?')
      .all(Number(limit), Number(offset));
    return { agents, count: agents.length };
  });
}
