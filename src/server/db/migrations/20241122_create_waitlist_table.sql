CREATE TABLE IF NOT EXISTS waitlist (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE UNIQUE INDEX IF NOT EXISTS unique_waitlist_entry
ON waitlist (event_id, user_id);
