-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,           -- e.g., 'CREATE_EVENT', 'DELETE_USER'
    performed_by INTEGER NOT NULL,  -- User ID who did the action
    target_id INTEGER,              -- Optional: ID of the object affected (e.g., event_id)
    details TEXT,                   -- Optional: JSON string or description of changes
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (performed_by) REFERENCES users(id)
);

-- Create an index for faster querying by user or action
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);