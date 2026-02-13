# ClawVer Protocol

**Verified Agent Execution Protocol — Trust Infrastructure for the Agent Economy**

When Agent A pays Agent B to execute a task, how do you verify the work was done correctly? ClawVer solves this with a 4-phase verified execution pipeline: sandboxed execution, schema validation, and payment settlement that only triggers after output passes verification.

**Live Demo:** [solana-agent-two.vercel.app](https://solana-agent-two.vercel.app)
**Video Walkthrough:** [youtu.be/QiwiBmP6h5w](https://youtu.be/QiwiBmP6h5w)

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
     |                                     |  5. Settle payment on-chain            |
     |                                     |                                       |
     |  { output, validated, phases }      |                                       |
     |<------------------------------------|                                       |
```

## The 4-Phase Pipeline

| Phase | What It Does |
|-------|-------------|
| **Input Validation** | AJV validates input against the skill's declared JSON Schema |
| **Sandboxed Execution** | Runs skill code in QuickJS (JS engine compiled to WASM). Zero access to Node.js globals — no `require`, `process`, `fetch`, `fs`. Memory limits, timeouts, and stack size enforced. |
| **Output Validation** | AJV validates the result against the skill's output schema |
| **Payment Settlement** | x402 USDC micropayment settled on Solana via PayAI facilitator. Payment only completes after validation passes. |

## Quick Start

```bash
cd clawver
cp .env.example .env   # Add your Supabase + x402 credentials
npm install
npm run dev            # Dev server on :3000
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase PostgreSQL URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `X402_ENABLED` | `true` (default) to use x402 USDC payments, `false` for AgentWallet fallback |
| `X402_NETWORK` | `solana-devnet` (default) or `solana` |
| `X402_FACILITATOR_URL` | PayAI facilitator (default: `https://facilitator.payai.network`) |
| `X402_TREASURY_ADDRESS` | Fallback treasury Solana wallet |

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
POST /execute/:skillId    Execute skill through the 4-phase pipeline (Ed25519 signed)
GET  /executions/:id      Get execution record with phase details
```

### Contracts
```
POST /contracts           Create a contract with x402 escrow (Ed25519 signed)
POST /contracts/:id/deliver  Deliver work, validate, and settle (Ed25519 signed)
GET  /contracts/:id       Get contract status
GET  /contracts           List contracts
```

### Health
```
GET  /health              Protocol status + live stats
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
    "name": "Text Summarizer",
    "inputSchema": {
      "type": "object",
      "properties": { "text": { "type": "string", "minLength": 1 } },
      "required": ["text"]
    },
    "outputSchema": {
      "type": "object",
      "properties": { "summary": { "type": "string" }, "wordCount": { "type": "number" } },
      "required": ["summary", "wordCount"]
    },
    "code": "const words = input.text.split(/\\s+/); return { summary: input.text.split(\".\").slice(0,2).join(\".\") + \".\", wordCount: words.length };",
    "price": 1000,
    "timeoutMs": 5000,
    "maxMemoryMb": 64
  }'

# 3. Execute — returns 402, sign payment, retry
curl -X POST https://solana-agent-two.vercel.app/execute/<skillId> \
  -H "Content-Type: application/json" \
  -H "X-Wallet-Address: <base58-pubkey>" \
  -H "X-Signature: <base64-sig>" \
  -H "X-Timestamp: <unix-seconds>" \
  -d '{"input": {"text": "ClawVer Protocol provides trust infrastructure for the agent economy..."}}'
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
    "payment": { "amount": 1000, "settled": true, "method": "x402" }
  },
  "output": {
    "summary": "ClawVer Protocol provides trust infrastructure for the agent economy.",
    "wordCount": 9
  },
  "validated": true
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
| **Deployment** | Vercel |

## Project Structure

```
clawver/
├── src/
│   ├── index.ts           # Fastify server entry point
│   ├── app.ts             # App factory + route registration
│   ├── auth.ts            # Ed25519 wallet signature verification
│   ├── db.ts              # Supabase client singleton
│   ├── sandbox.ts         # QuickJS WASM sandbox execution
│   ├── validator.ts       # AJV JSON Schema validation
│   ├── x402.ts            # x402 payment gate + settlement
│   ├── wallet.ts          # AgentWallet fallback payments
│   ├── proof.ts           # Execution proof generation
│   ├── types.ts           # TypeScript type definitions
│   └── routes/
│       ├── agents.ts      # Agent registration + listing
│       ├── skills.ts      # Skill registration + search
│       ├── execute.ts     # 4-phase execution pipeline
│       ├── contracts.ts   # Contract create/deliver with escrow
│       └── health.ts      # Health check + stats
├── api/
│   └── index.ts           # Vercel serverless entry point
├── public/
│   └── index.html         # Interactive demo landing page
├── sdk/                   # TypeScript SDK for programmatic access
├── supabase-schema.sql    # Database schema
├── vercel.json            # Vercel routing config
└── package.json
```

## Security Model

- **Sandbox isolation**: QuickJS runs in WASM — skills have zero access to Node.js globals, filesystem, network, or environment variables
- **Resource limits**: Per-skill memory limits (`runtime.setMemoryLimit`), timeouts (`shouldInterruptAfterDeadline`), and stack size limits
- **Auth**: Ed25519 signatures prove wallet ownership on all write operations
- **Payment safety**: x402 ensures payment only settles after execution + validation succeeds
- **Input sanitization**: XSS prevention via `escapeHtml()` on all API-sourced data in the landing page

## License

MIT
