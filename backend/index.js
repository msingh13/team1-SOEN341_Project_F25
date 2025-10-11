// Import required libraries
const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

// Configure PostgreSQL connection pool
const pool = new Pool({
  user: 'karim',            // Database user
  host: 'localhost',        // Host (local machine)
  database: 'campus_events', // Database name
  password: '1234',         // Database password
  port: 5432,               // Default PostgreSQL port
});

// Middleware to parse JSON
app.use(express.json());

// ✅ Attach the pool to the app for routes to use it
app.set('pool', pool);

// ✅ Import event routes (correct path)
const eventRoutes = require('./routes/event');
app.use('/events', eventRoutes);

// Default route (for testing)
app.get('/', (req, res) => {
  res.send('<h3>Backend is running ✅</h3>');
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
