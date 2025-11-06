// src/server/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

// Routers (make sure each of these does: module.exports = router)
const savesRouter = require("./routes/saves.routes");
const eventsRouter = require("./routes/events");
const adminRouter = require("./routes/admin.routes");
const ticketClaimRoutes = require("./routes/events.tickets");
const organizerRoutes = require("./routes/organizer.routes");
const ticketRoute = require("./routes/ticketRoute");
const orgEventsRouter = require("./routes/orgEvents");
const devRoutes = require("./routes/dev.js"); // dev helpers (e.g., /dev/login)
const adminOrgsRouter = require("./routes/admin.orgs.routes");
const adminAnalyticsRouter = require("./routes/admin.analytics.routes");
const app = express();

// CORS + JSON setup
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    allowedHeaders: ["Content-Type", "Authorization", "X-User-Id"],
    credentials: false,
  })
);
app.use(express.json());


// --- Health checks ---
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/__health/db", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT 1 AS ok");
    res.json({ db: "up", ok: rows[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ db: "down", error: e.message });
  }
});

// --- API Routes ---
// Dev helpers (e.g., /dev/login returns a JWT for demo)
app.use("/dev", devRoutes);

// Saves ( /events/:id/save , /me/saves )
app.use("/", savesRouter);

// Public events (list/detail under /events)
app.use("/events", eventsRouter);

// Ticket claim endpoint(s) like POST /events/:id/tickets
app.use("/", ticketClaimRoutes);

// My Tickets + QR validate (needs to be mounted at '/')
// This exposes GET /me/tickets and (if implemented) POST /org/tickets/validate
app.use("/", ticketRoute);

// Organizer routes (e.g., /org/events)
app.use("/", organizerRoutes);

// Alt organizer events mount (your FE uses /api/org/events)
app.use("/api/org/events", orgEventsRouter);

// Admin routes
app.use("/", adminOrgsRouter);
app.use("/admin", adminRouter);
app.use("/", adminAnalyticsRouter);



// --- 404 fallback (keep last) ---
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
