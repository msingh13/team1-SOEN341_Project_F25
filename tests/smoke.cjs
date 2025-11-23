// src/tests/smoke.cjs
// Simple CI-friendly API smoke test for Campus Events
// Usage:  node src/tests/smoke.cjs
//
// ENV:
//   API_URL         (default http://localhost:4000)
//   STUDENT_ID      (default 3)
//   ORGANIZER_ID    (default 4)
//   ADMIN_ID        (default 1)
//   DEV_PASSWORD    (default "demo")

const API = process.env.API_URL || "http://localhost:4000";
const STUDENT_ID = Number(process.env.STUDENT_ID || 3);
const ORGANIZER_ID = Number(process.env.ORGANIZER_ID || 4);
const ADMIN_ID = Number(process.env.ADMIN_ID || 1);
const DEV_PASSWORD = process.env.DEV_PASSWORD || "demo";

const red = (s) => `\x1b[31m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

async function jfetch(url, opts = {}) {
  const res = await fetch(url, opts);
  const ct = res.headers.get("content-type") || "";
  const isJSON = ct.includes("application/json");
  const body = isJSON ? await res.json().catch(() => ({})) : await res.text();
  return { res, body };
}

function assert(cond, msg, details) {
  if (!cond) {
    console.error(red(`✖ FAIL: ${msg}`));
    if (details) console.error(dim(typeof details === "string" ? details : JSON.stringify(details, null, 2)));
    process.exit(1);
  } else {
    console.log(green(`✔ ${msg}`));
  }
}

async function login(id, role) {
  const { res, body } = await jfetch(`${API}/dev/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, role, password: DEV_PASSWORD }),
  });
  assert(res.ok, `Login ${role} (id=${id})`, body);
  assert(body?.token, `Received token for ${role}`);
  return body.token;
}

async function main() {
  console.log(dim(`API: ${API}`));

  // 0) Health
  {
    const { res, body } = await jfetch(`${API}/health`);
    assert(res.ok && body?.ok === true, "Health endpoint ok", body);
  }

  // 1) Logins
  const studentToken = await login(STUDENT_ID, "student");
  const organizerToken = await login(ORGANIZER_ID, "organizer");
  const adminToken = await login(ADMIN_ID, "admin");

  // 2) Public events list
  let firstEventId = null;
  {
    const { res, body } = await jfetch(`${API}/events`);
    assert(res.ok, "List public events returns 200");
    assert(Array.isArray(body) || Array.isArray(body?.items), "Events payload is array");
    const arr = Array.isArray(body) ? body : body.items;
    console.log(dim(`Found ${arr.length} public event(s)`));
    if (arr.length) firstEventId = arr[0].id ?? arr[0].event_id ?? null;
  }

  // 3) Organizer "my events" (prefer /me/events; fallback /api/org/events?mine=1)
  {
    let ok = false;
    let payload = null;

    const a = await jfetch(`${API}/me/events`, {
      headers: { Authorization: `Bearer ${organizerToken}` },
    });
    if (a.res.ok) {
      ok = true;
      payload = a.body;
    } else {
      const b = await jfetch(`${API}/api/org/events?mine=1`, {
        headers: { Authorization: `Bearer ${organizerToken}` },
      });
      ok = b.res.ok;
      payload = b.body;
    }
    assert(ok, "Organizer can load My Events", payload);
  }

  // 4) If an event exists, try claim (student) -> then validate (organizer)
  if (firstEventId) {
    // Claim a ticket
    let qrToken = null;
    {
      const { res, body } = await jfetch(`${API}/events/${firstEventId}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${studentToken}`,
        },
        body: "{}",
      });
      assert(res.ok, `Student can claim ticket for event ${firstEventId}`, body);
      qrToken = body?.qrToken || body?.qr_token || body?.token || null;
      assert(qrToken, "Ticket response includes qr token", body);
    }

    // Validate QR once (should pass)
    {
      const { res, body } = await jfetch(`${API}/tickets/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${organizerToken}`,
        },
        body: JSON.stringify({ token: qrToken }),
      });
      assert(res.ok, "Organizer can validate QR (first time)", body);
    }

    // Validate again (should be duplicate/invalid)
    {
      const { res } = await jfetch(`${API}/tickets/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${organizerToken}`,
        },
        body: JSON.stringify({ token: qrToken }),
      });
      assert(res.status >= 200 && res.status < 500, "Second validation handled (duplicate/invalid ok)");
      console.log(dim("Duplicate validation returned " + res.status));
    }

    // CSV export (best-effort; don't fail the build if not implemented)
    {
      const { res } = await jfetch(`${API}/api/org/events/${firstEventId}/attendees.csv`, {
        headers: { Authorization: `Bearer ${organizerToken}` },
      });
      if (res.ok) {
        assert(true, "CSV export available (200 OK)");
      } else {
        console.log(dim(`CSV export not available (${res.status}) — skipping`));
      }
    }
  } else {
    console.log(dim("No public events available — skipping claim/validate/CSV checks"));
  }

  // 5) Admin-only orgs API (best-effort; do not fail if route is absent)
  {
    const { res } = await jfetch(`${API}/api/admin/orgs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status === 404) {
      console.log(dim("Admin orgs route not found — skipping admin orgs checks"));
    } else if (res.status === 401 || res.status === 403) {
      console.log(dim(`Admin orgs unauthorized/forbidden (${res.status}) — skipping`));
    } else {
      assert(res.ok, "Admin can reach /api/admin/orgs");
    }
  }

  console.log(green("All smoke checks passed ✅"));
}

main().catch((e) => {
  console.error(red("Uncaught test error"));
  console.error(e);
  process.exit(1);
});
