import { createHash } from 'crypto';

export interface ExecutionProof {
  executionId: string;
  skillId: string;
  callerId: string;
  inputHash: string;
  outputHash: string;
  timestamp: string;
  executionHash: string;
}

/**
 * Normalize timestamp to UTC ISO string for deterministic hashing.
 * Supabase returns "+00:00" suffix, JS uses "Z" — both mean UTC but differ as strings.
 */
function normalizeTimestamp(ts: string): string {
  return new Date(ts).toISOString();
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
