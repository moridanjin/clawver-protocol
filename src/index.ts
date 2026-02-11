import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthRoutes } from './routes/health';
import { agentRoutes } from './routes/agents';
import { skillRoutes } from './routes/skills';
import { executeRoutes } from './routes/execute';
import { contractRoutes } from './routes/contracts';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });

  // Register all routes
  await app.register(healthRoutes);
  await app.register(agentRoutes);
  await app.register(skillRoutes);
  await app.register(executeRoutes);
  await app.register(contractRoutes);

  // Root redirect to health
  app.get('/', async (_request, reply) => {
    return reply.redirect('/health');
  });

  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   🦀 ClawVer Protocol v0.1.0                        ║
║   Trust Infrastructure for the Agent Economy         ║
║                                                      ║
║   Server running on http://${HOST}:${PORT}             ║
║                                                      ║
║   Endpoints:                                         ║
║   GET  /health              — Protocol status        ║
║   POST /agents              — Register agent         ║
║   GET  /agents              — List agents            ║
║   GET  /agents/:id          — Get agent              ║
║   POST /skills              — Register skill         ║
║   GET  /skills              — List/search skills     ║
║   GET  /skills/:id          — Get skill              ║
║   POST /execute/:skillId    — Execute skill          ║
║   GET  /executions/:id      — Get execution          ║
║   POST /contracts           — Create contract        ║
║   POST /contracts/:id/deliver — Deliver & settle     ║
║   GET  /contracts/:id       — Get contract           ║
║   GET  /contracts           — List contracts         ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
    `);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
