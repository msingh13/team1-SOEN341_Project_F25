-- create_audit_logs.sql

-- Create audit_logs table (PostgreSQL version)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    action TEXT NOT NULL,              -- e.g., 'CREATE_EVENT', 'DELETE_USER'
    performed_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id INTEGER,                 -- Optional: ID of the object affected (e.g., event_id)
    details TEXT,                      -- Optional: JSON string or description of changes
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for faster querying by user or action
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by
  ON audit_logs(performed_by);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON audit_logs(action);
