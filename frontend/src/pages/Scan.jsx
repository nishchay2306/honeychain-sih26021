import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBatch, getBatchHistory, advanceStage, qrImageUrl, uploadLabReport, attachLabReport } from "../api/client";
import { useAuth } from "../context/AuthContext";

const STAGES = ["Harvested", "Extracted", "LabTested", "Packaged", "Distributed", "Sold"];
const ROLE_FOR_STAGE = ["BEEKEEPER", "EXTRACTOR", "LAB", "PACKAGER", "DISTRIBUTOR", "RETAILER"];

export default function Scan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lookupId, setLookupId] = useState(id || "");
  const [batch, setBatch] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) loadBatch(id);
  }, [id]);

  function loadBatch(batchId) {
    setLoading(true);
    setError(null);
    Promise.all([getBatch(batchId), getBatchHistory(batchId)])
      .then(([b, h]) => {
        setBatch(b);
        setHistory(h.history);
      })
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }

  function handleLookup(e) {
    e.preventDefault();
    if (lookupId) navigate(`/scan/${lookupId}`);
  }

  const nextStage = batch ? batch.currentStage + 1 : null;
  const canAdvance =
    batch && nextStage <= 5 && user && (user.role === ROLE_FOR_STAGE[nextStage] || user.role === "ADMIN");

  async function handleAdvance() {
    try {
      const updated = await advanceStage(id, nextStage);
      setBatch(updated);
      loadBatch(id);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }

  async function handleLabReportUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { cid } = await uploadLabReport(file);
      await attachLabReport(id, cid);
      loadBatch(id);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setUploading(false);
    }
  }

  const canAttachLabReport = user && (user.role === "LAB" || user.role === "ADMIN");

  return (
    <div style={{ padding: 24, maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ color: "#1F497D", fontSize: 22 }}>Scan / Verify a Batch</h1>
      <p style={{ color: "#666", fontSize: 14 }}>
        In production this page loads automatically when a consumer scans the QR code on a honey
        jar. Enter a batch ID below to simulate that scan.
      </p>

      <form onSubmit={handleLookup} style={{ display: "flex", gap: 10, margin: "16px 0" }}>
        <input
          value={lookupId}
          onChange={(e) => setLookupId(e.target.value)}
          placeholder="Batch ID, e.g. 1"
          style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc" }}
        />
        <button
          type="submit"
          style={{
            background: "#1F497D",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 18px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Look up
        </button>
      </form>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "#C0504D" }}>Error: {error}</p>}

      {batch && (
        <div style={{ border: "1px solid #DCE6F1", borderRadius: 12, padding: 20, marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <h2 style={{ margin: 0, color: "#1F497D" }}>Batch #{batch.id}</h2>
              <p style={{ margin: "4px 0", color: "#555" }}>
                {batch.floralSource} · {batch.harvestLocation}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#888" }}>
                Beekeeper: {batch.beekeeper}
              </p>
              {batch.labReportHash && (
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#4C8B4A" }}>
                  ✓ Lab report attached: {batch.labReportHash.slice(0, 24)}…
                </p>
              )}
            </div>
            <img
              src={qrImageUrl(batch.id)}
              alt={`QR code for batch ${batch.id}`}
              width={90}
              height={90}
              style={{ borderRadius: 8, border: "1px solid #eee" }}
            />
          </div>

          <h3 style={{ fontSize: 14, marginTop: 20, marginBottom: 8, color: "#333" }}>
            Chain of Custody
          </h3>
          <ol style={{ display: "grid", gap: 8, paddingLeft: 20, margin: 0 }}>
            {STAGES.map((s, i) => {
              const done = i <= batch.currentStage;
              const record = history.find((h) => h.stage === i);
              return (
                <li key={s} style={{ color: done ? "#1F497D" : "#bbb", fontWeight: done ? 700 : 400 }}>
                  {s}
                  {record && (
                    <span style={{ fontWeight: 400, color: "#888", fontSize: 12 }}>
                      {" "}
                      — {new Date(record.timestamp * 1000).toLocaleString()}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>

          {batch.currentStage < 5 && (
            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              {!user && (
                <p style={{ fontSize: 13, color: "#888" }}>
                  Log in as <strong>{ROLE_FOR_STAGE[nextStage]}</strong> to advance this batch to{" "}
                  <strong>{STAGES[nextStage]}</strong>.
                </p>
              )}
              {user && !canAdvance && (
                <p style={{ fontSize: 13, color: "#C0504D" }}>
                  Your role ({user.role}) can't advance this batch — need{" "}
                  <strong>{ROLE_FOR_STAGE[nextStage]}</strong>.
                </p>
              )}
              {canAdvance && (
                <button
                  onClick={handleAdvance}
                  style={{
                    background: "#4C8B4A",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 16px",
                    fontWeight: 700,
                    cursor: "pointer",
                    alignSelf: "flex-start",
                  }}
                >
                  ▶ Advance to {STAGES[nextStage]}
                </button>
              )}

              {nextStage === 2 && canAttachLabReport && (
                <div style={{ borderTop: "1px dashed #ddd", paddingTop: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#333", display: "block", marginBottom: 6 }}>
                    Upload lab report (attaches to IPFS, then to this batch)
                  </label>
                  <input type="file" onChange={handleLabReportUpload} disabled={uploading} />
                  {uploading && <p style={{ fontSize: 12, color: "#888" }}>Uploading…</p>}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
