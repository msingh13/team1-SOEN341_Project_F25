require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const adminOrganizersRouter = require('./routes/admin.organizers');
app.use('/api/admin', adminOrganizersRouter);

const PORT = process.env.PORT || 3000;

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

// Force a DB connection on startup to see errors immediately
const db = require('./db');
db.query('SELECT 1')
  .then(() => console.log('✅ DB ping OK'))
  .catch((err) => console.error('❌ DB ping FAILED', err));

