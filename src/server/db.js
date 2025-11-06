// src/server/db.js
const { Pool } = require("pg");

const {
  DATABASE_URL,
  DB_USER,
  DB_HOST,
  DB_NAME,
  DB_PORT,
  DB_PASSWORD, // preferred name
  DB_PASS,     // your .env currently uses this; we’ll fall back to it
  NODE_ENV,
} = process.env;

const useUrl = !!DATABASE_URL;

// Allow both DATABASE_URL or discrete creds; accept DB_PASS or DB_PASSWORD
const pool = new Pool(
  useUrl
    ? {
        connectionString: DATABASE_URL,
        ssl: process.env.PGSSL === "require" ? { rejectUnauthorized: false } : undefined,
      }
    : {
        user: DB_USER || "postgres",
        host: DB_HOST || "localhost",
        database: DB_NAME || "campus_events",
        password: DB_PASSWORD || DB_PASS || "postgres",
        port: Number(DB_PORT) || 5432,
        ssl: process.env.PGSSL === "require" ? { rejectUnauthorized: false } : undefined,
      }
);

// Optional: simple connection test on first import in dev
if (NODE_ENV !== "test") {
  pool
    .query("SELECT 1")
    .then(() => console.log("✅ DB pool ready"))
    .catch((err) => console.error("❌ DB pool error", err));
}

module.exports = pool;
