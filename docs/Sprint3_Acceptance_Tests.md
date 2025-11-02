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
