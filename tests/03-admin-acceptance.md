# Administrator — Acceptance Tests

## A1: Approve organizer accounts (mock or real)
**Goal:** Admin can approve or reject pending organizer requests.

Steps:
1. Go to **Moderation** or **Organizer Approvals** (admin page).
2. Verify a list of pending requests (mocked or real).
3. Click **Approve** on one; toast indicates success and row disappears.
4. Click **Reject** on another with a reason (if required).

**Pass if:** Approve/Reject actions update the list with clear feedback.

---

## A2: Moderate event listings
**Goal:** Admin can publish or reject submitted events.

Steps:
1. Open **Moderation** dashboard.
2. Locate events with status **submitted**.
3. Click **Publish**; status becomes **published**.
4. Click **Reject**, enter a reason; status becomes **rejected**.

**Pass if:** Status transitions work and persist (refresh to confirm).

---

## A3: Global analytics dashboard
**Goal:** View platform-wide stats.

Steps:
1. Go to **Admin Analytics** (if present) or the **Admin** landing.
2. Verify cards for **# of Events**, **Tickets Issued**, **Attendance Rate/Trend**.
3. Confirm a simple chart (bar/line) renders without console errors.

**Pass if:** KPIs show non-zero numbers (with seed/demo data) and chart renders.

---

## A4: Manage organizations & roles
**Goal:** Admin can create orgs and assign roles.

Steps:
1. Go to **Organizations**.
2. Click **+ New Organization**, fill Name/Description, **Create**.
3. In **Members**, add a user id with role **organizer**. Save.
4. Verify the member appears with the role badge.
5. Remove the member; confirm removal (guard last-admin, if enforced).

**Pass if:** Create/read/update/delete orgs and member roles work with clear UX.
