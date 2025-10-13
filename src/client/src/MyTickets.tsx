import { QRCodeCanvas } from "qrcode.react";
import { useState, useEffect } from "react";
import  {ErrorBoundary}  from "./ErrorBoundary";
import { getUser, isVerified } from "./verify";


type Ticket = {
  id: string;
  eventTitle: string;
  date: string;
  time: string;
  location: string;
  qrCode: string;
  status: "claimed" | "checked-in" | "cancelled";
};
 type ApiTicket = {
                  id?: string | number;
                  status?: string;
                  qr_code?: string;              
                  qrCode?: string;             
                  event_title?: string;
                  event_location?: string;
                 event_start_at?: string;
                 event?: {
                  id?: string | number;
                  title?: string;
                  location?: string;
                  startAt?: string;
                  start_at?: string;
                                  };
                                };

              function mapApiTicket(t: ApiTicket): Ticket {
                const ev = t.event ?? {};
                const startISO = t.event_start_at ?? ev.startAt ?? ev.start_at ?? null;
                const dt = startISO ? new Date(startISO) : null;

                  return {
                    id: String(t.id ?? ""),
                    eventTitle: t.event_title ?? ev.title ?? `Event #${ev.id ?? t.id ?? "?"}`,
                    date: dt ? dt.toLocaleDateString() : "",
                    time: dt ? dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
                    location: t.event_location ?? ev.location ?? "",
                    qrCode: t.qr_code ?? t.qrCode ?? "",     
                    status: (t.status as Ticket["status"]) ?? "claimed",
                  };
                }
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function authHeaders(): Record<string, string> {
    const header: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem("token");
    if (token) 
      header.Authorization = `Bearer ${token}`;
    return header;
}

function MyTickets() {

  console.log("User:", getUser(), "Verified:", isVerified());

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // if (!isVerified()) {
  //   return (
  //     <main style={{ padding: 24 }}>
  //       <h2>403 — Verified students only</h2>
  //       <p style={{ opacity: 0.8 }}>
  //         This page is visible only to verified students.
  //       </p>
  //     </main>
  //   );
  // }

    useEffect(() => {

        (async() => {
            try {
              
              console.log('API_URL =', API_URL);
              console.log('authHeaders() =', authHeaders());

              const res = await fetch(`${API_URL}/me/tickets`,{
                method: "GET",
                headers: authHeaders(),
              });

              if (!res.ok) {
                const text = await res.text().catch(()=>"");
                throw new Error(`Error: ${res.status} ${res.statusText} ${text}`);
              }
              const data = await res.json();
              console.log("Fetched tickets:", data);

              const raw =
              Array.isArray(data?.tickets) ? data.tickets :
              Array.isArray(data?.Tickets) ? data.Tickets :
              Array.isArray(data)          ? data : [];

              console.log("RAW tickets length:", raw.length);
              console.log("RAW sample[0]:", raw[0]); 

              const mapped: Ticket[] = raw.map(mapApiTicket);
              console.log("MAPPED tickets length:", mapped.length);
              console.log("MAPPED sample[0]:", mapped[0]);

              setTickets(mapped);

                } catch {
                    setError("Failed to fetch tickets.");
                } finally {
                    setLoading(false);
                }
            })();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div>Error: {error}</div>;
    }
     if (tickets.length === 0) {
        return <div>No tickets available.</div>;
    }   

  return (
    <main>
      <div>
        <h1>My Tickets</h1>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "stretch" }}>
          {tickets.map((t) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                flex: "1 1 220px",
                flexDirection: "column",
                border: "",
                margin: "10px",
                padding: "10px",
                borderRadius: "25px",
                boxShadow: "0px 0px 10px ",
                background: "linear-gradient(90deg, #e3e3e3, #cfcfcf)",
                maxWidth: "220px",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  fontWeight: 800,
                  letterSpacing: ".5px",
                  padding: "8px 10px",
                  border: "",
                  borderRadius: "10px",
                  background: "linear-gradient(90deg, #e3e3e3, #cfcfcf)"
                }}>
                <h2 style={{ margin: 0 }}>{t.eventTitle}</h2>
              </div>

              <div style={{ marginTop: "10px", fontSize: "14px" }}>
                <p>Date: {t.date}</p>
                <p>Time: {t.time}</p>
                <p>Location: {t.location}</p>
                <p>Status: {t.status}</p>

              </div>
              <ErrorBoundary>
                <div style={{ marginTop: 5, textAlign: "center", background: "white", padding: 5, borderRadius: 20, boxShadow: "0px 0px 5px lightgrey" }}>      
               <QRCodeCanvas
                    value={t.qrCode}  
                    size={130}
                     includeMargin/>
                </div>
            </ErrorBoundary>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default MyTickets;
