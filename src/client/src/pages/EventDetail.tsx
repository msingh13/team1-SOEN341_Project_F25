import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { EventItem, ClaimSuccess } from "../lib/api";
import { getEvent, saveToCalendar, claimTicket } from "../lib/api";
import { QRCodeCanvas } from "qrcode.react";

export default function EventDetails() {
  const { id = "" } = useParams();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [claimBusy, setClaimBusy] = useState(false);
  const [claimed, setClaimed] = useState<ClaimSuccess | null>(null);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setErr(null);
      const ev = await getEvent(String(id));
      if (!cancel) {
        if (!ev) setErr("Not found");
        setEvent(ev);
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [id]);

  if (loading) return <main className="container" style={{ paddingTop: 24 }}>Loading event…</main>;
  if (err || !event) return <main className="container" style={{ paddingTop: 24, color: "salmon" }}>{err || "Not found"}</main>;
  const ev = event;
  async function onSave() {
    await saveToCalendar(ev.id);
    setSavedMsg("Added to your calendar.");
    setTimeout(() => setSavedMsg(""), 1500);
  }

  async function onClaim() {
    setClaimBusy(true);
    try {
      const t = await claimTicket(ev.id);
      setClaimed(t);
    } catch (e: any) {
      // lightweight error feedback
      setSavedMsg(e?.message || "Failed to claim.");
      setTimeout(() => setSavedMsg(""), 1500);
    } finally {
      setClaimBusy(false);
    }
  }

  return (
    <main className="container" style={{ paddingTop: 24 }}>
      <section className="card">
        <header className="card-header">
          <div>
            <h2 className="h2">{event.title}</h2>
            <p className="muted">{new Date(event.start_time).toLocaleString()} · {event.location}</p>
          </div>
        </header>

        <div className="card-body" style={{ display: "grid", gap: 12 }}>
          <p style={{ opacity: 0.9 }}>{event.description || "No description."}</p>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={onSave}>Save to Calendar</button>
            <button className="btn" onClick={onClaim} disabled={claimBusy}>
              {claimBusy ? "Claiming…" : "Claim Ticket"}
            </button>
          </div>

          {savedMsg && <p className="info" role="status">{savedMsg}</p>}

          {claimed && (
            <div style={{ marginTop: 8 }}>
              <h3 className="h3">Your Ticket</h3>
              <p className="muted">Ticket ID: {claimed.ticketId}</p>
              <div style={{ display: "inline-block", background: "#fff", padding: 12, borderRadius: 12 }}>
                <QRCodeCanvas value={claimed.qr} size={164} includeMargin />
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
