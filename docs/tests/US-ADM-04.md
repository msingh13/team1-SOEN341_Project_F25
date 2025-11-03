# US-ADM-04 — QA: Role Assignment, Org CRUD, and Safeguards

**Status:** Documentation complete — testing pending backend merge

## Scope

**Objective:**  
Validate that admin users can manage organizations and assign/remove roles safely.

### Covered Features:

- Create, edit, and delete organizations.
- Assign and remove roles from users.
- Prevent duplicate role assignments.
- Ensure only admins can perform these actions.
- Confirm UI and API consistency once backend integration is available.

## 1 Preconditions

- **Backend URL:** `http://localhost:4000`
- **Admin user:** ID = `3`, role = `admin`
- **Students:** IDs = `5`, `6`, etc.
- **Authentication methods:**
  - (Preferred) JWT login endpoint `/dev/login`
  - (Fallback) Header: `x-user-id: 3`

> If backend routes are not yet connected or return `Unauthorized`, mark test as **PENDING**.

## 2 Test Matrix (Summary)

| ID        | Area  | Scenario                               | Expected Result               |
| --------- | ----- | -------------------------------------- | ----------------------------- |
| ORG-01    | Orgs  | Create organization (valid)            | 201 Created + org JSON        |
| ORG-02    | Orgs  | Create organization (missing name)     | 400 Validation error          |
| ORG-03    | Orgs  | Edit organization (valid)              | 200 Updated JSON              |
| ORG-04    | Orgs  | Edit organization (invalid/empty name) | 400 Validation error          |
| ORG-05    | Orgs  | Delete organization (existing)         | 200 `{ ok: true }`            |
| ORG-06    | Orgs  | Delete organization (not found)        | 404 Not Found                 |
| ROLE-01   | Roles | Assign role to user                    | 201 Success + members updated |
| ROLE-02   | Roles | Assign duplicate role                  | 409 Duplicate error           |
| ROLE-03   | Roles | Remove role mapping                    | 200 Success + member removed  |
| AUTH-01   | Auth  | Non-admin create org                   | 401/403 Blocked               |
| AUTH-02   | Auth  | Non-admin assign role                  | 401/403 Blocked               |
| UI-API-01 | UI    | UI shows create/edit/delete updates    | Matches backend state         |
| UI-API-02 | UI    | UI shows role add/remove status        | Matches backend state         |

## 3 Manual API Test Steps

### ORG-01 — Create Organization (valid)

curl -i -X POST "http://localhost:4000/admin/orgs" \
 -H "Content-Type: application/json" \
 -H "x-user-id: 3" \
 -d '{"name":"QA Test Org","description":"Created by ADM-04-QA"}'

### ORG-02 — Create Organization (missing name)

curl -i -X POST "http://localhost:4000/admin/orgs" \
 -H "Content-Type: application/json" \
 -H "x-user-id: 3" \
 -d '{"description":"Missing name"}'

### ORG-03 — Edit Org (valid)

curl -i -X PUT "http://localhost:4000/admin/orgs/1" \
 -H "Content-Type: application/json" \
 -H "x-user-id: 3" \
 -d '{"name":"QA Org (edited)","description":"Updated"}'

### ORG-04- Edit Org (invalid)

curl -i -X PUT "http://localhost:4000/admin/orgs/1" \
 -H "Content-Type: application/json" \
 -H "x-user-id: 3" \
 -d '{"name":""}'

### ORG-05-Delete Org (existing)

curl -i -X DELETE "http://localhost:4000/admin/orgs/1" -H "x-user-id: 3"

### ORG-06- Delete Org (not found)

curl -i -X DELETE "http://localhost:4000/admin/orgs/9999" -H "x-user-id: 3"

### ROLE-01- Assign Role

curl -i -X POST "http://localhost:4000/admin/orgs/1/roles" \
 -H "Content-Type: application/json" \
 -H "x-user-id: 3" \
 -d '{"user_id":5,"role":"organizer"}'

### ROLE-02- Prevent Duplicate Role

curl -i -X POST "http://localhost:4000/admin/orgs/1/roles" \
 -H "Content-Type: application/json" \
 -H "x-user-id: 3" \
 -d '{"user_id":5,"role":"organizer"}'

### ROLE-03- Remove Role

curl -i -X DELETE "http://localhost:4000/admin/orgs/1/roles/5" -H "x-user-id: 3"

### AUTH-01- Non-admin Blocked (create org)

curl -i -X POST "http://localhost:4000/admin/orgs" \
 -H "Content-Type: application/json" \
 -H "x-user-id: 5" \
 -d '{"name":"Should fail"}'

### AUTH-02- Non-admin Blocked (assign role)

curl -i -X POST "http://localhost:4000/admin/orgs/1/roles" \
 -H "Content-Type: application/json" \
 -H "x-user-id: 5" \
 -d '{"user_id":6,"role":"organizer"}'
