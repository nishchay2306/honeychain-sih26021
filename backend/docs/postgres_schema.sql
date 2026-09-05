-- Postgres migration target for the users table currently running on SQLite
-- (src/db/index.js). Schema is intentionally near-identical so the swap is
-- mostly just changing the driver, not the data model.
--
-- To migrate later:
--   1. `npm install pg` in backend/
--   2. Replace src/db/index.js with a `pg.Pool`-based client
--   3. Run this file against your Postgres instance
--   4. Update any raw SQL that used SQLite-specific syntax (there's very
--      little — mainly `AUTOINCREMENT` -> `SERIAL`, `TEXT` -> `VARCHAR`)

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('BEEKEEPER','EXTRACTOR','LAB','PACKAGER','DISTRIBUTOR','RETAILER','ADMIN')),
    wallet_address VARCHAR(42),
    display_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
