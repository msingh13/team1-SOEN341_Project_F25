import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { ClaimSuccess } from "../api/claimTicket";
// If you use React Router uncomment:
// import { Link } from "react-router-dom";

type Props = {
  open: boolean;
  data: ClaimSuccess | null;
  onClose: () => void;
};

export default function TicketConfirmationModal({ open, data, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null);

  // Lock background scroll while open
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [open]);

  // Focus management + Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        // minimal focus trap
        const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          (last as HTMLElement).focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          (first as HTMLElement).focus();
        }
      }
    };

    const prev = document.activeElement as HTMLElement | null;
    // move focus in
    setTimeout(() => firstFocusableRef.current?.focus(), 0);

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open || !data) return null;

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-confirm-title"
      aria-describedby="ticket-confirm-desc"
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
        animation: "fadeIn 120ms ease-out",
      }}
    >
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
          transform: "translateY(0)",
          animation: "popIn 140ms ease-out",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 id="ticket-confirm-title" style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
            Ticket claimed!
          </h2>
          <span aria-hidden="true">🎟️</span>
          <button
            ref={firstFocusableRef}
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              marginLeft: "auto",
              padding: "6px 10px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#f7f7f7",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        <p id="ticket-confirm-desc" style={{ marginTop: 6, color: "#555" }}>
          You successfully claimed your ticket for this event.
        </p>

        <div style={{ marginTop: 12, lineHeight: 1.6 }}>
          <div><strong>Ticket ID:</strong> {data.ticketId}</div>
          <div><strong>Event ID:</strong> {data.eventId}</div>
          <div><strong>Seat:</strong> {data.seat ?? "General Admission"}</div>
          <div><strong>Claimed at:</strong> {new Date(data.claimedAt).toLocaleString()}</div>
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          {/* If SPA: replace <a> with <Link to="/me/tickets" ref={lastFocusableRef as any}> */}
          <a
            href="/me/tickets"
            ref={lastFocusableRef as any}
            style={{
              padding: "8px 12px",
              borderRadius: 12,
              border: "1px solid #ddd",
              textDecoration: "none",
            }}
          >
            View my tickets
          </a>
        </div>
      </div>
      <style>
        {`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
        `}
      </style>
    </div>
  );

  // Render at document.body to avoid stacking/overflow issues
  return createPortal(content, document.body);
}
