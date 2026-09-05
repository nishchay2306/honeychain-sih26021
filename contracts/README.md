# Honey Chain — Smart Contracts

Covers Stage 1 (Tasks 1.1, 1.2) and Stage 2 (Tasks 2.1, 2.2) from the build plan.

## What's here

- `contracts/HoneyChain.sol` — the contract:
  - `Batch` struct + `Stage` enum: `Harvested → Extracted → LabTested → Packaged → Distributed → Sold`
  - **Role-gated lifecycle (Stage 2):** built on OpenZeppelin `AccessControl` with 6 roles —
    `BEEKEEPER_ROLE`, `EXTRACTOR_ROLE`, `LAB_ROLE`, `PACKAGER_ROLE`, `DISTRIBUTOR_ROLE`, `RETAILER_ROLE`.
    Each stage transition requires the one role authorized to perform it — e.g. only a `LAB_ROLE`
    wallet can move a batch into `LabTested`.
  - `registerBatch()` — BEEKEEPER_ROLE only
  - `advanceStage()` — role matching the *target* stage only
  - `attachLabReport()` — LAB_ROLE only
  - `getBatch()` / `getBatchHistory()` — public reads, used by the frontend
  - Events for indexing; custom errors (`MissingRole`, `InvalidStageTransition`, `BatchDoesNotExist`)
    instead of string reverts, to save gas
- `test/HoneyChain.test.js` — Hardhat/Chai test suite covering the full role-gated lifecycle
- `verify_access_control.js` — a **self-contained** verification script (compiles with `solc`
  directly + deploys to a local in-process Ganache EVM) that proves the role gating actually works,
  independent of Hardhat's own compiler downloader. Useful in restricted/offline CI environments.
- `scripts/deploy.js` — deploys to Polygon Amoy testnet, then grants the deployer every role (for
  easy solo demoing — normally each role would go to a different wallet)

## Verified — role gating actually works

Ran `verify_access_control.js` end-to-end: deployed the real compiled contract to a local EVM and
proved all of the following with different wallets:
- ❌ A wallet with no role cannot register a batch
- ✅ Granting `BEEKEEPER_ROLE` lets that wallet register successfully
- ❌ A beekeeper cannot perform the extractor's job (wrong role)
- ✅ Granting `EXTRACTOR_ROLE` lets the right wallet advance the batch
- ❌ Revoking a role immediately locks that wallet out again

All 6 checks passed. Run it yourself:
```bash
npm install
npm run verify:access-control
```

## Setup

```bash
npm install
npm run compile        # requires internet access to download the solc compiler
npm test                # standard Hardhat test suite
```

> If `npm run compile` / `npm test` fail with a network error trying to reach
> `binaries.soliditylang.org`, that's Hardhat's compiler downloader being blocked by your network,
> not a problem with the code — `npm run verify:access-control` works around this and proves the
> same logic using a bundled compiler instead.

## Deploying to Polygon Amoy testnet

```bash
cp .env.example .env
```
Fill in:
- `AMOY_RPC_URL` — free from [Alchemy](https://www.alchemy.com/) or [Infura](https://www.infura.io/)
- `PRIVATE_KEY` — a **test-only** wallet's exported private key. Never use a wallet holding real funds.
- `POLYGONSCAN_API_KEY` — free from [polygonscan.com/myapikey](https://polygonscan.com/myapikey)

Get free test MATIC from the [Polygon faucet](https://faucet.polygon.technology/) (select "Amoy").

```bash
npm run deploy:amoy
```
This deploys the contract, prints its address, and grants the deployer every role. Copy the
printed address into `backend/.env` as `CONTRACT_ADDRESS` to switch the backend from mock mode to
live chain data.

To onboard a real team member as e.g. a lab, from a script or Hardhat console:
```js
await honeyChain.grantRole(await honeyChain.LAB_ROLE(), "0xTheirWalletAddress");
```

Verify the source on Polygonscan (recommended before judging):
```bash
npx hardhat verify --network amoy <deployed_address>
```

## Next steps (Stage 3)
- Security hardening pass (re-entrancy checks — low risk here since there are no external calls
  or value transfers, but worth a review pass; input validation on string lengths)
- Consider a `batchExists` view helper and pagination for `getBatchHistory` if batches accumulate
  very long histories
