require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const eventsRouter = require("./routes/events");   // ⬅️ import the router
app.use("/events", eventsRouter);                  // ⬅️ mount at /events


const PORT = process.env.PORT || 3000;

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
