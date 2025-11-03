// src/client/src/pages/admin/AdminModeration.jsx
// Lightweight, FRONTEND-ONLY mock of the moderation dashboard.
// - Lists a few "submitted" events from local state
// - Lets you Publish / Reject (with reason) and updates UI instantly
// - No backend calls here (we'll wire real API later if needed)

import { useEffect, useState } from "react";

export default function AdminModeration() {
  const [events, setEvents] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [reasons, setReasons] = useState({}); // { [id]: "reason" }
  const [error, setError] = useState(null);

  // seed some fake submitted events on first load
  useEffect(() => {
    setEvents([
      {
        id: 101,
        title: "Robotics Club Demo",
        description: "Weekly showcase of projects.",
        category: "Tech",
        organizer: "Engineering Society",
        start_at: new Date(Date.now() + 86400000).toISOString(), // +1 day
        status: "submitted",
      },
      {
        id: 102,
        title: "Career Night",
        description: "Meet recruiters and alumni.",
        category: "Career",
        organizer: "Career Services",
        start_at: new Date(Date.now() + 2 * 86400000).toISOString(),
        status: "submitted",
      },
    ]);
  }, []);

  function onChangeReason(id, val) {
    setReasons((prev) => ({ ...prev, [id]: val }));
  }

  // “Publish” — purely local update
  async function onPublish(id) {
    setBusyId(id);
    setError(null);
    try {
      // pretend round-trip
      await new Promise((r) => setTimeout(r, 400));
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: "published" } : e))
      );
    } catch (e) {
      setError("Failed to publish (mock).");
    } finally {
      setBusyId(null);
    }
  }

  // “Reject” — requires a reason; purely local update
  async function onReject(id) {
    const reason = (reasons[id] || "").trim();
    if (!reason) {
      alert("Please provide a rejection reason.");
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 400));
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: "rejected", reject_reason: reason } : e))
      );
    } catch (e) {
      setError("Failed to reject (mock).");
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
                <label htmlFor={`reason-${ev.id}`} style={{ display: "block", fontSize: 12, color: "red", fontWeight: "bold" }}>
            Rejection reason (required to reject):
            </label>
                <textarea
                  id={`reason-${ev.id}`}
                  rows={2}
                  placeholder="Explain why this event is rejected"
                  value={reasons[ev.id] || ""}
                  onChange={(e) => onChangeReason(ev.id, e.target.value)}
                  style={{ width: "100%", resize: "vertical", marginTop: 4}}
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