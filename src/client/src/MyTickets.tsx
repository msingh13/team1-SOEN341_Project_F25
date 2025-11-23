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

type WaitlistVM = {
  id: number;
  status: string;
  eventTitle: string;
  eventStart?: string | null;
  location?: string | null;
  position?: number | null;
  offerExpiresAt?: string | null;
};

export default function MyTickets() {
  const [tickets, setTickets] = useState<TicketVM[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  // waitlists state
  const [activeTab, setActiveTab] = useState<"tickets" | "waitlists">("tickets");
  const [waitlists, setWaitlists] = useState<WaitlistVM[]>([]);
  const [waitlistsLoading, setWaitlistsLoading] = useState(false);
  const [waitlistsLoaded, setWaitlistsLoaded] = useState(false);

  // ticking clock for countdowns
  const [now, setNow] = useState(() => Date.now());

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

  //countdown
  function formatCountdown(deadline: string | null | undefined): string {
    if (!deadline) return "";
    const diff = new Date(deadline).getTime() - now;
    if (Number.isNaN(diff) || diff <= 0) return "Offer expired";

    const totalSeconds = Math.floor(diff / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s left`;
  }

  //respond to offer
  async function respondToOffer(id: number, action: "accept" | "decline") {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/me/waitlists/${id}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        // toast if needed
        console.error("Failed to update waitlist", await res.text());
        return;
      }

      setWaitlists((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      console.error("Network error updating waitlist", err);
    }
  }

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    async function loadTickets() {
      setTicketsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/me/tickets`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();

        // Backend returns: { Tickets: [{ id, status, qrCode, issuedAt, checkedInAt, ev:{title}, event:{startAt,endAt,location} }]}
        const arr = Array.isArray(data) ? data : data?.Tickets ?? [];

        const mapped: TicketVM[] = arr.map((t: any) => ({
          id: t.id ?? t.ticket_id,
          status: t.status,
          qrToken: t.qrCode ?? t.qr_token ?? "",
          issuedAt: t.issuedAt ?? t.issued_at ?? null,
          checkedInAt: t.checkedInAt ?? t.checked_in_at ?? null,
          title: t.ev?.title ?? t.event_title ?? t.title ?? "Event",
          startAt: t.event?.startAt ?? t.start_at ?? null,
          location: t.event?.location ?? t.location ?? null,
        }));

        setTickets(mapped);
      } catch (err) {
        console.error("Error loading tickets", err);
        setTickets([]);
      } finally {
        setTicketsLoading(false);
      }
    }

    loadTickets();
  }, [API_URL]);

  //load waitlists when tab first opened
  useEffect(() => {
    if (activeTab !== "waitlists" || waitlistsLoaded) return;

    async function loadWaitlists() {
      setWaitlistsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/me/waitlists`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          console.error("Failed to load waitlists", await res.text());
          setWaitlists([]);
          return;
        }

        const json = await res.json();
        const arr = Array.isArray(json) ? json : json.waitlists ?? [];

        const mapped: WaitlistVM[] = arr.map((w: any) => ({
          id: w.id,
          status: w.status,
          eventTitle: w.event_title ?? w.event?.title ?? "Event",
          eventStart: w.event_start ?? w.event?.start_at ?? null,
          location: w.location ?? w.event?.location ?? null,
          position: w.position ?? w.queue_position ?? null,
          offerExpiresAt: w.offer_expires_at ?? w.offerExpiresAt ?? null,
        }));

        setWaitlists(mapped);
        setWaitlistsLoaded(true);
      } catch (err) {
        console.error("Error loading waitlists", err);
        setWaitlists([]);
      } finally {
        setWaitlistsLoading(false);
      }
    }

    loadWaitlists();
  }, [activeTab, waitlistsLoaded, API_URL]);

  //Filter out expired offers on the client
  const visibleWaitlists = waitlists.filter((w) => {
    if (w.status === "expired") return false;
    if (w.offerExpiresAt) {
      const diff = new Date(w.offerExpiresAt).getTime() - now;
      if (!Number.isNaN(diff) && diff <= 0) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: 20 }}>
      <h2>My Tickets</h2>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Tickets and waitlists"
        style={{ display: "flex", gap: 8, marginBottom: 16 }}
      >
        <button
          role="tab"
          type="button"
          aria-selected={activeTab === "tickets"}
          onClick={() => setActiveTab("tickets")}
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            border: "1px solid #555",
            background: activeTab === "tickets" ? "#ffffff" : "transparent",
            color: activeTab === "tickets" ? "#000" : "#fff",
            cursor: "pointer",
          }}
        >
          Tickets
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={activeTab === "waitlists"}
          onClick={() => setActiveTab("waitlists")}
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            border: "1px solid #555",
            background: activeTab === "waitlists" ? "#ffffff" : "transparent",
            color: activeTab === "waitlists" ? "#000" : "#fff",
            cursor: "pointer",
          }}
        >
          My Waitlists
        </button>
      </div>

      {/* TAB: Tickets */}
      {activeTab === "tickets" && (
        <section aria-label="My tickets">
          {ticketsLoading ? (
            <p>Loading your tickets…</p>
          ) : !tickets.length ? (
            <p>No tickets yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {tickets.map((t) => (
                <article
                  key={t.id}
                  style={{ background: "#141414", padding: 16, borderRadius: 10 }}
                >
                  <h3>{t.title}</h3>
                  <p>
                    {t.startAt
                      ? new Date(t.startAt).toLocaleString()
                      : "Event time TBD"}
                    {" · issued "}
                    {t.issuedAt
                      ? new Date(t.issuedAt).toLocaleString()
                      : "N/A"}
                  </p>
                  <p>{t.location || ""}</p>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                      t.qrToken,
                    )}`}
                    alt="QR Code"
                  />
                  <p>
                    Status: {t.status}
                    {t.checkedInAt ? " (checked in)" : ""}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB: Waitlists */}
      {activeTab === "waitlists" && (
        <section aria-label="My waitlisted events">
          {waitlistsLoading ? (
            <p>Loading your waitlists…</p>
          ) : !visibleWaitlists.length ? (
            <p>You are not on any waitlists.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {visibleWaitlists.map((w) => {
                const isOffered = w.status === "offered";
                const countdown =
                  isOffered && w.offerExpiresAt
                    ? formatCountdown(w.offerExpiresAt)
                    : "";

                return (
                  <article
                    key={w.id}
                    style={{ background: "#141414", padding: 16, borderRadius: 10 }}
                  >
                    <h3>{w.eventTitle}</h3>
                    {w.eventStart && (
                      <p>{new Date(w.eventStart).toLocaleString()}</p>
                    )}
                    {w.location && <p>{w.location}</p>}

                    {typeof w.position === "number" && (
                      <p>Queue position: {w.position}</p>
                    )}

                    <p>Status: {w.status}</p>

                    {isOffered && (
                      <>
                        {countdown && <p>{countdown}</p>}
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => respondToOffer(w.id, "accept")}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 8,
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => respondToOffer(w.id, "decline")}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 8,
                              border: "1px solid #888",
                              background: "transparent",
                              color: "#fff",
                              cursor: "pointer",
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
