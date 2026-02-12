import { FastifyInstance } from 'fastify';
import { getDb } from '../db';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    const db = getDb();

    const [agents, skills, executions] = await Promise.all([
      db.from('agents').select('id', { count: 'exact', head: true }),
      db.from('skills').select('id', { count: 'exact', head: true }),
      db.from('executions').select('id', { count: 'exact', head: true }),
    ]);

    return {
      status: 'ok',
      protocol: 'ClawVer',
      version: '0.1.0',
      tagline: 'Trust Infrastructure for the Agent Economy',
      stats: {
        agents: agents.count || 0,
        skills: skills.count || 0,
        executions: executions.count || 0,
      },
      features: [
        'verified-skill-registry',
        'sandboxed-execution',
        'output-validation',
        'payment-settlement',
        'job-contracts',
      ],
      timestamp: new Date().toISOString(),
    };
  });
}
