import dotenv from "dotenv";
dotenv.config();
import express from 'express';
import cors from 'cors';
import pool from './db/index.js';
import devRoutes from './routes/dev.js';
import ticketRoutes from './routes/ticketRoute.js';

const app = express();


app.use(cors({
  origin: "http://localhost:5173",                
  allowedHeaders: ["Content-Type", "Authorization", "X-User-Id"], 
  credentials: false,                            
}));


app.use(express.json());

const PORT = process.env.PORT || 3000;

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

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
