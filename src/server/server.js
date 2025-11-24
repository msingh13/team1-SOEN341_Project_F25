// src/server/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

// Routers
const savesRouter = require("./routes/saves.routes");
const eventsRouter = require("./routes/events");
const adminRouter = require("./routes/admin.routes");
const ticketClaimRoutes = require("./routes/events.tickets");
const organizerRoutes = require("./routes/organizer.routes");
const ticketRoute = require("./routes/ticketRoute");
const orgEventsRouter = require("./routes/orgEvents");
const devRoutes = require("./routes/dev.js");
const authRoutes = require("./routes/auth.routes");
const adminOrgsRouter = require("./routes/admin.orgs.routes");
const adminAnalyticsRouter = require("./routes/admin.analytics.routes");

const app = express();

const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// ---------- Global middleware ----------
app.use(
  cors({
    origin: CORS_ORIGIN,
    allowedHeaders: ["Content-Type", "Authorization", "X-User-Id"],
    credentials: true,
  })
);

app.use(express.json());

// ---------- Health check ----------
app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (err) {
    console.error("Health check DB error", err);
    res.status(500).json({ ok: false });
  }
});

// ---------- Auth ----------
app.use(authRoutes); // /auth/register, /auth/login, /auth/me

// ---------- Public / student / organizer routes ----------
app.use(eventsRouter);        // /events...
app.use(ticketClaimRoutes);   // /events/:id/claim, etc.
app.use(ticketRoute);         // /me/tickets, /me/waitlists
app.use(savesRouter);         // /events/:id/save, /me/saves
app.use(orgEventsRouter);     // /organizer/events...
app.use(organizerRoutes);     // other organizer routes
app.use(devRoutes);           // dev helpers (if any)

// ---------- Admin & analytics ----------
app.use("/admin", adminRouter); // /admin/organizers/pending, /admin/events/...
app.use(adminOrgsRouter);       // /admin/orgs, /api/admin/organizations, etc.
app.use(adminAnalyticsRouter);  // /admin/stats

// ---------- 404 fallback ----------
app.use((req, res) => {
  res.status(404).json({
    code: "NOT_FOUND",
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ---------- Error handler ----------
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res
    .status(500)
    .json({ code: "INTERNAL_ERROR", message: "Unexpected server error" });
});

// ---------- Start server (no async wrapper, so process stays alive) ----------
pool
  .query("SELECT 1")
  .then(() => {
    console.log("✅ DB ping OK");
  })
  .catch((err) => {
    console.error("❌ DB ping failed", err);
  });

app.listen(PORT, () => {
  console.log(`🚀 Server @ http://localhost:${PORT}`);
});

module.exports = app;
