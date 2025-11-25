const express = require('express');
const router = express.Router();
const pool = require('../db');


const {authenticateToken, requireRoles } = require('../middleware/auth');
const requireOrganizer = requireRoles('organizer');

async function requireOwnedEvent(eventId, organizerId) {
  const { rows } = await pool.query(
    `
    SELECT e.id
    FROM events e
    JOIN organizers o ON o.org_id = e.org_id
    WHERE e.id = $1
      AND o.user_id = $2
    `,
    [eventId, organizerId]
  );
  return rows[0] || null;
}
router.get(
    '/:id/settings', authenticateToken, requireOrganizer,
    async (req, res) => {
        const eventId = parseInt(req.params.id);
        const organizerId = req.user.id;
    
        if (!Number.isFinite(eventId)) {
            return res.status(400).json({code: 'BAD_REQUEST', message: 'Invalid event id'});
        }
        try {
            const event = await requireOwnedEvent(eventId, organizerId);
            if (!event) {
                return res.status(404).json({code: 'NOT_FOUND', message: 'Event not found or not owned by organizer'});
            }
                
            const {rows} = await pool.query(
                `SELECT waitlist_enabled,
                offer_window_minutes,
                max_waitlist
                FROM event_settings
                WHERE event_id = $1`,
                [eventId]
            );

            const settings = rows[0] || {
                waitlist_enabled: false,
                offer_window_minutes: 60,
                max_waitlist: null
            };
            return res.json({settings});

        }catch(e){
            console.error('GET /:id/settings error:', e);
            return res.status(500).json({code: 'INTERNAL_ERROR', message: 'Failed to retrieve event settings'});
        }finally{}
});

router.post(
    '/:id/settings',
    authenticateToken,
    requireOrganizer,
    async (req, res) => {
        const eventId = parseInt(req.params.id);
        const organizerId = req.user.id;

        const { waitlist_enabled, offer_window_minutes, max_waitlist } = req.body || {};

        if (!Number.isFinite(eventId)) {
            return res.status(400).json({ code: 'BAD_REQUEST', message: 'Invalid event id' });
        }

        try {
            const event = await requireOwnedEvent(eventId, organizerId);
            if (!event) {
                return res.status(404).json({
                    code: 'NOT_FOUND',
                    message: 'Event not found or not owned by organizer',
                });
            }
            const enabled = !!waitlist_enabled;

            const offerWindow = Number(offer_window_minutes);
            if (!Number.isFinite(offerWindow) || offerWindow <= 0) {
                return res.status(400).json({
                    code: "BAD_REQUEST",
                    message: "offer_window_minutes must be a positive integer"
                });
            }

            let maxWaitlist = null;
            if (max_waitlist !== null && max_waitlist !== "" && max_waitlist !== undefined) {
                maxWaitlist = Number(max_waitlist);
                if (!Number.isFinite(maxWaitlist) || maxWaitlist < 0) {
                    return res.status(400).json({
                        code: "BAD_REQUEST",
                        message: "Invalid max_waitlist",
                    });
                }
            }
            const { rows } = await pool.query(
                `
                INSERT INTO event_settings (event_id, waitlist_enabled, offer_window_minutes, max_waitlist)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (event_id) DO UPDATE
                    SET waitlist_enabled = EXCLUDED.waitlist_enabled,
                        offer_window_minutes = EXCLUDED.offer_window_minutes,
                        max_waitlist = EXCLUDED.max_waitlist
                RETURNING waitlist_enabled, offer_window_minutes, max_waitlist
                `,
                [eventId, enabled, offerWindow, maxWaitlist]
            );

            return res.json({ settings: rows[0] });

        } catch (e) {
            console.error('POST /:id/settings error:', e);
            return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to update event settings' });
        }
    }
);


module.exports = router;