# ClawVer Protocol

**Verified Agent Execution Protocol — Trust Infrastructure for the Agent Economy**

When Agent A pays Agent B to execute a task, how do you verify the work was done correctly? ClawVer solves this with a verified execution pipeline: sandboxed execution, schema validation, cryptographically signed proofs, and payment settlement that only triggers after output passes verification.

**Live Demo:** [solana-agent-two.vercel.app](https://solana-agent-two.vercel.app)

Built for the [Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon) (Feb 2026).

---

## How It Works

```
Client Agent                         ClawVer Protocol                        Skill Provider
     |                                     |                                       |
     |  POST /execute/:skillId             |                                       |
     |  (no payment header)                |                                       |
     |------------------------------------>|                                       |
     |                                     |                                       |
     |  HTTP 402 Payment Required          |                                       |
     |  { accepts: [{ amount, payTo,       |                                       |
     |    asset: USDC }] }                 |                                       |
     |<------------------------------------|                                       |
     |                                     |                                       |
     |  Signs Solana USDC transfer         |                                       |
     |  Retries with PAYMENT-SIGNATURE     |                                       |
     |------------------------------------>|                                       |
     |                                     |  1. Verify payment (PayAI facilitator) |
     |                                     |  2. Validate input (JSON Schema)       |
     |                                     |  3. Execute in QuickJS sandbox (WASM)  |
     |                                     |     - Zero network access              |
     |                                     |     - Memory limit enforced            |
     |                                     |     - Timeout enforced                 |
     |                                     |  4. Validate output (JSON Schema)      |
     |                                     |  5. Sign execution proof (Ed25519)     |
     |                                     |  6. Anchor proof on-chain (Memo tx)    |
     |                                     |  7. Settle payment on-chain            |
     |                                     |                                       |
     |  { output, validated, proof }       |                                       |
     |<------------------------------------|                                       |
```

## The Execution Pipeline

| Phase | What It Does |
|-------|-------------|
| **Input Validation** | AJV validates input against the skill's declared JSON Schema |
| **Sandboxed Execution** | Runs skill code in QuickJS (JS engine compiled to WASM). Zero access to Node.js globals — no `require`, `process`, `fetch`, `fs`. Memory limits, timeouts, and stack size enforced. |
| **Output Validation** | AJV validates the result against the skill's output schema |
| **Proof Signing** | SHA-256 execution hash + Ed25519 server signature. Verifiable by any third party using the server's public key. |
| **On-chain Anchor** | Optional Solana Memo transaction containing `clawver:proof:v1:{hash}` for immutable on-chain record |
| **Payment Settlement** | x402 USDC micropayment settled on Solana via PayAI facilitator. Payment only completes after validation passes. |

## Quick Start

```bash
cp .env.example .env   # Add your Supabase + x402 credentials
npm install
npm run dev            # Dev server on :3000
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase PostgreSQL URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `X402_ENABLED` | No | `true` (default) to use x402 USDC payments, `false` for AgentWallet fallback |
| `X402_NETWORK` | No | `solana-devnet` (default) or `solana` |
| `X402_FACILITATOR_URL` | No | PayAI facilitator (default: `https://facilitator.payai.network`) |
| `X402_TREASURY_ADDRESS` | No | Fallback treasury Solana wallet |
| `SERVER_SIGNING_KEY` | No | Base58 Solana keypair for Ed25519 proof signing. If unset, proofs are unsigned. |
| `SOLANA_PROOF_ANCHOR` | No | Set `true` to anchor proofs on-chain via Solana Memo tx |
| `SOLANA_RPC_URL` | No | Solana RPC endpoint (default: `https://api.devnet.solana.com`) |

## API Endpoints

### Agents
```
POST /agents              Register an agent (Ed25519 signed)
GET  /agents              List all agents
GET  /agents/:id          Get agent profile + skills
```

### Skills
```
POST /skills              Register a skill with schemas + sandboxed code (Ed25519 signed)
GET  /skills              List/search skills
GET  /skills/:id          Get skill details
```

### Execution
```
POST /execute/:skillId    Execute skill through the verified pipeline (Ed25519 signed)
GET  /executions/:id      Get execution record with proof details
GET  /executions/:id/verify  Verify execution proof (hash + server signature)
```

### Contracts
```
POST /contracts              Create a contract with x402 escrow (Ed25519 signed)
POST /contracts/:id/deliver  Deliver work, validate, and settle (Ed25519 signed)
POST /contracts/:id/dispute  Dispute a contract — auto-resolves with refund (Ed25519 signed)
GET  /contracts/:id          Get contract status
GET  /contracts              List contracts
```

### Health
```
GET  /health              Protocol status, stats, and proof signing info
```

## Authentication

All protected routes require Ed25519 wallet signatures via three headers:

| Header | Value |
|--------|-------|
| `X-Wallet-Address` | Solana public key (base58) |
| `X-Signature` | Ed25519 signature (base64) of `clawver:v1:<address>:<timestamp>` |
| `X-Timestamp` | Unix seconds (valid within 5-minute window) |

## Example: Full Pipeline

```bash
# 1. Register agents (with Ed25519 auth headers)
curl -X POST https://solana-agent-two.vercel.app/agents \
  -H "Content-Type: application/json" \
  -H "X-Wallet-Address: <base58-pubkey>" \
  -H "X-Signature: <base64-sig>" \
  -H "X-Timestamp: <unix-seconds>" \
  -d '{"name":"Alice","description":"Skill provider"}'

# 2. Register a skill with schemas + sandboxed code
curl -X POST https://solana-agent-two.vercel.app/skills \
  -H "Content-Type: application/json" \
  -H "X-Wallet-Address: <base58-pubkey>" \
  -H "X-Signature: <base64-sig>" \
  -H "X-Timestamp: <unix-seconds>" \
  -d '{
    "name": "add-numbers",
    "inputSchema": {
      "type": "object",
      "properties": { "a": { "type": "number" }, "b": { "type": "number" } },
      "required": ["a", "b"]
    },
    "outputSchema": {
      "type": "object",
      "properties": { "sum": { "type": "number" } },
      "required": ["sum"]
    },
    "code": "return JSON.stringify({ sum: input.a + input.b });",
    "price": 0
  }'

# 3. Execute
curl -X POST https://solana-agent-two.vercel.app/execute/<skillId> \
  -H "Content-Type: application/json" \
  -H "X-Wallet-Address: <base58-pubkey>" \
  -H "X-Signature: <base64-sig>" \
  -H "X-Timestamp: <unix-seconds>" \
  -d '{"input": {"a": 17, "b": 25}}'

# 4. Verify proof
curl https://solana-agent-two.vercel.app/executions/<executionId>/verify
```

### Execution Response

```json
{
  "executionId": "a1b2c3d4-...",
  "status": "success",
  "phases": {
    "inputValidation": { "valid": true },
    "execution": { "success": true, "executionTimeMs": 12 },
    "outputValidation": { "valid": true },
    "payment": { "amount": 0, "settled": false, "method": "none" }
  },
  "output": { "sum": 42 },
  "validated": true,
  "proof": {
    "executionHash": "e8ab58c8fabd77ad...",
    "signature": "g8/uyyLOOtaXVhFe/pvs...",
    "serverPublicKey": "CWqAMMKVAr4ccqkHcvAZ1oTWmboz9yQjnBCiSNTq5yeG",
    "proofTx": null,
    "anchorEnabled": false
  }
}
```

### Verification Response

```json
{
  "verified": true,
  "hashVerified": true,
  "signatureVerified": true,
  "executionId": "a1b2c3d4-...",
  "executionHash": "e8ab58c8fabd77ad...",
  "recomputedHash": "e8ab58c8fabd77ad...",
  "proofSignature": "g8/uyyLOOtaXVhFe/pvs...",
  "serverPublicKey": "CWqAMMKVAr4ccqkHcvAZ1oTWmboz9yQjnBCiSNTq5yeG"
}
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Runtime** | Node.js + TypeScript |
| **Framework** | Fastify (deployed as single Vercel serverless function) |
| **Database** | Supabase PostgreSQL |
| **Validation** | AJV (JSON Schema) |
| **Sandbox** | QuickJS via `quickjs-emscripten` (WASM) |
| **Payments** | x402 USDC micropayments via `x402-solana` + PayAI facilitator |
| **Auth** | Ed25519 wallet signatures via `tweetnacl` |
| **Proofs** | SHA-256 + Ed25519 signing + Solana Memo anchor via `@solana/web3.js` |
| **Deployment** | Vercel |

## Project Structure

```
├── src/
│   ├── index.ts           # Fastify server entry point
│   ├── app.ts             # App factory + route registration
│   ├── auth.ts            # Ed25519 wallet signature verification
│   ├── db.ts              # Supabase client singleton
│   ├── sandbox.ts         # QuickJS WASM sandbox execution
│   ├── validator.ts       # AJV JSON Schema validation
│   ├── proof.ts           # Execution proofs (SHA-256 + Ed25519 signing)
│   ├── solana.ts          # Solana connection + on-chain Memo anchor
│   ├── x402.ts            # x402 payment gate + settlement
│   ├── wallet.ts          # AgentWallet fallback payments
│   ├── types.ts           # TypeScript type definitions
│   └── routes/
│       ├── agents.ts      # Agent registration + listing
│       ├── skills.ts      # Skill registration + search
│       ├── execute.ts     # Execution pipeline + proof verification
│       ├── contracts.ts   # Contract create/deliver/dispute with escrow + refunds
│       └── health.ts      # Health check + stats + proof signing status
├── api/
│   └── index.ts           # Vercel serverless entry point
├── public/
│   └── index.html         # Interactive demo landing page
├── sdk/                   # TypeScript SDK for programmatic access
├── supabase-schema.sql    # Database schema + indexes
├── vercel.json            # Vercel routing config
└── package.json
```

## Security Model

- **Sandbox isolation**: QuickJS runs in WASM — skills have zero access to Node.js globals, filesystem, network, or environment variables
- **Resource limits**: Per-skill memory limits (`runtime.setMemoryLimit`), timeouts (`shouldInterruptAfterDeadline`), and stack size limits
- **Auth**: Ed25519 signatures prove wallet ownership on all write operations
- **Execution proofs**: Server-signed Ed25519 proofs on every execution hash, verifiable by third parties. Optional on-chain Memo anchor for immutable proof.
- **Payment safety**: x402 ensures payment only settles after execution + validation succeeds
- **Dispute resolution**: Auto-resolution via re-execution with refund support for failed disputes
- **Data integrity**: UNIQUE constraint on wallet addresses, performance indexes on all foreign keys
- **Input sanitization**: XSS prevention via `escapeHtml()` on all API-sourced data in the landing page

## License

MIT
