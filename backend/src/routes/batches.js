const express = require("express");
const router = express.Router();
const { store, STAGE_NAMES } = require("../services/batchService");
const { requireAuth, requireRole } = require("../middleware/auth");

// Maps a target Stage index -> the role allowed to advance INTO it,
// mirroring _roleForStage() in the Solidity contract.
const ROLE_FOR_STAGE = ["BEEKEEPER", "EXTRACTOR", "LAB", "PACKAGER", "DISTRIBUTOR", "RETAILER"];

/** GET /api/batches — quick summary list (mock store only knows its own batches by id 1..N) */
router.get("/", async (req, res) => {
  try {
    const total = await store.totalBatches();
    const ids = Array.from({ length: total }, (_, i) => i + 1);
    const batches = await Promise.all(
      ids.map(async (id) => {
        try {
          const b = await store.getBatch(id);
          return { ...b, stageName: STAGE_NAMES[b.currentStage] };
        } catch {
          return null;
        }
      })
    );
    res.json({ total, batches: batches.filter(Boolean) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/batches — register a new batch (BEEKEEPER role required) */
router.post("/", requireAuth, requireRole("BEEKEEPER"), async (req, res) => {
  try {
    const { floralSource, harvestLocation } = req.body;
    if (!floralSource || !harvestLocation) {
      return res.status(400).json({ error: "floralSource and harvestLocation are required" });
    }
    const beekeeper = req.user.walletAddress || req.user.email;
    const id = await store.registerBatch(floralSource, harvestLocation, beekeeper);
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/batches/:id — full batch record, used by the consumer QR scan page */
router.get("/:id", async (req, res) => {
  try {
    const batch = await store.getBatch(req.params.id);
    res.json({ ...batch, stageName: STAGE_NAMES[batch.currentStage] });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

/** GET /api/batches/:id/history — full audit trail, powers the provenance timeline */
router.get("/:id/history", async (req, res) => {
  try {
    const history = await store.getBatchHistory(req.params.id);
    res.json({
      id: Number(req.params.id),
      history: history.map((h) => ({ ...h, stageName: STAGE_NAMES[h.stage] })),
    });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

/** POST /api/batches/:id/advance — move a batch to the next stage (role must match target stage) */
router.post("/:id/advance", requireAuth, async (req, res) => {
  try {
    const { newStage } = req.body;
    if (newStage === undefined) {
      return res.status(400).json({ error: "newStage is required (0-5)" });
    }
    const requiredRole = ROLE_FOR_STAGE[Number(newStage)];
    if (req.user.role !== requiredRole && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: `Advancing to this stage requires role: ${requiredRole}` });
    }
    const updatedBy = req.user.walletAddress || req.user.email;
    await store.advanceStage(req.params.id, Number(newStage), updatedBy);
    const batch = await store.getBatch(req.params.id);
    res.json({ ...batch, stageName: STAGE_NAMES[batch.currentStage] });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** POST /api/batches/:id/lab-report — attach an already-uploaded IPFS hash to a batch (LAB role required) */
router.post("/:id/lab-report", requireAuth, requireRole("LAB"), async (req, res) => {
  try {
    const { labReportHash } = req.body;
    if (!labReportHash) {
      return res.status(400).json({ error: "labReportHash is required (get one from POST /api/uploads/lab-report first)" });
    }
    await store.attachLabReport(req.params.id, labReportHash);
    const batch = await store.getBatch(req.params.id);
    res.json({ ...batch, stageName: STAGE_NAMES[batch.currentStage] });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
