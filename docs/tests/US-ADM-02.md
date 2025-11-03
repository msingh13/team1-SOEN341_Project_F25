# US-ADM-02 — Moderate Event Listings (Tests)

**Scope covered**
- Publish pending event → success and log created
- Reject pending event → success with rejection reason and log created
- Non-admin users cannot access endpoints (403)
- Unauthenticated requests rejected (401)
- Edge cases: already published/rejected (409), not found (404), invalid id (400)

**How to run**
```bash
    npm i 
    npm run test
```