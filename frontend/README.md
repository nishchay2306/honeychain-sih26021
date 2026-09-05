# Honey Chain — Frontend

React + Vite app, now with real auth (Task 2.4/2.5 built on Stage 1's scaffold).

## Pages

- **Home** (`/`) — lists all batches with their current stage
- **Log In** (`/login`) / **Create Account** (`/register-account`) — email/password, pick your
  supply-chain role (Beekeeper, Extractor, Lab, Packager, Distributor, Retailer)
- **Register Batch** (`/register`) — only usable when logged in as BEEKEEPER
- **Scan / Verify** (`/scan`, `/scan/:id`) — consumer-facing provenance lookup + role-aware actions:
  - Shows an "Advance to [stage]" button only if your logged-in role matches what's needed next
  - Shows a lab-report upload field only when it's your turn (LAB role, batch waiting on LabTested)

## Run it

Backend must be running first (`../backend`, port 4000), then:
```bash
npm install
cp .env.example .env
npm run dev
```
Visit http://localhost:5173

## Verified working (full flow, via the API — see backend/README.md for exact commands)
- Registered 3 accounts (Beekeeper, Extractor, Lab)
- Beekeeper → Extractor → Lab walked a real batch through 3 stages, each correctly gated by role
- Lab uploaded a file, got an IPFS hash back, attached it to the batch
- `npm run build` completes with no errors

## Structure

```
src/
  App.jsx                     # routes, wrapped in AuthProvider
  context/
    AuthContext.jsx             # login/register/logout, persists to localStorage
  pages/
    Home.jsx
    Login.jsx
    RegisterAccount.jsx
    RegisterBatch.jsx            # gated: must be logged in as BEEKEEPER
    Scan.jsx                       # role-aware advance button + lab report upload
  components/
    NavBar.jsx                     # shows logged-in user/role, login/logout
  api/
    client.js                       # axios wrapper, auto-attaches JWT to every request
```

## Next steps (Stage 3)
- Real QR camera scanning (e.g. `html5-qrcode`) instead of manual batch ID entry
- Tie a user's account to an actual connected wallet (MetaMask) instead of email/password once
  writes move to client-side signing
