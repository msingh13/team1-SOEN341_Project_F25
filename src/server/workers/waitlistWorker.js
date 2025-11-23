const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");

const pool = require("../db"); 
const SYSTEM_ADMIN_ID = Number(process.env.SYSTEM_ADMIN_ID || 1);

async function logWaitlistAudit(client, { targetId, action, details }) {
  await client.query(
    `
    INSERT INTO moderation_log (admin_id, target_type, target_id, action, details)
    VALUES ($1, $2, $3, $4, $5::jsonb)
    `,
    [SYSTEM_ADMIN_ID, "event_waitlist", targetId, action, JSON.stringify(details ?? {})],
  );
}

async function getRemainingCapacity(client, eventId) {
  const { rows } = await client.query(
    `
    SELECT
      e.id AS event_id,
      e.capacity,
      COALESCE(COUNT(t.id) FILTER (WHERE t.status = 'claimed'), 0) AS tickets_claimed,
      GREATEST(0, e.capacity - COALESCE(COUNT(t.id) FILTER (WHERE t.status = 'claimed'), 0)) AS remaining
    FROM events e
    LEFT JOIN tickets t
      ON t.event_id = e.id
    WHERE e.id = $1
    GROUP BY e.id, e.capacity
    `,
    [eventId],
  );

  if (!rows.length) return 0;
  return Number(rows[0].remaining || 0);
}

async function getEventsWithActiveWaitlists(client) {
  const { rows } = await client.query(
    `
    SELECT DISTINCT e.id,
           s.offer_window_minutes
    FROM event_waitlists w
    JOIN events e ON e.id = w.event_id
    JOIN event_waitlist_settings s ON s.event_id = e.id
    WHERE s.enabled = TRUE
      AND e.status = 'published'
      AND w.status = 'queued'
    `,
  );
  return rows;
}

async function promoteQueuedAttendees() {
  const client = await pool.connect();
  try {
    const events = await getEventsWithActiveWaitlists(client);

    for (const event of events) {
      const eventId = event.id;
      const offerWindowMinutes = Number(event.offer_window_minutes || 60);

      await client.query("BEGIN");

      const remaining = await getRemainingCapacity(client, eventId);
      if (remaining <= 0) {
        await client.query("ROLLBACK");
        continue;
      }

      const { rows: queued } = await client.query(
        `
        SELECT id, user_id
        FROM event_waitlists
        WHERE event_id = $1
          AND status = 'queued'
        ORDER BY queue_position ASC, joined_at ASC, id ASC
        FOR UPDATE SKIP LOCKED
        LIMIT $2
        `,
        [eventId, remaining],
      );

      if (queued.length === 0) {
        await client.query("ROLLBACK");
        continue;
      }

      for (const w of queued) {
        const token = uuidv4();

        const { rows: updatedRows } = await client.query(
          `
          UPDATE event_waitlists
          SET status = 'offered',
              offer_token = $2,
              offer_expires_at = NOW() + ($3 || ' minutes')::interval
          WHERE id = $1
          RETURNING id, offer_expires_at
          `,
          [w.id, token, String(offerWindowMinutes)],
        );

        const updated = updatedRows[0];

        await logWaitlistAudit(client, {
          targetId: updated.id,
          action: "waitlist_offer_created",
          details: {
            event_id: eventId,
            user_id: w.user_id,
            offer_token: token,
            offer_expires_at: updated.offer_expires_at,
          },
        });
      }

      await client.query("COMMIT");
    }
  } catch (err) {
    console.error("Error in promoteQueuedAttendees:", err);
    try {
      await client.query("ROLLBACK");
    } catch (_) {}
  } finally {
    client.release();
  }
}

async function expireOffersAndAdvanceQueue() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: expiredOffers } = await client.query(
      `
      SELECT id, event_id, user_id
      FROM event_waitlists
      WHERE status = 'offered'
        AND offer_expires_at IS NOT NULL
        AND offer_expires_at <= NOW()
      FOR UPDATE SKIP LOCKED
      `,
    );

    if (expiredOffers.length === 0) {
      await client.query("COMMIT");
      return;
    }

    const ids = expiredOffers.map((r) => r.id);

    await client.query(
      `
      UPDATE event_waitlists
      SET status = 'expired'
      WHERE id = ANY($1::bigint[])
      `,
      [ids],
    );

    for (const entry of expiredOffers) {
      await logWaitlistAudit(client, {
        targetId: entry.id,
        action: "waitlist_offer_expired",
        details: {
          event_id: entry.event_id,
          user_id: entry.user_id,
        },
      });
    }

    await client.query("COMMIT");
  } catch (err) {
    console.error("Error in expireOffersAndAdvanceQueue:", err);
    try {
      await client.query("ROLLBACK");
    } catch (_) {}
  } finally {
    client.release();
  }
}

async function runWaitlistJobs() {
  await expireOffersAndAdvanceQueue();
  await promoteQueuedAttendees();
}

module.exports = {
  runWaitlistJobs,
  promoteQueuedAttendees,
  expireOffersAndAdvanceQueue,
};
