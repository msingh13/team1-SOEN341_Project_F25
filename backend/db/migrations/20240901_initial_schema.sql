-- Create organizations table
CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create events table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    org_id INTEGER REFERENCES organizations(id),
    title TEXT,
    start_at TIMESTAMP,
    end_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create tickets table
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id),
    price NUMERIC,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
