# US-ADM-01: Approve Organizer Accounts

### Test A — Approve
✅ Organizer moves from `pending` → `approved`
Logs correctly record action.

### Test B — Reject
✅ Organizer moves from `pending` → `rejected`
Logs correctly record action.

### Test C — Unauthorized
✅ Non-admin user blocked (`403 Forbidden`)
No changes in DB.
