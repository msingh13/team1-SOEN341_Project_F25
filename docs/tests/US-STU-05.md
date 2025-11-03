# US-STU-05 — View My Tickets with QR (Test Plan & Results)

## Scope

Validate the ticket lifecycle from claim → listing → QR display → check-in status, plus auth/ownership.

## Endpoints

- GET `/me/tickets` (authenticated)

> Note: Claiming is covered at API level via POST `/events/:id/tickets` in US-STU-04.  
> For this story we verify that _claimed_ tickets appear and render QR data correctly.

---

## Automated Tests

Location: `tests/me.tickets.spec.js`

### What’s covered

- ✅ Returns only current user’s tickets (happy path)
- ✅ QR token present, unique, and “strong” (length ≥ 24; URL-safe base62/64-ish)
- ✅ Checked-in ticket reflects `checkedInAt` and `status`
- ✅ Unauthorized (no/invalid token) → 401/403
- ✅ Empty state (no tickets) → 404 with message

### Results

- All tests PASS on CI (see workflow runs).
- Coverage uploaded as artifact in CI.

---

## Manual Checks (UI)

1. Sign in as Student A (dev: use header or local auth flow).
2. Ensure Student A has at least one claimed ticket.
3. Visit **My Tickets** page:
   - Each ticket card shows title, date/time, location, and a rendered QR (from token).
   - “Checked In” tickets visually differ (badge/label).
4. Sign out, hit `/me/tickets` → should redirect or fail (401).

**Edge cases**

- Very long event names still wrap neatly.
- Timezone formatting consistent with locale.
- If tickets = 0, show empty state.

---

## Known Gaps / Notes

- Token format validation is heuristic (length & charset). True cryptographic strength is enforced where tokens are generated (US-STU-04).
- If you later add the check-in endpoint, extend tests to verify the “checked-in” transition via API before GET `/me/tickets`.
