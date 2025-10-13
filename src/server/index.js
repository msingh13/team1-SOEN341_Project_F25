import dotenv from "dotenv";
dotenv.config();
import express from 'express';
import cors from 'cors';
import pool from './db/index.js';
import devRoutes from './routes/dev.js';
import ticketRoutes from './routes/ticketRoute.js';

const eventsRouter = require('./routes/events');
app.use('/events', eventsRouter);

console.log('[server] using src/server/index.js'); 

const app = express();


app.use(cors({
  origin: "http://localhost:5173",                
  allowedHeaders: ["Content-Type", "Authorization", "X-User-Id"], 
  credentials: false,                            
}));


app.use(express.json());


const PORT = process.env.PORT || 3000;

const adminAnalyticsRouter = require('./routes/admin.analytics.routes');
const adminOrganizersRouter = require('./routes/admin.organizers');
const adminRoutes = require('./routes/admin');  
const eventsRouter = require('./routes/events');

app.use('/admin', adminRoutes);                  
app.use('/events', eventsRouter);
app.use('/admin', adminAnalyticsRouter);
app.use('/api/admin', adminOrganizersRouter);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/__health/db', async (_req, res) => {// Check database connectivity

  try {
    
    const { rows } = await pool.query('SELECT 1 AS ok');
    res.json({ db: 'up', ok: rows[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ db: 'down', error: e.message });

  }
});


app.use('/dev', devRoutes);
app.use('/', ticketRoutes);

app.get('/admin/ping', (_req, res) => res.json({ ok: true, where: 'index' }));


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

