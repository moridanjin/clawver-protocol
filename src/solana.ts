import {
  Connection,
  Keypair,
  Transaction,
  TransactionInstruction,
  PublicKey,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import bs58 from 'bs58';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

const DEFAULT_RPC = 'https://api.devnet.solana.com';

// Singleton connection
let _connection: Connection | null = null;

function getConnection(): Connection {
  if (!_connection) {
    const rpcUrl = process.env.SOLANA_RPC_URL || DEFAULT_RPC;
    _connection = new Connection(rpcUrl, 'confirmed');
  }
  return _connection;
}

// Cached server keypair
let _keypair: Keypair | null | undefined;

function getKeypair(): Keypair | null {
  if (_keypair !== undefined) return _keypair;
  const key = process.env.SERVER_SIGNING_KEY;
  if (!key) {
    _keypair = null;
    return null;
  }
  try {
    const secretKey = bs58.decode(key);
    _keypair = Keypair.fromSecretKey(secretKey);
    return _keypair;
  } catch {
    console.error('Invalid SERVER_SIGNING_KEY — on-chain anchoring disabled');
    _keypair = null;
    return null;
  }
}

export function isAnchorEnabled(): boolean {
  return process.env.SOLANA_PROOF_ANCHOR === 'true' && getKeypair() !== null;
}

/**
 * Send a Memo transaction on-chain containing the execution proof hash.
 * Fire-and-forget — caller should not await this in the request path.
 * Returns the transaction signature on success, null on failure.
 */
export async function anchorProofOnChain(executionHash: string): Promise<string | null> {
  const keypair = getKeypair();
  if (!keypair) return null;

  try {
    const connection = getConnection();
    const memoData = `clawver:proof:v1:${executionHash}`;

    const instruction = new TransactionInstruction({
      keys: [{ pubkey: keypair.publicKey, isSigner: true, isWritable: true }],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memoData, 'utf-8'),
    });

    const tx = new Transaction().add(instruction);
    const signature = await sendAndConfirmTransaction(connection, tx, [keypair]);
    return signature;
  } catch (err: any) {
    console.error('On-chain proof anchor failed:', err.message);
    return null;
  }
}
