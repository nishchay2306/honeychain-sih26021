const axios = require("axios");
const crypto = require("crypto");

const PINATA_JWT = process.env.PINATA_JWT || null;
const PINATA_UPLOAD_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs";

/**
 * In-memory mock IPFS. Used automatically when PINATA_JWT isn't set, so lab
 * report uploads can be developed/demoed without a real Pinata account.
 * Produces a fake-but-realistic-looking CID (deterministic hash of the
 * file content) so the same file always "resolves" to the same fake hash.
 */
const mockStorage = new Map();

function mockUpload(buffer, filename) {
  const hash = crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 46);
  const fakeCid = `bafybeig${hash}`; // not a real CID format, just looks plausible
  mockStorage.set(fakeCid, { buffer, filename });
  return fakeCid;
}

async function uploadToIPFS(buffer, filename) {
  if (!PINATA_JWT) {
    const cid = mockUpload(buffer, filename);
    return { cid, url: `[MOCK] ipfs://${cid}`, mock: true };
  }

  const FormData = require("form-data");
  const form = new FormData();
  form.append("file", buffer, filename);

  const response = await axios.post(PINATA_UPLOAD_URL, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    maxBodyLength: Infinity,
  });

  const cid = response.data.IpfsHash;
  return { cid, url: `${PINATA_GATEWAY}/${cid}`, mock: false };
}

function getMockFile(cid) {
  return mockStorage.get(cid) || null;
}

module.exports = { uploadToIPFS, getMockFile, usingMockIPFS: !PINATA_JWT };
