/**
 * Task 1.5 — standalone QR generation utility.
 *
 * Confirms end-to-end that we can turn a batch ID into a scannable QR code
 * pointing at the consumer verification page. The actual backend route
 * (src/routes/qr.js) does this on-the-fly per request; this script is just
 * to prove the concept works in isolation and to generate a sample image
 * for the pitch deck / demo.
 *
 * Usage:
 *   node generate-qr.js [batchId] [baseUrl]
 *
 * Example:
 *   node generate-qr.js 1 http://localhost:5173/scan
 */
const QRCode = require("qrcode");
const path = require("path");

const batchId = process.argv[2] || "1";
const baseUrl = process.argv[3] || "http://localhost:5173/scan";
const targetUrl = `${baseUrl}/${batchId}`;

const outPath = path.join(__dirname, `sample-qr-batch-${batchId}.png`);

QRCode.toFile(outPath, targetUrl, { width: 400, margin: 2 }, (err) => {
  if (err) {
    console.error("❌ QR generation failed:", err);
    process.exit(1);
  }
  console.log(`✅ QR code generated for batch ${batchId}`);
  console.log(`   Encodes URL: ${targetUrl}`);
  console.log(`   Saved to:    ${outPath}`);
});
