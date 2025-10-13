import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

// Define the structure of the event data fetched from the backend
interface EventData {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  organizer: string;
  start_time: string;
  end_time: string;
  capacity: number;
  remaining_seats: number;
  ticket_type: "free" | "paid";
  is_published?: boolean;
}

export default function EventDetail() {
  const { id } = useParams(); // Get event ID from the URL
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);

  // Temporary hardcoded user role (to be replaced with actual user context later)
  const userRole = "student";
  const isStudent = userRole === "student";

  // Fetch event details from backend
  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`http://localhost:3000/events/${id}`);
        if (!res.ok) throw new Error("Event not found");

        const data: EventData = await res.json();

        // Handle unpublished events
        if (!data.is_published) {
          throw new Error("Unpublished event");
        }

        setEvent(data);
      } catch (err: any) {
        setError(err.message || "Unable to load event details.");
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [id]);

  // Handle loading and error states
  if (loading) return <p>Loading event details...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!event) return <p>No event found.</p>;

  const soldOut = event.remaining_seats <= 0;

  // Save event locally (temporary mock)
  function handleSave() {
    setIsSaved(true);
    alert("✅ Event saved to your list!");
  }

  // Claim ticket (temporary mock)
  function handleClaim() {
    setIsClaimed(true);
    alert("🎟️ Ticket claimed successfully!");
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "700px", margin: "0 auto" }}>
      {/* Event information */}
      <h1>{event.title}</h1>
      <p>{event.description}</p>

      <div style={{ marginTop: "1rem" }}>
        <p><strong>Category:</strong> {event.category}</p>
        <p><strong>Location:</strong> {event.location}</p>
        <p><strong>Organizer:</strong> {event.organizer}</p>
        <p><strong>Start:</strong> {new Date(event.start_time).toLocaleString()}</p>
        <p><strong>End:</strong> {new Date(event.end_time).toLocaleString()}</p>
        <p>
          <strong>Remaining Seats:</strong> {event.remaining_seats} / {event.capacity}
        </p>
        <p><strong>Ticket Type:</strong> {event.ticket_type}</p>
      </div>

      {/* Buttons section */}
      <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
        {/* Save button (visible to all users) */}
        {!isSaved && (
          <button
            style={{
              padding: "0.5rem 1rem",
              background: "#2563eb",
              color: "white",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
            onClick={handleSave}
          >
            Save
          </button>
        )}

        {/* Claim button (only for students and if not sold out) */}
        {isStudent && !soldOut && !isClaimed && (
          <button
            style={{
              padding: "0.5rem 1rem",
              background: "#7c3aed",
              color: "white",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
            onClick={handleClaim}
          >
            Claim Ticket
          </button>
        )}

        {/* Disabled state if already claimed or sold out */}
        {(soldOut || isClaimed) && (
          <p style={{ color: "gray", marginTop: "0.5rem" }}>
            {soldOut
              ? "❌ This event is sold out."
              : "🎟️ You have already claimed this ticket."}
          </p>
        )}
      </div>
    </div>
  );
}
