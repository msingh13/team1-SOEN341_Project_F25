import { QRCodeCanvas } from "qrcode.react";
import { useState, useEffect } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { getUser, isVverified } from "./verify";


type Ticket = {
  id: string;
  eventTitle: string;
  date: string;
  time: string;
  location: string;
  qrCode: string;
  status: "claimed" | "checked-in" | "cancelled";
};

function MyTickets() {

  console.log("User:", getUser(), "Verified:", isVverified());

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  if (!isVverified()) {
    return (
      <main style={{ padding: 24 }}>
        <h2>403 — Verified students only</h2>
        <p style={{ opacity: 0.8 }}>
          This page is visible only to verified students.
        </p>
      </main>
    );
  }

    useEffect(() => {

        (async() => {
            try {
                setTickets([
                    {
                      id: "ex1",
                      eventTitle: "example A",
                      date: "2025-10-15",
                      time: "19:00",
                      location: "example X",
                      qrCode: "QR_CODE_DATA_1",
                      status: "claimed",
                    },
                    {
                      id: "ex2",
                      eventTitle: "example B",
                      date: "2025-11-20",
                      time: "20:00",
                      location: "exampleVenue Y",
                      qrCode: "QR_CODE_DATA_2",
                      status: "checked-in",
                        },
                    ]);
                    
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
