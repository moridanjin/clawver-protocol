import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { authPlugin } from './auth';
import { healthRoutes } from './routes/health';
import { agentRoutes } from './routes/agents';
import { skillRoutes } from './routes/skills';
import { executeRoutes } from './routes/execute';
import { contractRoutes } from './routes/contracts';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: [
      'https://solana-agent-two.vercel.app',
      'http://localhost:3000',
    ],
  });

  app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  app.register(authPlugin);
  app.register(healthRoutes);
  app.register(agentRoutes);
  app.register(skillRoutes);
  app.register(executeRoutes);
  app.register(contractRoutes);

  app.get('/', async (_request, reply) => {
    return reply.redirect('/health');
  });

  return app;
}
