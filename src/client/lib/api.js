export async function getEvents(params = {}) {
  const url = new URL('/api/events', window.location.origin);

  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (Array.isArray(v)) v.forEach(val => url.searchParams.append(k, val));
    else url.searchParams.set(k, v);
  });

  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to load events: ${res.status}`);
  return res.json();
}
