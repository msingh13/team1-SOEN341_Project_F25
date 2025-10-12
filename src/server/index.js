require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const adminOrganizersRouter = require('./routes/admin.organizers');
app.use('/api/admin', adminOrganizersRouter);

const PORT = process.env.PORT || 3000;


const adminRoutes = require('./routes/admin');  
const eventsRouter = require('./routes/events');

app.use('/admin', adminRoutes);                  
app.use('/events', eventsRouter);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use((_req, res) => {
  res.status(404).json({ code: 'NOT_FOUND', message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

// Force a DB connection on startup to see errors immediately
const db = require('./db');
db.query('SELECT 1')
  .then(() => console.log('✅ DB ping OK'))
  .catch((err) => console.error('❌ DB ping FAILED', err));

