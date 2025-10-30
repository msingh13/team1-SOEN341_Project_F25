import { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import "./App.css";

//import ClaimTicketButton from "./components/ClaimTicketButton";
import TicketConfirmationModal from "./components/TicketConfirmationModal";

// type-only imports to satisfy verbatimModuleSyntax
import type { ClaimSuccess, SavedEventWire, EventItem } from "./lib/api";
import {
  listEvents,
  listSavedEvents,
  listTickets,
  claimTicket,
  saveToCalendar,
} from "./lib/api";

import EventsList from "./pages/EventsList";
import EventDetails from "./pages/EventDetail";
import OrganizerApprovalsPage from "./pages/admin/OrganizerApprovalsPage";
import { QRCodeCanvas } from "qrcode.react";

/* ---------- Home ---------- */
function Home() {
  const navigate = useNavigate();

  // mini data for the three boxes
  const [featured, setFeatured] = useState<EventItem[]>([]);
  const [saved, setSaved] = useState<SavedEventWire[]>([]);
  const [tickets, setTickets] = useState<ClaimSuccess[]>([]);
  const [loading, setLoading] = useState(true);

  // claim demo on hero card (optional)
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [ticketModal, setTicketModal] = useState<ClaimSuccess | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const ev = await listEvents({ limit: 50 });
        const sv = await listSavedEvents();
        const tk = await listTickets();
        if (!cancel) {
          setFeatured(ev.items.slice(0, 6));
          setSaved(sv.items);
          setTickets(tk.tickets);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  async function onQuickClaim() {
    // claim the first event as a quick demo
    if (!featured.length) return;
    const id = featured[0].id;
    setBusy(true);
    setMsg("");
    try {
      const t = await claimTicket(id);
      setTicketModal(t);
      setMsg("🎟️ Ticket claimed!");
      // refresh tickets list
      const tk = await listTickets();
      setTickets(tk.tickets);
      setTimeout(() => navigate(`/events/${id}`), 900);
    } catch (e: any) {
      setMsg(e?.message || "Failed to claim.");
    } finally {
      setBusy(false);
    }
  }

  async function onSave(id: string) {
    await saveToCalendar(id);
    const sv = await listSavedEvents();
    setSaved(sv.items);
  }

  return (
    <>
      <header className="topnav">
        <div className="topnav-inner">
          <Link to="/" className="brand">🎓 Campus Events</Link>
          <nav className="links">
            <Link to="/">Home</Link>
            <Link to="/events">Events</Link>
            <Link to="/admin/organizers?dev=1">Admin</Link>
          </nav>
        </div>
      </header>

      <main className="container">
        {/* Hero */}
        <section className="hero">
          <div>
            <h1 className="h1">Find events. Claim tickets. Go.</h1>
            <p className="muted">Browse by date, category, or organization and store your tickets securely.</p>
          </div>
          <div className="hero-actions">
            <Link className="btn" to="/events">Browse Events</Link>
            <button className="btn btn-ghost" onClick={onQuickClaim} disabled={busy || loading}>
              {busy ? "Claiming…" : "Quick claim first event"}
            </button>
          </div>
        </section>

        {/* Three-column summary */}
        <section className="grid3">
          {/* 1) Featured events */}
          <article className="mini-card">
            <div className="mini-header">
              <h3 className="h3">Events</h3>
              <Link className="muted" to="/events">View all →</Link>
            </div>
            {loading ? (
              <p className="muted">Loading…</p>
            ) : featured.length === 0 ? (
              <p className="muted">No events yet.</p>
            ) : (
              <ul className="mini-list">
                {featured.slice(0, 4).map((e) => (
                  <li key={e.id}>
                    <Link to={`/events/${e.id}`}>{e.title}</Link>
                    <div className="mini-sub">
                      {new Date(e.start_time).toLocaleString()} · {e.location}
                    </div>
                    <div className="mini-cta">
                      <button className="linklike" onClick={() => onSave(e.id)}>Save</button>
                      <button className="linklike" onClick={() => navigate(`/events/${e.id}`)}>View</button>
                    </div>
                  </li>
                ))}
              </ul> 
            )}
          </article>

          {/* 2) Saved (personal calendar) */}
          <article className="mini-card">
            <div className="mini-header">
              <h3 className="h3">Saved Events</h3>
              <span className="muted">{saved.length}</span>
            </div>
            {loading ? (
              <p className="muted">Loading…</p>
            ) : saved.length === 0 ? (
              <p className="muted">Nothing saved yet. Click “Save” on an event.</p>
            ) : (
              <ul className="mini-list">
                {saved.slice(0, 5).map((s) => (
                  <li key={s.id}>
                    <Link to={`/events/${s.id}`}>{s.title}</Link>
                    <div className="mini-sub">
                      {s.start_time ? new Date(s.start_time).toLocaleString() : "TBA"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>

          {/* 3) Tickets (QR codes) */}
          <article className="mini-card">
            <div className="mini-header">
              <h3 className="h3">My Tickets (QR)</h3>
              <span className="muted">{tickets.length}</span>
            </div>
            {loading ? (
              <p className="muted">Loading…</p>
            ) : tickets.length === 0 ? (
              <p className="muted">No tickets yet. Claim one from an event.</p>
            ) : (
              <ul className="qr-grid">
                {tickets.slice(0, 6).map((t) => (
                  <li key={t.ticketId} title={`Ticket ${t.ticketId}`}>
                    <QRCodeCanvas value={t.qr} size={92} includeMargin />
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        {/* Inline feedback for quick-claim */}
        {msg && <p className="info" role="alert" style={{ marginTop: 12 }}>{msg}</p>}

        {/* Claim modal */}
        <TicketConfirmationModal
          open={!!ticketModal}
          data={ticketModal}
          onClose={() => setTicketModal(null)}
        />
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <span className="muted">© {new Date().getFullYear()} Campus Events — Prototype</span>
        </div>
      </footer>
    </>
  );
}

/* ---------- Routes ---------- */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/events" element={<EventsList />} />
      <Route path="/events/:id" element={<EventDetails />} />
      <Route path="/admin/organizers" element={<OrganizerApprovalsPage />} />
      <Route path="*" element={<div className="container">Not Found</div>} />
    </Routes>
  );
}
