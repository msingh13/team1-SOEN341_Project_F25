import { useEffect, useState } from "react";

type TicketVM = {
  id: number;
  status: string;
  qrToken: string;
  issuedAt?: string | null;
  checkedInAt?: string | null;
  title: string;
  startAt?: string | null;
  location?: string | null;
};

export default function MyTickets() {
  const [tickets, setTickets] = useState<TicketVM[]>([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/me/tickets`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();

        // Backend returns: { Tickets: [{ id, status, qrCode, issuedAt, checkedInAt, ev:{title}, event:{startAt,endAt,location} }]}
        const arr = Array.isArray(data) ? data : (data?.Tickets ?? []);
        const mapped: TicketVM[] = arr.map((t: any) => ({
          id: t.id ?? t.ticket_id,
          status: t.status,
          qrToken: t.qrCode ?? t.qr_token ?? "",
          issuedAt: t.issuedAt ?? t.issued_at ?? null,
          checkedInAt: t.checkedInAt ?? t.checked_in_at ?? null,
          title: t.ev?.title ?? t.event_title ?? "Event",
          startAt: t.event?.startAt ?? t.start_at ?? null,
          location: t.event?.location ?? t.location ?? null,
        }));

        setTickets(mapped);
      } catch {
        setTickets([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [API_URL]);

  if (loading) return <p style={{ padding: 20 }}>Loading your tickets…</p>;
  if (!tickets.length) return <p style={{ padding: 20 }}>No tickets yet.</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>My Tickets</h2>
      <div style={{ display: "grid", gap: 12 }}>
        {tickets.map((t) => (
          <article key={t.id} style={{ background: "#141414", padding: 16, borderRadius: 10 }}>
            <h3>{t.title}</h3>
            <p>{t.startAt ? new Date(t.startAt).toLocaleString() : (t.issuedAt ? new Date(t.issuedAt).toLocaleString() : "N/A")}</p>
            <p>{t.location || ""}</p>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(t.qrToken)}`}
              alt="QR Code"
            />
            <p>
              Status: {t.status}
              {t.checkedInAt ? " (checked in)" : ""}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
