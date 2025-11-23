# Organizer — Acceptance Tests

## O1: Create event
**Pre:** Logged in as organizer (user id 4 or similar).
**Goal:** Create a new event from UI and see it in Organizer Dashboard.

Steps:
1. Go to **Create Event**.
2. Fill: Title, Description, Date, Start, End, Location, Capacity, Ticket Type.
3. Click **Create Event**. Expect success toast.
4. Go to **Organizer Dashboard** (My Events).
5. Verify the new event appears with **submitted** or **published** status.

**Pass if:** Event is created and listed under organizer events.

---

## O2: Edit event (and publish flow if present)
**Goal:** Organizer can update details before start time.

Steps:
1. From **Organizer Dashboard**, click **Edit** on the newly created event.
2. Change the **Location** and **Capacity**, click **Save**.
3. Expect success toast and values persisted (reload to confirm).

**Pass if:** PUT succeeds and fields persist.

---

## O3: Event analytics — per-event dashboard
**Goal:** Organizer sees tickets issued, checked-in, remaining, attendance rate.

Steps:
1. From **Organizer Dashboard**, click **Analytics** for an event.
2. Verify metrics: **Total Tickets**, **Checked In**, **Remaining**, **Attendance %**.
3. Confirm the pie chart renders (Checked In vs Remaining) with tooltip/legend.

**Pass if:** Metrics render and chart is visible without console errors.

---

## O4: Export attendees CSV
**Goal:** Organizer can export a CSV of attendees.

Steps:
1. Open **Edit** for an event that has tickets (claim 1 if necessary).
2. Click **Export Attendees CSV**.
3. Verify a file like `event_<id>_attendees.csv` downloads.
4. Open it and confirm columns: attendee_name, student_id (if present), email, ticket_id, ticket_status, issued_at, checked_in_at.

**Pass if:** CSV downloads and includes the listed headers.

---

## O5: QR validation (upload/scan simulation)
**Goal:** Validate a ticket QR/token.

Steps:
1. Navigate to **Scan** (organizer route).
2. Either upload a QR image or paste a known token (if the UI supports paste).
3. Click **Validate**.
4. Expect **Valid** on first attempt (and server updates checked-in time).
5. Repeat the same token; expect **Duplicate** or **Already Checked In**.

**Pass if:** First validate = valid; second = duplicate/already-checked.
