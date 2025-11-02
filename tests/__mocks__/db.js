// tests/__mocks__/db.js
// Minimal in-memory DB that emulates the specific queries used by moderation.controller & requireAdmin

let users = [
    { id: 1, role: 'admin', name: 'Alice Admin' },
    { id: 2, role: 'student', name: 'Bob Student' }
  ];
  
  let events = [
    { id: 101, status: 'submitted', title: 'Pending Event' },
    { id: 102, status: 'published', title: 'Already Published' },
    { id: 103, status: 'rejected',  title: 'Already Rejected' }
  ];
  
  let moderation_logs = [];
  
  function reset() {
    users = [
      { id: 1, role: 'admin', name: 'Alice Admin' },
      { id: 2, role: 'student', name: 'Bob Student' }
    ];
    events = [
      { id: 101, status: 'submitted', title: 'Pending Event' },
      { id: 102, status: 'published', title: 'Already Published' },
      { id: 103, status: 'rejected',  title: 'Already Rejected' }
    ];
    moderation_logs = [];
  }
  
  async function query(sql, params = []) {
    const s = sql.replace(/\s+/g, ' ').trim().toLowerCase();
  
    // SELECT users for admin check
    if (s.startsWith('select id, role from users where id = $1')) {
      const id = Number(params[0]);
      const row = users.find(u => u.id === id);
      return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
    }
  
    // SELECT event by id for moderation
    if (s.startsWith('select id, status from events where id = $1')) {
      const id = Number(params[0]);
      const row = events.find(e => e.id === id);
      return { rows: row ? [{ id: row.id, status: row.status }] : [], rowCount: row ? 1 : 0 };
    }
  
    // UPDATE events SET status = 'published' WHERE id = $1 RETURNING id, status
    if (s.startsWith("update events set status = 'published' where id = $1 returning id, status")) {
      const id = Number(params[0]);
      const row = events.find(e => e.id === id);
      if (!row) return { rows: [], rowCount: 0 };
      row.status = 'published';
      return { rows: [{ id: row.id, status: row.status }], rowCount: 1 };
    }
  
    // UPDATE events SET status = 'rejected' WHERE id = $1 RETURNING id, status
    if (s.startsWith("update events set status = 'rejected' where id = $1 returning id, status")) {
      const id = Number(params[0]);
      const row = events.find(e => e.id === id);
      if (!row) return { rows: [], rowCount: 0 };
      row.status = 'rejected';
      return { rows: [{ id: row.id, status: row.status }], rowCount: 1 };
    }
  
    // INSERT moderation_logs (publish/reject)
    if (s.startsWith('insert into moderation_logs')) {
      // Two shapes are used in your controllers:
      // publish: (admin_id, event_id, action, reason) VALUES ($1, $2, 'publish', NULL)
      // reject : (admin_id, event_id, action, reason) VALUES ($1, $2, 'reject', $3)
      const adminId = params[0];
      const eventId = params[1];
      const isReject = s.includes("'reject'");
      const reason = isReject ? params[2] ?? null : null;
  
      moderation_logs.push({
        id: moderation_logs.length + 1,
        admin_id: adminId,
        event_id: eventId,
        action: isReject ? 'reject' : 'publish',
        reason,
        created_at: new Date().toISOString()
      });
      return { rows: [], rowCount: 1 };
    }
  
    // Generic fallback — not expected to be used in these tests
    throw new Error(`Mock DB: Unhandled query:\n${sql}\nparams=${JSON.stringify(params)}`);
  }
  
  module.exports = {
    query,
    // helpers for tests
    __data: {
      reset,
      get events() { return events; },
      get logs() { return moderation_logs; }
    }
  };
  