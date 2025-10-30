import { useEffect, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import type { ClaimSuccess } from "../api/claimTicket";

type Props = {
  open: boolean;
  data: ClaimSuccess | null;
  onClose: () => void;
};

export default function TicketConfirmationModal({ open, data, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

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

  // Unique payload you’ll show at the door scanner
  const qrPayload = JSON.stringify({
    v: 1,
    type: "ticket",
    ticketId: data.ticketId,
    eventId: data.eventId,
    ts: data.claimedAt,
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-confirm-title"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, zIndex: 1000,
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 520, background: "white", color: "#111",
          borderRadius: 16, padding: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        }}
      >
        <h2 id="ticket-confirm-title" style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
          Ticket claimed!
        </h2>
        <p style={{ marginTop: 6, color: "#555" }}>
          Show this QR at the entrance. A copy is also in <strong>Saved</strong>.
        </p>

        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          <div><strong>Ticket ID:</strong> {data.ticketId}</div>
          <div><strong>Event ID:</strong> {data.eventId}</div>
          <div><strong>Claimed at:</strong> {new Date(data.claimedAt).toLocaleString()}</div>
          {data.seat && <div><strong>Seat:</strong> {data.seat}</div>}
        </div>

        <div style={{
          marginTop: 14, display: "flex", justifyContent: "center",
          background: "#fff", padding: 12, borderRadius: 12, border: "1px solid #eee"
        }}>
          <QRCodeCanvas value={qrPayload} size={180} includeMargin />
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <a href="/saved" style={{ padding: "8px 12px", borderRadius: 12, border: "1px solid #ddd", textDecoration: "none" }}>
            View Saved
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
