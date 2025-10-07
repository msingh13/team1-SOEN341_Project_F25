# queries/

This folder contains **reusable SQL queries or query wrapper functions**.

- Keeps database logic separate from route controllers.
- Each file should handle one domain (e.g., `events.js`, `tickets.js`).
- Queries should use the `db/index.js` connection pool.

✅ Example (`events.js`):
```js
const db = require("../index");

exports.getEvents = (limit, offset) => {
  return db.query(
    `SELECT * FROM events WHERE status='published' ORDER BY start_at ASC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
};