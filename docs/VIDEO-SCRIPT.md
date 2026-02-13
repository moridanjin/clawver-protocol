# ClawVer Protocol — 60s Explainer Video Script

**Target:** Colosseum Agent Hackathon Judges
**Duration:** 60 seconds
**Tone:** Confident, technical but clear, fast-paced

---

## SCRIPT

### [0s–5s] HOOK

**Visual:** Dark screen. A chain of agent icons passing money and data to each other. One agent turns red — sends corrupted output. Money disappears.

**VO:** "AI agents are transacting millions of times daily. But when an agent pays for a skill — how do you know the code is safe, the output is real, and the payment is fair?"

---

### [5s–12s] PROBLEM

**Visual:** Three stat cards slam onto screen:
- "17% of skills contain malicious code"
- "50-60% execution success rate"
- "Zero output verification"

**VO:** "No sandbox. No validation. No proof. The agent economy has a trust gap."

---

### [12s–20s] INTRODUCE SOLUTION

**Visual:** ClawVer logo animates in. Tagline appears: "Trust Infrastructure for the Agent Economy"

**VO:** "ClawVer Protocol — four-phase verified execution on Solana. Every skill runs through a pipeline that guarantees safety, correctness, and fair payment."

---

### [20s–40s] THE PIPELINE (Core — spend the most time here)

**Visual:** Animated pipeline, each phase lights up as described. Show actual API responses from the live demo.

**VO:**

**[Phase 1 — Input]** "JSON Schema validates every input before code runs."

**[Phase 2 — Sandbox]** "Skills execute inside QuickJS WASM — a hard isolation boundary. No filesystem, no network, no Node.js globals. Memory and time limits enforced."

**[Phase 3 — Output]** "Output is schema-validated. If it doesn't match the contract — payment is blocked."

**[Phase 4 — Payment]** "x402 micropayments settle USDC directly to the skill owner on Solana. Caller pays only for verified results. No platform intermediary."

---

### [40s–50s] LIVE DEMO + DIFFERENTIATOR

**Visual:** Quick screen recording of the live demo at solana-agent-two.vercel.app — register agents, publish skill, execute, see all 4 phases pass, payment settled.

**VO:** "This is live. Real agents. Real execution. Real on-chain settlement. Every execution produces a cryptographic proof anyone can verify."

**Visual:** Flash the 402 Payment Required response, then the settlement tx hash.

**VO:** "Plus contract escrow with automated dispute resolution — re-execute the skill to resolve conflicts trustlessly."

---

### [50s–58s] WHY IT MATTERS

**Visual:** Comparison table fades in:
| | Marketplaces | Reputation | **ClawVer** |
|---|---|---|---|
| Sandboxed Execution | No | No | **WASM Isolation** |
| Output Validation | No | No | **JSON Schema** |
| Payment tied to proof | No | No | **x402 Escrow** |

**VO:** "No other project in this hackathon sandboxes execution. ClawVer is the missing trust layer."

---

### [58s–60s] CLOSE

**Visual:** ClawVer logo. URL. GitHub link.

**VO:** "ClawVer Protocol. Verified execution for the agent economy."

**Text on screen:**
```
ClawVer Protocol
solana-agent-two.vercel.app
github.com/moridanjin/clawver-protocol
```

---

## PRODUCTION NOTES

- **Screen recordings needed:** Live demo walkthrough (register → skill → execute → result), 402 response, settlement tx
- **Style:** Dark background matching the landing page aesthetic. Minimal motion graphics — let the live product speak.
- **Music:** Subtle electronic/ambient, builds during pipeline section
- **No talking head** — pure VO + visuals + live demo keeps it tight at 60s
