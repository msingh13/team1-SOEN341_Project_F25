// src/client/src/pages/admin/AdminModeration.tsx
// Lightweight, FRONTEND-ONLY mock of the moderation dashboard.
// - Lists a few "submitted" events from local state
// - Lets you Publish / Reject (with reason) and updates UI instantly
// - No backend calls here (wire real API later)

import { useEffect, useState } from "react";

// Always normalize API responses to an array
function toArray(x: any): any[] {
  if (Array.isArray(x)) return x;
  if (x && Array.isArray(x.data)) return x.data;
  if (x && Array.isArray(x.items)) return x.items;
  if (x && Array.isArray(x.events)) return x.events;
  return [];
}

type ModerationStatus = "submitted" | "published" | "rejected";

type ModerationEvent = {
  id: number;
  title: string;
  description?: string;
  category?: string;
  organizer?: string;
  start_at?: string; // ISO
  status: ModerationStatus;
  reject_reason?: string;
};

type ReasonsMap = Record<number, string>;

export default function AdminModeration() {
  const [events, setEvents] = useState<ModerationEvent[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [reasons, setReasons] = useState<ReasonsMap>({});
  const [error, setError] = useState<string | null>(null);

  // seed some fake submitted events on first load
  useEffect(() => {
      (async () => {
         try {
           const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
           const res = await fetch(`${API}/admin/events/submitted`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` }
           });
           const text = await res.text();
           const data = text ? JSON.parse(text) : null;
           setEvents(toArray(data));
         } catch (e) {
           setError("Failed to load submitted events");
         }
       })();
     }, []);

  function onChangeReason(id: number, val: string) {
    setReasons((prev) => ({ ...prev, [id]: val }));
  }

  // “Publish” — purely local update
  async function onPublish(id: number) {
    setBusyId(id);
    setError(null);
    try {
     await new Promise((r) => setTimeout(r, 400));
     setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: "published" } : e)));
     const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
     const res = await fetch(`${API}/admin/events/${id}/publish`, {
       method: "POST",
       headers: { "Authorization": `Bearer ${localStorage.getItem("token") ?? ""}` }
     });
     if (!res.ok) throw new Error("Publish failed");
     setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch {
      setError("Failed to publish.");
    } finally {
      setBusyId(null);
    }
  }

  // “Reject” — requires a reason; purely local update
  async function onReject(id: number) {
    const reason = (reasons[id] || "").trim();
    if (!reason) { alert("Please provide a rejection reason."); return; }
    setBusyId(id);
    setError(null);
    try {
     await new Promise((r) => setTimeout(r, 400));
     setEvents((prev) => prev.map((e) => e.id === id ? { ...e, status: "rejected", reject_reason: reason } : e));
     const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
     const res = await fetch(`${API}/admin/events/${id}/reject`, {
       method: "POST",
       headers: {
         "Authorization": `Bearer ${localStorage.getItem("token") ?? ""}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({ reason }),
     });
     if (!res.ok) throw new Error("Reject failed");
     setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch {
      setError("Failed to reject.");
    } finally {
      setBusyId(null);
    }
  }


  const pending = events.filter((e) => e.status === "submitted");

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin • Event Moderation</h2>
      <p className="muted" style={{ marginTop: 6 }}>
        Review submitted events. Publish if OK, or reject with a reason.
      </p>

      {error && (
        <p role="alert" style={{ color: "red", marginTop: 8 }}>
          {error}
        </p>
      )}

      {pending.length === 0 ? (
        <p style={{ marginTop: 12 }}>No pending events. 🎉</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
            marginTop: 12,
          }}
        >
          {pending.map((ev) => (
            <div
              key={ev.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 12,
                background: "#fafafa",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <h3 style={{ margin: 0, color: "black" }}>{ev.title}</h3>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: "bold",
                    color: "black",
                    background:
                      ev.status === "submitted"
                        ? "green"
                        : ev.status === "published"
                        ? "#27ae60" // green
                        : "#e74c3c", // red
                    border: "none",
                    textTransform: "capitalize",
                  }}
                >
                  {ev.status}
                </span>
              </div>

              <p style={{ margin: "8px 0 6px", color: "#555" }}>
                {ev.description || "No description"}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "#666" }}>
                <strong>Category:</strong> {ev.category || "N/A"}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "#666" }}>
                <strong>Organizer:</strong> {ev.organizer || "N/A"}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "#666" }}>
                <strong>Start:</strong>{" "}
                {ev.start_at ? new Date(ev.start_at).toLocaleString() : "N/A"}
              </p>

              <div style={{ marginTop: 10 }}>
                <label
                  htmlFor={`reason-${ev.id}`}
                  style={{ display: "block", fontSize: 12, color: "red", fontWeight: "bold" }}
                >
                  Rejection reason (required to reject):
                </label>
                <textarea
                  id={`reason-${ev.id}`}
                  rows={2}
                  placeholder="Explain why this event is rejected"
                  value={reasons[ev.id] || ""}
                  onChange={(e) => onChangeReason(ev.id, e.target.value)}
                  style={{ width: "100%", resize: "vertical", marginTop: 4 }}
                />
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <button onClick={() => onPublish(ev.id)} disabled={busyId === ev.id}>
                  {busyId === ev.id ? "Publishing…" : "Publish"}
                </button>
                <button
                  onClick={() => onReject(ev.id)}
                  disabled={busyId === ev.id}
                  style={{
                    border: "1px solid #c0392b",
                    background: "#e74c3c",
                    color: "white",
                    fontWeight: "bold",
                    padding: "6px 10px",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  {busyId === ev.id ? "Rejecting…" : "Reject"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
