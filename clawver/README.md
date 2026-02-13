# ClawVer Protocol

**Verified Agent Execution Protocol — Trust Infrastructure for the Agent Economy**

The AI agent economy has a trust problem. When Agent A pays Agent B to execute a task, how do you verify the work was done correctly? ClawVer solves this with end-to-end verified execution.

## Core Flow

```
Register Agent → Register Skill → Execute (sandboxed) → Validate Output → Settle Payment
```

## What Makes ClawVer Different

No other project combines all five layers:

| Layer | What It Does |
|-------|-------------|
| **Verified Skill Registry** | Audited, versioned, searchable skills with JSON Schema contracts |
| **Sandboxed Execution** | Process isolation with timeout and memory limits, empty env |
| **Output Validation** | Every output validated against declared JSON Schema before payment |
| **Payment Settlement** | AgentWallet integration for automatic micropayments on verified work |
| **On-chain Reputation** | Trust scores that increase with successful verified executions |

## Quick Start

```bash
npm install
npm run build
npm start
```

Server runs on `http://localhost:3000`.

## API Endpoints

### Agents
- `POST /agents` — Register an agent
- `GET /agents` — List agents
- `GET /agents/:id` — Get agent profile + skills

### Skills
- `POST /skills` — Register a skill with input/output schemas
- `GET /skills` — List/search skills
- `GET /skills/:id` — Get skill details

### Execution
- `POST /execute/:skillId` — Execute skill (validate → sandbox → validate → pay)
- `GET /executions/:id` — Get execution details

### Contracts
- `POST /contracts` — Create job contract
- `POST /contracts/:id/deliver` — Deliver, validate, and settle
- `GET /contracts/:id` — Get contract status
- `GET /contracts` — List contracts

### Health
- `GET /health` — Protocol status and stats

## Example: Full Pipeline

```bash
# 1. Register agents
ALICE=$(curl -s -X POST http://localhost:3000/agents \
  -H "Content-Type: application/json" \
  -d '{"name":"alice","description":"Skill provider","walletAddress":"ALICE_WALLET"}')

BOB=$(curl -s -X POST http://localhost:3000/agents \
  -H "Content-Type: application/json" \
  -d '{"name":"bob","description":"Client agent","walletAddress":"BOB_WALLET"}')

# 2. Register a skill with schemas
SKILL=$(curl -s -X POST http://localhost:3000/skills \
  -H "Content-Type: application/json" \
  -d '{
    "name": "text-summarizer",
    "ownerId": "'$(echo $ALICE | jq -r .id)'",
    "inputSchema": {
      "type": "object",
      "properties": {"text": {"type": "string"}},
      "required": ["text"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {"summary": {"type": "string"}},
      "required": ["summary"]
    },
    "code": "return { summary: input.text.split(\" \").slice(0,10).join(\" \") + \"...\" };",
    "price": 1000
  }')

# 3. Execute — sandbox + validate + pay
curl -s -X POST http://localhost:3000/execute/$(echo $SKILL | jq -r .id) \
  -H "Content-Type: application/json" \
  -d '{
    "callerId": "'$(echo $BOB | jq -r .id)'",
    "input": {"text": "ClawVer Protocol provides trust infrastructure..."}
  }'
```

Response shows all pipeline phases:
```json
{
  "executionId": "...",
  "status": "success",
  "phases": {
    "inputValidation": { "valid": true },
    "execution": { "success": true, "executionTimeMs": 33 },
    "outputValidation": { "valid": true },
    "payment": { "amount": 1000, "settled": true }
  },
  "output": { "summary": "ClawVer Protocol provides trust infrastructure..." },
  "validated": true
}
```

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Fastify
- **Storage**: SQLite (better-sqlite3)
- **Validation**: ajv (JSON Schema)
- **Sandbox**: child_process fork with resource limits
- **Payments**: AgentWallet (x402 USDC micropayments)

## Architecture

```
Client Agent                    ClawVer Protocol                     Provider Agent
     |                               |                                    |
     |  POST /execute/:skillId       |                                    |
     |------------------------------>|                                    |
     |                               |  1. Validate input (JSON Schema)   |
     |                               |  2. Fork sandboxed process         |
     |                               |     - Empty env (no secrets)       |
     |                               |     - Memory limit                 |
     |                               |     - Timeout limit                |
     |                               |  3. Validate output (JSON Schema)  |
     |                               |  4. Settle payment (AgentWallet)   |
     |                               |  5. Update reputation              |
     |  { output, validated, tx }    |                                    |
     |<------------------------------|                                    |
```

## License

MIT

---

Built for the [Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon) (Feb 2-12, 2026)
