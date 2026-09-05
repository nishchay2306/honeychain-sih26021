const path = require("path");
const { DatabaseSync } = require("node:sqlite");

// Uses Node's built-in SQLite module (available Node 22.5+, stable API from
// Node 24+) instead of better-sqlite3 — avoids needing native compilation
// (node-gyp/Visual Studio Build Tools), which was breaking `npm install` on
// Windows machines without build tools installed. Marked "experimental" by
// Node but functionally solid for this use case.
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "..", "honeychain.db");
const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('BEEKEEPER','EXTRACTOR','LAB','PACKAGER','DISTRIBUTOR','RETAILER','ADMIN')),
    wallet_address TEXT,
    display_name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Thin adapter so the rest of the app can keep using the same
// db.prepare(sql).get/.run/.all(...) calls it already does — node:sqlite's
// StatementSync API matches better-sqlite3's shape closely enough that no
// other file needs to change.
module.exports = db;
