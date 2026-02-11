const AGENTWALLET_BASE = 'https://agentwallet.mcpay.tech/api';
const WALLET_USERNAME = process.env.AGENTWALLET_USERNAME || 'molatvnatha';
const API_TOKEN = process.env.AGENTWALLET_API_TOKEN || '';

interface WalletBalance {
  sol: string;
  usdc: string;
}

export async function getBalance(): Promise<WalletBalance> {
  const res = await fetch(
    `${AGENTWALLET_BASE}/wallets/${WALLET_USERNAME}/balances`,
    { headers: { Authorization: `Bearer ${API_TOKEN}` } }
  );
  if (!res.ok) throw new Error(`Wallet balance check failed: ${res.status}`);
  return res.json() as Promise<WalletBalance>;
}

export async function transferSol(
  to: string,
  amountLamports: string
): Promise<{ txSignature: string }> {
  const res = await fetch(
    `${AGENTWALLET_BASE}/wallets/${WALLET_USERNAME}/actions/transfer-solana`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        amount: amountLamports,
        asset: 'sol',
        network: 'devnet',
      }),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Transfer failed: ${res.status} ${body}`);
  }
  return res.json() as Promise<{ txSignature: string }>;
}

export async function settlePayment(
  toAddress: string,
  amountLamports: number
): Promise<string | null> {
  if (amountLamports <= 0) return null;

  try {
    const result = await transferSol(toAddress, String(amountLamports));
    return result.txSignature || 'settled';
  } catch (err: any) {
    console.error('Payment settlement failed:', err.message);
    return null;
  }
}
