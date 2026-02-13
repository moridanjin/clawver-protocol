import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildApp } from '../src/app';

const app = buildApp();
const ready = app.ready();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ready;

  const response = await app.inject({
    method: req.method as any,
    url: req.url || '/',
    headers: req.headers as any,
    payload: req.body ? JSON.stringify(req.body) : undefined,
  });

  // Set response headers
  const headers = response.headers;
  for (const [key, value] of Object.entries(headers)) {
    if (value) res.setHeader(key, value as string);
  }

  res.status(response.statusCode).send(response.body);
}
