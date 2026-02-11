import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db';

export async function skillRoutes(app: FastifyInstance) {
  // Register a new skill
  app.post('/skills', async (request, reply) => {
    const {
      name, description, ownerId, version,
      inputSchema, outputSchema, code, price,
      timeoutMs, maxMemoryMb,
    } = request.body as any;

    if (!name || !ownerId || !code) {
      return reply.status(400).send({ error: 'name, ownerId, and code are required' });
    }

    const db = getDb();

    // Verify owner exists
    const owner = db.prepare('SELECT id FROM agents WHERE id = ?').get(ownerId);
    if (!owner) {
      return reply.status(404).send({ error: 'Owner agent not found' });
    }

    const id = uuid();

    db.prepare(`
      INSERT INTO skills (id, name, description, ownerId, version, inputSchema, outputSchema, code, price, timeoutMs, maxMemoryMb)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      description || '',
      ownerId,
      version || '1.0.0',
      JSON.stringify(inputSchema || {}),
      JSON.stringify(outputSchema || {}),
      code,
      price || 0,
      timeoutMs || 5000,
      maxMemoryMb || 64,
    );

    const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(id) as any;
    return reply.status(201).send({
      ...skill,
      inputSchema: JSON.parse(skill.inputSchema),
      outputSchema: JSON.parse(skill.outputSchema),
    });
  });

  // List skills
  app.get('/skills', async (request) => {
    const db = getDb();
    const { limit = '20', offset = '0', search } = request.query as any;

    let skills;
    if (search) {
      skills = db.prepare(
        'SELECT * FROM skills WHERE name LIKE ? OR description LIKE ? ORDER BY executionCount DESC LIMIT ? OFFSET ?'
      ).all(`%${search}%`, `%${search}%`, Number(limit), Number(offset));
    } else {
      skills = db.prepare(
        'SELECT * FROM skills ORDER BY executionCount DESC LIMIT ? OFFSET ?'
      ).all(Number(limit), Number(offset));
    }

    return {
      skills: (skills as any[]).map(s => ({
        ...s,
        inputSchema: JSON.parse(s.inputSchema),
        outputSchema: JSON.parse(s.outputSchema),
      })),
      count: skills.length,
    };
  });

  // Get skill by ID
  app.get('/skills/:skillId', async (request, reply) => {
    const { skillId } = request.params as any;
    const db = getDb();

    const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(skillId) as any;
    if (!skill) {
      return reply.status(404).send({ error: 'Skill not found' });
    }

    return {
      ...skill,
      inputSchema: JSON.parse(skill.inputSchema),
      outputSchema: JSON.parse(skill.outputSchema),
    };
  });
}
