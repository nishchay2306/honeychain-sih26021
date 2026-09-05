import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const linkStyle = ({ isActive }) => ({
    padding: "8px 16px",
    textDecoration: "none",
    color: isActive ? "#1F497D" : "#333",
    fontWeight: isActive ? 700 : 500,
    borderBottom: isActive ? "3px solid #1F497D" : "3px solid transparent",
  });

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "0 24px",
        borderBottom: "1px solid #e2e2e2",
        background: "#fff",
      }}
    >
      <span style={{ fontWeight: 800, color: "#1F497D", marginRight: 24, fontSize: 20 }}>
        🍯 Honey Chain
      </span>
      <NavLink to="/" style={linkStyle} end>
        Home
      </NavLink>
      <NavLink to="/register" style={linkStyle}>
        Register Batch
      </NavLink>
      <NavLink to="/scan" style={linkStyle}>
        Scan / Verify
      </NavLink>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        {user ? (
          <>
            <span style={{ fontSize: 13, color: "#555" }}>
              {user.displayName || user.email} · <strong style={{ color: "#1F497D" }}>{user.role}</strong>
            </span>
            <button
              onClick={handleLogout}
              style={{
                background: "none",
                border: "1px solid #ccc",
                borderRadius: 6,
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <NavLink to="/login" style={linkStyle}>
            Log In
          </NavLink>
        )}
      </div>
    </nav>
  );
}
