// src/server/routes/orgEvents.js
// This route implements:
// POST  /api/org/events        -> create event
// PUT   /api/org/events/:id    -> update event
// GET   /api/org/events/:id/attendees.csv -> download attendees CSV

const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Try to use real DB pool if exists
let pool = null;
try {
  pool = require('../db'); // expects src/server/db/index.js exporting Pool
} catch (err) {
  pool = null;
}

// JSON-file fallback storage (for easy testing without Postgres)
const dataDir = path.join(__dirname, '..', 'data');
const eventsFile = path.join(dataDir, 'events.json');
const attendeesFile = path.join(dataDir, 'attendees.json');

function ensureDataFiles() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
  if (!fs.existsSync(eventsFile)) fs.writeFileSync(eventsFile, '[]', 'utf8');
  if (!fs.existsSync(attendeesFile)) fs.writeFileSync(attendeesFile, '[]', 'utf8');
}
function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return []; }
}
function writeJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); }

// Helper to convert attendees array to CSV
function toCSV(rows) {
  if (!rows || rows.length === 0) return '';
  const keys = Object.keys(rows[0]);
  const lines = [keys.join(',')];
  for (const r of rows) {
    const vals = keys.map(k => {
      let v = r[k] === null || r[k] === undefined ? '' : String(r[k]);
      if (v.includes(',') || v.includes('"')) {
        v = '"' + v.replace(/"/g, '""') + '"';
      }
      return v;
    });
    lines.push(vals.join(','));
  }
  return lines.join('\n');
}

// POST create event
router.post('/', async (req, res) => {
  const {
    title, description, date, startTime, endTime, location, capacity, ticketType, createdBy
  } = req.body || {};

  if (!title || !date) return res.status(400).json({ error: 'title and date required' });

  // If pool exists, store in DB
  if (pool) {
    try {
      const q = `INSERT INTO events (title, description, date, start_time, end_time, location, capacity, ticket_type, created_by, created_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()) RETURNING *;`;
      const vals = [title, description || null, date, startTime || null, endTime || null, location || null, capacity || null, ticketType || 'free', createdBy || null];
      const { rows } = await pool.query(q, vals);
      return res.status(201).json(rows[0]);
    } catch (err) {
      console.error('DB insert error', err);
      return res.status(500).json({ error: 'DB error' });
    }
  }

  // Fallback: JSON file storage
  try {
    ensureDataFiles();
    const events = readJSON(eventsFile);
    const newEvent = {
      id: uuidv4(),
      title, description: description || '', date, start_time: startTime || null, end_time: endTime || null,
      location: location || '', capacity: capacity || 0, ticket_type: ticketType || 'free', created_by: createdBy || 'unknown',
      created_at: new Date().toISOString()
    };
    events.push(newEvent);
    writeJSON(eventsFile, events);
    return res.status(201).json(newEvent);
  } catch (err) {
    console.error('Fallback insert error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT update event
router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const {
    title, description, date, startTime, endTime, location, capacity, ticketType
  } = req.body || {};

  if (pool) {
    try {
      const q = `UPDATE events SET title=$1, description=$2, date=$3, start_time=$4, end_time=$5, location=$6,
                 capacity=$7, ticket_type=$8, updated_at=NOW() WHERE id=$9 RETURNING *;`;
      const vals = [title, description || null, date, startTime || null, endTime || null, location || null, capacity || null, ticketType || 'free', id];
      const { rows } = await pool.query(q, vals);
      if (!rows[0]) return res.status(404).json({ error: 'Event not found' });
      return res.json(rows[0]);
    } catch (err) {
      console.error('DB update error', err);
      return res.status(500).json({ error: 'DB error' });
    }
  }

  // Fallback JSON file
  try {
    ensureDataFiles();
    const events = readJSON(eventsFile);
    const idx = events.findIndex(e => e.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Event not found' });
    const ev = events[idx];
    events[idx] = {
      ...ev,
      title: title ?? ev.title,
      description: description ?? ev.description,
      date: date ?? ev.date,
      start_time: startTime ?? ev.start_time,
      end_time: endTime ?? ev.end_time,
      location: location ?? ev.location,
      capacity: capacity ?? ev.capacity,
      ticket_type: ticketType ?? ev.ticket_type,
      updated_at: new Date().toISOString()
    };
    writeJSON(eventsFile, events);
    return res.json(events[idx]);
  } catch (err) {
    console.error('Fallback update error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET attendees CSV for an event id
router.get('/:id/attendees.csv', async (req, res) => {
  const id = req.params.id;

  if (pool) {
    try {
      // Example: attendees table with id, event_id, name, email, ticket_id, checked_in
      const q = `SELECT name, email, ticket_id, checked_in, created_at FROM attendees WHERE event_id = $1 ORDER BY created_at;`;
      const { rows } = await pool.query(q, [id]);
      const csv = toCSV(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="attendees-${id}.csv"`);
      return res.send(csv);
    } catch (err) {
      console.error('DB attendees error', err);
      return res.status(500).send('Server error');
    }
  }

  // JSON fallback: read attendees.json and filter
  try {
    ensureDataFiles();
    const attendees = readJSON(attendeesFile);
    const rows = attendees.filter(a => a.event_id === id);
    const csv = toCSV(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendees-${id}.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error('Fallback attendees error', err);
    return res.status(500).send('Server error');
  }
});

module.exports = router;
