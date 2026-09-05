import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerBatch } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function RegisterBatch() {
  const [floralSource, setFloralSource] = useState("");
  const [harvestLocation, setHarvestLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div style={{ padding: 24, maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ color: "#1F497D", fontSize: 22 }}>Register a New Batch</h1>
        <p style={{ color: "#666" }}>You need to be logged in as a Beekeeper to register a batch.</p>
        <Link
          to="/login"
          style={{ display: "inline-block", marginTop: 12, background: "#1F497D", color: "#fff", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontWeight: 700 }}
        >
          Log In
        </Link>
      </div>
    );
  }

  if (user.role !== "BEEKEEPER" && user.role !== "ADMIN") {
    return (
      <div style={{ padding: 24, maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ color: "#1F497D", fontSize: 22 }}>Register a New Batch</h1>
        <p style={{ color: "#C0504D" }}>
          Your account role is <strong>{user.role}</strong>. Only <strong>BEEKEEPER</strong> accounts
          can register a new batch.
        </p>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { id } = await registerBatch({ floralSource, harvestLocation });
      navigate(`/scan/${id}`);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ color: "#1F497D", fontSize: 22 }}>Register a New Batch</h1>
      <p style={{ color: "#666", fontSize: 14 }}>
        Logged in as <strong>{user.displayName || user.email}</strong> ({user.role}) — this batch
        will be tagged as harvested by you.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14, marginTop: 20 }}>
        <label style={labelStyle}>
          Floral Source
          <input
            required
            value={floralSource}
            onChange={(e) => setFloralSource(e.target.value)}
            placeholder="e.g. Mustard, Litchi, Multi-floral"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Harvest Location
          <input
            required
            value={harvestLocation}
            onChange={(e) => setHarvestLocation(e.target.value)}
            placeholder="e.g. Sirsa, Haryana"
            style={inputStyle}
          />
        </label>

        {error && <p style={{ color: "#C0504D", fontSize: 13 }}>{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          style={{
            background: "#1F497D",
            color: "#fff",
            padding: "12px",
            borderRadius: 8,
            border: "none",
            fontWeight: 700,
            cursor: "pointer",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "Registering…" : "Register Batch"}
        </button>
      </form>
    </div>
  );
}

const labelStyle = { display: "grid", gap: 6, fontSize: 13, fontWeight: 600, color: "#333" };
const inputStyle = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: 14,
};
