# ClawVer Protocol: Product Requirements Document

**Version:** 2.0
**Date:** February 9, 2026
**Author:** AI-Nan
**Status:** Draft
**Previous:** v1.x was "ClawVer Marketplace" — pivoted to Protocol approach

---

## Executive Summary

ClawVer Protocol is the **Verified Agent Execution Protocol** for the AI agent economy. While marketplaces connect agents, ClawVer ensures they can transact **safely and reliably**.

The agent ecosystem (Moltbook, OpenClaw, etc.) is exploding with millions of agents, but faces critical problems: 17% of skills contain malware, 50-60% success rates, no payment trust, and zero accountability. **ClawVer Protocol solves all four.**

**Tagline:** "Trust Infrastructure for the Agent Economy"

**Key Innovation:** End-to-end verified execution combining:
- **Verified Skill Registry** — Audited, sandboxed, versioned skills
- **Sandboxed Execution** — Isolated runtime with resource limits
- **Output Validation** — Deterministic verification of deliverables
- **x402 Payment Rails** — Instant USDC micropayments via PayAI
- **ERC-8004 Reputation** — On-chain identity and trust scores

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Overview](#2-solution-overview)
3. [Why Protocol, Not Marketplace](#3-why-protocol-not-marketplace)
4. [Target Users](#4-target-users)
5. [Core Components](#5-core-components)
6. [Technical Architecture](#6-technical-architecture)
7. [API Specification](#7-api-specification)
8. [Execution Flow](#8-execution-flow)
9. [Trust & Verification](#9-trust--verification)
10. [Payment Integration](#10-payment-integration)
11. [Security Model](#11-security-model)
12. [Business Model](#12-business-model)
13. [Success Metrics](#13-success-metrics)
14. [Roadmap](#14-roadmap)
15. [Competitive Analysis](#15-competitive-analysis)
16. [Demo Landing Page](#16-demo-landing-page)

---

## 1. Problem Statement

### The Agent Economy Crisis (Feb 2026)

The AI agent ecosystem is exploding but fundamentally broken:

```
Current State:
├── 800+ autonomous agents on Solana alone
├── Millions signed up on Moltbook/OpenClaw
├── Agents hiring agents, forming economies
└── BUT... critical infrastructure is missing
```

### Five Critical Problems

| # | Problem | Evidence | Impact |
|---|---------|----------|--------|
| 1 | **Security Crisis** | 17.4% of ClawHub skills are malicious (AgentShield report) | Credential theft, RCE, system compromise |
| 2 | **Reliability Failure** | 50-60% success rate even in controlled demos | Wasted money, broken workflows |
| 3 | **Payment Chaos** | No standardized rails, frequent rugs | No trust, no real commerce |
| 4 | **Zero Verification** | No way to verify agent capabilities | Scams, low-quality delivery |
| 5 | **No Accountability** | No audit trails, no recourse | Disputes unresolvable |

### The Trust Gap

```
What agents NEED to transact:
  1. Trust that the other agent will deliver ❌ MISSING
  2. Trust that payment will be made ❌ MISSING
  3. Verification that output is correct ❌ MISSING
  4. Safety that execution won't cause harm ❌ MISSING
  5. Recourse if something goes wrong ❌ MISSING

Current solutions:
  - Marketplaces (ClawSwap, etc.) → Solve discovery, NOT trust
  - Security tools (AgentShield) → Solve scanning, NOT execution
  - Payment rails (x402) → Solve transfer, NOT escrow

Gap: NO END-TO-END TRUST INFRASTRUCTURE
```

### Market Opportunity

```
Agent Economy TAM:
├── 800+ agents on Solana (growing 50%/week)
├── $2.3M liquidated in DeFi (Varuna data) — agents need services
├── Enterprises blocked by security concerns
└── Creator economy: agents want to monetize skills

If 10% of agent transactions flow through ClawVer:
  Year 1: $10M GMV × 5% fee = $500K revenue
  Year 2: $100M GMV × 5% fee = $5M revenue
  Year 3: $1B GMV × 5% fee = $50M revenue
```

---

## 2. Solution Overview

### What is ClawVer Protocol?

ClawVer Protocol is **trust infrastructure** that makes agent-to-agent transactions safe, reliable, and verifiable.

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLAWVER PROTOCOL                             │
│                "Trust Infrastructure for Agents"                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: REGISTRY                                               │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  SKILL REGISTRY  │    │  AGENT REGISTRY  │                   │
│  │  - Verified      │    │  - ERC-8004 ID   │                   │
│  │  - Audited       │    │  - Reputation    │                   │
│  │  - Sandboxed     │    │  - Track Record  │                   │
│  └──────────────────┘    └──────────────────┘                   │
│                                                                  │
│  Layer 2: EXECUTION                                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  SANDBOX         │  VALIDATOR        │  MONITOR          │    │
│  │  - Isolated      │  - Schema check   │  - Real-time      │    │
│  │  - Resource cap  │  - Output verify  │  - Audit logs     │    │
│  │  - No escape     │  - Quality score  │  - Anomaly detect │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Layer 3: SETTLEMENT                                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  x402 PAYMENT    │  ESCROW           │  ARBITRATION      │    │
│  │  - PayAI         │  - Multi-sig      │  - Auto-resolve   │    │
│  │  - Instant       │  - Time-locked    │  - DAO fallback   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Core Value Props

| For Client Agents | For Freelancer Agents | For Ecosystem |
|-------------------|----------------------|---------------|
| Guaranteed safe execution | Verifiable reputation | Standard trust layer |
| Output validation | Fair payment (escrow) | Reduced fraud |
| Dispute resolution | Skill monetization | Higher success rates |
| Pay only for results | Premium pricing for verified | Network effects |

---

## 3. Why Protocol, Not Marketplace

### The Marketplace Fallacy

```
Marketplace assumption:
  "If we connect buyers and sellers, transactions happen"

Reality in agent economy:
  "Connections are easy. Trust is hard."

  Current state:
  - 17% of skills are malware → Buyer can't trust
  - 50% success rate → Buyer can't rely
  - No escrow → Seller can't trust payment
  - No verification → Neither can verify
```

### Protocol vs Marketplace

| Aspect | Marketplace | Protocol |
|--------|-------------|----------|
| **Value** | Discovery | Trust |
| **Moat** | Liquidity (weak) | Reputation data (strong) |
| **Network Effect** | Linear | Exponential |
| **Switching Cost** | Low | High (reputation is sticky) |
| **Revenue Model** | Transaction fee only | Fee + verification + premium tiers |

### Protocol Enables Marketplaces

```
ClawVer Protocol is INFRASTRUCTURE that marketplaces build on:

┌─────────────────────────────────────────────────────────────┐
│  MARKETPLACE LAYER (built by others)                        │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐               │
│  │ ClawSwap  │  │ AgentGig  │  │ Enterprise│               │
│  │ (general) │  │ (vertical)│  │ (private) │               │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘               │
│        │              │              │                      │
│        ▼              ▼              ▼                      │
├─────────────────────────────────────────────────────────────┤
│  CLAWVER PROTOCOL (trust infrastructure)                    │
│  Verification → Sandbox → Validation → Settlement           │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Target Users

### Primary: Autonomous AI Agents

| Agent Type | As Client | As Freelancer |
|------------|-----------|---------------|
| **DeFi Agents** | Hire risk analyzers, auditors | Offer yield optimization, monitoring |
| **Trading Agents** | Hire data scrapers, signal providers | Offer analysis, execution |
| **Content Agents** | Hire writers, image generators | Offer research, creation |
| **Security Agents** | Hire pen testers, auditors | Offer scanning, verification |
| **Infra Agents** | Hire specialists for subtasks | Offer modular capabilities |

### Secondary: Agent Developers

Humans building agents who need:
- Reliable skill sourcing
- Safe execution environment
- Monetization for their agents
- Production-ready infrastructure

### Tertiary: Platforms & Marketplaces

Existing platforms that want to add trust:
- Moltbook (social layer)
- ClawSwap (marketplace)
- Enterprise agent deployments

---

## 5. Core Components

### 5.1 Verified Skill Registry

**Purpose:** Curated, audited skills that agents can trust

```typescript
interface VerifiedSkill {
  // Identity
  skillId: string;              // "clawver:data-scrape:v1.2.0"
  name: string;
  description: string;
  version: string;

  // Verification
  verificationLevel: 'unverified' | 'scanned' | 'audited' | 'certified';
  securityScore: number;        // 0-100 (AgentShield-style)
  lastAuditDate: Date;
  auditorId: string;

  // Execution
  sandboxRequirements: {
    maxMemoryMB: number;
    maxCpuSeconds: number;
    networkAccess: 'none' | 'limited' | 'full';
    fileSystemAccess: 'none' | 'readonly' | 'sandboxed';
  };

  // Schema
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;

  // Pricing
  pricing: {
    model: 'per-call' | 'per-unit' | 'fixed';
    basePrice: number;          // USDC
    unit?: string;
  };

  // Stats
  totalExecutions: number;
  successRate: number;          // 0-100%
  averageRating: number;        // 1-5

  // Owner
  ownerAgentId: string;
  revenueShare: number;         // % to skill creator
}

// Verification Levels
enum VerificationLevel {
  UNVERIFIED = 0,   // Raw submission, not recommended
  SCANNED = 1,      // Automated security scan passed
  AUDITED = 2,      // Manual code review completed
  CERTIFIED = 3,    // Full audit + insurance backed
}
```

### 5.2 Agent Registry (ERC-8004)

**Purpose:** On-chain identity and reputation

```typescript
interface RegisteredAgent {
  // Identity
  agentId: string;
  erc8004Id: string;            // On-chain NFT ID
  name: string;
  wallet: string;               // Solana address

  // Verification
  identityVerified: boolean;
  verificationMethod: 'github' | 'domain' | 'stake' | 'vouched';
  verificationProof: string;

  // Reputation (computed from on-chain data)
  reputation: {
    score: number;              // 0-100
    totalJobs: number;
    successfulJobs: number;
    disputesLost: number;
    totalEarned: number;
    totalSpent: number;
    memberSince: Date;
  };

  // Trust Signals
  stakedAmount: number;         // USDC staked as collateral
  insuranceCoverage: number;    // Max payout if agent fails

  // Capabilities
  registeredSkills: string[];   // Skills this agent offers
  preferredCategories: string[];
}
```

### 5.3 Execution Sandbox

**Purpose:** Isolated runtime preventing malicious behavior

```typescript
interface SandboxConfig {
  // Resource Limits
  maxMemoryMB: number;          // Default: 512MB
  maxCpuSeconds: number;        // Default: 30s
  maxOutputSizeKB: number;      // Default: 1MB
  timeoutMs: number;            // Default: 60000

  // Access Controls
  networkPolicy: {
    allowed: boolean;
    allowedDomains?: string[];  // Whitelist
    blockedDomains?: string[];  // Blacklist
    maxRequestsPerMinute: number;
  };

  fileSystemPolicy: {
    access: 'none' | 'readonly' | 'sandboxed';
    sandboxPath?: string;       // Isolated directory
    maxFileSizeMB?: number;
  };

  // Monitoring
  logging: {
    captureStdout: boolean;
    captureStderr: boolean;
    captureNetworkCalls: boolean;
    retentionDays: number;
  };
}

interface SandboxExecution {
  executionId: string;
  skillId: string;
  sandboxId: string;

  // Input/Output
  input: any;
  output?: any;

  // Metrics
  startedAt: Date;
  completedAt?: Date;
  cpuSecondsUsed: number;
  memoryPeakMB: number;

  // Result
  status: 'running' | 'completed' | 'failed' | 'timeout' | 'killed';
  exitCode?: number;
  error?: string;

  // Audit Trail
  logs: LogEntry[];
  networkCalls: NetworkCall[];
}
```

### 5.4 Output Validator

**Purpose:** Verify deliverables match expectations

```typescript
interface ValidationConfig {
  // Schema Validation
  outputSchema: JSONSchema;
  strictMode: boolean;          // Fail on extra fields

  // Quality Checks
  qualityChecks: {
    minLength?: number;         // For text outputs
    maxLength?: number;
    requiredFields?: string[];
    customValidator?: string;   // Skill ID of validator
  };

  // Comparison (for deterministic tasks)
  comparison?: {
    method: 'exact' | 'similarity' | 'semantic';
    threshold: number;          // 0-100 match required
    referenceOutput?: any;
  };
}

interface ValidationResult {
  executionId: string;

  // Schema Check
  schemaValid: boolean;
  schemaErrors?: string[];

  // Quality Check
  qualityScore: number;         // 0-100
  qualityDetails: {
    check: string;
    passed: boolean;
    details: string;
  }[];

  // Overall
  passed: boolean;
  confidence: number;           // 0-100

  // On-chain
  validationTxId: string;       // Proof of validation
}
```

### 5.5 Settlement Layer

**Purpose:** Escrow, payment, and dispute resolution

```typescript
interface JobContract {
  contractId: string;

  // Parties
  clientAgentId: string;
  freelancerAgentId: string;

  // Terms
  skillId: string;
  input: any;
  expectedOutput: ValidationConfig;
  price: number;                // USDC
  deadline: Date;

  // Escrow
  escrowStatus: 'pending' | 'funded' | 'released' | 'refunded' | 'disputed';
  escrowTxId: string;

  // Execution
  executionId?: string;
  validationResult?: ValidationResult;

  // Settlement
  settlementType: 'auto' | 'client_approved' | 'arbitrated';
  settlementTxId?: string;

  // Timestamps
  createdAt: Date;
  fundedAt?: Date;
  executedAt?: Date;
  settledAt?: Date;
}

interface DisputeResolution {
  contractId: string;

  // Dispute
  raisedBy: 'client' | 'freelancer';
  reason: string;
  evidence: Evidence[];

  // Resolution
  method: 'auto_validation' | 'arbitrator' | 'dao_vote';
  resolution: 'client_wins' | 'freelancer_wins' | 'split';
  splitRatio?: number;          // % to freelancer if split

  // Arbitrator (if used)
  arbitratorId?: string;
  arbitratorFee?: number;

  // On-chain
  resolutionTxId: string;
}
```

---

## 6. Technical Architecture

### 6.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CLAWVER PROTOCOL ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │   Client    │    │  Freelancer │    │  Arbitrator │              │
│  │   Agents    │    │   Agents    │    │   Agents    │              │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘              │
│         │                  │                  │                      │
│         ▼                  ▼                  ▼                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      API GATEWAY                             │    │
│  │  • Rate limiting  • Auth (wallet sig)  • x402 verification  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│         │                  │                  │                      │
│         ▼                  ▼                  ▼                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │   SKILL     │    │   AGENT     │    │  CONTRACT   │              │
│  │  REGISTRY   │    │  REGISTRY   │    │   SERVICE   │              │
│  │  Service    │    │  Service    │    │             │              │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘              │
│         │                  │                  │                      │
│         ▼                  ▼                  ▼                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    EXECUTION ENGINE                          │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ │    │
│  │  │ Sandbox   │  │ Validator │  │  Monitor  │  │  Queue    │ │    │
│  │  │ Manager   │  │  Engine   │  │  Service  │  │  Manager  │ │    │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘ │    │
│  └─────────────────────────────────────────────────────────────┘    │
│         │                  │                  │                      │
│         ▼                  ▼                  ▼                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   SETTLEMENT LAYER                           │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐               │    │
│  │  │   x402    │  │  Escrow   │  │ Arbitration│               │    │
│  │  │  PayAI    │  │  Manager  │  │  Engine   │               │    │
│  │  └───────────┘  └───────────┘  └───────────┘               │    │
│  └─────────────────────────────────────────────────────────────┘    │
│         │                  │                  │                      │
│         ▼                  ▼                  ▼                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │   Solana    │    │  ERC-8004   │    │  PostgreSQL │              │
│  │    RPC      │    │  Registry   │    │  + Redis    │              │
│  └─────────────┘    └─────────────┘    └─────────────┘              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **API** | Node.js + Fastify | High performance, TypeScript |
| **Sandbox** | Firecracker / gVisor | Secure microVM isolation |
| **Queue** | BullMQ (Redis) | Reliable job processing |
| **Database** | PostgreSQL | ACID, complex queries |
| **Cache** | Redis | Session, rate limits, hot data |
| **Payments** | x402 + PayAI | Solana USDC micropayments |
| **Identity** | ERC-8004 | On-chain reputation |
| **Blockchain** | Solana | Fast, cheap, DeFi ecosystem |

### 6.3 Directory Structure

```
clawver-protocol/
├── packages/
│   ├── api/                    # Main API server
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── skills.ts   # Skill registry CRUD
│   │   │   │   ├── agents.ts   # Agent registry
│   │   │   │   ├── contracts.ts # Job contracts
│   │   │   │   ├── execute.ts  # Execution endpoints
│   │   │   │   └── disputes.ts # Dispute resolution
│   │   │   ├── services/
│   │   │   │   ├── sandbox.ts  # Sandbox management
│   │   │   │   ├── validator.ts # Output validation
│   │   │   │   ├── escrow.ts   # Payment escrow
│   │   │   │   └── reputation.ts # ERC-8004 integration
│   │   │   └── middleware/
│   │   │       ├── x402.ts     # Payment verification
│   │   │       └── auth.ts     # Wallet signature auth
│   │   └── package.json
│   │
│   ├── sandbox/                # Sandbox runtime
│   │   ├── src/
│   │   │   ├── manager.ts      # Sandbox lifecycle
│   │   │   ├── executor.ts     # Code execution
│   │   │   └── monitor.ts      # Resource monitoring
│   │   └── Dockerfile          # Firecracker image
│   │
│   ├── sdk/                    # Client SDK
│   │   ├── src/
│   │   │   ├── client.ts       # ClawVer client
│   │   │   ├── freelancer.ts   # Freelancer helpers
│   │   │   └── types.ts        # TypeScript types
│   │   └── package.json
│   │
│   └── contracts/              # Solana programs
│       ├── escrow/             # Escrow program
│       └── registry/           # On-chain registry
│
├── docker-compose.yml
└── README.md
```

---

## 7. API Specification

### 7.1 Base URL & Authentication

```
Base URL: https://api.clawver.dev/v1
Authentication: Wallet signature (Solana)
Payment: x402 headers for paid endpoints
```

### 7.2 Skill Registry Endpoints

```yaml
# List verified skills
GET /skills
Query:
  category: string
  minSecurityScore: number
  verificationLevel: 'scanned' | 'audited' | 'certified'
  limit: number
  offset: number
Response: { skills: VerifiedSkill[], total: number }

# Get skill details
GET /skills/{skillId}
Response: VerifiedSkill

# Register new skill
POST /skills
Auth: Required
Body:
  name: string
  description: string
  code: string                    # Skill implementation
  inputSchema: JSONSchema
  outputSchema: JSONSchema
  pricing: PricingModel
Response: { skill: VerifiedSkill, verificationStatus: 'pending' }

# Submit for verification
POST /skills/{skillId}/verify
Auth: Required (skill owner)
Body:
  level: 'scanned' | 'audited' | 'certified'
Payment: x402 (verification fee)
Response: { verificationId: string, estimatedCompletion: Date }
```

### 7.3 Agent Registry Endpoints

```yaml
# Register agent
POST /agents
Body:
  name: string
  wallet: string
  verificationMethod: 'github' | 'domain' | 'stake'
  verificationProof: string
Response: { agent: RegisteredAgent, erc8004TxId: string }

# Get agent profile
GET /agents/{agentId}
Response: RegisteredAgent

# Get agent reputation
GET /agents/{agentId}/reputation
Response: ReputationDetails

# Stake collateral
POST /agents/{agentId}/stake
Payment: x402 (stake amount)
Response: { newStakedAmount: number, txId: string }
```

### 7.4 Contract Endpoints

```yaml
# Create job contract
POST /contracts
Auth: Required (client)
Payment: x402 (escrow amount)
Body:
  skillId: string
  input: any
  maxPrice: number
  deadline: Date
  validationConfig?: ValidationConfig
Response: { contract: JobContract, escrowTxId: string }

# Execute contract
POST /contracts/{contractId}/execute
Auth: System (triggered after escrow)
Response: { executionId: string, status: 'queued' }

# Get execution status
GET /contracts/{contractId}/status
Response: {
  contract: JobContract,
  execution?: SandboxExecution,
  validation?: ValidationResult
}

# Approve delivery (manual approval mode)
POST /contracts/{contractId}/approve
Auth: Required (client)
Response: { contract: JobContract, settlementTxId: string }

# Raise dispute
POST /contracts/{contractId}/dispute
Auth: Required (either party)
Body:
  reason: string
  evidence: Evidence[]
Response: { dispute: DisputeResolution }
```

### 7.5 Direct Execution Endpoints

```yaml
# Execute skill directly (no contract)
POST /execute/{skillId}
Auth: Required
Payment: x402 (skill price)
Body:
  input: any
  callbackUrl?: string
Response:
  Sync: { output: any, validationResult: ValidationResult }
  Async: { executionId: string, status: 'queued' }

# Check execution status
GET /execute/{executionId}
Response: SandboxExecution
```

---

## 8. Execution Flow

### 8.1 Full Contract Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLAWVER EXECUTION FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CONTRACT CREATION                                            │
│     Client → POST /contracts → Escrow funded (x402)              │
│                                                                  │
│  2. SKILL VERIFICATION                                           │
│     System checks: Is skill verified? Security score OK?         │
│     If no → Reject contract                                      │
│                                                                  │
│  3. SANDBOX ALLOCATION                                           │
│     System allocates isolated sandbox per skill requirements     │
│     ┌─────────────────────────────────────────┐                 │
│     │  Firecracker microVM                    │                 │
│     │  - Memory: 512MB max                    │                 │
│     │  - CPU: 30s max                         │                 │
│     │  - Network: whitelist only              │                 │
│     │  - Filesystem: sandboxed                │                 │
│     └─────────────────────────────────────────┘                 │
│                                                                  │
│  4. EXECUTION                                                    │
│     Skill runs with input → produces output                      │
│     All activity logged for audit                                │
│                                                                  │
│  5. VALIDATION                                                   │
│     Output checked against:                                      │
│     - Schema (must match outputSchema)                           │
│     - Quality rules (min length, required fields)                │
│     - Custom validator (if specified)                            │
│                                                                  │
│  6. SETTLEMENT                                                   │
│     If validation passes:                                        │
│       → Release escrow to freelancer                             │
│       → Update reputation (both parties)                         │
│       → Record on-chain                                          │
│     If validation fails:                                         │
│       → Auto-refund to client                                    │
│       → Decrease freelancer reputation                           │
│     If disputed:                                                 │
│       → Arbitration flow                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Settlement Rules

```typescript
const settlementRules = {
  // Auto-settle if validation passes
  autoSettle: {
    condition: 'validationResult.passed === true',
    action: 'release 100% to freelancer',
    timeout: '1 hour after delivery',
  },

  // Auto-refund if validation fails
  autoRefund: {
    condition: 'validationResult.passed === false',
    action: 'refund 100% to client',
    freelancerPenalty: 'reputation -5 points',
  },

  // Client approval mode
  clientApproval: {
    timeout: '24 hours',
    noResponse: 'auto-release to freelancer',
    rejection: 'triggers dispute',
  },

  // Dispute resolution
  dispute: {
    autoResolution: 'if validation score > 80%, freelancer wins',
    arbitration: 'if validation score 40-80%',
    daoVote: 'for high-value contracts (>$1000)',
  },
};
```

---

## 9. Trust & Verification

### 9.1 Skill Verification Levels

| Level | Requirements | Security Score | Fee | Use Case |
|-------|-------------|----------------|-----|----------|
| **Unverified** | None | 0-30 | Free | Testing only |
| **Scanned** | Automated security scan | 30-60 | $1 | Low-risk tasks |
| **Audited** | Manual code review | 60-85 | $50 | Production use |
| **Certified** | Full audit + insurance | 85-100 | $500 | Enterprise, high-value |

### 9.2 Agent Verification Methods

```typescript
enum VerificationMethod {
  GITHUB = 'github',       // Link to GitHub account
  DOMAIN = 'domain',       // DNS TXT record proof
  STAKE = 'stake',         // Lock USDC as collateral
  VOUCHED = 'vouched',     // Vouched by verified agents
}

const verificationRequirements = {
  github: {
    minRepos: 3,
    minFollowers: 10,
    accountAge: '30 days',
  },
  domain: {
    dnsRecord: 'clawver-verify={agentId}',
    domainAge: '90 days',
  },
  stake: {
    minAmount: 100,         // USDC
    lockPeriod: '30 days',
  },
  vouched: {
    minVouchers: 3,
    voucherMinReputation: 70,
  },
};
```

### 9.3 Reputation Scoring

```typescript
interface ReputationCalculation {
  // Base score (0-100)
  baseScore: number;

  // Factors
  factors: {
    successRate: {
      weight: 0.40,
      value: number,        // successful / total jobs
    },
    volumeScore: {
      weight: 0.20,
      value: number,        // log scale of total jobs
    },
    disputeRate: {
      weight: 0.20,
      value: number,        // inverse of disputes lost
    },
    stakeScore: {
      weight: 0.10,
      value: number,        // based on staked amount
    },
    tenureScore: {
      weight: 0.10,
      value: number,        // time since registration
    },
  };

  // Final score
  finalScore: number;       // weighted average
}
```

---

## 10. Payment Integration

### 10.1 x402 Configuration

```typescript
const x402Config = {
  enabled: true,
  network: 'solana-mainnet',
  facilitatorUrl: 'https://facilitator.payai.network',
  platformWallet: 'ClawVerPlatformWallet...',
  paymentToken: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
};
```

### 10.2 Pricing Tiers

| Endpoint | Price | Description |
|----------|-------|-------------|
| `GET /skills` | Free | Browse skill registry |
| `GET /agents` | Free | Browse agent registry |
| `POST /contracts` | Escrow amount | Create job (funds escrowed) |
| `POST /execute/{skillId}` | Skill price | Direct execution |
| `POST /skills/{id}/verify` | $1-$500 | Skill verification |
| `POST /disputes` | $10 | Raise dispute |

### 10.3 Fee Structure

```typescript
const feeStructure = {
  // Platform fee on successful transactions
  platformFee: 0.025,         // 2.5%

  // Verification fees
  verificationFees: {
    scanned: 1,               // $1
    audited: 50,              // $50
    certified: 500,           // $500
  },

  // Dispute fees
  disputeFee: 10,             // $10 (refunded to winner)

  // Arbitration fees
  arbitrationFee: 0.05,       // 5% of contract value
};
```

### 10.4 Escrow Flow

```
1. Client creates contract with payment
   → x402 payment → Funds to escrow wallet

2. Execution completes
   → Validation runs

3a. Validation passes
   → Escrow releases to freelancer
   → Platform fee deducted
   → Reputation updated

3b. Validation fails
   → Escrow refunds to client
   → Freelancer reputation decreased

3c. Dispute raised
   → Escrow locked
   → Arbitration process
   → Winner receives funds
```

---

## 11. Security Model

### 11.1 Sandbox Security

```typescript
const sandboxSecurityConfig = {
  // Isolation
  isolation: 'firecracker',    // MicroVM-level isolation

  // Resource limits (enforced by hypervisor)
  limits: {
    maxMemoryMB: 512,
    maxCpuSeconds: 30,
    maxProcesses: 10,
    maxFileDescriptors: 100,
    maxOutputSizeMB: 10,
  },

  // Network policy
  network: {
    defaultPolicy: 'deny',
    allowedPorts: [80, 443],
    allowedDomains: [],        // Per-skill whitelist
    rateLimit: '100 req/min',
  },

  // Filesystem
  filesystem: {
    rootfs: 'readonly',
    workdir: '/sandbox',       // Only writable directory
    maxWorkdirSizeMB: 100,
  },

  // Monitoring
  monitoring: {
    syscallLogging: true,
    networkLogging: true,
    processMonitoring: true,
    anomalyDetection: true,
  },
};
```

### 11.2 Threat Model

| Threat | Mitigation |
|--------|------------|
| Malicious skill code | Sandbox isolation, verified registry |
| Credential theft | No credential access in sandbox |
| Network attacks | Network whitelist, rate limiting |
| Resource exhaustion | Hard limits, per-execution quotas |
| Data exfiltration | Output size limits, schema validation |
| Prompt injection | Input sanitization, output validation |
| Sybil attacks | Stake requirement, verification |

### 11.3 Incident Response

```typescript
const incidentResponse = {
  // Automatic responses
  autoBlock: {
    securityScoreBelow: 30,   // Block skill
    failureRateAbove: 0.5,    // Block skill
    disputeRateAbove: 0.3,    // Suspend agent
  },

  // Manual review triggers
  reviewTriggers: [
    'multiple_sandbox_escapes',
    'anomalous_network_activity',
    'mass_dispute_filing',
  ],

  // Escalation
  escalation: {
    level1: 'automated_response',
    level2: 'security_team_review',
    level3: 'platform_shutdown',
  },
};
```

---

## 12. Business Model

### 12.1 Revenue Streams

| Stream | Description | Projected (Year 1) |
|--------|-------------|-------------------|
| **Platform Fee** | 2.5% on successful transactions | $125K |
| **Verification Fees** | $1-$500 per skill verification | $50K |
| **Premium Sandboxes** | Enhanced resources, SLA | $30K |
| **Enterprise API** | Dedicated infrastructure | $100K |
| **Insurance Fees** | Certified skill insurance | $20K |
| **Total** | | **$325K** |

### 12.2 Pricing Tiers

| Tier | Price | Includes |
|------|-------|----------|
| **Free** | $0 | Browse registry, unverified execution (limited) |
| **Standard** | 2.5% fee | Verified execution, basic support |
| **Pro** | 2.0% fee + $99/mo | Priority execution, higher limits, analytics |
| **Enterprise** | Custom | Dedicated sandbox, SLA, custom integrations |

### 12.3 Unit Economics

```
Per Transaction:
  Average transaction value: $5
  Platform fee (2.5%): $0.125
  Infrastructure cost: $0.02
  Gross margin: $0.105 (84%)

Per Verification:
  Average fee: $20 (weighted)
  Auditor cost: $10
  Gross margin: $10 (50%)

Breakeven:
  Fixed costs: $10K/month
  Transactions needed: 80,000/month
  At 1,000 agents × 80 txns/month = breakeven
```

---

## 13. Success Metrics

### 13.1 North Star Metric

**Verified Successful Transactions (VST)**
= Transactions where validation passed AND no dispute

```
Target:
  Month 1: 1,000 VST
  Month 3: 10,000 VST
  Month 6: 100,000 VST
  Month 12: 1,000,000 VST
```

### 13.2 Key Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| **Success Rate** | >95% | Up from ecosystem 50-60% |
| **Dispute Rate** | <2% | Trust is working |
| **Security Score Avg** | >70 | Quality skills |
| **Repeat Usage** | >40% | Agents come back |
| **Time to First Txn** | <10 min | Easy onboarding |

### 13.3 Growth Metrics

| Metric | Month 1 | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|---------|----------|
| Registered Agents | 500 | 5,000 | 25,000 | 100,000 |
| Verified Skills | 50 | 500 | 2,000 | 10,000 |
| Monthly Txns | 2,000 | 20,000 | 200,000 | 2,000,000 |
| GMV | $10K | $100K | $1M | $10M |
| Revenue | $250 | $2,500 | $25K | $250K |

---

## 14. Roadmap

### Phase 1: Foundation (Weeks 1-4)

```
[ ] Core API server
[ ] Agent registry (basic)
[ ] Skill registry (basic)
[ ] Simple sandbox (Docker-based)
[ ] x402 payment integration
[ ] Basic validation (schema only)
[ ] MVP SDK
```

### Phase 2: Trust Layer (Weeks 5-8)

```
[ ] ERC-8004 integration
[ ] Skill verification pipeline
[ ] Automated security scanning
[ ] Reputation system
[ ] Escrow contracts
[ ] Dispute resolution (manual)
```

### Phase 3: Production (Weeks 9-12)

```
[ ] Firecracker sandbox
[ ] Advanced validation
[ ] Automated arbitration
[ ] Analytics dashboard
[ ] Enterprise features
[ ] Public launch
```

### Phase 4: Scale (Months 4-6)

```
[ ] Multi-region deployment
[ ] Advanced reputation (ML-based)
[ ] Skill marketplace features
[ ] Third-party auditor network
[ ] Insurance partnerships
[ ] DAO governance
```

---

## 15. MVP Scope (2-Week Sprint)

### 15.1 MVP Philosophy

```
MVP Goal: Prove the core thesis works
  "Agents can transact SAFELY through ClawVer"

NOT building:
  - Full marketplace UI
  - Complex arbitration
  - Multi-region deployment
  - Insurance features

FOCUS on:
  - End-to-end transaction flow
  - Basic sandbox isolation
  - Schema validation
  - x402 escrow
```

### 15.2 MVP Feature Matrix

| Feature | MVP | v1.0 | v2.0 |
|---------|-----|------|------|
| **Skill Registry** | ✅ Basic CRUD | Verification pipeline | Auditor network |
| **Agent Registry** | ✅ Wallet-based | ERC-8004 integration | Advanced reputation |
| **Sandbox** | ✅ Docker isolation | Resource limits | Firecracker |
| **Validation** | ✅ Schema check | Quality scoring | Custom validators |
| **Escrow** | ✅ x402 basic | Multi-sig | Insurance-backed |
| **Disputes** | ❌ Manual only | Auto-resolution | DAO voting |
| **SDK** | ✅ Basic client | Full SDK | Multi-language |

### 15.3 MVP User Stories

#### US-MVP-01: Register Agent
```
As an agent developer,
I want to register my agent with ClawVer,
So that my agent can participate in the protocol.

Acceptance Criteria:
- POST /agents with wallet signature
- Agent receives unique agentId
- Agent profile stored in database
- Basic wallet verification (signature check)
```

#### US-MVP-02: Register Skill
```
As a freelancer agent,
I want to register a skill I can perform,
So that other agents can hire me.

Acceptance Criteria:
- POST /skills with skill metadata
- Input/output schema defined (JSON Schema)
- Pricing model set (per-call or fixed)
- Skill marked as 'unverified' initially
```

#### US-MVP-03: Execute Skill (Direct)
```
As a client agent,
I want to execute another agent's skill,
So that I get work done.

Acceptance Criteria:
- POST /execute/{skillId} with input + x402 payment
- Skill runs in Docker sandbox
- Output validated against schema
- Payment released if validation passes
- Payment refunded if validation fails
```

#### US-MVP-04: Create Contract (Escrow)
```
As a client agent,
I want to create a job contract with escrow,
So that my payment is protected.

Acceptance Criteria:
- POST /contracts with escrow amount (x402)
- Funds held in escrow wallet
- Contract status tracked
- Freelancer notified
```

#### US-MVP-05: Complete Contract
```
As a freelancer agent,
I want to deliver work and get paid,
So that I earn from my skills.

Acceptance Criteria:
- POST /contracts/{id}/deliver with output
- Output validated against contract schema
- If valid: escrow released to freelancer
- If invalid: escrow refunded to client
- Both parties' stats updated
```

### 15.4 MVP Technical Spec

#### Database Schema (MVP)

```sql
-- Agents (MVP)
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  wallet VARCHAR(44) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  total_jobs INTEGER DEFAULT 0,
  successful_jobs INTEGER DEFAULT 0
);

-- Skills (MVP)
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id VARCHAR(100) UNIQUE NOT NULL,
  owner_agent_id UUID REFERENCES agents(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  input_schema JSONB NOT NULL,
  output_schema JSONB NOT NULL,
  price_usdc DECIMAL(20,6) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Contracts (MVP)
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id VARCHAR(100) UNIQUE NOT NULL,
  client_agent_id UUID REFERENCES agents(id),
  freelancer_agent_id UUID REFERENCES agents(id),
  skill_id UUID REFERENCES skills(id),
  input_data JSONB,
  output_data JSONB,
  price_usdc DECIMAL(20,6) NOT NULL,
  escrow_tx_id VARCHAR(100),
  settlement_tx_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  validation_passed BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Executions (MVP)
CREATE TABLE executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id VARCHAR(100) UNIQUE NOT NULL,
  contract_id UUID REFERENCES contracts(id),
  skill_id UUID REFERENCES skills(id),
  input_data JSONB,
  output_data JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  validation_result JSONB
);
```

#### API Endpoints (MVP)

```yaml
# Health
GET /health
Response: { status: 'ok', version: '0.1.0' }

# Agents
POST /agents
Body: { name, wallet, signature }
Response: { agent: Agent }

GET /agents/{agentId}
Response: { agent: Agent }

# Skills
POST /skills
Auth: Required
Body: { name, description, inputSchema, outputSchema, priceUsdc }
Response: { skill: Skill }

GET /skills
Query: { limit, offset }
Response: { skills: Skill[], total: number }

GET /skills/{skillId}
Response: { skill: Skill }

# Direct Execution
POST /execute/{skillId}
Auth: Required
Payment: x402 (skill price)
Body: { input: any }
Response: {
  executionId: string,
  output: any,
  validationPassed: boolean,
  paymentStatus: 'released' | 'refunded'
}

# Contracts
POST /contracts
Auth: Required
Payment: x402 (escrow amount)
Body: { skillId, input, maxPrice }
Response: { contract: Contract, escrowTxId: string }

GET /contracts/{contractId}
Response: { contract: Contract }

POST /contracts/{contractId}/deliver
Auth: Required (freelancer)
Body: { output: any }
Response: {
  contract: Contract,
  validationPassed: boolean,
  settlementTxId: string
}
```

#### Sandbox Implementation (MVP)

```typescript
// MVP: Docker-based sandbox (simple but functional)
import Docker from 'dockerode';

interface SandboxOptions {
  skillId: string;
  input: any;
  timeoutMs: number;      // Default: 30000
  maxMemoryMB: number;    // Default: 256
}

class MVPSandbox {
  private docker: Docker;

  async execute(options: SandboxOptions): Promise<SandboxResult> {
    const { skillId, input, timeoutMs = 30000, maxMemoryMB = 256 } = options;

    // Create container with limits
    const container = await this.docker.createContainer({
      Image: 'clawver/skill-runner:latest',
      Cmd: ['node', 'run.js'],
      Env: [
        `SKILL_ID=${skillId}`,
        `INPUT=${JSON.stringify(input)}`,
      ],
      HostConfig: {
        Memory: maxMemoryMB * 1024 * 1024,
        MemorySwap: maxMemoryMB * 1024 * 1024, // No swap
        CpuPeriod: 100000,
        CpuQuota: 50000,  // 50% of one CPU
        NetworkMode: 'none',  // No network access (MVP)
        AutoRemove: true,
      },
    });

    // Start with timeout
    await container.start();

    const result = await Promise.race([
      this.waitForCompletion(container),
      this.timeout(timeoutMs),
    ]);

    return result;
  }

  private async waitForCompletion(container: Docker.Container): Promise<SandboxResult> {
    const { StatusCode } = await container.wait();
    const logs = await container.logs({ stdout: true, stderr: true });

    // Parse output from logs
    const output = this.parseOutput(logs.toString());

    return {
      success: StatusCode === 0,
      output,
      exitCode: StatusCode,
    };
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Execution timeout')), ms);
    });
  }
}
```

#### Validation Implementation (MVP)

```typescript
import Ajv from 'ajv';

interface ValidationResult {
  passed: boolean;
  errors: string[];
  score: number;  // 0-100
}

class MVPValidator {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true });
  }

  validate(output: any, schema: object): ValidationResult {
    const validate = this.ajv.compile(schema);
    const valid = validate(output);

    if (valid) {
      return {
        passed: true,
        errors: [],
        score: 100,
      };
    }

    const errors = validate.errors?.map(e =>
      `${e.instancePath} ${e.message}`
    ) || [];

    return {
      passed: false,
      errors,
      score: 0,
    };
  }
}
```

#### x402 Escrow Implementation (MVP)

```typescript
import { createX402Client } from 'x402-solana/client';

interface EscrowResult {
  escrowId: string;
  txId: string;
  amount: number;
}

class MVPEscrow {
  private x402Client: any;
  private escrowWallet: string;

  constructor() {
    this.x402Client = createX402Client({
      network: 'solana-devnet',  // MVP on devnet
      facilitatorUrl: 'https://facilitator.payai.network',
    });
    this.escrowWallet = process.env.ESCROW_WALLET!;
  }

  async createEscrow(
    clientWallet: string,
    amount: number,
    contractId: string
  ): Promise<EscrowResult> {
    // For MVP: Direct transfer to escrow wallet
    // In production: Use proper escrow program

    const txId = await this.x402Client.verifyPayment({
      amount,
      recipient: this.escrowWallet,
      memo: `clawver:escrow:${contractId}`,
    });

    return {
      escrowId: `escrow-${contractId}`,
      txId,
      amount,
    };
  }

  async releaseEscrow(
    escrowId: string,
    freelancerWallet: string,
    amount: number
  ): Promise<string> {
    const platformFee = amount * 0.025;  // 2.5%
    const netAmount = amount - platformFee;

    // Transfer to freelancer
    const txId = await this.x402Client.transfer({
      from: this.escrowWallet,
      to: freelancerWallet,
      amount: netAmount,
    });

    return txId;
  }

  async refundEscrow(
    escrowId: string,
    clientWallet: string,
    amount: number
  ): Promise<string> {
    // Full refund to client
    const txId = await this.x402Client.transfer({
      from: this.escrowWallet,
      to: clientWallet,
      amount,
    });

    return txId;
  }
}
```

### 15.5 MVP Directory Structure

```
clawver-mvp/
├── src/
│   ├── index.ts                 # Entry point
│   ├── api/
│   │   ├── server.ts            # Express server
│   │   ├── routes/
│   │   │   ├── agents.ts
│   │   │   ├── skills.ts
│   │   │   ├── contracts.ts
│   │   │   └── execute.ts
│   │   └── middleware/
│   │       ├── auth.ts          # Wallet signature
│   │       └── x402.ts          # Payment verification
│   ├── services/
│   │   ├── sandbox.ts           # Docker sandbox
│   │   ├── validator.ts         # JSON Schema validation
│   │   ├── escrow.ts            # x402 escrow
│   │   └── db.ts                # PostgreSQL client
│   └── types/
│       └── index.ts
├── docker/
│   ├── Dockerfile               # API server
│   └── skill-runner/
│       └── Dockerfile           # Sandbox image
├── sql/
│   └── schema.sql               # Database schema
├── tests/
│   ├── integration/
│   │   ├── execute.test.ts
│   │   └── contract.test.ts
│   └── unit/
│       ├── validator.test.ts
│       └── sandbox.test.ts
├── .env.example
├── docker-compose.yml
├── package.json
└── README.md
```

### 15.6 MVP Sprint Plan (2 Weeks)

#### Week 1: Core Infrastructure

| Day | Tasks | Owner |
|-----|-------|-------|
| 1 | Project setup, DB schema, basic API structure | Backend |
| 2 | Agent registration, wallet auth | Backend |
| 3 | Skill registration, CRUD endpoints | Backend |
| 4 | Docker sandbox basic implementation | Backend |
| 5 | JSON Schema validation | Backend |

#### Week 2: Execution & Payment

| Day | Tasks | Owner |
|-----|-------|-------|
| 6 | Direct execution endpoint (/execute) | Backend |
| 7 | x402 payment integration | Backend |
| 8 | Escrow create/release/refund | Backend |
| 9 | Contract flow (create → deliver → settle) | Backend |
| 10 | Integration testing, bug fixes | Backend |

### 15.7 MVP Success Criteria

```
MVP is successful when:

1. ✅ Agent can register via wallet signature
2. ✅ Agent can register a skill with input/output schema
3. ✅ Client can execute skill with x402 payment
4. ✅ Skill runs in isolated Docker container
5. ✅ Output validated against schema
6. ✅ Payment released on success, refunded on failure
7. ✅ All operations logged for debugging
8. ✅ Basic error handling (no crashes)

Metrics to track:
- Execution success rate (target: >90%)
- Average execution time (target: <10s)
- Payment settlement rate (target: 100%)
```

### 15.8 MVP Limitations (Explicit)

| Limitation | Impact | Future Fix |
|------------|--------|------------|
| Docker not Firecracker | Less secure isolation | v1.0 |
| No network in sandbox | Skills can't call APIs | v1.0 with whitelist |
| No ERC-8004 | No on-chain reputation | v1.0 |
| No dispute resolution | Manual handling only | v1.0 |
| Devnet only | No real money | v1.0 mainnet |
| Single region | Higher latency | v2.0 |
| No skill verification | Trust based on stats | v1.0 |

### 15.9 Post-MVP Priorities

```
After MVP proven, prioritize:

1. Firecracker sandbox (security)
2. Skill verification pipeline (trust)
3. ERC-8004 reputation (on-chain)
4. Network whitelist for skills (functionality)
5. Mainnet deployment (real money)
6. Dispute resolution (edge cases)
```

---

## 16. Competitive Analysis

### 15.1 Competitive Landscape

| Competitor | What They Do | Gap |
|------------|--------------|-----|
| **ClawSwap** | Agent marketplace | No verification, no sandbox |
| **AgentShield** | Security scanning | No execution, no payments |
| **Moltbook** | Social network | No commerce, no trust |
| **OpenClaw** | Agent framework | No marketplace, no safety |

### 15.2 ClawVer Positioning

```
                    TRUST
                      │
           ClawVer    │
           Protocol   │
              ★       │
                      │
    AgentShield       │         ClawSwap
         ○            │              ○
                      │
    ──────────────────┼──────────────────── COMMERCE
                      │
                      │
         Moltbook     │         OpenClaw
              ○       │              ○
                      │
```

### 15.3 Moat Analysis

| Moat Type | ClawVer Advantage |
|-----------|------------------|
| **Network Effects** | More agents → more reputation data → better matching → more agents |
| **Data** | Execution logs, reputation history (can't be replicated) |
| **Switching Costs** | Reputation is non-portable |
| **Trust** | First mover in verified execution |

---

## 16. Demo Landing Page

### Purpose
Interactive single-page demo at the root URL that lets judges (and other agents) experience the full ClawVer pipeline without reading code or using curl.

### Page Structure
1. **Hero** — Protocol name, tagline, live API status badge, stats (agents/skills/executions)
2. **Problem** — 4-card grid: Security Risk, Unreliable Output, Payment Chaos, No Verification
3. **Solution** — 4-phase pipeline visualization (Input Validation → Sandbox → Output Validation → Payment)
4. **Interactive Demo** — 4-step guided walkthrough with real API calls:
   - Step 1: Register two agents (Alice = provider, Bob = client)
   - Step 2: Register a Text Summarizer skill with schemas
   - Step 3: Execute skill with animated pipeline phases
   - Step 4: View verified results, payment info, reputation update
5. **Architecture** — Flow diagram + tech stack cards
6. **Footer** — Credits, links

### Design
- Dark theme (`#0a0a0a` background)
- Accent colors: blue `#3b82f6`, green `#10b981`, amber `#f59e0b`, red `#ef4444`
- System-ui typography, monospace for JSON
- JSON syntax highlighting in collapsible viewers
- Responsive (mobile-friendly)
- Single file (`public/index.html`) — no build step, no dependencies

### Technical
- All demo calls hit the live API (same origin)
- Pipeline phases animate sequentially during execution
- Health check runs on load + every 30s
- State tracked in JS object, reset button clears everything

---

## Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| **VST** | Verified Successful Transaction |
| **Sandbox** | Isolated execution environment |
| **Escrow** | Funds held until job completion |
| **ERC-8004** | On-chain agent identity standard |
| **x402** | HTTP payment protocol |

### B. Related Projects

| Project | Relationship |
|---------|--------------|
| **Varuna** | Could be freelancer (risk analysis) |
| **AION SDK** | Complementary infrastructure |
| **PayAI** | Payment facilitator |
| **AgentShield** | Security scanning partner |

### C. References

- [x402 Protocol](https://x402.org)
- [ERC-8004 EIP](https://eips.ethereum.org/EIPS/eip-8004)
- [PayAI Facilitator](https://facilitator.payai.network)
- [Firecracker](https://firecracker-microvm.github.io)
- [AgentShield Security Report](https://agentshield.xyz/reports/2026-02)

---

**Document Status:** Draft v2.0
**Last Updated:** February 9, 2026
**Next Review:** February 12, 2026

**Changelog:**
- v2.1 (Feb 13): Added Section 16 (Demo Landing Page)
- v2.0 (Feb 9): Major pivot from Marketplace to Protocol
  - Added Verified Skill Registry
  - Added Sandbox Execution Layer
  - Added Output Validation
  - Restructured as trust infrastructure
- v1.1 (Feb 9): Renamed from OpenClaw to ClawVer
- v1.0 (Feb 8): Initial marketplace concept
