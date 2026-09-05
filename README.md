# Honey Chain — SIH26021

Blockchain-based honey traceability and smart beekeeping management system, built for Smart India
Hackathon 2026 (Ministry of MSME / KVIC Honey Mission).

Team: Ctrl-Alt-Elite

## Repo structure

```
honeychain/
  contracts/     # Solidity smart contract, tests, deployment scripts (Hardhat)
  backend/       # Express API — talks to the contract via ethers.js, has a mock-mode fallback
  frontend/      # React + Vite app — register batches, scan/verify provenance
  tools/         # standalone utilities (QR code generation)
```

Each folder is an independent Node project with its own `package.json` — install and run them
separately (see each folder's README for specifics).

## Quick start (all 3 together)

```bash
# Terminal 1 — backend (runs in mock mode until the contract is deployed)
cd backend && npm install && cp .env.example .env && npm run dev

# Terminal 2 — frontend
cd frontend && npm install && cp .env.example .env && npm run dev
# → open http://localhost:5173

# Terminal 3 (optional, once ready) — deploy the real contract
cd contracts && npm install && npm test && cp .env.example .env
# fill in .env with your RPC URL + test wallet key, then:
npm run deploy:amoy
# then put the printed contract address into backend/.env (CONTRACT_ADDRESS)
# and restart the backend — it will automatically switch from mock to live chain data
```

## Build status

### Stage 1 (Foundation) — ✅ Complete

| Task | Status | Notes |
|---|---|---|
| 1.1 Smart contract skeleton | ✅ Done | Compiles clean; `Batch` struct, `Stage` enum, register/advance/read functions |
| 1.2 Testnet deployment setup | ✅ Ready | Deploy script + config done; actual `npm run deploy:amoy` must be run from a machine with real wallet + RPC access |
| 1.3 Backend scaffold | ✅ Done & tested | All routes verified live against a running server |
| 1.4 Frontend scaffold | ✅ Done & tested | All 3 pages built, `npm run build` passes |
| 1.5 QR generation | ✅ Done & verified | Generated a QR, independently decoded it back to the correct URL |
| 1.6 Repo structure | ✅ Done | This file |

### Stage 2 (Core Integration) — ✅ Complete

| Task | Status | Notes |
|---|---|---|
| 2.1 Role-based access control | ✅ Done & verified | OpenZeppelin `AccessControl`, 6 roles. Proved working with 6 automated tests against a real deployed contract on a local EVM (grant/revoke, correct/wrong role, all behave correctly) |
| 2.2 Batch lifecycle logic | ✅ Done & verified | Every stage transition now requires the matching role, both in the contract AND mirrored in the backend API |
| 2.3 IPFS integration | ✅ Done & verified | Mock-first (like Stage 1's chain connection) — real Pinata upload wired in, verified via a full curl upload+attach flow |
| 2.4 Beekeeper/admin dashboard | ✅ Done & tested | Register Batch page now requires BEEKEEPER login; role-aware advance/upload actions on the Scan page |
| 2.5 Consumer scan page | ✅ Done & tested | Chain-of-custody timeline, QR, lab report status, role-gated advance button |
| 2.6 Off-chain DB + auth | ✅ Done & verified | JWT auth + SQLite (not Postgres — see backend/README.md for why and the migration path); verified full multi-role login/register/advance/upload flow end-to-end |

### Stage 3 (Advanced/Polish) — Not started
Simulated IoT hive data, analytics dashboard, security hardening, deployment framework doc, demo polish.

## What's intentionally deferred to Stage 3

- **IoT/AI hive monitoring** — not started; will be simulated (no physical hardware) per
  the team's decision to focus depth on blockchain + QR traceability first.
- **Security hardening** — re-entrancy checks, input validation edge cases, basic pen-test pass.
- **Analytics dashboard** for KVIC/admin aggregating data across clusters.
- **Wallet-based auth** — right now login is email/password (Task 2.6); tying a user's DB account
  to their actual on-chain wallet address (for a MetaMask-signed write flow) is still open.
- **`ChainBatchStore` write methods** — reads work against a live contract once deployed, but writes
  still need to go directly from the frontend via a signer (MetaMask), not through this backend.

## Branch strategy (suggested)

- `main` — always demo-ready
- `dev` — integration branch, merge feature branches here first
- `feature/<task-id>-<short-name>` — e.g. `feature/2.1-access-control`, `feature/2.4-dashboard`
- Open a PR into `dev` when a task is done; merge `dev` → `main` before each internal demo checkpoint

## Team task assignment

See `HoneyChain_Build_Plan.md` (shared separately) for the full 3-stage plan and suggested track
assignment (blockchain / frontend / backend / docs-demo).
