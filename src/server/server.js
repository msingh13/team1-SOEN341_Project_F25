const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

const { authenticateToken } = require("./middleware/auth");

// Routers
const savesRouter = require("./routes/saves.routes");
const eventsRouter = require("./routes/events");
const adminRouter = require("./routes/admin.routes"); // your moderation, etc.
const ticketClaimRoutes = require("./routes/events.tickets");
const organizerRoutes = require("./routes/organizer.routes");
const ticketRoute = require("./routes/ticketRoute");
const orgEventsRouter = require("./routes/orgEvents");

const devRoutes = require("./routes/dev.js");
const authRoutes = require("./routes/auth.routes");
const adminOrgsRouter = require("./routes/admin.orgs.routes");
const adminAnalyticsRouter = require("./routes/admin.analytics.routes");

const waitlistRoutes = require("./routes/events.waitlist.routes");


const app = express();


// CORS + JSON
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    allowedHeaders: ["Content-Type", "Authorization", "X-User-Id"],
  })
);
app.use(express.json());

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/__health/db", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT 1 AS ok");
    res.json({ db: "up", ok: rows[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ db: "down", error: e.message });
  }
});

// Dev & Auth
app.use("/dev", devRoutes);
app.use("/auth", authRoutes);

// Saves, events, tickets, my tickets, org events
app.use("/", savesRouter);
app.use("/events", eventsRouter);
app.use("/", waitlistRoutes);
app.use("/", ticketClaimRoutes);
app.use("/", ticketRoute);
app.use("/api/org/events", orgEventsRouter);

// Admin (orgs/roles + analytics + moderation)
app.use("/", adminOrgsRouter);
app.use("/", adminAnalyticsRouter);
app.use("/admin", adminRouter);

// 404
app.use((_req, res) => res.status(404).json({ code: "NOT_FOUND", message: "Route not found" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server @ http://localhost:${PORT}`));

pool
  .query("SELECT 1")
  .then(() => console.log("✅ DB ping OK"))
  .catch((err) => console.error("❌ DB ping FAILED", err));
