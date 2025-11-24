// src/pages/OrganizerEvents.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type Wire = {
  id: number;
  title: string;
  location?: string;
  startAt?: string;      // camel
  start_time?: string;   // snake
  capacity?: number;
  remaining?: number;
  remaining_seats?: number;
  status?: "submitted" | "published" | "rejected" | string;
};

type Row = {
  id: number;
  title: string;
  startAt: string | null;
  location: string;
  capacity: number | null;
  remaining: number | null;
  status: string;
};

const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";

export default function OrganizerEvents() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [sort, setSort] = useState<"start_asc" | "start_desc">("start_asc");
  const nav = useNavigate();
  const token = localStorage.getItem("token") || "";

  function normalize(list: Wire[]): Row[] {
    return list.map((e) => ({
      id: Number(e.id),
      title: e.title,
      startAt: e.startAt ?? e.start_time ?? null,
      location: e.location ?? "",
      capacity: e.capacity ?? null,
      remaining: e.remaining ?? e.remaining_seats ?? (e.capacity != null ? e.capacity : null),
      status: e.status ?? "",
    }));
  }

  async function fetchSafely(url: string): Promise<any> {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    if (!res.ok) {
      const msg = data?.message || `HTTP ${res.status}`;
      const code = data?.code;
      throw Object.assign(new Error(msg), { status: res.status, code });
    }
    return data;
  }

useEffect(() => {
  let cancelled = false;
  (async () => {
    setLoading(true);
    setErr(null);
    try {
      let out: Row[] | null = null;

      // 1) Try the primary route
      try {
        const data = await fetchSafely(`${API_URL}/me/events`);
        const list: Wire[] = Array.isArray(data) ? data : data?.data ?? [];
        out = normalize(list);
      } catch (_e) {
        // swallow — we'll try fallback below
       }

      // 2) Fallback if primary failed or came back empty
      if (!out || out.length === 0) {
        try {
          const alt = await fetchSafely(`${API_URL}/api/org/events?mine=1`);
          const list2: Wire[] = Array.isArray(alt) ? alt : alt?.data ?? [];
          out = normalize(list2);
        } catch (e) {
          // If even fallback fails, rethrow to surface the error
          throw e;
        }
      }

      if (!cancelled) setRows(out || []);
    } catch (e: any) {
      if (!cancelled) {
        if (e?.status === 401) setErr("Unauthorized — please log in as an organizer.");
        else if (e?.status === 403) setErr(e?.code === "FORBIDDEN" ? "Forbidden — organizer role required." : e.message || "Forbidden.");
        else setErr(e?.message || "Failed to load events.");
      }
    } finally {
      if (!cancelled) setLoading(false);
    }
  })();
  return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [token]);

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      const ta = a.startAt ? new Date(a.startAt).getTime() : 0;
      const tb = b.startAt ? new Date(b.startAt).getTime() : 0;
      return sort === "start_asc" ? ta - tb : tb - ta;
    });
    return arr;
  }, [rows, sort]);

  if (loading) return <p className="container">Loading your events…</p>;

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <header className="card-header" style={{ marginBottom: 12 }}>
        <div>
          <h1 className="h2">My Events</h1>
          <p className="muted">Create, edit, monitor, and export attendees.</p>
        </div>
        <button className="btn" onClick={() => nav("/create")}>+ Create Event</button>
      </header>

      {err && (
        <div className="card" style={{ background:"#3d1010", border:"1px solid #a43b3b", color:"#ffb5b5", marginBottom:12 }}>
          {err}
        </div>
      )}

      {!err && sorted.length === 0 && (
        <div className="card">You haven’t created any events yet.</div>
      )}

      {!err && sorted.length > 0 && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", margin:"10px 0" }}>
            <div>
              <label className="muted" style={{ marginRight: 8 }}>Sort by:</label>
              <select value={sort} onChange={(e)=>setSort(e.target.value as any)}>
                <option value="start_asc">Start Date ↑</option>
                <option value="start_desc">Start Date ↓</option>
              </select>
            </div>
          </div>

          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead style={{ background:"#202020" }}>
              <tr>
                <th style={{ textAlign:"left", padding:8 }}>Title</th>
                <th style={{ textAlign:"left", padding:8 }}>Start Time</th>
                <th style={{ textAlign:"left", padding:8 }}>Location</th>
                <th style={{ textAlign:"center", padding:8 }}>Capacity / Remaining</th>
                <th style={{ textAlign:"left", padding:8 }}>Status</th>
                <th style={{ textAlign:"left", padding:8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((e) => (
                <tr key={e.id} style={{ borderBottom:"1px solid #333" }}>
                  <td style={{ padding:8 }}>{e.title}</td>
                  <td style={{ padding:8 }}>{e.startAt ? new Date(e.startAt).toLocaleString() : "—"}</td>
                  <td style={{ padding:8 }}>{e.location || "—"}</td>
                  <td style={{ padding:8, textAlign:"center" }}>
                    {e.remaining != null && e.capacity != null
                      ? `${e.capacity - (e.remaining ?? 0)} / ${e.capacity}`
                      : e.capacity != null ? `${e.capacity}` : "—"}
                  </td>
                  <td style={{ padding:8, textTransform:"capitalize" }}>
                    <span className="badge">{e.status || "—"}</span>
                  </td>
                  <td style={{ padding:8, whiteSpace:"nowrap" }}>
                    <Link className="btn btn-ghost" to={`/organizer/events/${e.id}/edit`}>Edit</Link>{" "}
                    <Link className="btn btn-ghost" to={`/organizer/events/${e.id}/analytics`}>Analytics</Link>{" "}
                    <Link className="btn btn-ghost" to={`/events/${e.id}`}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
