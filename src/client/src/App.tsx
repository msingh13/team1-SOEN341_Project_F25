import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Link } from "react-router-dom";
import ClaimTicketButton from './components/ClaimTicketButton';
import { claimTicket, type ClaimSuccess, ClaimTicketError } from "./api/claimTicket";
import TicketConfirmationModal from "./components/TicketConfirmationModal";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import EventDetail from "./pages/EventDetail";

// --- Home Page Component ---
function Home() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<ClaimSuccess | null>(null);
  const navigate = useNavigate(); // ✅ Hook for redirection

  // Temporary mock data
  const userRole = "student";
  const capacity = 100;
  const claimed = 99;
  const hasClaimed = false;

  const isEligible = userRole === "student";
  const soldOut = claimed >= capacity;

  const [hasClaimedUI, setHasClaimedUI] = useState(hasClaimed);
  const [soldOutUI, setSoldOutUI] = useState(soldOut);

  // Handle claim ticket logic
  async function handleClaimClick() {
    setMessage("");
    setTicket(null);
    setLoading(true);
    try {
      const data = await claimTicket("e_demo");
      setTicket(data);
      setHasClaimedUI(true);
      setMessage("Ticket claimed!");

      // ✅ Redirect to Event Detail page after success
      setTimeout(() => {
        navigate(`/events/${data.eventId}`);
      }, 1500); // slight delay for UX
    } catch (err) {
      if (err instanceof ClaimTicketError) {
        if (err.reason === "sold_out") {
          setSoldOutUI(true);
          setMessage("Sold out ❌");
        } else if (err.reason === "already_claimed") {
          setHasClaimedUI(true);
          setMessage("You already claimed a ticket ❌");
        } else if (err.reason === "unauthorized") {
          setMessage("You must be signed in ❌");
        }
      } else {
        setMessage("Something went wrong ❌");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ textAlign: "center" }}>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <h1>Vite + React</h1>
      <h2>Claim Ticket Demo</h2>

      <ClaimTicketButton
        isEligible={isEligible}
        hasClaimed={hasClaimedUI}
        soldOut={soldOutUI}
        loading={loading}
        onClick={handleClaimClick}
      />

      {loading && <p>⏳ Talking to backend…</p>}
      {!loading && message && <p role="alert">{message}</p>}

      <TicketConfirmationModal
        open={!!ticket}
        data={ticket}
        onClose={() => setTicket(null)}
      />

      {/* Manual navigation button (for testing) */}
      <div style={{ marginTop: "2rem" }}>
        <Link
          to="/events/1"
          style={{
            textDecoration: "none",
            background: "#2563eb",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
          }}
        >
          View Event Details
        </Link>
      </div>
    </div>
  );
}

// --- Main Router Wrapper ---
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events/:id" element={<EventDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
