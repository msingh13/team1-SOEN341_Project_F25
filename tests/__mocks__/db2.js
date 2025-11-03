// Jest auto-mock for src/server/db
// We simulate `pool.query` compatible signature by exposing `query` fn.

const db = {
    __rows: [],
    __setRows(rows) { this.__rows = rows; },
    async query(sql, params) {
      // Very small router: if query selects tickets join events, return injected rows
      // Your controller uses one SELECT ... FROM tickets t JOIN events e...
      if (/FROM\s+tickets\s+t\s+JOIN\s+events\s+e/i.test(sql)) {
        return { rows: this.__rows };
      }
  
      // Default: return a benign rowset
      return { rows: [] };
    },
  };
  
  module.exports = db;
  