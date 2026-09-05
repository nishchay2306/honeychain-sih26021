import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 400, margin: "0 auto" }}>
      <h1 style={{ color: "#1F497D", fontSize: 22 }}>Log In</h1>
      <p style={{ color: "#666", fontSize: 14 }}>
        Log in as a beekeeper, lab, extractor, packager, distributor, or retailer to perform
        role-restricted actions.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14, marginTop: 20 }}>
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
        {error && <p style={{ color: "#C0504D", fontSize: 13 }}>{error}</p>}
        <button type="submit" disabled={submitting} style={buttonStyle}>
          {submitting ? "Logging in…" : "Log In"}
        </button>
      </form>

      <p style={{ fontSize: 13, color: "#666", marginTop: 16 }}>
        No account? <Link to="/register-account" style={{ color: "#1F497D" }}>Create one</Link>
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
