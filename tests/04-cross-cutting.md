# Cross-Cutting Acceptance

## C1: Role-based navigation
**Goal:** Different roles see the correct menus and routes.

Steps:
1. Logged out: See Home, Browse, Login. No organizer/admin links.
2. Logged in as **student**: See Home, Browse, My Tickets. No organizer/admin links.
3. Logged in as **organizer**: See Organizer Dashboard, Create Event, Scan.
4. Logged in as **admin**: See Moderation, Organizations, (Admin Analytics).

**Pass if:** Menus and access match the role.

---

## C2: Error handling & empty states
**Goal:** Friendly messages when lists are empty or something fails.

Steps:
1. Force a filter that returns zero events on Browse.
2. Verify “No events found” (or equivalent).
3. Temporarily stop the API (optional) and reload a page.
4. Verify a red “HTTP xxx” or “Unable to load” banner, not a blank screen.

**Pass if:** Clear, non-technical empty/error states are shown to the user.
