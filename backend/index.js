// Import required libraries
const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

// Configure PostgreSQL connection pool
const pool = new Pool({
  user: 'karim',           // Database user
  host: 'localhost',       // Host (local machine)
  database: 'campus_events', // Database name
  password: '1234',        // Database password
  port: 5432,              // Default PostgreSQL port
});

// Default route to check if backend is running
app.get('/', (req, res) => {
  res.send('Backend is running ✅');
});

// Route to test PostgreSQL connection
app.get('/db-test', async (req, res) => {
  try {
    // Execute a simple query to get current timestamp
    const result = await pool.query('SELECT NOW()');
    res.json({ time: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send('DB connection error ❌');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
