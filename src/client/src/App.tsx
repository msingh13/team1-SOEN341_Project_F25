import { useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";

import "./App.css";

import ClaimTicketButton from "./components/ClaimTicketButton";
import TicketConfirmationModal from "./components/TicketConfirmationModal";
import {
  claimTicket,
  type ClaimSuccess,
  ClaimTicketError,
} from "./api/claimTicket";

import EventDetail from "./pages/EventDetail";
import OrganizerApprovalsPage from "./pages/admin/OrganizerApprovalsPage";

/* ---------- Home (pretty UI) ---------- */
function Home() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [ticket, setTicket] = useState<ClaimSuccess | null>(null);
  const navigate = useNavigate();

  // demo values
  const userRole = "student";
  const capacity = 100;
  const claimed = 72;
  const hasClaimed = false;

  const isEligible = userRole === "student";
  const soldOut = claimed >= capacity;

  const [hasClaimedUI, setHasClaimedUI] = useState(hasClaimed);
  const [soldOutUI, setSoldOutUI] = useState(soldOut);

  async function handleClaim() {
    setMsg("");
    setTicket(null);
    setLoading(true);
    try {
      const data = await claimTicket("e_demo");
      setTicket(data);
      setHasClaimedUI(true);
      setMsg("🎟️ Ticket claimed!");
      setTimeout(() => navigate(`/events/${data.eventId}`), 1000);
    } catch (err) {
      if (err instanceof ClaimTicketError) {
        if (err.reason === "sold_out") {
          setSoldOutUI(true);
          setMsg("❌ Sold out");
        } else if (err.reason === "already_claimed") {
          setHasClaimedUI(true);
          setMsg("❌ You already claimed a ticket");
        } else if (err.reason === "unauthorized") {
          setMsg("🔒 You must be signed in");
        } else {
          setMsg("❌ Something went wrong");
        }
      } else {
        setMsg("❌ Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="topnav">
        <div className="topnav-inner">
          <Link to="/" className="brand">🎓 Campus Events</Link>
          <nav className="links">
            <Link to="/">Home</Link>
            <Link to="/admin/organizers?dev=1">Admin</Link>
          </nav>
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <div>
            <h1 className="h1">Find events. Claim tickets. Go.</h1>
            <p className="muted">
              Browse by date, category, or organization and store your tickets securely.
            </p>
          </div>
          <div className="hero-actions">
            <Link className="btn" to="/events/1">Quick View: Event #1</Link>
            <Link className="btn btn-ghost" to="/admin/organizers?dev=1">
              Admin » Organizers
            </Link>
          </div>
        </section>

        <section className="card">
          <header className="card-header">
            <div>
              <h2 className="h2">Claim Ticket Demo</h2>
              <p className="muted">
                Capacity <span className="badge">{claimed}</span> / {capacity}
              </p>
            </div>
            <div className="status-wrap">
              {soldOutUI && <span className="status status-red">Sold Out</span>}
              {!soldOutUI && hasClaimedUI && (
                <span className="status status-green">Claimed</span>
              )}
              {!soldOutUI && !hasClaimedUI && <span className="status">Available</span>}
            </div>
          </header>

          <div className="card-body">
            <ClaimTicketButton
              isEligible={isEligible}
              hasClaimed={hasClaimedUI}
              soldOut={soldOutUI}
              loading={loading}
              onClick={handleClaim}
            />

            {loading && <p className="info">Talking to backend…</p>}
            {!loading && msg && (
              <p className="info" role="alert">{msg}</p>
            )}

            <TicketConfirmationModal
              open={!!ticket}
              data={ticket}
              onClose={() => setTicket(null)}
            />

            <div className="hint">
              After claiming, you’ll be redirected to the event detail page.
            </div>
          </div>
        </section>

        <section className="grid">
          <article className="mini-card">
            <h3 className="h3">Search & Filters</h3>
            <p className="muted">Filter by date, category, and organization.</p>
          </article>
          <article className="mini-card">
            <h3 className="h3">Save Events</h3>
            <p className="muted">Bookmark your favorites for later.</p>
          </article>
          <article className="mini-card">
            <h3 className="h3">QR Tickets</h3>
            <p className="muted">Unique QR for fast check-in.</p>
          </article>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <span className="muted">© {new Date().getFullYear()} Campus Events — Prototype</span>
          <a className="muted" href="https://vite.dev" target="_blank" rel="noreferrer">
            Built with Vite + React
          </a>
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
      <Route path="/events/:id" element={<EventDetail />} />
      <Route path="/admin/organizers" element={<OrganizerApprovalsPage />} />
      <Route path="*" element={<div className="container">Not Found</div>} />
    </Routes>
  );
}
