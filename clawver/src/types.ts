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
  inputSchema: object;
  outputSchema: object;
  code: string;
  price: number; // in lamports
  executionCount: number;
  avgRating: number;
  sandboxConfig: {
    timeoutMs: number;
    maxMemoryMb: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Execution {
  id: string;
  skillId: string;
  callerId: string;
  input: unknown;
  output: unknown | null;
  status: 'pending' | 'running' | 'success' | 'failed' | 'timeout';
  validated: boolean;
  executionTimeMs: number | null;
  error: string | null;
  txSignature: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface Contract {
  id: string;
  clientId: string;
  providerId: string;
  skillId: string;
  input: unknown;
  output: unknown | null;
  price: number;
  status: 'created' | 'escrowed' | 'delivered' | 'validated' | 'settled' | 'disputed' | 'refunded';
  escrowTx: string | null;
  settleTx: string | null;
  validationResult: object | null;
  createdAt: string;
  updatedAt: string;
}
