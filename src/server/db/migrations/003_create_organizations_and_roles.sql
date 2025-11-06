-- =============================================================
-- Migration: 003_create_organizations_and_roles.sql
-- Parent Story: US-ADM-04 (Manage Organizations & Roles)
-- Purpose:
--   Create organizations and user_org_roles tables with FK constraints
--   and role validation.
-- =============================================================

BEGIN;

-- -------------------------------------------------------------
-- 1. Create organizations table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 2. Create user_org_roles mapping table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_org_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'organizer', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, org_id, role)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS ix_uor_user ON user_org_roles(user_id);
CREATE INDEX IF NOT EXISTS ix_uor_org ON user_org_roles(org_id);

COMMIT;
