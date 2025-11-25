// src/pages/Home.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

type CardEvent = {
  id: number;
  title: string;
  start_at?: string;
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
  const { user } = useAuth();

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(`${API}/events?status=published&limit=6`);
        const data = await res.json();
        // support either {data:[]} or just []
        const items =
          Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        if (!cancel) setEvents(items.slice(0, 6));
      } catch {
        if (!cancel) setEvents([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <main className="container">
      {/* HERO */}
      <section className="hero">
        <div>
          <p
            className="muted"
            style={{ textTransform: "uppercase", letterSpacing: ".12em", fontSize: ".75rem" }}
          >
            Campus Events Portal
          </p>
          <h1 className="h1" style={{ marginTop: 4 }}>
            Find events. Claim tickets. Show up.
          </h1>
          <p className="muted" style={{ maxWidth: 520, marginTop: 8 }}>
            Student clubs, career fairs, and faculty events in one place. Browse what&apos;s
            happening on campus and save your seat with a digital QR ticket.
          </p>
          <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link className="btn" to="/events">
              Browse Events
            </Link>
            {user && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => navigate("/me/tickets")}
              >
                View My Tickets
              </button>
            )}
          </div>
        </div>
      </section>

      {/* STRIP: three columns describing who the site is for */}
      <section
        className="card"
        style={{
          marginTop: 26,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 0,
        }}
      >
        <div className="card-body" style={{ borderRight: "1px solid rgba(255,255,255,0.03)" }}>
          <h3 className="h3">For students</h3>
          <p className="muted" style={{ marginTop: 4 }}>
            Discover what&apos;s happening after class, save events you care about, and keep your
            QR tickets in one place.
          </p>
        </div>
        <div className="card-body" style={{ borderRight: "1px solid rgba(255,255,255,0.03)" }}>
          <h3 className="h3">For organizers</h3>
          <p className="muted" style={{ marginTop: 4 }}>
            Create events, track registrations, export attendee lists, and scan tickets at the
            door.
          </p>
        </div>
        <div className="card-body">
          <h3 className="h3">For campus staff</h3>
          <p className="muted" style={{ marginTop: 4 }}>
            Monitor event requests, approve organizers, and see participation trends across
            campus.
          </p>
        </div>
      </section>

      {/* QUICK ACTION TILES */}
      <section
        className="grid"
        style={{
          marginTop: 20,
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
        }}
      >
        <article
          className="mini-card"
          role="button"
          onClick={() => navigate("/events")}
          tabIndex={0}
        >
          <h3 className="h3">Browse all events</h3>
          <p className="muted">Filters by date, category, and organization help you plan your week.</p>
        </article>

        <article
          className="mini-card"
          role="button"
          onClick={() => navigate("/me/saves")}
          tabIndex={0}
        >
          <h3 className="h3">Saved for later</h3>
          <p className="muted">Star events you&apos;re interested in so you don&apos;t lose them.</p>
        </article>

        <article
          className="mini-card"
          role="button"
          onClick={() => navigate("/me/tickets")}
          tabIndex={0}
        >
          <h3 className="h3">My tickets</h3>
          <p className="muted">
            Your QR codes and check-in history live here — perfect for showing at the door.
          </p>
        </article>

        <article
          className="mini-card"
          role="button"
          onClick={() => navigate("/organizer/events")}
          tabIndex={0}
        >
          <h3 className="h3">Host an event</h3>
          <p className="muted">
            Organizers can submit new events, manage capacity, and see who actually shows up.
          </p>
        </article>
      </section>

      {/* FEATURED / UPCOMING */}
      <section className="card" style={{ marginTop: 26, marginBottom: 32 }}>
        <header className="card-header">
          <div>
            <h2 className="h2" style={{ margin: 0 }}>
              Coming up on campus
            </h2>
            <p className="muted" style={{ marginTop: 4, fontSize: ".9rem" }}>
              A quick look at a few events from our public calendar.
            </p>
          </div>
          <Link className="btn btn-ghost" to="/events">
            See all
          </Link>
        </header>

        {loading ? (
          <div className="muted" style={{ padding: 16 }}>
            Loading events…
          </div>
        ) : events.length === 0 ? (
          <div className="muted" style={{ padding: 16 }}>
            No events yet. Check back soon!
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 12,
              padding: 16,
            }}
          >
            {events.map((ev) => {
              const dateRaw = ev.start_at ?? ev.start_time ?? ev.startAt;
              const hasDate = !!dateRaw && !Number.isNaN(Date.parse(dateRaw));
              const dateLabel = hasDate
                ? new Date(dateRaw!).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "TBA";

              return (
                <article key={ev.id} className="mini-card">
                  <Link
                    to={`/events/${ev.id}`}
                    className="link"
                    style={{ fontWeight: 600, fontSize: "1rem" }}
                  >
                    {ev.title}
                  </Link>
                  <div className="muted" style={{ marginTop: 6, fontSize: ".9rem" }}>
                    {dateLabel}
                    {ev.location && ` · ${ev.location}`}
                    {ev.category && ` · ${ev.category}`}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
