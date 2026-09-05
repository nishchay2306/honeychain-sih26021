const express = require("express");
const router = express.Router();
const QRCode = require("qrcode");

const SCAN_BASE_URL = process.env.SCAN_BASE_URL || "http://localhost:5173/scan";

/** GET /api/qr/:batchId — returns a PNG QR code that encodes the scan URL for this batch */
router.get("/:batchId", async (req, res) => {
  try {
    const url = `${SCAN_BASE_URL}/${req.params.batchId}`;
    const png = await QRCode.toBuffer(url, { width: 300, margin: 2 });
    res.set("Content-Type", "image/png");
    res.send(png);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
