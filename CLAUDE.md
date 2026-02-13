# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run

```bash
npm run build          # TypeScript compile (tsc) → dist/
npm run dev            # Local dev server with hot reload (tsx watch src/index.ts) on :3000
npm start              # Run compiled output (node dist/index.js)
npx vercel --prod      # Deploy to Vercel production
```

No test runner is configured. No linter is configured.

## Environment Variables

Required in `.env` (never commit):
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` — Supabase PostgreSQL connection
- `AGENTWALLET_API_TOKEN` — AgentWallet payment API
- `AGENTWALLET_USERNAME` — defaults to `molatvnatha`
- `COLOSSEUM_API_KEY` / `COLOSSEUM_CLAIM_CODE` — Colosseum hackathon API

## Architecture

**Fastify API server** deployed as a single Vercel serverless function. All API routes are handled by one function (`api/index.ts`) that creates a Fastify app and uses `app.inject()` to route Vercel requests internally.

### Request Flow (Vercel)

```
Browser/Agent → Vercel CDN
  ├─ /              → public/index.html (static, interactive demo landing page)
  ├─ /health        → api/index.ts → Fastify → src/routes/health.ts
  ├─ /agents/*      → api/index.ts → Fastify → src/routes/agents.ts
  ├─ /skills/*      → api/index.ts → Fastify → src/routes/skills.ts
  ├─ /execute/*     → api/index.ts → Fastify → src/routes/execute.ts
  ├─ /executions/*  → api/index.ts → Fastify → src/routes/execute.ts
  └─ /contracts/*   → api/index.ts → Fastify → src/routes/contracts.ts
```

Routing is configured via `vercel.json` rewrites — all API paths rewrite to `/api` (the serverless function). Static files in `public/` are served directly by Vercel (takes priority over rewrites).

### Core Pipeline (POST /execute/:skillId)

The central feature — `src/routes/execute.ts` — runs 4 phases sequentially:

1. **Input Validation** (`src/validator.ts`) — AJV validates input against skill's `inputSchema`
2. **Sandboxed Execution** (`src/sandbox.ts`) — Runs skill code via `new Function()` with a `setTimeout` guard. The `input` object is injected as a parameter. No filesystem/network access in the function scope.
3. **Output Validation** (`src/validator.ts`) — AJV validates result against skill's `outputSchema`
4. **Payment Settlement** (`src/wallet.ts`) — Calls AgentWallet REST API to transfer SOL (devnet) from platform wallet to skill owner

Contracts (`src/routes/contracts.ts`) follow the same pipeline but through a two-step create→deliver flow.

### Data Layer

`src/db.ts` exports a singleton Supabase client. All route handlers call `getDb()` and query Supabase tables directly (no ORM). Tables: `agents`, `skills`, `executions`, `contracts`. Column names are snake_case in DB, camelCase in API responses (each route file has a `format*` function).

### Authentication (Ed25519 Wallet Signatures)

`src/auth.ts` — Fastify `onRequest` hook verifying Ed25519 signatures on protected routes.

**How it works:** Agent signs message `clawver:v1:<walletAddress>:<unixTimestamp>` with Solana private key. Server verifies via `tweetnacl.sign.detached.verify()`.

**Three headers on protected requests:**
- `X-Wallet-Address` — Solana public key (base58)
- `X-Signature` — Ed25519 signature (base64)
- `X-Timestamp` — Unix seconds, valid within 5-minute window

**Route protection:**
- Public (no auth): all GET routes
- Signed (wallet proof, no agent lookup): POST /agents
- Protected (wallet proof + agent lookup): POST /skills, /execute/:skillId, /contracts, /contracts/:id/deliver

**Demo mode:** Landing page uses a hardcoded devnet demo keypair so hackathon judges can try the full pipeline without needing their own wallet. The demo keypair auto-signs all requests in the browser.

**Deps:** `tweetnacl` (Ed25519 verify, CJS), `bs58` v5 (base58 decode, CJS)

### Landing Page

`public/index.html` is a single-file HTML/CSS/JS page (no build step, no dependencies). It makes real `fetch()` calls to the same-origin API to demo the full pipeline interactively. Uses a demo keypair for auth signing (devnet only).

## Colosseum Hackathon Context

Built for the Colosseum Agent Hackathon (Feb 2-12, 2026). Agent ID `2964`, name `moridanjin`. Project is registered on Colosseum as "ClawVer Protocol" (status: draft). Live at https://solana-agent-two.vercel.app.

### Colosseum API

```bash
# All requests need: Authorization: Bearer $COLOSSEUM_API_KEY
curl -s -H "Authorization: Bearer $COLOSSEUM_API_KEY" https://agents.colosseum.com/api/agents/status
curl -s -H "Authorization: Bearer $COLOSSEUM_API_KEY" https://agents.colosseum.com/api/my-project
# Submit (one-way, locks edits):
curl -X POST -H "Authorization: Bearer $COLOSSEUM_API_KEY" https://agents.colosseum.com/api/my-project/submit
```

### AgentWallet API

```bash
# Check balance
curl -s -H "Authorization: Bearer $AGENTWALLET_API_TOKEN" https://agentwallet.mcpay.tech/api/wallets/molatvnatha/balances
# Devnet SOL faucet (3x per 24h)
curl -X POST -H "Authorization: Bearer $AGENTWALLET_API_TOKEN" -H "Content-Type: application/json" https://agentwallet.mcpay.tech/api/wallets/molatvnatha/actions/faucet-sol -d '{}'
```
