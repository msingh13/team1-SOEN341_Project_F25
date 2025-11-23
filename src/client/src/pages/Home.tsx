// src/pages/Home.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type CardEvent = {
  id: number;
  title: string;
  start_time?: string;
  startAt?: string;
  location?: string;
  category?: string;
};

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function Home() {
  const [events, setEvents] = useState<CardEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        // Public feed — adjust to your browse endpoint
        const res = await fetch(`${API}/events?status=published&limit=6`);
        const data = await res.json();
        if (!cancel) setEvents(Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data.slice(0,6) : []));
      } catch {
        if (!cancel) setEvents([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  return (
    <main className="container">
      {/* hero */}
      <section className="hero">
        <div>
          <h1 className="h1">Find events. Claim tickets. Go.</h1>
          <p className="muted">Browse by date, category, or organization and store your tickets securely.</p>
        </div>
        <div className="hero-actions">
          <Link className="btn" to="/events">Browse Events</Link>
        </div>
      </section>

      {/* feature tiles */}
      <section className="grid" style={{ marginTop: 16 }}>
        <article className="mini-card" role="button" onClick={() => navigate("/events")} tabIndex={0}>
          <h3 className="h3">Events</h3>
          <p className="muted">See what’s happening across campus.</p>
        </article>
        <article className="mini-card" role="button" onClick={() => navigate("/me/saves")} tabIndex={0}>
          <h3 className="h3">Saved Events</h3>
          <p className="muted">Bookmark your favorites for later.</p>
        </article>
        <article className="mini-card" role="button" onClick={() => navigate("/events")} tabIndex={0}>
          <h3 className="h3">Search & Filters</h3>
          <p className="muted">Filter by date, category, and organization.</p>
        </article>
        <article className="mini-card" role="button" onClick={() => navigate("/me/tickets")} tabIndex={0}>
          <h3 className="h3">QR Tickets</h3>
          <p className="muted">Unique QR for fast check-in.</p>
        </article>
      </section>

      {/* quick list */}
      <section className="card" style={{ marginTop: 18 }}>
        <header className="card-header">
          <h2 className="h2" style={{ margin: 0 }}>Featured</h2>
          <Link className="btn btn-ghost" to="/events">See all</Link>
        </header>
        {loading ? (
          <div className="muted" style={{ padding: 12 }}>Loading events…</div>
        ) : events.length === 0 ? (
          <div className="muted" style={{ padding: 12 }}>No events yet. Check back soon!</div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 12,
              padding: 12,
            }}
          >
            {events.map(ev => (
              <article key={ev.id} className="mini-card">
                <Link to={`/events/${ev.id}`} className="link" style={{ fontWeight: 700 }}>
                  {ev.title}
                </Link>
                <div className="muted" style={{ marginTop: 6 }}>
                  {new Date(ev.start_time ?? ev.startAt ?? "").toLocaleString() || "TBA"}
                  {ev.location ? ` • ${ev.location}` : ""}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
