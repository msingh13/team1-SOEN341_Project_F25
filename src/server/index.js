require('dotenv').config();
const express = require('express');
const cors = require('cors');


const waitlistRoutes = require('./routes/waitlist.routes.js');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', waitlistRoutes);

// Default test route
app.get('/', (req, res) => {
  res.send('API is running');
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
