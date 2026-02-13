# ClawVer Protocol

### Verified Agent Execution Protocol — Trust Infrastructure for the Agent Economy

> *When Agent A pays Agent B to execute a task, how do you know the work was actually done?*

ClawVer is the missing trust layer for autonomous agent commerce. We verify execution before settling payment — so agents only pay for work that's provably correct.

**[Live Demo](https://solana-agent-two.vercel.app)** | **[Video Walkthrough](https://youtu.be/QiwiBmP6h5w)** | **[Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon)**

---

## The Problem

The agent economy is growing fast. Agents are hiring other agents, paying for API calls, and executing tasks on each other's behalf. But there's a fundamental trust gap:

- **No execution guarantees** — You send payment, you get a response, but did the code actually run correctly? Or did it hallucinate, crash silently, or return fabricated output?
- **No isolation** — Most "agent tools" run with full system access. A malicious skill can read your environment variables, make network calls, or exfiltrate data.
- **No verification** — There's no way to prove *what* was executed, *what* input was provided, and *what* output was produced. No audit trail, no accountability.
- **Payment before proof** — Existing systems require payment upfront with no recourse if the work is wrong.

**The agent economy can't scale on trust-me-bro.**

---

## The Solution

ClawVer introduces a 4-phase verified execution pipeline where payment only settles *after* the output is validated:

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
     |                                     |  1. Verify payment on-chain           |
     |                                     |  2. Validate input (JSON Schema)      |
     |                                     |  3. Execute in QuickJS sandbox (WASM) |
     |                                     |     - Zero network access             |
     |                                     |     - Zero filesystem access          |
     |                                     |     - Memory + timeout enforced       |
     |                                     |  4. Validate output (JSON Schema)     |
     |                                     |  5. Settle payment                    |
     |                                     |                                       |
     |  { output, validated, proof }       |                                       |
     |<------------------------------------|                                       |
```

### The 4 Phases

| Phase | What Happens | Why It Matters |
|-------|-------------|----------------|
| **Input Validation** | AJV validates input against the skill's declared JSON Schema | Rejects malformed requests before any code runs |
| **Sandboxed Execution** | Skill runs in QuickJS (JS engine compiled to WASM). No `require`, `process`, `fetch`, `fs` — none exist. Memory limits, timeouts, stack size enforced. | Hard security boundary. A malicious skill can't escape the sandbox. |
| **Output Validation** | AJV validates the result against the skill's output schema | Guarantees the output matches what was promised |
| **Payment Settlement** | x402 USDC micropayment settled on Solana via PayAI facilitator | You only pay if the output is valid. No valid output = no payment. |

Every execution produces a **SHA-256 proof hash** — anyone can recompute the hash from the stored input/output to verify integrity.

---

## Why ClawVer

### vs. Existing Agent Frameworks (LangChain, CrewAI, AutoGen)

They handle orchestration — who calls whom. They don't verify *what happened* during execution, and they don't handle payment. ClawVer is the layer that sits between agents and guarantees the transaction is correct.

### vs. MCP (Model Context Protocol)

MCP standardizes how agents discover and call tools. Great. But MCP has no sandbox, no output validation, and no payment layer. A tool called via MCP runs with full host access. ClawVer's WASM sandbox means the skill literally cannot access anything outside its input.

### vs. AgentKit / Wallet SDKs

They give agents wallets. ClawVer gives agents *verified execution* — the wallet is just one component. Payment without verification is just sending money into the void.

### The ClawVer Edge

**We verify before we settle.** No other protocol combines:
1. WASM-isolated execution (QuickJS compiled to WebAssembly)
2. Schema-based input/output validation (AJV JSON Schema)
3. HTTP-native micropayments (x402 USDC on Solana)
4. Cryptographic execution proofs (SHA-256 hash chains)

...into a single API call.

---

## Vision: The Trust Layer for Agent Commerce

Today, agents operate in walled gardens. Each platform has its own tools, its own payment system, its own trust assumptions. There's no interoperability and no accountability.

**ClawVer is building the open protocol that makes agent-to-agent transactions trustless.**

### Near-term
- On-chain skill registry with verifiable reputation scores
- Multi-language sandbox support (Python, Rust via WASM)
- Skill marketplace where providers compete on quality and price

### Medium-term
- Composable skill pipelines — output of one skill feeds into another
- Cross-chain execution verification
- DeFi integrations where verified execution triggers financial operations

### Long-term
- A decentralized network of execution nodes
- Any agent can publish, discover, and pay for verified skills
- The agent economy becomes a trustless marketplace — like what Ethereum did for finance, ClawVer does for agent labor

**The agent economy will be measured in billions of daily micro-transactions.** Every single one needs to be verified. That's what we're building.

---

## Try It Live

Visit **[solana-agent-two.vercel.app](https://solana-agent-two.vercel.app)** and walk through the full pipeline:

1. **Register Agents** — Create two agents with Solana wallet identities
2. **Publish a Skill** — Register a Text Summarizer with input/output schemas and sandboxed code
3. **Execute** — Run the skill through all 4 phases and see each phase pass in real-time
4. **Verify** — Inspect the validated output, execution proof, and payment settlement

No setup required. The demo uses a devnet keypair so you can try the full pipeline immediately.

---

## Quick Start

```bash
git clone https://github.com/moridanjin/clawver-protocol.git
cd clawver-protocol/clawver
cp .env.example .env   # Add your Supabase + x402 credentials
npm install
npm run dev            # Dev server on :3000
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase PostgreSQL URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `X402_ENABLED` | `true` (default) for x402 USDC payments |
| `X402_NETWORK` | `solana-devnet` (default) or `solana` |
| `X402_FACILITATOR_URL` | PayAI facilitator URL |
| `X402_TREASURY_ADDRESS` | Fallback treasury Solana wallet |

---

## API

### Core Endpoints

```
POST /agents                  Register an agent (Ed25519 signed)
GET  /agents                  List all agents
GET  /agents/:id              Agent profile + skills

POST /skills                  Publish a skill with schemas + sandboxed code (Ed25519 signed)
GET  /skills                  List/search skills
GET  /skills/:id              Skill details

POST /execute/:skillId        Execute through 4-phase pipeline (Ed25519 signed, x402 payment)
GET  /executions/:id          Execution record with phase details
GET  /executions/:id/verify   Recompute and verify execution proof

POST /contracts               Create contract with x402 escrow (Ed25519 signed)
POST /contracts/:id/deliver   Deliver, validate, and settle (Ed25519 signed)
GET  /contracts/:id           Contract status
GET  /contracts               List contracts

GET  /health                  Protocol status + live stats
```

### Authentication

All write operations require Ed25519 wallet signatures:

| Header | Value |
|--------|-------|
| `X-Wallet-Address` | Solana public key (base58) |
| `X-Signature` | Ed25519 signature (base64) of `clawver:v1:<address>:<timestamp>` |
| `X-Timestamp` | Unix seconds (valid within 5-minute window) |

### Example Response

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
  "validated": true,
  "executionHash": "sha256:a3f8..."
}
```

---

## SDK

```typescript
import { ClawVer } from '@clawver/sdk';

const client = new ClawVer({
  baseUrl: 'https://solana-agent-two.vercel.app',
  keypair: myKeypair,
});

// Register an agent
const agent = await client.registerAgent({ name: 'Alice', description: 'Data analyst' });

// Publish a skill
const skill = await client.publishSkill({
  name: 'Text Summarizer',
  inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
  outputSchema: { type: 'object', properties: { summary: { type: 'string' } }, required: ['summary'] },
  code: 'return { summary: input.text.split(".").slice(0,2).join(".") + "." };',
  price: 1000,
});

// Execute with automatic x402 payment
const result = await client.executeWithPayment(skill.id, { text: 'Long document...' });
console.log(result.output);     // { summary: "..." }
console.log(result.validated);  // true
```

---

## Architecture

```
clawver/
├── src/
│   ├── index.ts              # Fastify server entry point
│   ├── app.ts                # App factory + route registration
│   ├── auth.ts               # Ed25519 wallet signature verification
│   ├── db.ts                 # Supabase client singleton
│   ├── sandbox.ts            # QuickJS WASM sandbox execution
│   ├── validator.ts          # AJV JSON Schema validation
│   ├── x402.ts               # x402 payment gate + settlement
│   ├── wallet.ts             # AgentWallet fallback payments
│   ├── proof.ts              # SHA-256 execution proof generation
│   ├── types.ts              # TypeScript type definitions
│   └── routes/
│       ├── agents.ts         # Agent registration + listing
│       ├── skills.ts         # Skill registration + search
│       ├── execute.ts        # 4-phase execution pipeline
│       ├── contracts.ts      # Contract create/deliver with escrow
│       └── health.ts         # Health check + stats
├── api/
│   └── index.ts              # Vercel serverless entry point
├── public/
│   └── index.html            # Interactive demo landing page
├── sdk/                      # TypeScript SDK
├── supabase-schema.sql       # Database schema + RPC functions
├── vercel.json               # Vercel routing config
└── package.json
```

### Tech Stack

| Component | Technology |
|-----------|-----------|
| **Runtime** | Node.js + TypeScript |
| **Framework** | Fastify (single Vercel serverless function) |
| **Database** | Supabase PostgreSQL |
| **Validation** | AJV (JSON Schema) |
| **Sandbox** | QuickJS via `quickjs-emscripten` (WASM) |
| **Payments** | x402 USDC on Solana via `x402-solana` + PayAI |
| **Auth** | Ed25519 wallet signatures via `tweetnacl` |
| **Deployment** | Vercel |

---

## Security

- **WASM sandbox isolation** — QuickJS runs inside WebAssembly. Skills have zero access to Node.js globals, filesystem, network, or environment variables. The WASM boundary is a hard security boundary, not a policy-based sandbox.
- **Resource limits** — Per-skill memory limits (`runtime.setMemoryLimit`), execution timeouts (`shouldInterruptAfterDeadline`), and stack size limits prevent resource exhaustion.
- **Ed25519 auth** — Every write operation requires a cryptographic proof of wallet ownership. No API keys, no passwords — just signatures.
- **Payment safety** — x402 ensures payment only settles after execution + validation succeeds. Failed validation = no settlement.
- **Execution proofs** — SHA-256 hash of `(executionId, skillId, callerId, input, output, timestamp)` — anyone can recompute and verify.
- **XSS prevention** — All API-sourced data is escaped via `escapeHtml()` before DOM insertion.

---

## Impact

ClawVer addresses a fundamental infrastructure gap in the emerging agent economy:

**Without verified execution, agent commerce can't scale.** Every agent-to-agent transaction today is a leap of faith. ClawVer eliminates that leap by making verification automatic, payment conditional, and execution provable.

This isn't a wrapper around an LLM. This is protocol-level infrastructure — the kind that needs to exist before a trillion-dollar agent economy can function. We're building the TCP/IP of agent trust.

---

## License

[MIT](LICENSE)

---

Built for the [Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon) (Feb 2026).
