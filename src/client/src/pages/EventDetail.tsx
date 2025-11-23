// src/pages/EventDetail.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import SaveButton from "../components/SaveButton";
import ClaimTicketButton from "../components/ClaimTicketButton";
import TicketConfirmationModal from "../components/TicketConfirmationModal";
import { claimTicket, ClaimTicketError, type ClaimSuccess } from "../api/claimTicket";
import EventWaitlistTab from "./EventWaitlistTab";

// Match shape coming from backend (adjust names if your API differs)
interface EventData {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  organizer: string;
  start_time: string; // ISO
  end_time: string; // ISO
  capacity: number;
  remaining_seats: number;
  ticket_type: "free" | "paid";
  is_published?: boolean;
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const DEV_USER_ID = import.meta.env.VITE_DEV_USER_ID || "1"; // dev-only auth

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // claim state
  const [claimLoading, setClaimLoading] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [ticket, setTicket] = useState<ClaimSuccess | null>(null);

  // TODO: replace this with real auth/role from context
  const userRole: string = "student";
  const isStudent = userRole === "student";
  const isOrganizer = userRole === "organizer" || userRole === "admin";
  
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErrMsg(null);
      try {
        const res = await fetch(`${BASE_URL}/events/${id}`, {
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": DEV_USER_ID, // dev-only bypass
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch event (HTTP ${res.status})`);
        }

        const data: EventData = await res.json();

        // Guard unpublished events from regular students
        if (data.is_published === false && !isOrganizer) {
          throw new Error("This event is not published.");
        }

        if (!cancelled) {
          setEvent(data);
        }
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : "Unable to load event details.";
        if (!cancelled) {
          setErrMsg(msg);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, isOrganizer]);

  async function handleClaim() {
    if (!id || claimLoading) return;
    setClaimLoading(true);
    try {
      const result = await claimTicket(Number(id));
      setTicket(result);
      setHasClaimed(true);
    } catch (e: unknown) {
      if (e instanceof ClaimTicketError) {
        alert(
          e.reason === "sold_out"
            ? "❌ This event is sold out."
            : e.reason === "already_claimed"
            ? "You already claimed a ticket."
            : "You must be signed in."
        );
      } else {
        alert("Something went wrong claiming your ticket.");
      }
    } finally {
      setClaimLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
        <div className="skeleton" style={{ height: 28, width: 320, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 16, width: "100%", marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 16, width: "90%", marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 180, width: "100%", marginTop: 16 }} />
        <style>{`
          .skeleton {
            background: linear-gradient(90deg,#2a2a2a 25%,#3a3a3a 37%,#2a2a2a 63%);
            background-size: 400% 100%;
            animation: shimmer 1.2s infinite;
            border-radius: 10px;
          }
          @keyframes shimmer {
            0% { background-position: 100% 0 }
            100% { background-position: 0 0 }
          }
        `}</style>
      </div>
    );
  }

  if (errMsg) {
    return (
      <div
        style={{
          padding: "2rem",
          maxWidth: 720,
          margin: "0 auto",
          color: "#ffb5b5",
        }}
      >
        <h2 style={{ margin: 0 }}>Unable to load event</h2>
        <p style={{ marginTop: 6, color: "#ffcccc" }}>{errMsg}</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
        <p>No event found.</p>
      </div>
    );
  }

  const soldOut = event.remaining_seats <= 0;

  function downloadIcs(ev: {
    title: string;
    start_time: string;
    end_time?: string;
    location?: string;
  }) {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Campus Events//EN",
      "BEGIN:VEVENT",
      `UID:${ev.title}-${ev.start_time}`,
      `DTSTAMP:${new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .split(".")[0]}Z`,
      `DTSTART:${ev.start_time.replace(/[-:]/g, "").split(".")[0]}Z`,
      ev.end_time
        ? `DTEND:${ev.end_time.replace(/[-:]/g, "").split(".")[0]}Z`
        : "",
      `SUMMARY:${ev.title}`,
      ev.location ? `LOCATION:${ev.location}` : "",
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .join("\r\n");

    const blob = new Blob([lines], {
      type: "text/calendar;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${ev.title}.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 820, margin: "0 auto" }}>
      <header style={{ marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>{event.title}</h1>
        <div style={{ color: "#9aa", marginTop: 6 }}>{event.category}</div>
      </header>

      <section
        style={{
          background: "#141414",
          border: "1px solid #2b2b2b",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <p style={{ marginTop: 0, lineHeight: 1.6 }}>{event.description}</p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginTop: 12,
          }}
        >
          <Info label="Location" value={event.location} />
          <Info label="Organizer" value={event.organizer} />
          <Info
            label="Starts"
            value={new Date(event.start_time).toLocaleString()}
          />
          <Info
            label="Ends"
            value={new Date(event.end_time).toLocaleString()}
          />
          <Info
            label="Capacity"
            value={`${event.capacity - event.remaining_seats}/${event.capacity} filled`}
          />
          <Info
            label="Ticket Type"
            value={event.ticket_type === "free" ? "Free" : "Paid"}
          />
        </div>

        <div
          style={{
            marginTop: 16,
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <SaveButton eventId={event.id} onChange={() => {}} />

          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => downloadIcs(event)}
          >
            Add to Calendar
          </button>

          {isStudent && (
            <ClaimTicketButton
              isEligible
              hasClaimed={hasClaimed}
              soldOut={soldOut}
              loading={claimLoading}
              onClick={handleClaim}
            />
          )}

          {(soldOut || hasClaimed) && (
            <span style={{ color: "#bbb" }}>
              {soldOut ? "❌ Sold out" : "🎟️ Ticket claimed"}
            </span>
          )}
        </div>
      </section>

      {/* Organizer-only Waitlist tab (Task-ORG-06-FE-01) */}
      {isOrganizer && (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Waitlist Management</h2>
          <EventWaitlistTab
            eventId={event.id.toString()}
            isOwner={true} // TODO: replace with real "is this user the event owner?" check
          />
        </section>
      )}

      <TicketConfirmationModal
        open={!!ticket}
        data={ticket}
        onClose={() => setTicket(null)}
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "#1b1b1b",
        border: "1px solid #2b2b2b",
        borderRadius: 8,
        padding: 10,
      }}
    >
      <div style={{ fontSize: 12, color: "#9aa" }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}
