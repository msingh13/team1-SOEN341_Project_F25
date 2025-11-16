// src/pages/BrowseEvents.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

type Wire = {
  id: number;
  title: string;
  description?: string | null;
  location?: string | null;
  category?: string | null;
  organizer?: string | null;
  org_name?: string | null;
  org_id?: number | string | null;
  start_at?: string | null;
  start_time?: string | null;
  end_at?: string | null;
  end_time?: string | null;
  status?: string | null;        // 'draft'|'submitted'|'published'|'rejected'
  is_published?: boolean | null; // sometimes boolean
  capacity?: number | null;
  remaining?: number | null;
  remaining_seats?: number | null;
};

type Item = {
  id: number;
  title: string;
  description: string;
  location: string;
  category: string;
  orgName: string;
  startISO: string | null;
  endISO: string | null;
  status: string;
  capacity: number | null;
  remaining: number | null;
};

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

function normalize(w: Wire): Item {
  const start = w.start_at ?? w.start_time ?? null;
  const end = w.end_at ?? w.end_time ?? null;
  const status =
    typeof w.is_published === "boolean"
      ? (w.is_published ? "published" : "draft")
      : (w.status ?? "published");
  return {
    id: w.id,
    title: w.title,
    description: (w.description ?? "") || "",
    location: (w.location ?? "") || "TBA",
    category: (w.category ?? "") || "General",
    orgName: (w.org_name ?? w.organizer ?? "") || "",
    startISO: start,
    endISO: end,
    status,
    capacity: w.capacity ?? null,
    remaining: (w.remaining_seats ?? w.remaining) ?? null,
  };
}

export default function BrowseEvents() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // simple local filters
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [org, setOrg] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      // Public browse MUST NOT send Authorization; some servers 401 Bearer garbage.
      const res = await fetch(`${API}/events?limit=100`);
      const raw = await res.json();
      if (!res.ok) throw new Error(raw?.message || `HTTP ${res.status}`);

      // support either {items:[...]} or [...]
      const list: Wire[] = Array.isArray(raw) ? raw : (raw.items ?? raw.data ?? []);
      const mapped = list.map(normalize);

      // If backend returns everything (incl. drafts), keep only published here.
      const visible = mapped.filter((e) => e.status === "published");
      setItems(visible);
    } catch (e: any) {
      setErr(e?.message || "Failed to load events");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const qlc = q.trim().toLowerCase();
    const fromTs = from ? Date.parse(from) : NaN;
    const toTs = to ? Date.parse(to) : NaN;

    return items.filter((e) => {
      if (qlc) {
        const hay =
          `${e.title} ${e.description} ${e.location} ${e.category} ${e.orgName}`.toLowerCase();
        if (!hay.includes(qlc)) return false;
      }
      if (cat && e.category.toLowerCase() !== cat.toLowerCase()) return false;
      if (org && e.orgName.toLowerCase() !== org.toLowerCase()) return false;

      if (fromTs && e.startISO) {
        const st = Date.parse(e.startISO);
        if (!isNaN(st) && st < fromTs) return false;
      }
      if (toTs && e.startISO) {
        const st = Date.parse(e.startISO);
        if (!isNaN(st) && st > toTs) return false;
      }
      return true;
    });
  }, [items, q, cat, org, from, to]);

  return (
    <div className="container" style={{ padding: 24 }}>
      <header style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Browse Events</h2>
        <p className="muted" style={{ marginTop: 6 }}>Search, filter, and explore upcoming events.</p>
      </header>

      <div className="card" style={{ padding: 12, display: "grid", gap: 8 }}>
        <input
          placeholder="Search title, org, location…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #333", background: "#1c1c1c", color: "#fff" }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 8 }}>
          <input placeholder="Category (optional)" value={cat} onChange={(e) => setCat(e.target.value)}
                 style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #333", background: "#1c1c1c", color: "#fff" }} />
          <input placeholder="Organization (optional)" value={org} onChange={(e) => setOrg(e.target.value)}
                 style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #333", background: "#1c1c1c", color: "#fff" }} />
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                 style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #333", background: "#1c1c1c", color: "#fff" }} />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                 style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #333", background: "#1c1c1c", color: "#fff" }} />
        </div>
        <div>
          <button className="btn btn-ghost" onClick={() => { setQ(""); setCat(""); setOrg(""); setFrom(""); setTo(""); }}>
            Clear
          </button>
          <button className="btn" onClick={load} style={{ marginLeft: 8 }}>Refresh</button>
        </div>
      </div>

      {loading && <p style={{ padding: 12 }}>Loading…</p>}
      {err && <p role="alert" style={{ padding: 12, color: "tomato" }}>{err}</p>}

      {!loading && !err && (
        filtered.length === 0 ? (
          <p style={{ padding: 16, color: "#9aa" }}>No events found.</p>
        ) : (
          <div style={{
            marginTop: 12, display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 12
          }}>
            {filtered.map((e) => (
              <article key={e.id} className="card" style={{ padding: 12 }}>
                <h3 style={{ margin: 0 }}>{e.title}</h3>
                <div className="muted" style={{ marginTop: 4 }}>
                  {e.category}{e.orgName ? ` · ${e.orgName}` : ""}
                </div>
                <div style={{ fontSize: 13, color: "#9aa", marginTop: 8 }}>
                  <div><b>Starts:</b> {e.startISO ? new Date(e.startISO).toLocaleString() : "TBA"}</div>
                  <div><b>Location:</b> {e.location}</div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <Link className="btn" to={`/events/${e.id}`}>View details</Link>
                </div>
              </article>
            ))}
          </div>
        )
      )}
    </div>
  );
}
