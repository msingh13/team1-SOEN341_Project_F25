import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listSavedEvents, normalizeEventId } from "../lib/api";
import type {EventItem} from "../lib/api";


export default function SavedEvents() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const items = await listSavedEvents();
        setEvents(items);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <main className="container" style={{ paddingTop: 24 }}>Loading…</main>;

  return (
    <main className="container" style={{ paddingTop: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2>Saved Events</h2>
        <Link to="/events" className="muted">← Back to Events</Link>
      </div>

      {events.length === 0 ? (
        <p className="muted">You haven't saved any events yet.</p>
      ) : (
        <div className="grid" role="region" aria-live="polite" aria-label="Saved events"
             style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", marginTop: 8 }}>
          {events.map((e) => (
            <article key={e.id} className="event-card" style={{ background: "#1a1a1a", padding: 12, borderRadius: 10, border: "1px solid #2a2a2a" }}>
              <h3 style={{ margin: 0 }}>
                <Link to={`/events/${normalizeEventId(e.id)}`} style={{ color: "white", textDecoration: "none" }}>
                  {e.title}
                </Link>
              </h3>
              <p style={{ marginTop: 6, color: "#bbb" }}>
                <strong>Date/Time:</strong> {new Date(e.start_time).toLocaleString()}
              </p>
              <p style={{ marginTop: 2, color: "#bbb" }}>
                <strong>Location:</strong> {e.location || "TBA"}
              </p>
              <p style={{ marginTop: 2, color: "#888" }}>
                <strong>Category:</strong> {e.category || "—"} · <strong>Organizer:</strong> {e.organizer || "—"}
              </p>
              <div style={{ marginTop: 10 }}>
                <Link className="btn btn-sm" to={`/events/${normalizeEventId(e.id)}`}>View</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
