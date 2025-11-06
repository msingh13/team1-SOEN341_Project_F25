// src/pages/EventsList.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

type EventRow = {
  id: number;
  title: string;
  description?: string | null;
  category?: string | null;
  organizer?: string | null;
  location?: string | null;
  start_at: string;
  end_at?: string | null;
  capacity: number;
  tickets_claimed: number;
  remaining_seats: number;
};

type ApiResponse = {
  data: EventRow[];
  pagination: { page: number; perPage: number; total: number; totalPages: number };
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function qs(params: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === null || v === undefined || v === "") return;
    if (Array.isArray(v)) v.forEach((x) => sp.append(k, String(x)));
    else sp.set(k, String(v));
  });
  return sp.toString();
}

export default function EventsList() {
  const [sp, setSp] = useSearchParams();
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const page = Math.max(1, Number(sp.get("page") || 1));
  const perPage = Math.min(50, Math.max(1, Number(sp.get("perPage") || 12)));
  const sort = sp.get("sort") || "created_desc";
  const q = sp.get("q") || "";
  const category = sp.getAll("category");
  const org = sp.get("org") || "";
  const dateFrom = sp.get("dateFrom") || "";
  const dateTo = sp.get("dateTo") || "";

  const [totalPages, setTotalPages] = useState(1);

  function setParam(name: string, value: string | null) {
    const next = new URLSearchParams(sp);
    if (value && value.trim()) next.set(name, value);
    else next.delete(name);
    next.set("page", "1");
    setSp(next);
  }
  function toggleCategory(name: string) {
    const next = new URLSearchParams(sp);
    const all = next.getAll("category");
    if (all.includes(name)) {
      next.delete("category");
      all.filter((c) => c !== name).forEach((c) => next.append("category", c));
    } else {
      next.append("category", name);
    }
    next.set("page", "1");
    setSp(next);
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const query = qs({
        page,
        perPage,
        sort,
        q: q.trim() || undefined,
        category: category.length ? category : undefined,
        org: org || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      const res = await fetch(`${API_URL}/events?${query}`);
      const data: ApiResponse = await res.json();
      if (!res.ok) throw new Error("Failed to load events");
      setRows(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (e: any) {
      setErr(e.message || "Failed to load events");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, sort, q, org, dateFrom, dateTo, JSON.stringify(category)]);

  const pageCategories = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => r.category && s.add(r.category));
    return Array.from(s).sort();
  }, [rows]);

  return (
    <div className="container" style={{ padding: 24 }}>
      <header className="page-head">
        <div>
          <h1 className="h2">Browse Events</h1>
          <p className="muted">Search, filter, and explore upcoming events.</p>
        </div>
        <div className="sort-wrap">
          <label className="muted" htmlFor="sort">Sort</label>
          <select id="sort" value={sort} onChange={(e) => setParam("sort", e.target.value)} className="select sm">
            <option value="created_desc">Recently Added</option>
            <option value="start_asc">Start Date ↑</option>
            <option value="start_desc">Start Date ↓</option>
          </select>
        </div>
      </header>

      {/* Sticky filter bar */}
      <section className="filter-bar">
        <input
          className="input"
          placeholder="Search title or description…"
          defaultValue={q}
          onKeyDown={(e) => {
            if (e.key === "Enter") setParam("q", (e.target as HTMLInputElement).value);
          }}
        />
        <input
          className="input"
          type="date"
          defaultValue={dateFrom}
          onChange={(e) => setParam("dateFrom", e.target.value)}
        />
        <input
          className="input"
          type="date"
          defaultValue={dateTo}
          onChange={(e) => setParam("dateTo", e.target.value)}
        />
        <input
          className="input"
          placeholder="Org ID"
          defaultValue={org}
          onChange={(e) => setParam("org", e.target.value)}
        />
        <button
          className="btn ghost"
          onClick={() => {
            const next = new URLSearchParams();
            next.set("page", "1");
            setSp(next);
          }}
        >
          Clear
        </button>
      </section>

      {/* Category chips */}
      {pageCategories.length > 0 && (
        <div className="chip-row">
          {pageCategories.map((c) => {
            const active = sp.getAll("category").includes(c);
            return (
              <button
                key={c}
                onClick={() => toggleCategory(c)}
                className={`chip ${active ? "chip-on" : ""}`}
                title={active ? "Remove filter" : "Filter by category"}
              >
                {c}
              </button>
            );
          })}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <GridSkeleton />
      ) : err ? (
        <div className="alert error">{err}</div>
      ) : rows.length === 0 ? (
        <div className="empty">
          <h3>No events match your filters</h3>
          <p className="muted">Try clearing filters or searching a different term.</p>
          <button className="btn" onClick={() => setParam("q", "")}>Reset</button>
        </div>
      ) : (
        <div className="grid-events">
          {rows.map((ev) => {
            const claimed = ev.tickets_claimed ?? 0;
            const cap = Math.max(0, ev.capacity ?? 0);
            const pct = cap ? Math.min(100, Math.round((claimed / cap) * 100)) : 0;
            const soldOut = ev.remaining_seats <= 0;

            return (
              <article key={ev.id} className="event-card">
                <header className="event-card__head">
                  <h3 className="event-title">
                    <Link to={`/events/${ev.id}`}>{ev.title}</Link>
                  </h3>
                  <span className={`pill ${soldOut ? "pill-red" : "pill-green"}`}>
                    {soldOut ? "Sold out" : "Available"}
                  </span>
                </header>

                <div className="event-meta">
                  {ev.category && <span className="mini-chip">{ev.category}</span>}
                  {ev.organizer && <span className="muted sep">{ev.organizer}</span>}
                </div>

                <dl className="event-dl">
                  <div>
                    <dt>Starts</dt>
                    <dd>{new Date(ev.start_at).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>Location</dt>
                    <dd>{ev.location || "TBA"}</dd>
                  </div>
                </dl>

                <div className="capacity">
                  <div className="capacity-line">
                    <div className="capacity-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="capacity-text">
                    {claimed}/{cap} claimed
                  </div>
                </div>

                <footer className="card-actions">
                  <Link to={`/events/${ev.id}`} className="btn">View details</Link>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="pager">
        <button
          className="btn ghost"
          onClick={() => setParam("page", String(Math.max(1, page - 1)))}
          disabled={page <= 1}
        >
          Prev
        </button>
        <span className="muted">{page} / {totalPages}</span>
        <button
          className="btn ghost"
          onClick={() => setParam("page", String(Math.min(totalPages, page + 1)))}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* ---------- tiny skeleton loader ---------- */
function GridSkeleton() {
  return (
    <div className="grid-events">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skel-card" />
      ))}
    </div>
  );
}
