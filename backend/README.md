# Honey Chain — Backend

Express API sitting between the frontend and the blockchain, now with Stage 2's auth, roles, and
IPFS integration on top of Stage 1's mock-first design.

## What's here (Stage 1 + Stage 2)

- `GET /api/health` — status + mode (mock/live-chain)
- **Batches**
  - `GET /api/batches` / `GET /api/batches/:id` / `GET /api/batches/:id/history`
  - `POST /api/batches` — register a batch — **requires BEEKEEPER role**
  - `POST /api/batches/:id/advance` — move a batch forward — **requires the role matching the target stage** (mirrors the smart contract's own role gating)
  - `POST /api/batches/:id/lab-report` — attach an IPFS hash — **requires LAB role**
- **Auth** (Task 2.6)
  - `POST /api/auth/register`, `POST /api/auth/login` — email/password, JWT-based
  - `GET /api/auth/roles` — valid role list
  - `GET /api/auth/me` — sanity check for the currently logged-in user
- **Uploads / IPFS** (Task 2.3)
  - `POST /api/uploads/lab-report` — multipart upload, returns an IPFS CID (real via Pinata, or a mock CID if `PINATA_JWT` isn't set)

## Mock-first design (still true in Stage 2)

Both the blockchain connection AND the IPFS connection auto-fall-back to working mocks when their
respective env vars aren't set. You can run and demo the entire app right now with zero external
accounts. Fill in `.env` to switch either one to the real thing — no code changes needed.

## Auth + roles, verified working

I ran a full multi-account workflow against a live instance of this server:
1. Registered BEEKEEPER, EXTRACTOR, and LAB accounts
2. Beekeeper registered a batch — succeeded
3. Extractor advanced it to "Extracted" — succeeded
4. Lab uploaded a file, got a real CID back, attached it to the batch, advanced it to "LabTested" — succeeded
5. Confirmed the final audit trail correctly recorded which account performed each step

Unauthenticated requests and wrong-role requests are both rejected with clear error messages.

## Off-chain database (Task 2.6)

Using **SQLite** (via Node's built-in `node:sqlite` module, Node 22.5+) instead of PostgreSQL for
now — zero setup, single file (`honeychain.db`, auto-created, git-ignored), and critically **no
native compilation step** (we started with `better-sqlite3`, but that requires node-gyp + Visual
Studio Build Tools on Windows, which broke `npm install` on machines without them — switching to
the built-in module avoids that entirely). Requires Node 22.5+; check with `node -v`. See
`docs/postgres_schema.sql` for the schema to
migrate to Postgres later; the two are intentionally kept close so the swap is mostly just a driver
change, not a data model change.

## Run it

```bash
npm install
cp .env.example .env
npm run dev
```

## Structure

```
src/
  server.js
  routes/
    auth.js            # register/login
    batches.js          # CRUD + stage-advance + lab-report attach (role-gated)
    qr.js                 # QR PNG generation
    uploads.js             # IPFS lab-report upload
  services/
    authService.js       # bcrypt + JWT
    batchService.js        # mock store OR real contract wrapper
    ipfsService.js           # Pinata OR in-memory mock
  middleware/
    auth.js               # requireAuth / requireRole
  db/
    index.js                # SQLite connection + schema
  config/
    contract.js
    HoneyChainABI.json
docs/
  postgres_schema.sql       # migration target for later
```

## Next steps (remaining Stage 2/3 items)
- `ChainBatchStore` write methods still throw — once the frontend can sign transactions directly
  via MetaMask/ethers, reads stay on this backend but writes go straight to the chain client-side
- Consider linking each DB user's `wallet_address` so on-chain role grants and the app's login
  roles stay in sync (right now they're tracked separately — fine for a demo, worth reconciling
  before a real rollout)
