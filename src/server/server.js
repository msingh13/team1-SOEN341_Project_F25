// src/server/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db"); // initialize PostgreSQL pool
const savesRouter = require("./routes/saves.routes");
const eventsRouter = require("./routes/events");
const adminRouter = require("./routes/admin.routes");
const ticketClaimRoutes = require("./routes/events.tickets");


// Optional: if you have these routes too, uncomment them
// const adminAnalyticsRouter = require("./routes/admin.analytics.routes");
// const adminOrganizersRouter = require("./routes/admin.organizers");
// const ticketRoutes = require("./routes/ticketRoute.js").default; // if ESM
// const devRoutes = require("./routes/dev.js").default; // if ESM

const app = express();

// CORS + JSON setup
app.use(
  cors({
    origin: "http://localhost:5173",
    allowedHeaders: ["Content-Type", "Authorization", "X-User-Id"],
    credentials: false,
  })
);
app.use(express.json());

// --- Health check endpoints ---
app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/__health/db", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT 1 AS ok");
    res.json({ db: "up", ok: rows[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ db: "down", error: e.message });
  }
});

// --- Routers ---
app.use("/", savesRouter); // /events/:id/save, /me/saves
app.use("/events", eventsRouter);
app.use("/admin", adminRouter);
app.use("/", ticketClaimRoutes);

// If using extra admin or dev routes later:
// app.use("/admin", adminAnalyticsRouter);
// app.use("/api/admin", adminOrganizersRouter);
// app.use("/dev", devRoutes);
// app.use("/", ticketRoutes);

// --- 404 fallback ---
app.use((_req, res) => {
  res.status(404).json({ code: "NOT_FOUND", message: "Route not found" });
});

// --- Start server ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

// --- DB sanity ping ---
pool
  .query("SELECT 1")
  .then(() => console.log("✅ DB ping OK"))
  .catch((err) => console.error("❌ DB ping FAILED", err));

module.exports = app;
