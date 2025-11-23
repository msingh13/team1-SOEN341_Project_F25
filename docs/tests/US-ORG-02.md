# US-ORG-02 — View My Events (Test Report)

**Scope**
- Organizer sees only their own events.
- Sorting by date works.
- Pagination works for multiple pages.
- Empty state when no events exist.
- Unauthorized access to `/org/events` is blocked.

**Environment**
- App commit: <sha>
- Backend URL: <http://localhost:5000>
- Test date: <YYYY-MM-DD>
- Tester: <your name>

---

## Manual Test Cases

### M1 — Organizer sees only their events
**Precondition:** Organizer A has events E1, E2. Organizer B has event E3.  
**Steps:**
1. Log in as Organizer A.
2. Go to Organizer Dashboard → My Events.
**Expected:** Only E1, E2 appear (E3 hidden).  
**Result:** [Pass/Fail] / Notes:

### M2 — Sort by date (descending)
**Steps:** Click the Date column or sort button (newest first).  
**Expected:** Events ordered by newest start date.  
**Result:** [Pass/Fail] / Notes:

### M3 — Sort by date (ascending)
**Steps:** Click the Date column again (oldest first).  
**Expected:** Events ordered by oldest start date.  
**Result:** [Pass/Fail] / Notes:

### M4 — Pagination
**Precondition:** More than 1 page of events (e.g., 15+ if page size = 10).  
**Steps:** Click “Next page”, then “Previous page”.  
**Expected:** Correct page content; no duplicates or missing events.  
**Result:** [Pass/Fail] / Notes:

### M5 — Empty state
**Precondition:** Organizer with no events.  
**Steps:** Log in as a new organizer; open My Events.  
**Expected:** Shows message like “No events yet” and a Create button.  
**Result:** [Pass/Fail] / Notes:

### M6 — Unauthorized access (API)
**Steps:** Call `GET /org/events` without logging in or as a non-organizer.  
**Expected:** 401 Unauthorized or 403 Forbidden.  
**Result:** [Pass/Fail] / Notes:

---

## Automated Tests
- API tests: `/org/events` (ownership filter, sorting, pagination, auth)
- Optional UI tests: dashboard sorting & pagination

**Status:** [Planned / Implemented]  
**Command:** `npm test` (or your project’s test command)

---

## Bugs
If any bugs appear, log separately with:
- **Title**
- **Env / Build**
- **Steps to Reproduce**
- **Expected**
- **Actual**
- **Status**

---

## Summary
- Manual: [# passed / # total]
- Automated: [# passed / # total]
- Notes:
