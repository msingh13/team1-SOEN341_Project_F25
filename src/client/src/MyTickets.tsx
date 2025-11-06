import { useEffect, useState } from "react";

export default function MyTickets() {
  interface Ticket {
    id: number;
    ev: { title: string };
    event: { startAt: string; location: string };
    qrCode: string;
    status: string;
  }
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const DEV_USER_ID = import.meta.env.VITE_DEV_USER_ID || "1";

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/me/tickets`, {
          headers: { "X-User-Id": DEV_USER_ID },
        });
        const data = await res.json();
        setTickets(data.Tickets || []);
      } catch {
        setTickets([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p>Loading your tickets…</p>;
  if (!tickets.length) return <p>No tickets yet.</p>;

  
  return (
    <div style={{ padding: 20 }}>
      <h2>My Tickets</h2>
      <div style={{ display: "grid", gap: 12 }}>
        {tickets.map((t) => (
          <article key={t.id} style={{ background: "#141414", padding: 16, borderRadius: 10 }}>
            <h3>{t.ev.title}</h3>
            <p>{new Date(t.event.startAt).toLocaleString()}</p>
            <p>{t.event.location}</p>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                t.qrCode
              )}`}
              alt="QR Code"
            />
            <p>Status: {t.status}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
