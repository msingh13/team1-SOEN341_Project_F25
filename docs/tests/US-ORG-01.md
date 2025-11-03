# US-ORG-01 — QA Test

## 🎯 Purpose

To verify that organizers can create and edit events correctly, that edits are blocked after the event starts, and that non-organizers cannot perform these actions. Validation and error messages should also behave correctly.

## 1. Scope Recap

Test organizer workflows:

- Event creation (valid / invalid)
- Editing before start date
- Prevent editing after start
- Role restrictions (non-organizers blocked)
- Validation messages for invalid inputs

## 🧪 Test Data

Template for event creation:

{
"title": "QA Demo Event",
"description": "End-to-end test",
"category": "Workshop",
"location": "Engineering Hall",
"start_at": "2025-12-10T10:00:00",
"end_at": "2025-12-10T12:00:00",
"capacity": 50,
"ticket_type": "free"
}

### Manual Test Cases

## 1. Create Event - Valid Organizer flow

Goal: verify an organizer can successfully create an event.
Test:
curl -i -X POST http://localhost:4000/organizer/events \
 -H "Content-Type: application/json" \
 -H "x-user-id: 101" \
 -d '{"title":"QA Demo Event","description":"End-to-end test","category":"Workshop","location":"Engineering Hall","start_at":"2025-12-10T10:00:00","end_at":"2025-12-10T12:00:00","capacity":50,"ticket_type":"free"}'

Expected Result: 201 created

## 2. Create Event - Invalid Date Handling

Tests:
a) missing title --> expect error
b) Negative capacity --> expect error
c) end_at before start_at --> expect error
d) Invalid ticket type --> expect error

## 3. Edit Event - Before Start

Goal: Organizer should be able to edit the details before the start date.
Test:
curl -i -X PUT http://localhost:4000/organizer/events/<EVENT_ID> \
 -H "Content-Type: application/json" \
 -H "x-user-id: 101" \
 -d '{"title":"QA Demo Event (Updated)","location":"New Room 201"}'

Expected: 200 ok

## 4. Edit Event - After Start

Goal: prevent modifications after the start time of event
Test:
curl -i -X PUT http://localhost:4000/organizer/events/<PAST_EVENT_ID> \
 -H "Content-Type: application/json" \
 -H "x-user-id: 101" \
 -d '{"title":"Late Edit Attempt"}'

Expected error

## 5. Role Restriction - Non Organizer Blocked

Goal: ensure only organizers can create/edit events
Test:

# Student tries to create

curl -i -X POST http://localhost:4000/organizer/events \
 -H "Content-Type: application/json" \
 -H "x-user-id: 102" \
 -d '{"title":"Unauthorized","category":"Workshop","location":"Lab","start_at":"2025-12-10T10:00:00","end_at":"2025-12-10T12:00:00","capacity":20,"ticket_type":"free"}'

Expected error

## 6. Validation Message Review:

Goal: check that all error responses contain clear and consistent JSON keys:
{
"code": "VALIDATION_ERROR",
"message": "title is required"
}

## Implementation Status on `dev`

| Area                                      | Status                           | Notes                                       |
| ----------------------------------------- | -------------------------------- | ------------------------------------------- |
| POST /organizer/events (create)           | 🚫 Missing                       | Endpoint not found in `organizer.routes.js` |
| PUT /organizer/events/:id (edit)          | 🚫 Missing                       | No update logic present                     |
| PATCH (lock-after-start)                  | 🚫 Missing                       | Not implemented                             |
| GET /organizer/org/events                 | ✅ Available                     | Lists organizer’s own events                |
| GET /organizer/org/events/:id/analytics   | ✅ Available                     | Returns event analytics                     |
| Role restriction (403 when non-organizer) | ✅ Confirmed via code review     |
| Error handling structure                  | ✅ sendError() used consistently |

## Manual Test Coverage

| Test Case                                     | Expected Result                           | Actual Result       |
| --------------------------------------------- | ----------------------------------------- | ------------------- |
| GET /org/events (no token)                    | 401 Unauthorized                          | ✅ 401 returned     |
| GET /org/events (non-organizer)               | 403 Forbidden (`Organizer role required`) | ✅ 403 verified     |
| GET /org/events (organizer)                   | 200 OK + list data or empty list          | ✅ Works            |
| GET /org/events/:id/analytics (wrong owner)   | 403 Forbidden                             | ✅ 403              |
| GET /org/events/:id/analytics (correct owner) | 200 OK + metrics JSON                     | ✅ Works            |
| POST /organizer/events (create)               | 201 Created                               | 🚫 Endpoint missing |
| PUT /organizer/events/:id (edit)              | 200 Updated                               | 🚫 Endpoint missing |
| Edit after start                              | 409 Conflict                              | 🚫 Endpoint missing |

## Bugs / Gaps Identified

1. No create/edit endpoints in `organizer.routes.js`.
2. Duplicate definition of `/org/events/:id/analytics` lines 84 & 151.
3. Minor: no input-validation errors for page/limit (but clamped values).

### Additional Notes

- Editing restrictions depend on server timezone (NOW() vs event start).
- Some tests may require pre-seeded events or manual creation beforehand.
- If endpoints differ, update paths accordingly (/events vs /organizer/events).
- **Partially testable**: Role restriction and auth logic verified.
- **Blocked**: Create / Edit / Lock-after-start until backend implementation exists.
- No critical bugs found in existing endpoints.
