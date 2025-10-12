// src/server/db/index.js
const { Pool } = require("pg");
const path = require("path");

// ✅ Load the root .env (two levels up from this file)
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "campus_events",
  password: process.env.DB_PASS || undefined,
  port: Number(process.env.DB_PORT || 5432),
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on("connect", () => {
  console.log(
    "✅ Connected to PostgreSQL",
    `(db=${process.env.DB_NAME || "campus_events"}, host=${process.env.DB_HOST || "localhost"})`
  );
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
