import { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, registerAccount as apiRegister } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("honeychain_user");
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  async function login(email, password) {
    const { token, user } = await apiLogin({ email, password });
    localStorage.setItem("honeychain_token", token);
    localStorage.setItem("honeychain_user", JSON.stringify(user));
    setUser(user);
    return user;
  }

  async function register(payload) {
    await apiRegister(payload);
    return login(payload.email, payload.password);
  }

  function logout() {
    localStorage.removeItem("honeychain_token");
    localStorage.removeItem("honeychain_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
