// client/lib/api.js
export async function getEvents(params = {}) {
  //Use the correct base path for your Express backend
  const url = new URL("http://localhost:4000/events");

  // attach search params dynamically
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (Array.isArray(v)) v.forEach((val) => url.searchParams.append(k, val));
    else url.searchParams.set(k, v);
  });

  try {
    const res = await fetch(url, {
      credentials: "include", // keeps session cookies if used
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to load events: ${res.status} - ${text}`);
    }

    const data = await res.json();
    console.log("[getEvents] Loaded:", data);
    return data;
  } catch (err) {
    console.error("[getEvents] Error:", err);
    throw err;
  }
}
