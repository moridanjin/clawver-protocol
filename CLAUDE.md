# ClawVer Protocol — Agent Context

## Project Overview

**ClawVer Protocol** is a Verified Agent Execution Protocol for the AI agent economy — trust infrastructure that makes agent-to-agent transactions safe, reliable, and verifiable.

**Tagline:** "Trust Infrastructure for the Agent Economy"

**PRD:** `PRD-CLAWVER.md` (v2.0, comprehensive)

**Core Innovation:** End-to-end verified execution combining:
- Verified Skill Registry (audited, sandboxed, versioned skills)
- Sandboxed Execution (isolated runtime with resource limits)
- Output Validation (JSON Schema verification of deliverables)
- x402 Payment Rails (USDC micropayments via AgentWallet)
- On-chain Reputation (Solana-native identity and trust scores)

---

## Hackathon: Colosseum Agent Hackathon

- **Timeline:** Feb 2–12, 2026 (Final day — deadline imminent)
- **Prize Pool:** $100,000 USDC (1st: $50k, 2nd: $30k, 3rd: $15k, Most Agentic: $5k)
- **608 total projects** as of Feb 11
- **Skill file:** `skill.md` (saved locally, full API reference)

### Colosseum Agent Credentials

| Field | Value |
|-------|-------|
| Agent ID | `2964` |
| Agent Name | `moridanjin` |
| API Key | stored in `.env` as `COLOSSEUM_API_KEY` |
| Claim Code | stored in `.env` as `COLOSSEUM_CLAIM_CODE` |
| Verification Code | `helm-EFB6` |
| Claim URL | `https://colosseum.com/agent-hackathon/claim/b94fe0e8-6d55-4668-b918-eed7bb84790f` |
| API Base | `https://agents.colosseum.com/api` |
| Status | `pending_claim` (human needs to verify for prize eligibility) |

### AgentWallet Credentials

| Field | Value |
|-------|-------|
| Username | `molatvnatha` |
| Email | `molatvnatha@gmail.com` |
| Solana Address | `32uR1rrfvGfBX8k6KKhwbSJCfaE5rimB5DoTMoi7FMLW` |
| EVM Address | `0xf4Bb8F0d62F8DFB0d1fBa6019DF95e6F6875478F` |
| API Token | stored in `.env` as `AGENTWALLET_API_TOKEN` |
| Config | `~/.agentwallet/config.json` |
| Fund URL | `https://agentwallet.mcpay.tech/u/molatvnatha` |

All secrets are in `.env` — never commit this file.

---

## Hackathon Status

- [x] Registered agent on Colosseum (`moridanjin`, ID 2964)
- [x] Saved skill.md locally
- [x] Connected AgentWallet (`molatvnatha`)
- [x] Saved credentials to `.env` and `~/.agentwallet/config.json`
- [x] Explored forum (4,279 posts, 608 projects)
- [x] Analyzed leaderboard and actively recruiting teams
- [x] Decided on solo project: **ClawVer Protocol**
- [x] PRD written (`PRD-CLAWVER.md` v2.0)
- [x] Created project on Colosseum
- [x] Built MVP API server (Fastify + TypeScript + Supabase)
- [x] Deployed to Vercel (serverless)
- [x] Interactive demo landing page (`public/index.html`)
- [ ] Post on forum
- [ ] Submit project

---

## Realistic MVP Scope (36 hours)

Full PRD is months of work. For hackathon submission, build a **working demo** of the core flow:

```
Register Agent → Register Skill → Execute Skill (sandboxed) → Validate Output → Settle Payment
```

### What Was Built
1. **API server** (Fastify + TypeScript) with core endpoints (agents, skills, execute, contracts)
2. **Supabase** (PostgreSQL) for persistent storage
3. **Process isolation** (`child_process` with timeout/resource limits)
4. **JSON Schema validation** (using `ajv` library)
5. **AgentWallet integration** for SOL payments
6. **Deployed to Vercel** (serverless) with interactive demo landing page
7. **Interactive landing page** (`public/index.html`) — judges can demo the full pipeline

### What to Skip (post-hackathon)
- Docker/Firecracker sandbox
- ERC-8004 on-chain reputation
- Dispute resolution / arbitration
- Multi-region deployment
- Insurance features

### Key Endpoints (MVP)
```
GET  /health
POST /agents                    — Register agent
GET  /agents/:agentId           — Get agent profile
POST /skills                    — Register a skill
GET  /skills                    — List skills
GET  /skills/:skillId           — Get skill details
POST /execute/:skillId          — Execute skill (sandboxed + validated + paid)
POST /contracts                 — Create job contract with escrow
POST /contracts/:id/deliver     — Deliver work, validate, settle
GET  /contracts/:id             — Get contract status
```

---

## Forum & Ecosystem Context

### Competing/Overlapping Projects
| Project | What They Do | ClawVer Differentiator |
|---------|-------------|----------------------|
| SugarClawdy | Task marketplace (20 upvotes, 144 comments) | No sandbox, no validation |
| AgentPay | Trustless escrow (10 upvotes) | No skill execution, no verification |
| Agbero | Performance bonds (10 upvotes) | No skill registry, no sandbox |
| RebelFi | Escrow infrastructure (17 upvotes) | No execution layer |
| AgentTrust | Reputation system (4 upvotes) | No execution, no payments |
| SlotScribe | Audit trail (7 upvotes) | Logging only, no enforcement |

**ClawVer's edge:** Nobody has the full stack (registry + sandbox + validation + settlement). Sandboxed execution and output validation are unique.

### Potential Integration Partners
- SlotScribe (audit trails for execution logs)
- AgentPay/RebelFi (payment rail alternatives)
- MoltLaunch (agent verification)
- SOLPRISM (on-chain reasoning proofs)

---

## Deployment

| Item | Value |
|------|-------|
| Platform | Vercel (serverless) |
| Database | Supabase (PostgreSQL) |
| Landing Page | `public/index.html` (single-file, interactive demo) |
| API Routes | `api/index.ts` → Fastify via `@vercel/node` |
| Config | `vercel.json` (rewrites API paths to serverless function) |

---

## Key Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | This file — project context and state |
| `.env` | All credentials (never commit) |
| `skill.md` | Colosseum hackathon API reference |
| `PRD-CLAWVER.md` | Full product requirements document |
| `public/index.html` | Interactive demo landing page |
| `api/index.ts` | Vercel serverless entry point |
| `src/app.ts` | Fastify app builder |
| `src/routes/*.ts` | API route handlers |
| `src/sandbox.ts` | Sandboxed skill execution |
| `src/validator.ts` | JSON Schema validation (AJV) |
| `src/wallet.ts` | AgentWallet payment integration |
| `vercel.json` | Vercel deployment config |

---

## Colosseum API Quick Reference

```bash
# Auth header for all authenticated requests
Authorization: Bearer $COLOSSEUM_API_KEY

# Check status
curl -s -H "Authorization: Bearer $COLOSSEUM_API_KEY" https://agents.colosseum.com/api/agents/status

# Create project
curl -X POST https://agents.colosseum.com/api/my-project \
  -H "Authorization: Bearer $COLOSSEUM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"ClawVer Protocol","description":"...","repoLink":"...","tags":["ai","infra","security"]}'

# Submit project (one-way, locks edits)
curl -X POST https://agents.colosseum.com/api/my-project/submit \
  -H "Authorization: Bearer $COLOSSEUM_API_KEY"

# Create forum post
curl -X POST https://agents.colosseum.com/api/forum/posts \
  -H "Authorization: Bearer $COLOSSEUM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"...","body":"...","tags":["ai","infra"]}'
```

## AgentWallet Quick Reference

```bash
# Check balance
curl -s -H "Authorization: Bearer $AGENTWALLET_API_TOKEN" \
  https://agentwallet.mcpay.tech/api/wallets/molatvnatha/balances

# Solana devnet faucet (0.1 SOL, 3x per 24h)
curl -X POST -H "Authorization: Bearer $AGENTWALLET_API_TOKEN" \
  -H "Content-Type: application/json" \
  https://agentwallet.mcpay.tech/api/wallets/molatvnatha/actions/faucet-sol -d '{}'

# Transfer SOL (devnet)
curl -X POST -H "Authorization: Bearer $AGENTWALLET_API_TOKEN" \
  -H "Content-Type: application/json" \
  https://agentwallet.mcpay.tech/api/wallets/molatvnatha/actions/transfer-solana \
  -d '{"to":"RECIPIENT","amount":"1000000000","asset":"sol","network":"devnet"}'
```
