import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { listEvents } from "../lib/api";
import type {EventItem} from "../lib/api";
import EventCard from "./EventCard";

const DEFAULT_LIMIT = 12;

export default function EventsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<EventItem[]>([]);
  const [total, setTotal] = useState(0);
  const [options] = useState({
    categories: ["Academic", "Sports", "Club", "Career", "Social"],
    orgs: ["CSU", "ECA", "IEEE", "CASA", "Sports Union", "Robotics Club"],
  });

  const params = useMemo(() => {
    const obj: Record<string, any> = Object.fromEntries(searchParams.entries());
    const cats = searchParams.getAll("category");
    if (cats.length) obj.category = cats;
    obj.page = Number(obj.page || 1);
    obj.limit = Number(obj.limit || DEFAULT_LIMIT);
    return obj;
  }, [searchParams]);

  function updateParams(next: Record<string, any>) {
    const merged = { ...params, ...next };
    const sp = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => {
      if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) return;
      if (Array.isArray(v)) v.forEach((val) => sp.append(k, String(val)));
      else sp.set(k, String(v));
    });
    setSearchParams(sp, { replace: true });
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await listEvents({
          q: params.q,
          org: params.org,
          from: params.from,
          to: params.to,
          page: params.page,
          limit: params.limit,
          category: params.category,
        });
        if (!cancelled) {
          setItems(data.items || []);
          setTotal(data.total ?? 0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.q, params.org, params.from, params.to, params.page, params.limit, params.category]);

  const page = Number(params.page || 1);
  const limit = Number(params.limit || DEFAULT_LIMIT);
  const totalPages = Math.max(1, Math.ceil((total || 0) / (limit || DEFAULT_LIMIT)));

  return (
    <section className="container" style={{ paddingTop: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2>Events</h2>
        <Link to="/" className="muted">← Back to Home</Link>
      </div>

      <form className="filters" style={{ display: "grid", gap: 12, margin: "12px 0" }} onSubmit={(e) => e.preventDefault()}>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 200px 200px 200px" }}>
          <input placeholder="Keyword…" value={params.q || ""} onChange={(e) => updateParams({ q: e.target.value, page: 1 })} />
          <select value={params.org || ""} onChange={(e) => updateParams({ org: e.target.value || undefined, page: 1 })}>
            <option value="">All orgs</option>
            {options.orgs.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <input type="date" value={params.from || ""} onChange={(e) => updateParams({ from: e.target.value || undefined, page: 1 })} />
          <input type="date" value={params.to || ""} onChange={(e) => updateParams({ to: e.target.value || undefined, page: 1 })} />
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {options.categories.map((cat) => {
            const selected = Array.isArray(params.category) ? params.category.includes(cat) : params.category === cat;
            return (
              <label key={cat} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={!!selected}
                  onChange={() => {
                    const current = new Set<string>(
                      Array.isArray(params.category) ? params.category : params.category ? [params.category] : []
                    );
                    current.has(cat) ? current.delete(cat) : current.add(cat);
                    updateParams({ category: Array.from(current), page: 1 });
                  }}
                />
                <span>{cat}</span>
              </label>
            );
          })}
          <button type="button" className="btn btn-ghost" onClick={() => updateParams({ page: 1, limit: params.limit ?? DEFAULT_LIMIT })}>
            Clear
          </button>
        </div>
      </form>

      {loading ? (
        <div role="status" aria-live="polite">
          <div className="skeleton" style={{ height: 120, margin: "12px 0" }} />
          <div className="skeleton" style={{ height: 120, margin: "12px 0" }} />
          <div className="skeleton" style={{ height: 120, margin: "12px 0" }} />
          <span className="sr-only">Loading events…</span>
        </div>
      ) : items.length === 0 ? (
        <p role="status" aria-live="polite">No events match your filters.</p>
      ) : (
        <>
          <div className="grid" role="region" aria-live="polite" aria-label="Event results"
               style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", marginTop: 8 }}>
            {items.map((ev) => <EventCard key={ev.id} event={ev} />)}
          </div>

          <nav className="pagination" aria-label="Pagination" style={{ marginTop: 12 }}>
            <button disabled={page <= 1} onClick={() => updateParams({ page: Math.max(1, page - 1) })}>Previous</button>
            <span style={{ padding: "0 8px" }}>Page {page} of {totalPages} — {total} results</span>
            <button disabled={page >= totalPages} onClick={() => updateParams({ page: Math.min(totalPages, page + 1) })}>Next</button>
          </nav>
        </>
      )}
    </section>
  );
}
