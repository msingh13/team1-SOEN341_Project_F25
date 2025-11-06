## Ticket Claim API Test — Summary Report

## **Overview**
This document explains the purpose, execution, and results of the **Ticket Claim API Test**, which verifies the endpoint:

The test suite in `tests/claim-ticket.test.js` performs 4 main checks:

1. Rejects requests without a valid JWT token  
2. Successfully claims a ticket and decreases available seats  
3. Rejects duplicate claims for the same user/event  
4. Handles invalid event IDs properly

Things that went wrong:
1. The test failed because remaining_seats returned from the database was a string, not a number.
PostgreSQL returns COUNT(*) as a bigint


Tests:       1 failed, 3 passed, 4 total
Time:        0.364 s, estimated 1 s