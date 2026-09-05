import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listBatches } from "../api/client";

const STAGE_COLORS = {
  Harvested: "#E0A02B",
  Extracted: "#4F81BD",
  LabTested: "#4C8B4A",
  Packaged: "#1F497D",
  Distributed: "#8064A2",
  Sold: "#C0504D",
};

export default function Home() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    listBatches()
      .then((data) => setBatches(data.batches))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ color: "#1F497D" }}>Honey Chain</h1>
      <p style={{ color: "#555", maxWidth: 640 }}>
        Blockchain-based traceability and QR verification for honey — from harvest to consumer,
        every batch's journey is recorded on an immutable ledger.
      </p>

      <div style={{ display: "flex", gap: 12, margin: "20px 0" }}>
        <Link
          to="/register"
          style={{
            background: "#1F497D",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          + Register a Batch
        </Link>
        <Link
          to="/scan"
          style={{
            background: "#fff",
            color: "#1F497D",
            padding: "10px 18px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
            border: "2px solid #1F497D",
          }}
        >
          Scan / Verify a Batch
        </Link>
      </div>

      <h2 style={{ fontSize: 18, color: "#333", marginTop: 32 }}>All Batches</h2>
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "#C0504D" }}>Error: {error}</p>}

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {batches.map((b) => (
          <Link
            key={b.id}
            to={`/scan/${b.id}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 16px",
              border: "1px solid #DCE6F1",
              borderRadius: 10,
              textDecoration: "none",
              color: "#333",
              background: "#F7FAFD",
            }}
          >
            <div>
              <strong>Batch #{b.id}</strong> — {b.floralSource} ({b.harvestLocation})
            </div>
            <span
              style={{
                background: STAGE_COLORS[b.stageName] || "#999",
                color: "#fff",
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {b.stageName}
            </span>
          </Link>
        ))}
        {!loading && batches.length === 0 && <p style={{ color: "#888" }}>No batches yet.</p>}
      </div>
    </div>
  );
}
