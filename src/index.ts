import { buildApp } from './app';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  const app = buildApp();

  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`ClawVer Protocol v0.1.0 running on http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
