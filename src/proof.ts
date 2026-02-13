import { createHash } from 'crypto';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

export interface ExecutionProof {
  executionId: string;
  skillId: string;
  callerId: string;
  inputHash: string;
  outputHash: string;
  timestamp: string;
  executionHash: string;
}

export interface SignedExecutionProof {
  executionHash: string;
  signature: string;      // base64 Ed25519 signature
  serverPublicKey: string; // base58 Solana public key
}

/**
 * Normalize timestamp to UTC ISO string for deterministic hashing.
 * Supabase returns "+00:00" suffix, JS uses "Z" — both mean UTC but differ as strings.
 */
function normalizeTimestamp(ts: string): string {
  return new Date(ts).toISOString();
}

// Cached server keypair (loaded once from env)
let _serverKeypair: nacl.SignKeyPair | null | undefined;

function getServerKeypair(): nacl.SignKeyPair | null {
  if (_serverKeypair !== undefined) return _serverKeypair;
  const key = process.env.SERVER_SIGNING_KEY;
  if (!key) {
    _serverKeypair = null;
    return null;
  }
  try {
    const secretKey = bs58.decode(key);
    _serverKeypair = nacl.sign.keyPair.fromSecretKey(new Uint8Array(secretKey));
    return _serverKeypair;
  } catch (err: any) {
    console.error('Invalid SERVER_SIGNING_KEY — proof signing disabled:', err?.message || err);
    _serverKeypair = null;
    return null;
  }
}

/**
 * Get the server's public key (base58) for third-party verification.
 * Returns null if SERVER_SIGNING_KEY is not configured.
 */
export function getServerPublicKey(): string | null {
  const kp = getServerKeypair();
  if (!kp) return null;
  return bs58.encode(kp.publicKey);
}

/**
 * Sign an execution hash with the server's Ed25519 key.
 * Returns null if SERVER_SIGNING_KEY is not configured (graceful fallback).
 */
export function signExecutionProof(executionHash: string): SignedExecutionProof | null {
  const kp = getServerKeypair();
  if (!kp) return null;

  const messageBytes = new TextEncoder().encode(executionHash);
  const signatureBytes = nacl.sign.detached(messageBytes, kp.secretKey);

  return {
    executionHash,
    signature: Buffer.from(signatureBytes).toString('base64'),
    serverPublicKey: bs58.encode(kp.publicKey),
  };
}

/**
 * Verify a proof signature against the server's public key.
 * Can be used by third parties — only needs the public key, not the secret.
 */
export function verifyProofSignature(
  executionHash: string,
  signatureBase64: string,
  serverPublicKeyBase58: string,
): boolean {
  try {
    const messageBytes = new TextEncoder().encode(executionHash);
    const signatureBytes = Buffer.from(signatureBase64, 'base64');
    const publicKeyBytes = bs58.decode(serverPublicKeyBase58);

    if (publicKeyBytes.length !== 32) return false;
    if (signatureBytes.length !== 64) return false;

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch {
    return false;
  }
}

/**
 * Compute a deterministic SHA-256 hash of execution data.
 * Anyone with the same inputs can recompute this hash to verify integrity.
 */
export function computeExecutionHash(
  executionId: string,
  skillId: string,
  callerId: string,
  input: unknown,
  output: unknown,
  timestamp: string,
): ExecutionProof {
  const normalizedTimestamp = normalizeTimestamp(timestamp);

  const inputHash = createHash('sha256')
    .update(JSON.stringify(input))
    .digest('hex');

  const outputHash = createHash('sha256')
    .update(JSON.stringify(output))
    .digest('hex');

  // Canonical string: all fields in deterministic order
  const canonical = [
    `execution:${executionId}`,
    `skill:${skillId}`,
    `caller:${callerId}`,
    `input:${inputHash}`,
    `output:${outputHash}`,
    `timestamp:${normalizedTimestamp}`,
  ].join('|');

  const executionHash = createHash('sha256')
    .update(canonical)
    .digest('hex');

  return {
    executionId,
    skillId,
    callerId,
    inputHash,
    outputHash,
    timestamp: normalizedTimestamp,
    executionHash,
  };
}
