# Student — Acceptance Tests

## S1: Event discovery — browse & search
**Goal:** A student can browse all events and filter by text/date/category/org.

Steps:
1. Go to `http://localhost:5173/` and click **Browse** (or **Browse Events**).
2. Verify the list shows ≥ 1 event card with title, date, location, and availability.
3. In the search box, type a known keyword (e.g., “Hackathon”).
4. Set a **From** date and a **To** date spanning the event.
5. Select a **Category** (if available) and/or an **Organization** (if available).
6. Click **Clear** and confirm the full list returns.

**Pass if:** Lists render, filters narrow results correctly, clearing restores full list.

---

## S2: Save event to personal list
**Goal:** Student can save/unsave.

Steps:
1. From **Browse**, open any event detail.
2. Click **Save**. Expect the button to flip to **Unsave** (optimistic).
3. Open **Saved Events** from Home (or the dedicated page).
4. Verify the saved event appears.
5. Click **Unsave** on the event card.
6. Return to **Saved Events** and verify it’s removed.

**Pass if:** Save/Unsave works and reflects on the Saved Events page.

---

## S3: Claim free ticket and receive digital ticket with QR
**Goal:** Claiming issues a ticket and shows a QR in **My Tickets**.

Steps:
1. Open an event with available capacity.
2. Click **Claim Ticket**.
3. Expect success toast/modal.
4. Navigate to **My Tickets**.
5. Verify a new ticket card shows title, time, location, **QR image**, and **Status**.

**Pass if:** Ticket appears with a QR image/token and reasonable metadata.

---

## S4: Add event to personal calendar (export iCal)
**Goal:** Download an iCal file (if button exists) or show instruction.

Steps:
1. On Event detail (or My Tickets), click **Add to Calendar** or **Export .ics** (if present).
2. Verify a file downloads OR the UI presents clear instructions.

**Pass if:** A .ics file downloads OR instructions are shown clearly.
