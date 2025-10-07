import { useState } from 'react'
import './App.css'
import ClaimTicketButton from './components/ClaimTicketButton'
import TicketConfirmationModal from './components/TicketConfirmationModal'
import { claimTicket } from "./api/claimTicket"

type TicketData = { ticketId: number; eventId: number; qrToken: string }


function App() {
  // choose the event ID you are showing on screen (number!)
  const eventId = 1

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [hasClaimedUI, setHasClaimedUI] = useState(false)
  const [soldOutUI, setSoldOutUI] = useState(false)
  const isEligible = true // gate with auth later

  async function handleClaimClick() {
    setMessage("")
    setLoading(true)
    try {
      const data = await claimTicket(eventId) // 🔗 real backend call
      setTicket(data)                         // { ticketId, eventId, qrToken }
      setHasClaimedUI(true)                   // ✅ disable button after success
      setMessage("Ticket claimed!")
    } catch (err: any) {
      const msg = String(err?.message || "")
      if (msg.includes("SOLD_OUT")) {
        setSoldOutUI(true)
        setMessage("Sold out ❌")
      } else if (msg.includes("ALREADY_CLAIMED")) {
        setHasClaimedUI(true)
        setMessage("You already claimed a ticket ❌")
      } else if (msg.includes("UNAUTHORIZED")) {
        setMessage("You must be signed in ❌")
      } else {
        setMessage("Something went wrong ❌")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1>Claim Ticket demo</h1>

      <ClaimTicketButton
        isEligible={isEligible}
        hasClaimed={hasClaimedUI}
        soldOut={soldOutUI}
        loading={loading}
        onClick={handleClaimClick}
      />

      {loading && <p style={{ marginTop: 8 }}>⏳ Talking to backend…</p>}
      {!loading && message && <p role="alert" style={{ marginTop: 8 }}>{message}</p>}

      {ticket && (
        <TicketConfirmationModal
          // update your modal to accept these props (see note below)
          ticketId={ticket.ticketId}
          eventId={ticket.eventId}
          qrToken={ticket.qrToken}
          onClose={() => setTicket(null)}   // ✅ just closes; does NOT claim again
        />
      )}
    </>
  )
}

export default App
