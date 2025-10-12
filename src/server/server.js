const express = require("express");
const cors = require("cors");
const savesRouter = require("./routes/saves.routes");
require("dotenv").config();

require("./db"); // initialize pool
const eventsRouter = require("./routes/events");

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use("/", savesRouter);

//Added: Import the admin routes module that defines moderation endpoints
const adminRouter = require("./routes/admin.routes");

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/events", eventsRouter);

//Added: Mount the admin routes under the '/admin' path prefix
//Example: POST /admin/events/ :id/publish or /admin/events/ :id/reject
app.use("/admin", adminRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server at http://localhost:${PORT}`));

module.exports = app; // for tests
