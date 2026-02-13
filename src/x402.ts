import { X402PaymentHandler, getDefaultTokenAsset, toAtomicUnits } from 'x402-solana';

// USDC on Solana devnet
const USDC_DEVNET = {
  address: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  decimals: 6,
};

const X402_NETWORK = (process.env.X402_NETWORK || 'solana-devnet') as 'solana' | 'solana-devnet';
const X402_FACILITATOR_URL = process.env.X402_FACILITATOR_URL || 'https://facilitator.payai.network';
const X402_TREASURY = process.env.X402_TREASURY_ADDRESS || '';

// Feature flag — set X402_ENABLED=false to fall back to AgentWallet
export function isX402Enabled(): boolean {
  return process.env.X402_ENABLED !== 'false';
}

let handler: X402PaymentHandler | null = null;

function getHandler(): X402PaymentHandler {
  if (!handler) {
    handler = new X402PaymentHandler({
      network: X402_NETWORK,
      treasuryAddress: X402_TREASURY,
      facilitatorUrl: X402_FACILITATOR_URL,
      defaultToken: USDC_DEVNET,
    });
  }
  return handler;
}

/**
 * Extract payment header from request headers.
 * Supports both v2 (PAYMENT-SIGNATURE) and v1 (X-PAYMENT).
 */
export function extractPaymentHeader(
  headers: Record<string, string | string[] | undefined>,
): string | null {
  return getHandler().extractPayment(headers);
}

/**
 * Convert lamports price to USDC atomic units (micro-USDC).
 * For demo/devnet: 1000 lamports ≈ $0.001 USDC = 1000 micro-USDC.
 * Simple 1:1 mapping for hackathon demo.
 */
export function lamportsToUsdcAtomic(lamports: number): string {
  return String(lamports);
}

/**
 * Create a 402 Payment Required response for a skill execution.
 */
export async function createPaymentRequired(
  price: number,
  payToAddress: string,
  resourceUrl: string,
): Promise<{ status: 402; body: any; requirements: any }> {
  const h = getHandler();
  const routeConfig = {
    amount: lamportsToUsdcAtomic(price),
    asset: USDC_DEVNET,
    description: 'ClawVer skill execution payment',
  };

  const requirements = await h.createPaymentRequirements(routeConfig, resourceUrl);

  // Override payTo to skill owner (not treasury)
  if (requirements.accepts) {
    for (const accept of requirements.accepts) {
      (accept as any).payTo = payToAddress;
    }
  }

  const response = h.create402Response(requirements, resourceUrl);
  return { ...response, requirements };
}

/**
 * Verify and settle a payment via the PayAI facilitator.
 * Returns settlement result or null on failure.
 */
export async function verifyAndSettle(
  paymentHeader: string,
  requirements: any,
): Promise<{ success: boolean; txHash: string | null; error?: string }> {
  const h = getHandler();

  try {
    const verifyResult = await h.verifyPayment(paymentHeader, requirements);
    if (!verifyResult.isValid) {
      return { success: false, txHash: null, error: verifyResult.invalidReason || 'Payment verification failed' };
    }

    const settleResult = await h.settlePayment(paymentHeader, requirements);
    if (!settleResult.success) {
      return { success: false, txHash: null, error: settleResult.errorReason || 'Payment settlement failed' };
    }

    return { success: true, txHash: settleResult.transaction || null };
  } catch (err: any) {
    console.error('x402 payment error:', err.message);
    return { success: false, txHash: null, error: err.message };
  }
}

/**
 * Encode a SettleResponse as base64 for the PAYMENT-RESPONSE header.
 */
export function encodePaymentResponse(settleResult: any): string {
  return Buffer.from(JSON.stringify(settleResult)).toString('base64');
}
