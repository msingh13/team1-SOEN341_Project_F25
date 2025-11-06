#!/usr/bin/env bash
set -euo pipefail

API=${API:-http://localhost:4000}
echo "API: $API"

# 1) health
curl -fsS "$API/health" | jq .

# 2) login 3 roles (requires /dev/login)
STU_TOKEN=$(curl -fsS "$API/dev/login" -H 'Content-Type: application/json' -d '{"id":3,"role":"student","password":"demo"}' | jq -r .token)
ORG_TOKEN=$(curl -fsS "$API/dev/login" -H 'Content-Type: application/json' -d '{"id":4,"role":"organizer","password":"demo"}' | jq -r .token)
ADM_TOKEN=$(curl -fsS "$API/dev/login" -H 'Content-Type: application/json' -d '{"id":1,"role":"admin","password":"demo"}' | jq -r .token)

# 3) public events
curl -fsS "$API/events" | jq '.data | length'

# 4) organizer: my events (should not be "Admin only")
curl -fsS "$API/me/events" -H "Authorization: Bearer $ORG_TOKEN" | jq .

# 5) claim a ticket (first public event id)
EV_ID=$(curl -fsS "$API/events" | jq -r '.data[0].id')
curl -fsS -X POST "$API/events/$EV_ID/tickets" -H "Authorization: Bearer $STU_TOKEN" | jq .

# 6) validate QR (if token comes back)
QR=$(curl -fsS "$API/me/tickets" -H "Authorization: Bearer $STU_TOKEN" | jq -r '.Tickets[0].qrCode // empty')
if [[ -n "$QR" ]]; then
  echo "Validating $QR"
  curl -fsS -X POST "$API/tickets/validate" -H "Authorization: Bearer $ORG_TOKEN" -H 'Content-Type: application/json' -d "{\"token\":\"$QR\"}" | jq .
fi

echo "OK"
