require('dotenv').config();
const express = require('express');
const cors = require('cors');

const eventsRouter = require('./routes/events');
app.use('/events', eventsRouter);

console.log('[server] using src/server/index.js'); 

const app = express();
app.use(cors());
app.use(express.json());

const adminAnalyticsRouter = require('./routes/admin.analytics.routes');
console.log('[server] admin router required');   
app.use('/admin', adminAnalyticsRouter);

const PORT = process.env.PORT || 3000;

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/admin/ping', (_req, res) => res.json({ ok: true, where: 'index' }));

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
