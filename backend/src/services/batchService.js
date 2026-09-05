const { ethers } = require("ethers");
const { HoneyChainABI, CONTRACT_ADDRESS, RPC_URL } = require("../config/contract");

const STAGE_NAMES = ["Harvested", "Extracted", "LabTested", "Packaged", "Distributed", "Sold"];

/**
 * In-memory mock store. Used automatically whenever CONTRACT_ADDRESS / RPC_URL
 * aren't set yet, so the frontend team can build against this API before the
 * contract is deployed (Task 1.2/2.2). Swap to the real chain by filling in
 * .env — no route/frontend code needs to change.
 */
class MockBatchStore {
  constructor() {
    this.batches = new Map();
    this.nextId = 1;
    // seed with one example batch so GET /api/batches/1 works out of the box
    this._seed();
  }

  _seed() {
    const id = this.nextId++;
    const now = Math.floor(Date.now() / 1000);
    this.batches.set(id, {
      id,
      beekeeper: "0x0000000000000000000000000000000000dEaD",
      floralSource: "Mustard",
      harvestLocation: "Sirsa, Haryana",
      harvestTimestamp: now,
      labReportHash: "",
      currentStage: 0,
      exists: true,
      history: [{ stage: 0, updatedBy: "0x0000000000000000000000000000000000dEaD", timestamp: now }],
    });
  }

  async registerBatch(floralSource, harvestLocation, beekeeper) {
    const id = this.nextId++;
    const now = Math.floor(Date.now() / 1000);
    const batch = {
      id,
      beekeeper: beekeeper || "0xMOCK",
      floralSource,
      harvestLocation,
      harvestTimestamp: now,
      labReportHash: "",
      currentStage: 0,
      exists: true,
      history: [{ stage: 0, updatedBy: beekeeper || "0xMOCK", timestamp: now }],
    };
    this.batches.set(id, batch);
    return id;
  }

  async advanceStage(id, newStage, updatedBy) {
    const batch = this.batches.get(Number(id));
    if (!batch) throw new Error("BatchDoesNotExist");
    if (newStage !== batch.currentStage + 1) throw new Error("InvalidStageTransition");
    batch.currentStage = newStage;
    batch.history.push({ stage: newStage, updatedBy: updatedBy || "0xMOCK", timestamp: Math.floor(Date.now() / 1000) });
    return true;
  }

  async getBatch(id) {
    const batch = this.batches.get(Number(id));
    if (!batch) throw new Error("BatchDoesNotExist");
    return batch;
  }

  async getBatchHistory(id) {
    const batch = this.batches.get(Number(id));
    if (!batch) throw new Error("BatchDoesNotExist");
    return batch.history;
  }

  async attachLabReport(id, labReportHash) {
    const batch = this.batches.get(Number(id));
    if (!batch) throw new Error("BatchDoesNotExist");
    batch.labReportHash = labReportHash;
    return true;
  }

  async totalBatches() {
    return this.batches.size;
  }
}

/** Thin wrapper around the real deployed contract, once CONTRACT_ADDRESS is set. */
class ChainBatchStore {
  constructor() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, HoneyChainABI, provider);
  }

  async registerBatch() {
    throw new Error(
      "Write operations must be signed client-side (or via a signer-configured backend route) — not implemented in this read-only scaffold yet."
    );
  }

  async advanceStage() {
    throw new Error("Same as above — write path comes with Task 2.2.");
  }

  async attachLabReport() {
    throw new Error(
      "Write operations must be signed client-side by a LAB_ROLE wallet — not implemented in this read-only scaffold yet."
    );
  }

  async getBatch(id) {
    const b = await this.contract.getBatch(id);
    return {
      id: Number(b.id),
      beekeeper: b.beekeeper,
      floralSource: b.floralSource,
      harvestLocation: b.harvestLocation,
      harvestTimestamp: Number(b.harvestTimestamp),
      labReportHash: b.labReportHash,
      currentStage: Number(b.currentStage),
      exists: b.exists,
    };
  }

  async getBatchHistory(id) {
    const rows = await this.contract.getBatchHistory(id);
    return rows.map((r) => ({
      stage: Number(r.stage),
      updatedBy: r.updatedBy,
      timestamp: Number(r.timestamp),
    }));
  }

  async totalBatches() {
    return Number(await this.contract.totalBatches());
  }
}

const usingMock = !CONTRACT_ADDRESS || !RPC_URL;
if (usingMock) {
  console.log(
    "[batchService] CONTRACT_ADDRESS / AMOY_RPC_URL not set — using in-memory mock store.\n" +
      "               Deploy the contract (Task 1.2) and set .env to switch to live chain data."
  );
} else {
  console.log(`[batchService] Using live contract at ${CONTRACT_ADDRESS} on ${RPC_URL}`);
}

const store = usingMock ? new MockBatchStore() : new ChainBatchStore();

module.exports = { store, STAGE_NAMES, usingMock };
