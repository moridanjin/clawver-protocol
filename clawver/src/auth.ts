import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { getDb } from './db';

// -- Types --

export interface AuthAgent {
  id: string;
  walletAddress: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    authAgent?: AuthAgent;
  }
}

// -- Config --

const TIMESTAMP_TOLERANCE_SECONDS = 300; // 5 minutes
const MESSAGE_PREFIX = 'clawver:v1';

// -- Route classification --

const PUBLIC_ROUTES: Array<{ method: string; pattern: RegExp }> = [
  { method: 'GET', pattern: /^\/health$/ },
  { method: 'GET', pattern: /^\/agents(\/.*)?$/ },
  { method: 'GET', pattern: /^\/skills(\/.*)?$/ },
  { method: 'GET', pattern: /^\/executions(\/.*)?$/ },
  { method: 'GET', pattern: /^\/contracts(\/.*)?$/ },
  { method: 'GET', pattern: /^\/$/ },
];

const REGISTRATION_ROUTES: Array<{ method: string; pattern: RegExp }> = [
  { method: 'POST', pattern: /^\/agents$/ },
];

function isPublicRoute(method: string, url: string): boolean {
  const path = url.split('?')[0];
  return PUBLIC_ROUTES.some(r => r.method === method && r.pattern.test(path));
}

function isRegistrationRoute(method: string, url: string): boolean {
  const path = url.split('?')[0];
  return REGISTRATION_ROUTES.some(r => r.method === method && r.pattern.test(path));
}

// -- Signature helpers --

function buildMessage(walletAddress: string, timestamp: string): Uint8Array {
  const message = `${MESSAGE_PREFIX}:${walletAddress}:${timestamp}`;
  return new TextEncoder().encode(message);
}

function verifySignature(
  walletAddress: string,
  signatureBase64: string,
  timestamp: string,
): boolean {
  try {
    const publicKeyBytes = bs58.decode(walletAddress);
    const signatureBytes = Buffer.from(signatureBase64, 'base64');
    const messageBytes = buildMessage(walletAddress, timestamp);

    if (publicKeyBytes.length !== 32) return false;
    if (signatureBytes.length !== 64) return false;

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch {
    return false;
  }
}

function isTimestampValid(timestamp: string): boolean {
  const ts = Number(timestamp);
  if (isNaN(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  return Math.abs(now - ts) <= TIMESTAMP_TOLERANCE_SECONDS;
}

// -- Fastify plugin --

async function authPluginImpl(app: FastifyInstance) {
  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const method = request.method;
    const url = request.url;

    // Public routes — no auth
    if (isPublicRoute(method, url)) return;

    // Extract auth headers
    const walletAddress = request.headers['x-wallet-address'] as string | undefined;
    const signature = request.headers['x-signature'] as string | undefined;
    const timestamp = request.headers['x-timestamp'] as string | undefined;

    if (!walletAddress || !signature || !timestamp) {
      return reply.status(401).send({
        error: 'Authentication required',
        details: 'Missing X-Wallet-Address, X-Signature, or X-Timestamp headers',
      });
    }

    // Check timestamp freshness
    if (!isTimestampValid(timestamp)) {
      return reply.status(401).send({
        error: 'Timestamp expired or invalid',
        details: `Timestamp must be within ${TIMESTAMP_TOLERANCE_SECONDS} seconds of server time`,
      });
    }

    // Verify Ed25519 signature
    const valid = verifySignature(walletAddress, signature, timestamp);
    if (!valid) {
      return reply.status(401).send({
        error: 'Invalid signature',
        details: 'Ed25519 signature verification failed',
      });
    }

    // Registration route — wallet verified but no agent lookup
    if (isRegistrationRoute(method, url)) {
      request.authAgent = { id: '', walletAddress };
      return;
    }

    // Protected route — look up agent by wallet address
    const db = getDb();
    const { data: agent } = await db.from('agents')
      .select('id, wallet_address')
      .eq('wallet_address', walletAddress)
      .single();

    if (!agent) {
      return reply.status(403).send({
        error: 'Agent not found',
        details: 'No registered agent for this wallet. Register first via POST /agents.',
      });
    }

    request.authAgent = { id: agent.id, walletAddress: agent.wallet_address };
  });
}

export const authPlugin = fp(authPluginImpl);
