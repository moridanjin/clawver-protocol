# ClawVer Gap Analysis — Existing vs Vision

## Yang SUDAH Jalan (Working in Production)

| Feature | Status |
|---|---|
| 4-phase pipeline (validate → sandbox → validate → pay) | Done |
| Ed25519 wallet auth (Solana keypair signing) | Done |
| QuickJS WASM sandbox (true isolation) | Done |
| JSON Schema validation (AJV, input + output) | Done |
| Payment settlement (AgentWallet, devnet SOL) | Done |
| Job contracts (create → deliver → settle) | Done |
| Interactive landing page demo | Done |
| Vercel deployment + Supabase DB | Done |

---

## Gaps

### 1. Escrow Belum Nyata
Contracts punya status `escrowed` → `settled`, tapi tidak ada logic escrow yang mengunci dana di antara create dan deliver. Payment langsung settle kalau output valid. Gap: Escrow seharusnya lock dana saat contract created, baru release ke provider saat validated.

### 2. Reputation Terlalu Sederhana
`reputation += 1` setiap execution sukses. Tidak ada weighted scoring, decay, rating dari caller, atau trust score. Mudah di-inflate via spam execution murah.

### 3. Dispute Resolution Kosong
Contract bisa masuk status `disputed` tapi tidak ada mekanisme resolusi — stuck selamanya. Tidak ada mediator, voting, atau auto-refund.

### 4. Skill Capability Terbatas
QuickJS sandbox = pure JavaScript saja. Tidak bisa call external API, akses database, proses file, atau async/await. Skill yang bisa dibuat sangat terbatas.

### 5. Devnet Only
Semua payment di Solana devnet. Platform wallet hardcoded. Tidak ada switch devnet/mainnet atau multi-tenant wallet management.

### 6. Tidak Ada Marketplace Integration
Competitive analysis sebut integrasi ClawGig, SugarClawdy, AgentShield. Zero integration dibangun.

### 7. Tidak Ada Verified Skills Badge
Tidak ada badge/certification yang menandai skill sudah di-audit. Hanya execution count.

### 8. Vercel 30s Timeout Limit
Skill yang butuh waktu lama tidak bisa jalan. Tidak ada queue/async execution model.

### 9. Audit Trail Minimal
Execution records ada di DB tapi tidak ada formal audit log, immutable log, export, atau on-chain proof of execution.

### 10. Sandbox Tier Roadmap Tidak Match
Competitive analysis janjikan Docker → gVisor → Firecracker → Nitro Enclaves. Reality: QuickJS WASM (lebih aman untuk use case ini, tapi beda dari docs).

---

## Prioritas

| Priority | Gap | Impact | Effort |
|---|---|---|---|
| P0 | Update competitive analysis docs to match reality (QuickJS WASM) | Credibility | Low |
| P1 | Dispute resolution (auto-refund / simple mediation) | Core trust story | Medium |
| P1 | Real escrow (lock dana saat contract created) | Core trust story | Medium |
| P2 | Richer reputation (weighted score, caller ratings) | Differentiation | Medium |
| P2 | Verified skills badge system | Differentiation | Medium |
| P3 | Skill capability expansion (allowlisted fetch, async) | Ecosystem growth | High |
| P3 | Mainnet support | Production readiness | Medium |
| P4 | Marketplace integrations | Ecosystem | High |
| P4 | Async execution queue (bypass 30s limit) | Scale | High |
