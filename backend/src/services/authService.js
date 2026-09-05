const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-CHANGE-ME-in-production";
const JWT_EXPIRY = "7d";

const VALID_ROLES = ["BEEKEEPER", "EXTRACTOR", "LAB", "PACKAGER", "DISTRIBUTOR", "RETAILER", "ADMIN"];

function registerUser({ email, password, role, walletAddress, displayName }) {
  if (!email || !password || !role) {
    throw new AuthError(400, "email, password, and role are required");
  }
  if (!VALID_ROLES.includes(role)) {
    throw new AuthError(400, `role must be one of: ${VALID_ROLES.join(", ")}`);
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    throw new AuthError(409, "An account with this email already exists");
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare(
      "INSERT INTO users (email, password_hash, role, wallet_address, display_name) VALUES (?, ?, ?, ?, ?)"
    )
    .run(email, passwordHash, role, walletAddress || null, displayName || null);

  return { id: info.lastInsertRowid, email, role };
}

function loginUser({ email, password }) {
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) throw new AuthError(401, "Invalid email or password");

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) throw new AuthError(401, "Invalid email or password");

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  return {
    token,
    user: { id: user.id, email: user.email, role: user.role, walletAddress: user.wallet_address, displayName: user.display_name },
  };
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

class AuthError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = { registerUser, loginUser, verifyToken, AuthError, VALID_ROLES };
