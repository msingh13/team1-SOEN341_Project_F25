# Regression Testing – Sprint 4

In Sprint 4 we performed regression testing to ensure new features (waitlist, analytics, admin tools) did not break existing functionality.

---

## 1. Strategy

We used a **mixed approach**:

- Automated backend tests (Jest) to guard critical business rules.
- Manual end-to-end passes on the main user journeys (student, organizer, admin).
- Smoke tests after large merges to dev/main.

Each regression pass used the same seeded DB state from `reset_and_seed.sql`.

---

## 2. Student Regression Checklist

Executed with **student** role (login by student ID):

- Login with valid student ID and role.
- Browse events list loads without error.
- Filters by category and organization work.
- Search bar returns expected event titles.
- Event detail shows date/time, capacity, and remaining seats.
- “Save event” toggles and event appears in **Saved Events**.
- “Claim Ticket” creates a ticket and **My Tickets** shows:
  - status `claimed`
  - QR code string/token.
- For sold-out events, primary action changes to **Join Waitlist**.

---

## 3. Organizer Regression Checklist

Executed with **organizer** role:

- Organizer dashboard lists own events with remaining capacity.
- Creating a new event results in status `submitted`.
- Editing an upcoming event validates capacity > already issued tickets.
- Waitlist settings form:
  - Rejects non-numeric or non-positive `offer_window_minutes`.
  - Rejects negative `max_waitlist`.
- Analytics page:
  - `tickets_issued` and `tickets_checked_in` reflect DB.
  - `remaining_capacity` is non-negative.

CSV Export:

- Download `attendees-<id>.csv`.
- CSV contains header and rows for all attendees.

---

## 4. Admin Regression Checklist

Executed with **admin** role:

- Organizer requests page lists `pending` requests.
- Approve → user becomes organizer; Reject → status `rejected`.
- Event moderation:
  - Submitted events appear in the pending list.
  - Publish → event becomes `published` and visible to students.
  - Reject → event becomes `rejected` and disappears from submitted view.
- Global stats page loads without errors and all numeric cards show non-negative integers.
- Waitlist policy page:
  - Allows updating max size, autoPromote, enabled flags.
  - Audit history shows new record for each change.

---

## 5. Defects Found & Fixed (Examples)

- [example] Bug: analytics API could return negative remaining capacity when tickets > capacity (fixed by `GREATEST(0, capacity - issued)`).
- [example] Bug: event settings form accepted 0-minute offer window (fixed by server-side validation).

(You can replace with your actual issues + links.)
