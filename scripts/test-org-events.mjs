// scripts/test-org-events.mjs
// Automated smoke tests for US-ORG-02 (View My Events)

const BASE = process.env.BASE_URL || 'http://localhost:5001';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function json(url) {
  const res = await fetch(url);
  const txt = await res.text();
  let data;
  try { data = JSON.parse(txt); } catch {
    throw new Error(`Non-JSON from ${url}: ${res.status} ${txt.slice(0,200)}`);
  }
  return { status: res.status, data };
}

function isSorted(arr, extractor, dir='asc') {
  for (let i = 1; i < arr.length; i++) {
    const a = extractor(arr[i-1]);
    const b = extractor(arr[i]);
    if (dir === 'asc' && a > b) return false;
    if (dir === 'desc' && a < b) return false;
  }
  return true;
}

(async () => {
  const results = [];
  let passed = 0, failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      results.push(`✅ ${name}`);
      passed++;
    } catch (e) {
      results.push(`❌ ${name}\n   ↳ ${e.message}`);
      failed++;
    }
  }

  // M1 — Organizer sees only their events (via public filter ?org=)
  await test('M1A: Org 1 only sees Org 1 events', async () => {
    const { status, data } = await json(`${BASE}/events?org=1&perPage=50`);
    assert(status === 200, `status ${status}`);
    assert(Array.isArray(data.data), 'data.data not array');
    for (const ev of data.data) {
      assert(ev.org_id === 1, `found non-Org-1 event id=${ev.id} org_id=${ev.org_id}`);
    }
  });

  await test('M1B: Org 2001 only sees Org 2001 events', async () => {
    const { status, data } = await json(`${BASE}/events?org=2001&perPage=50`);
    assert(status === 200, `status ${status}`);
    assert(Array.isArray(data.data), 'data.data not array');
    for (const ev of data.data) {
      assert(ev.org_id === 2001, `found non-Org-2001 event id=${ev.id} org_id=${ev.org_id}`);
    }
  });

  // M2 — Sorting by date (the API uses start_at; adjust to ev.start_at)
  await test('M2: sort=start_asc sorts by start_at ascending', async () => {
    const { data } = await json(`${BASE}/events?org=1&sort=start_asc&perPage=50`);
    const arr = data.data;
    assert(Array.isArray(arr), 'no array');
    const ok = isSorted(arr, ev => new Date(ev.start_at ?? ev.start_time).getTime(), 'asc');
    assert(ok, 'not sorted ascending by start time');
  });

  await test('M2: sort=start_desc sorts by start_at descending', async () => {
    const { data } = await json(`${BASE}/events?org=1&sort=start_desc&perPage=50`);
    const arr = data.data;
    assert(Array.isArray(arr), 'no array');
    const ok = isSorted(arr, ev => new Date(ev.start_at ?? ev.start_time).getTime(), 'desc');
    assert(ok, 'not sorted descending by start time');
  });

  // M3 — Pagination
  await test('M3: pagination page=1 vs page=2 no duplicates', async () => {
    const a = await json(`${BASE}/events?org=1&perPage=5&page=1`);
    const b = await json(`${BASE}/events?org=1&perPage=5&page=2`);
    const idsA = new Set(a.data.data.map(ev => ev.id));
    const idsB = new Set(b.data.data.map(ev => ev.id));
    for (const id of idsA) {
      assert(!idsB.has(id), `duplicate id ${id} across pages`);
    }
    // basic sanity on pagination object
    assert(a.data.pagination?.page === 1, 'page 1 wrong');
    assert(b.data.pagination?.page === 2, 'page 2 wrong');
  });

  // M4 — Empty state (use an org with no events)
  // If you created Org Empty earlier, replace ORGX with its id.
  const ORGX = process.env.EMPTY_ORG_ID;
  if (ORGX) {
    await test('M4: empty state for an org with no events', async () => {
      const { data } = await json(`${BASE}/events?org=${ORGX}`);
      assert(Array.isArray(data.data), 'data not array');
      assert(data.data.length === 0, `expected empty, got ${data.data.length}`);
      assert(data.pagination?.total === 0, 'pagination total not 0');
    });
  } else {
    results.push('ℹ️ M4: skipped (set EMPTY_ORG_ID to test empty state)');
  }

  // M5 — Unauthorized access note (route is public in this codebase)
  results.push('ℹ️ M5: unauthorized /org/events not applicable (public /events endpoint)');

  // Report
  console.log(results.join('\n'));
  if (failed) {
    console.error(`\n${passed} passed, ${failed} failed`);
    process.exit(1);
  } else {
    console.log(`\n${passed} passed, ${failed} failed`);
  }
})().catch(e => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
