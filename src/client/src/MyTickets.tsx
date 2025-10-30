import { useEffect, useState } from "react";
import { listMyTickets } from "./lib/api";
import type { ClaimSuccess } from "./lib/api";
import { QRCodeCanvas } from "qrcode.react";

export default function MyTickets() {
  const [tickets, setTickets] = useState<ClaimSuccess[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { tickets } = await listMyTickets();
        setTickets(tickets);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <main className="container" style={{ paddingTop: 24 }}>Loading…</main>;

  return (
    <main className="container" style={{ paddingTop: 24 }}>
      <h2>My Tickets</h2>
      {tickets.length === 0 ? (
        <p className="muted">You have no tickets yet. Claim one from an event page.</p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {tickets.map((t) => {
            const payload = JSON.stringify({ ticketId: t.ticketId, eventId: t.eventId, at: t.claimedAt });
            return (
              <div key={t.ticketId} style={{ background: "#1a1a1a", padding: 12, borderRadius: 12, border: "1px solid #2a2a2a", width: 240 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{t.eventId}</div>
                <div style={{ background: "white", padding: 8, borderRadius: 8, textAlign: "center" }}>
                  <QRCodeCanvas value={payload} size={160} includeMargin />
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: "#bbb" }}>
                  Ticket: {t.ticketId}<br />Claimed: {new Date(t.claimedAt).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
