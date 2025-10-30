// CommonJS throughout (no ESM exports)
const { Pool } = require("pg");

// Load .env ONCE at process start (server.js already does this).
// If you still want a fallback here, uncomment the next line.
// require("dotenv").config();

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        user: process.env.DB_USER || "postgres",
        host: process.env.DB_HOST || "localhost",
        database: process.env.DB_NAME || "campus_events",
        password: process.env.DB_PASS || undefined,
        port: Number(process.env.DB_PORT || 5432),
        max: 10,
        idleTimeoutMillis: 30_000,
      }
);

pool.on("connect", () => {
  console.log(
    "Connected to PostgreSQL",
    `(db=${process.env.DB_NAME || "[via DATABASE_URL or default]"}, host=${process.env.DB_HOST || "localhost"})`
  );
});

pool.on("error", (err) => {
  console.error(" PG pool error:", err);
});

// Optional: tiny sanity check query on boot (non-fatal if it fails)
(async () => {
  try {
    const r = await pool.query("SELECT 1 as up");
    if (r?.rows?.[0]?.up === 1) {
      console.log("DB sanity check OK");
    }
  } catch (e) {
    console.warn("⚠️ DB sanity check failed:", e.message);
  }
})();

module.exports = pool;
