// src/server/db.js
const { Pool } = require("pg");

const {
  DATABASE_URL,
  DB_USER,
  DB_HOST,
  DB_NAME,
  DB_PORT,
  DB_PASSWORD, // preferred
  DB_PASS,     // fallback
  NODE_ENV,
} = process.env;

const useUrl = !!DATABASE_URL;

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

// Simple connection test in non-test env
if (NODE_ENV !== "test") {
  pool
    .query("SELECT 1")
    .then(() => console.log("✅ DB pool ready"))
    .catch((err) => console.error("❌ DB pool error", err));
}

module.exports = pool;
