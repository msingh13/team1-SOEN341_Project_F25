// src/server/routes/org.waitlist.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const {v4: uuidv4} = require('uuid');

const {authenticateToken, requireRoles } = require('../middleware/auth');
const requireOrganizer = requireRoles('organizer');

router.get(
    '/:id/waitlist',
    authenticateToken,
    requireOrganizer,
    async (req, res) => {
        const eventId = parseInt(req.params.id);
        if (!Number.isFinite(eventId)) {
            return res.status(400).json({code: 'BAD_REQUEST', message: 'Invalid event id'});
        }

        try {
            const {rows: evRows} = await pool.query(
                'SELECT id FROM events WHERE id = $1',
                [eventId]
            );
            if (evRows.length === 0) {
                return res.status(404).json({code: 'NOT_FOUND', message: 'Event not found'});
            }
            
            const {rows: waitlistRows} = await pool.query(
                `SELECT w.id,
                 w.status, 
                 w.position, 
                 w.created_at,
                 u.name AS user_name,
                 u.id AS user_id,
                 u.email 
                 FROM event_waitlist w
                 JOIN users AS u ON u.id = w.user_id
                 WHERE w.event_id = $1
                 ORDER BY w.created_at ASC`,
                [eventId]
            );
            return res.json({waitlist: waitlistRows});
        }catch(e){
            console.error('GET /:id/waitlist error:', e);
            return res.status(500).json({code: 'INTERNAL_ERROR', message: 'Failed to retrieve waitlist'});
        }
    }
);

router.post(
    '/:id/waitlist/promote',
    authenticateToken,
    requireOrganizer,
    async (req, res) => {
        const eventId = parseInt(req.params.id);
        const {userId} = req.body|| {};
        const actorID = req.user.id;
        if (!Number.isFinite(eventId)) {
            return res.status(400).json({code: 'BAD_REQUEST', message: 'Invalid event id'});
        }
    

    const client = await pool.connect();
    try{// Start transaction
        await client.query('BEGIN');
        const {rows: evRows} = await client.query(
            'SELECT id, capacity FROM events WHERE id = $1 FOR UPDATE',
            [eventId]
        );
        if (evRows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({code: 'NOT_FOUND', message: 'Event not found'});
        }
        const capacity = evRows[0].capacity;
        
        const {rows: ticketCountRows} = await client.query(
            "SELECT COUNT(*) AS count FROM tickets WHERE event_id = $1 AND status != 'canceled'",
            [eventId],
        );
        const used = parseInt(ticketCountRows[0].count);
        if (used >= capacity) {
            await client.query('ROLLBACK');
            return res.status(400).json({code: 'BAD_REQUEST', message: 'Event is at full capacity'});
        }
        
        const {rows: waitlistRows} = await client.query(
            `SELECT id, user_id, status FROM event_waitlist 
             WHERE event_id = $1 AND user_id = $2 FOR UPDATE`,
            [eventId, userId]
        );
        if (waitlistRows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({code: 'NOT_FOUND', message: 'User not found in waitlist'});
        }
        const waitlistEntry = waitlistRows[0];
        if (waitlistEntry.status !== 'queued') {
            await client.query('ROLLBACK');
            return res.status(400).json({code: 'BAD_REQUEST', message: 'can only promote queued users'});
        }
        await client.query(
            `UPDATE event_waitlist
             SET status = 'promoted', updated_at = NOW()
             WHERE id = $1`,
            [waitlistEntry.id]
        );
        const qrToken = uuidv4();
        const {rows: ticketRows} = await client.query(
            `INSERT INTO tickets (event_id, user_id, status, qr_token)
             VALUES ($1, $2, 'claimed', $3)
             RETURNING id, status, qr_token, issued_at`,
            [eventId, userId, qrToken]
        );

        await client.query(
            `INSERT INTO event_waitlist_audit (event_id, waitlist_id, actor_id, action)
             VALUES ($1, $2, $3, 'promote')`,
            [eventId, waitlistEntry.id, actorID]
        );
        await client.query('COMMIT');
        return res.json({ticket: ticketRows[0]});

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('POST /:id/waitlist/promote error:', e);
        return res.status(500).json({code: 'INTERNAL_ERROR', message: 'Server error'});
    }finally{
        client.release();
    }
}
);

router.delete(
    "/:id/waitlist/:entryId",
    authenticateToken,
    requireOrganizer,
    async (req, res) => {
        const eventId = parseInt(req.params.id);
        const entryId = parseInt(req.params.entryId);
        const actorID = req.user.id;
        
        if (!Number.isFinite(eventId) || !Number.isFinite(entryId)) {
            return res.status(400).json({code: 'BAD_REQUEST', message: 'Invalid event or entry id'});
        }
        const client = await pool.connect();
        try {
            
            await client.query('BEGIN');
            
            const {rows: evRows} = await client.query(
                `SELECT w.id FROM event_waitlist w
                 JOIN events e ON e.id = w.event_id
                 WHERE w.event_id = $1 AND w.id = $2 
                 FOR UPDATE`,
                [eventId, entryId]
            );
            if (evRows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({code: 'NOT_FOUND', message: 'Waitlist entry not found for this event'});
            }
            await client.query(
                `UPDATE event_waitlist
                 SET status = 'removed', updated_at = NOW()
                 WHERE id = $1`,
                [entryId]
            );
            await client.query(
                `INSERT INTO event_waitlist_audit (event_id, waitlist_id, actor_id, action)
                 VALUES ($1, $2, $3, 'remove')`,
                [eventId, entryId, actorID]
            );
            await client.query('COMMIT');
            return res.json({ok: true});
        }catch (e) {
            await client.query('ROLLBACK');
            console.error('DELETE /:id/waitlist/:entryId error:', e);
            return res.status(500).json({code: 'INTERNAL_ERROR', message: 'Server error'});
        }finally{
            client.release();
        }
}
);



module.exports = router;
