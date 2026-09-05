import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRoles } from "../api/client";

export default function RegisterAccount() {
  const [roles, setRoles] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getRoles()
      .then((r) => {
        const selectable = r.filter((x) => x !== "ADMIN");
        setRoles(selectable);
        setRole(selectable[0] || "");
      })
      .catch(() => setRoles(["BEEKEEPER", "EXTRACTOR", "LAB", "PACKAGER", "DISTRIBUTOR", "RETAILER"]));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register({ email, password, role, displayName });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 420, margin: "0 auto" }}>
      <h1 style={{ color: "#1F497D", fontSize: 22 }}>Create an Account</h1>
      <p style={{ color: "#666", fontSize: 14 }}>
        Pick the role you'll act as in the supply chain. In a real deployment, KVIC would assign
        these; here you can self-select for demo purposes.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14, marginTop: 20 }}>
        <input
          placeholder="Display name (e.g. Ramesh's Apiary)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          style={inputStyle}
        />
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        <label style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ ...inputStyle, marginTop: 6, width: "100%" }}>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        {error && <p style={{ color: "#C0504D", fontSize: 13 }}>{error}</p>}
        <button type="submit" disabled={submitting} style={buttonStyle}>
          {submitting ? "Creating…" : "Create Account"}
        </button>
      </form>

      <p style={{ fontSize: 13, color: "#666", marginTop: 16 }}>
        Already have an account? <Link to="/login" style={{ color: "#1F497D" }}>Log in</Link>
      </p>
    </div>
  );
}

const inputStyle = { padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 14 };
const buttonStyle = {
  background: "#1F497D",
  color: "#fff",
  padding: "12px",
  borderRadius: 8,
  border: "none",
  fontWeight: 700,
  cursor: "pointer",
};
