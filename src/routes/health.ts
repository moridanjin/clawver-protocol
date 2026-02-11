import { FastifyInstance } from 'fastify';
import { getDb } from '../db';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    const db = getDb();
    const agentCount = db.prepare('SELECT COUNT(*) as count FROM agents').get() as any;
    const skillCount = db.prepare('SELECT COUNT(*) as count FROM skills').get() as any;
    const execCount = db.prepare('SELECT COUNT(*) as count FROM executions').get() as any;

    return {
      status: 'ok',
      protocol: 'ClawVer',
      version: '0.1.0',
      tagline: 'Trust Infrastructure for the Agent Economy',
      stats: {
        agents: agentCount.count,
        skills: skillCount.count,
        executions: execCount.count,
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
