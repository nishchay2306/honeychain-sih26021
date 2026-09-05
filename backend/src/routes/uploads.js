const express = require("express");
const multer = require("multer");
const router = express.Router();
const { uploadToIPFS, getMockFile, usingMockIPFS } = require("../services/ipfsService");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB cap
});

if (usingMockIPFS) {
  console.log(
    "[ipfsService] PINATA_JWT not set — using in-memory mock IPFS.\n" +
      "               Get a free JWT from pinata.cloud and set it in .env for real uploads."
  );
}

/** POST /api/uploads/lab-report — multipart/form-data with a "file" field */
router.post("/lab-report", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded (expected field name 'file')" });
    }
    const result = await uploadToIPFS(req.file.buffer, req.file.originalname);
    res.status(201).json({
      cid: result.cid,
      url: result.url,
      mock: result.mock,
      filename: req.file.originalname,
      size: req.file.size,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/uploads/mock/:cid — only works in mock mode, lets you fetch back what you "uploaded" */
router.get("/mock/:cid", (req, res) => {
  if (!usingMockIPFS) {
    return res.status(400).json({ error: "Not in mock mode — fetch the real file from the IPFS gateway URL instead" });
  }
  const file = getMockFile(req.params.cid);
  if (!file) return res.status(404).json({ error: "Unknown mock CID" });
  res.set("Content-Disposition", `inline; filename="${file.filename}"`);
  res.send(file.buffer);
});

module.exports = router;
