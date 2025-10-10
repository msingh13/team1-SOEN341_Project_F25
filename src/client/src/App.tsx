import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ClaimTicketButton from './components/ClaimTicketButton';
import { claimTicket, type ClaimSuccess, ClaimTicketError } from "./api/claimTicket";
import TicketConfirmationModal from "./components/TicketConfirmationModal";


function App() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<ClaimSuccess | null>(null);

  // 1) Define your demo values FIRST
  const userRole = "student";   // try "guest"
  const capacity = 100;
  const claimed = 99;           // set to 100 to see "Sold out"
  const hasClaimed = false;     // set true to see "Already claimed"
  //const eventId = "e_demo";     // try "e_demo_sold", "e_demo_dup", "e_demo_unauth"

  const isEligible = userRole === "student";
  const soldOut = claimed >= capacity;

  // 2) THEN make UI state that uses them
  const [hasClaimedUI, setHasClaimedUI] = useState(hasClaimed);
  const [soldOutUI, setSoldOutUI] = useState(soldOut);

async function handleClaimClick() {
  setMessage("");
  setTicket(null);
  setLoading(true);
  try {
    const data = await claimTicket(eventId);
    setTicket(data);
    setHasClaimedUI(true);                 // ⬅️ after success, disable button
    setMessage("Ticket claimed!");
  } catch (err) {
    if (err instanceof ClaimTicketError) {
      if (err.reason === "sold_out") {
        setSoldOutUI(true);                // ⬅️ disable as Sold out
        setMessage("Sold out ❌");
      } else if (err.reason === "already_claimed") {
        setHasClaimedUI(true);             // ⬅️ disable as Already claimed
        setMessage("You already claimed a ticket ❌");
      } else if (err.reason === "unauthorized") {
        setMessage("You must be signed in ❌"); // keep enabled so they can try after sign-in
      }
    } else {
      setMessage("Something went wrong ❌");
    }
  } finally {
    setLoading(false);
  }
}

type Variant = "success" | "sold" | "dup" | "unauth";

const [variant, setVariant] = useState<Variant>("success");

const eventIdMap = {
  success: "e_demo",
  sold: "e_demo_sold",
  dup: "e_demo_dup",
  unauth: "e_demo_unauth",
} as const;

const eventId = eventIdMap[variant]; // <-- use this in handleClaimClick

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <h2>Claim Ticket demo</h2>
      <ClaimTicketButton
        isEligible={isEligible}
        hasClaimed={hasClaimedUI}   // ⬅️ use UI state
        soldOut={soldOutUI}         // ⬅️ use UI state
        loading={loading}
        onClick={handleClaimClick}
      />

      
      {loading && <p style={{ marginTop: 8 }}>⏳ Talking to backend…</p>}
      {!loading && message && <p role="alert" style={{ marginTop: 8 }}>{message}</p>}

      <TicketConfirmationModal
        open={!!ticket}
        data={ticket}
        onClose={() => setTicket(null)}
      />


      {ticket && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
          <strong>Ticket claimed!</strong>
          <div>Ticket ID: {ticket.ticketId}</div>
          <div>Event ID: {ticket.eventId}</div>
          <div>Seat: {ticket.seat ?? "General Admission"}</div>
          <div>Claimed at: {new Date(ticket.claimedAt).toLocaleString()}</div>
          <a href="/me/tickets" style={{ display: "inline-block", marginTop: 8 }}>View my tickets</a>
      </div>
    )}
      
      <hr />
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
