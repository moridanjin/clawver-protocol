/**
 * ClawVer SDK — TypeScript client for the ClawVer Protocol
 *
 * Usage:
 *   import { ClawVer } from '@clawver/sdk';
 *
 *   const client = new ClawVer({
 *     apiUrl: 'https://solana-agent-two.vercel.app',
 *     privateKey: Uint8Array // 64-byte Ed25519 secret key
 *   });
 *
 *   const agent = await client.registerAgent('my-agent', 'description');
 *   const skill = await client.publishSkill({ ... });
 *   const result = await client.execute(skillId, { text: 'hello' });
 */

import nacl from 'tweetnacl';
import bs58 from 'bs58';

// -- Types --

export interface ClawVerConfig {
  apiUrl: string;
  privateKey: Uint8Array; // 64-byte Ed25519 secret key (nacl.sign.keyPair().secretKey)
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  walletAddress: string;
  reputation: number;
  skillsExecuted: number;
  createdAt: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  version: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  code: string;
  price: number;
  executionCount: number;
  timeoutMs: number;
  maxMemoryMb: number;
  createdAt: string;
}

export interface ExecutionResult {
  executionId: string;
  status: string;
  phases: {
    inputValidation: { valid: boolean };
    execution: { success: boolean; executionTimeMs: number };
    outputValidation: { valid: boolean; errors: string[] | null };
    payment: { amount: number; txSignature: string | null; settled: boolean };
  };
  output: unknown;
  validated: boolean;
  executionHash: string;
}

export interface ExecutionProof {
  verified: boolean;
  executionId: string;
  executionHash: string;
  recomputedHash: string;
  proof: {
    skillId: string;
    callerId: string;
    inputHash: string;
    outputHash: string;
    timestamp: string;
  };
  txSignature: string | null;
}

export interface Contract {
  id: string;
  clientId: string;
  providerId: string;
  skillId: string;
  input: unknown;
  output: unknown;
  price: number;
  status: string;
  escrowTx: string | null;
  escrowedAt: string | null;
  settleTx: string | null;
  disputeReason: string | null;
  disputedAt: string | null;
  resolution: string | null;
  resolutionReason: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DisputeResult {
  contractId: string;
  status: string;
  resolution: string;
  reason: string;
  reExecutionOutput?: unknown;
}

export interface SkillInput {
  name: string;
  description: string;
  code: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  price?: number;
  version?: string;
  timeoutMs?: number;
  maxMemoryMb?: number;
}

// -- SDK Error --

export class ClawVerError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown,
  ) {
    super(message);
    this.name = 'ClawVerError';
  }
}

// -- Client --

export class ClawVer {
  private apiUrl: string;
  private keypair: nacl.SignKeyPair;
  private walletAddress: string;

  constructor(config: ClawVerConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, '');
    this.keypair = {
      publicKey: config.privateKey.slice(32),
      secretKey: config.privateKey,
    };
    this.walletAddress = bs58.encode(this.keypair.publicKey);
  }

  /** Create from a fresh random keypair (for testing) */
  static generateKeypair(): { client: ClawVer; publicKey: string; secretKey: Uint8Array } {
    const kp = nacl.sign.keyPair();
    const client = new ClawVer({
      apiUrl: 'https://solana-agent-two.vercel.app',
      privateKey: kp.secretKey,
    });
    return {
      client,
      publicKey: bs58.encode(kp.publicKey),
      secretKey: kp.secretKey,
    };
  }

  // -- Auth --

  private signHeaders(): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const message = `clawver:v1:${this.walletAddress}:${timestamp}`;
    const messageBytes = new TextEncoder().encode(message);
    const signature = nacl.sign.detached(messageBytes, this.keypair.secretKey);
    const signatureBase64 = Buffer.from(signature).toString('base64');
    return {
      'X-Wallet-Address': this.walletAddress,
      'X-Signature': signatureBase64,
      'X-Timestamp': timestamp,
      'Content-Type': 'application/json',
    };
  }

  // -- HTTP helpers --

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers = method === 'GET' ? { 'Content-Type': 'application/json' } : this.signHeaders();
    const res = await fetch(`${this.apiUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json() as any;
    if (!res.ok) {
      throw new ClawVerError(data.error || `HTTP ${res.status}`, res.status, data);
    }
    return data as T;
  }

  private get<T>(path: string): Promise<T> { return this.request('GET', path); }
  private post<T>(path: string, body: unknown): Promise<T> { return this.request('POST', path, body); }

  // -- Agents --

  async registerAgent(name: string, description: string = ''): Promise<Agent> {
    return this.post<Agent>('/agents', { name, description });
  }

  async getAgent(agentId: string): Promise<Agent> {
    return this.get<Agent>(`/agents/${agentId}`);
  }

  async listAgents(): Promise<{ agents: Agent[]; count: number }> {
    return this.get('/agents');
  }

  // -- Skills --

  async publishSkill(skill: SkillInput): Promise<Skill> {
    return this.post<Skill>('/skills', skill);
  }

  async getSkill(skillId: string): Promise<Skill> {
    return this.get<Skill>(`/skills/${skillId}`);
  }

  async listSkills(query?: string): Promise<{ skills: Skill[]; count: number }> {
    const qs = query ? `?search=${encodeURIComponent(query)}` : '';
    return this.get(`/skills${qs}`);
  }

  // -- Execution --

  async execute(skillId: string, input: unknown): Promise<ExecutionResult> {
    return this.post<ExecutionResult>(`/execute/${skillId}`, { input });
  }

  async getExecution(executionId: string): Promise<any> {
    return this.get(`/executions/${executionId}`);
  }

  async verifyExecution(executionId: string): Promise<ExecutionProof> {
    return this.get<ExecutionProof>(`/executions/${executionId}/verify`);
  }

  // -- Contracts --

  async createContract(providerId: string, skillId: string, input?: unknown): Promise<Contract> {
    return this.post<Contract>('/contracts', { providerId, skillId, input });
  }

  async deliverContract(contractId: string): Promise<any> {
    return this.post(`/contracts/${contractId}/deliver`, {});
  }

  async disputeContract(contractId: string, reason?: string): Promise<DisputeResult> {
    return this.post<DisputeResult>(`/contracts/${contractId}/dispute`, { reason });
  }

  async getContract(contractId: string): Promise<Contract> {
    return this.get<Contract>(`/contracts/${contractId}`);
  }

  async listContracts(opts?: { agentId?: string; status?: string }): Promise<{ contracts: Contract[]; count: number }> {
    const params = new URLSearchParams();
    if (opts?.agentId) params.set('agentId', opts.agentId);
    if (opts?.status) params.set('status', opts.status);
    const qs = params.toString() ? `?${params}` : '';
    return this.get(`/contracts${qs}`);
  }

  // -- Health --

  async health(): Promise<any> {
    return this.get('/health');
  }
}

export default ClawVer;
