import React, { useEffect, useRef } from "react";
import type { ClaimSuccess } from "../api/claimTicket";

type Props = {
  open: boolean;
  data: ClaimSuccess | null;
  onClose: () => void;
};

export default function TicketConfirmationModal({ open, data, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape and move focus into the dialog when it opens
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);

    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open || !data) return null;

  return (
    // Overlay
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-confirm-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 1000,
      }}
    >
      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "white",
          color: "#111",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        }}
      >
        <h2 id="ticket-confirm-title" style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
          Ticket claimed!
        </h2>
        <p style={{ marginTop: 6, color: "#555" }}>
          You successfully claimed your ticket for this event.
        </p>

        <div style={{ marginTop: 12, lineHeight: 1.6 }}>
          <div><strong>Ticket ID:</strong> {data.ticketId}</div>
          <div><strong>Event ID:</strong> {data.eventId}</div>
          <div><strong>Seat:</strong> {data.seat ?? "General Admission"}</div>
          <div><strong>Claimed at:</strong> {new Date(data.claimedAt).toLocaleString()}</div>
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <a href="/me/tickets" style={{ padding: "8px 12px", borderRadius: 12, border: "1px solid #ddd", textDecoration: "none" }}>
            View my tickets
          </a>
          <button
            onClick={onClose}
            style={{ marginLeft: "auto", padding: "8px 12px", borderRadius: 12, background: "#111", color: "white", border: "none" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
