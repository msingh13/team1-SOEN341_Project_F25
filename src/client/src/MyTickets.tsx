import { useEffect, useState } from "react";

type TicketRow = {
  ticket_id: number;
  event_id: number;
  qr_token: string;
  status: string;
  issued_at: string | null;
  checked_in_at: string | null;
  title: string;
  start_at: string;
  location: string;
};

export default function MyTickets() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/me/tickets`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data: TicketRow[] = await res.json();
        setTickets(Array.isArray(data) ? data : []);
      } catch {
        setTickets([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [API_URL]);

  if (loading) return <p>Loading your tickets…</p>;
  if (!tickets.length) return <p>No tickets yet.</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>My Tickets</h2>
      <div style={{ display: "grid", gap: 12 }}>
        {tickets.map((t) => (
          <article key={t.ticket_id} style={{ background: "#141414", padding: 16, borderRadius: 10 }}>
           <h3>{(t as any).title || (t as any).event_title || "Event"}</h3>
            <p>{new Date((t as any).start_at || (t as any).issued_at).toLocaleString()}</p>
            <p>{(t as any).location || ""}</p>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                  (t as any).qr_token || (t as any).qrCode || ""
              )}`} alt="QR Code" />
            <p>Status: {t.status}{t.checked_in_at ? " (checked in)" : ""}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
