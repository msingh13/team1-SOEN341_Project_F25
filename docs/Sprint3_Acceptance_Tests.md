# Sprint 3 Acceptance Tests

## STU-01-QA: Test filtering, pagination, and empty states
* **User Story:** As a student, I want to filter and browse events so I can find what I'm looking for easily, even if there are no results.
* **Acceptance Test 1 (Filtering):** Given I am on the events page, when I select the "Workshop" category, then I should only see events with the "Workshop" category.
* **Acceptance Test 2 (Pagination):** Given there are 25 events, and 10 per page, when I click "Page 2", then I should see events 11-20.
* **Acceptance Test 3 (Empty State):** Given I filter for "Music" on a date with no music events, then I should see a message "No events found."

## STU-04-QA: Test concurrency, duplicate claims, and sold-out edge cases
* **User Story:** As a student, I want to claim a ticket reliably, and the system must handle sold-out or duplicate-claim cases.
* **Acceptance Test 1 (Sold-Out):** Given "Event X" has 1 ticket left, and I claim it, when "User B" tries to claim it, then "User B" should see a "Sold Out" error.
* **Acceptance Test 2 (Duplicate):** Given I have already claimed a ticket for "Event Y", when I visit the "Event Y" page again, then the "Claim Ticket" button should be disabled or show "Already Claimed".
---
# Sprint 4 Proposed User Stories

## ADM-03-DB: Admin Global Statistics
* **User Story:** As an admin, I want to see global stats on the platform (total events, total tickets, attendance rates) so I can monitor platform health.
* **Tasks:**
    1.  (BE) Create `GET /api/admin/stats` endpoint.
    2.  (DB) Use `Event.countDocuments()` for total events.
    3.  (DB) Use `Ticket.countDocuments()` for total tickets.
    4.  (DB) Use `Ticket.countDocuments({ checkInStatus: true })` for attendance.
* **Priority:** High

## STU-05-DB: Secure QR Code Generation and Validation
* **User Story:** As a student, I want a unique QR code for my ticket so I can be checked in at the event.
* **Tasks:**
    1.  (DB) Add `qrCodeToken` and `checkInStatus` fields to the `Ticket` schema.
    2.  (BE) On ticket creation, generate a unique token (`uuid`) and save it.
    3.  (FE) On the "My Tickets" page, display the token as a QR code (using `react-qr-code`).
    4.  (BE) Create new `PUT /api/org/validate/:qrCodeToken` endpoint to check-in.
* **Priority:** High
