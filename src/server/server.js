// src/server/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

// ─── Debug: log why the process exits ───────────────────────────────
process.on("exit", (code) => {
  console.log(`⚠️ process.exit with code: ${code}`);
});
process.on("SIGINT", () => {
  console.log("⚠️ Caught SIGINT (Ctrl+C)");
});
process.on("SIGTERM", () => {
  console.log("⚠️ Caught SIGTERM");
});
process.on("uncaughtException", (err) => {
  console.error("💥 uncaughtException:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("💥 unhandledRejection:", reason);
});

// ─── Routers ────────────────────────────────────────────────────────
const devRoutes = require("./routes/dev");
const authRoutes = require("./routes/auth.routes");

const savesRouter = require("./routes/saves.routes");
const eventsRouter = require("./routes/events");
const eventMetricsRouter = require("./routes/events.metrics.routes");

const ticketClaimRoutes = require("./routes/events.tickets");
const orgEventsRouter = require("./routes/orgEvents");
const organizerRoutes = require("./routes/organizer.routes");

const offersRoutes = require("./routes/offers");

const waitlistRoutes = require("./routes/events.waitlist.routes");
const orgWaitlistRoutes = require("./routes/org.waitlist.routes");
const eventSettingsRouter = require("./routes/events.settings.routes");

const adminRouter = require("./routes/admin.routes");
const adminOrgsRouter = require("./routes/admin.orgs.routes");
const adminAnalyticsRouter = require("./routes/admin.analytics.routes");
const adminWaitlistRoutes = require("./routes/admin.waitlist.routes");

// ─── App setup ──────────────────────────────────────────────────────
const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    allowedHeaders: ["Content-Type", "Authorization", "X-User-Id"],
  })
);
app.use(express.json());

// ─── Health endpoints ───────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/__health/db", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT 1 AS ok");
    res.json({ db: "up", ok: rows[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ db: "down", error: e.message });
  }
});

// ─── Dev & Auth ─────────────────────────────────────────────────────
app.use("/dev", devRoutes);
app.use("/auth", authRoutes);

// ─── Student features ───────────────────────────────────────────────
// Saves + discovery + counters + waitlist + tickets

app.use("/", savesRouter);                 // /events/:id/save, /me/saves

app.use("/events", eventsRouter);          // /events, /events/:id, filters
app.use("/events", eventMetricsRouter);    // /events/:id/counters

// student waitlist: /events/:id/waitlist/...
app.use("/", waitlistRoutes);
app.use("/events", waitlistRoutes);


// ticket claim + my tickets + organizer QR validate
app.use("/", ticketClaimRoutes);           // POST /events/:id/tickets, GET /me/tickets, POST /org/tickets/validate

// ─── Organizer features ─────────────────────────────────────────────
app.use("/api/org/events", orgEventsRouter); // CRUD + CSV + analytics for org events
app.use("/", organizerRoutes);               // GET /org/events, /org/events/:id/analytics

// organizer waitlist management: /events/:id/waitlist (organizer view)
app.use("/events", orgWaitlistRoutes);
app.use("/api/org/events", orgWaitlistRoutes);


// organizer event settings: /events/:id/settings GET/POST
app.use("/events", eventSettingsRouter);

// Offers (waitlist promotion tokens)
app.use("/offers", offersRoutes);

// ─── Admin features ─────────────────────────────────────────────────
app.use("/", adminOrgsRouter);              // admin orgs/roles
app.use("/", adminAnalyticsRouter);         // admin analytics
app.use("/admin", adminRouter);             // moderation publish/reject
app.use("/admin/waitlist", adminWaitlistRoutes); // waitlist policy + audit

// ─── 404 fallback ───────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ code: "NOT_FOUND", message: "Route not found" });
});

// ─── Start server ───────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server @ http://localhost:${PORT}`);
  // optional DB ping
  pool
    .query("SELECT 1")
    .then(() => console.log("✅ DB ping OK"))
    .catch((err) => console.error("❌ DB ping FAILED", err));
});

// Keep reference so nothing accidentally closes it
server.on("error", (err) => {
  console.error("💥 HTTP server error:", err);
});
