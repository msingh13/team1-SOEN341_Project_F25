# Acceptance Tests – Campus Events & Ticketing (Sprint 3 & 4)

This document describes end-to-end acceptance tests for the main user stories.
Each test was executed against the dev environment (`http://localhost:5173` +
`http://localhost:4000`) using seeded users:

- Admin (role: `admin`, student ID: `A0001`)
- Organizer (role: `organizer`, student ID: `O0001`)
- Student (role: `student`, student ID: `S0001`)

> Note: Authentication is based on **student ID and role**, not password.

---

## US.STU.01 – Browse & filter events

1. Log in as **Student** (`S0001`).
2. Open “Browse Events”.
3. Apply filter **Category = Social** and **Organization = Student Union**.
4. Expected: list only shows published events with category “Social” and organizer “Student Union”.
5. Clear filters and search for “Career Fair”.
6. Expected: list contains the “Career Fair” event, with correct date, time, and remaining seats.

---

## US.STU.04 / US.STU.05 – Claim ticket and view QR code

1. Log in as **Student** (`S0001`).
2. Open “Browse Events” and select an event that has remaining seats (e.g., “Career Fair”).
3. Click **Claim Ticket**.
4. Expected: confirmation message and ticket appears in **My Tickets**.
5. Open **My Tickets**.
6. Expected: a ticket card for the event with:
   - Status `claimed`
   - A QR code visible on the card.

---

## US.ORG.01 / US.ORG.03 / US.ORG.04 – Create event, analytics, CSV export

1. Log in as **Organizer** (`O0001`).
2. Go to **Organizer → My Events → Create Event**.
3. Fill required fields (title, date/time, location, capacity) and submit.
4. Expected: event is created in status `submitted`.
5. After admin publishes the event, claim a few tickets as a student.
6. As organizer, open **Event Analytics** for that event.
   - Expected: `tickets_issued`, `tickets_checked_in`, and `remaining_capacity` reflect DB state.
7. Click **Export attendees CSV**.
   - Expected: browser downloads `attendees-<id>.csv` with header row and at least one attendee row.

---

## US.ADM.01 / US.ADM.02 – Approve organizer and moderate events

1. Log in as **Student** (`S0001`), submit an organizer request.
2. Log in as **Admin** (`A0001`).
3. Open **Admin → Organizer Requests**.
   - Expected: the new request appears as `pending`.
4. Click **Approve**.
   - Expected: request status changes to `approved`; user now has `organizer` role.
5. As organizer, submit a new event (status `submitted`).
6. As admin, open **Admin → Event Moderation**.
   - Expected: event is listed in “Submitted events”.
7. Click **Publish**.
   - Expected: event status changes to `published` and appears in student browse list.

---

## US.ADM.03 / US.ADM.05 – Global analytics & waitlist policy

1. Log in as **Admin** (`A0001`).
2. Open **Admin → Global Stats**.
   - Expected: dashboard shows totals for events, tickets, users, `issued_today`, and a chart of tickets by day.
3. Navigate to **Admin → Waitlist Policy**.
4. Set:
   - `enabled = true`
   - `maxSize = 50`
   - `autoPromote = true`
5. Save the policy.
   - Expected: confirmation message, and changes appear in policy audit history with admin id and timestamp.

---

## US.ORG.06 / US.STU.06 – Event waitlist flow

1. Ensure event **Homecoming Party** is **sold out** (capacity reached by tickets).
2. Log in as **Student** (`S0001`) and open the event detail page.
   - Expected: primary action is **Join Waitlist** (not Claim Ticket).
3. Click **Join Waitlist**.
   - Expected: success toast and button changes to “On waitlist”.
4. As organizer, open **Waitlist / Attendees** for that event.
   - Expected: student appears with status `queued` and a position.
5. Organizer clicks **Promote**.
   - Expected: student receives an offer (mocked as an “offer available” state in UI).
6. As student, accept the offer and claim ticket.
   - Expected: ticket appears in **My Tickets**; waitlist position freed.

---

(You can link this file in your report and from relevant GitHub issues.)
