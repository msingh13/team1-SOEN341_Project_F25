const db = require('..');

const express = require('express');
const router = express.Router();
const eventsCtrl = require('../controllers/events.controllers');

router.get('/', eventsCtrl.list); // GET /events

module.exports = router;


exports.getEvents = async ({ q, categories, org, dateFrom, dateTo, sort, limit, offset }) => {
  const where = ['e.published = TRUE'];
  const params = [];
  let i = 1;

  if (q) {
    where.push(`(e.title ILIKE $${i} OR e.description ILIKE $${i})`);
    params.push(`%${q}%`); i++;
  }
  if (categories && categories.length) {
    where.push(`e.category = ANY($${i})`);
    params.push(categories); i++;
  }
  if (org) {
    where.push(`e.org_id = $${i}`);
    params.push(org); i++;
  }
  if (dateFrom) {
    where.push(`e.start_time::date >= $${i}`);
    params.push(dateFrom); i++;
  }
  if (dateTo) {
    where.push(`e.start_time::date <= $${i}`);
    params.push(dateTo); i++;
  }

  const order =
    sort === 'start_desc'   ? 'e.start_time DESC'   :
    sort === 'created_desc' ? 'e.created_at DESC'   :
                               'e.start_time ASC';

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sql = `
    SELECT
      e.id, e.title, e.start_time, e.end_time, e.location,
      e.category, e.org_id,
      o.name AS organizer
    FROM events e
    LEFT JOIN organizations o ON o.id = e.org_id
    ${whereSql}
    ORDER BY ${order}
    LIMIT ${limit} OFFSET ${offset}
  `;
  const { rows } = await db.query(sql, params);
  return rows;
};

exports.countPublished = async ({ q, categories, org, dateFrom, dateTo }) => {
  const where = ['e.published = TRUE'];
  const params = [];
  let i = 1;

  if (q) {
    where.push(`(e.title ILIKE $${i} OR e.description ILIKE $${i})`);
    params.push(`%${q}%`); i++;
  }
  if (categories && categories.length) {
    where.push(`e.category = ANY($${i})`);
    params.push(categories); i++;
  }
  if (org) {
    where.push(`e.org_id = $${i}`);
    params.push(org); i++;
  }
  if (dateFrom) {
    where.push(`e.start_time::date >= $${i}`);
    params.push(dateFrom); i++;
  }
  if (dateTo) {
    where.push(`e.start_time::date <= $${i}`);
    params.push(dateTo); i++;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const { rows } = await db.query(`SELECT COUNT(*) AS c FROM events e ${whereSql}`, params);
  return Number(rows[0]?.c || 0);
};
