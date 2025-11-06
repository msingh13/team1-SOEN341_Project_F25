// src/pages/SavedEvents.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMySaves } from "../lib/api";
import { on } from "../lib/bus";
import SaveButton from "../components/SaveButton";

type SavedEventWire = {
  id: number;
  title: string;
  description?: string;
  // backend might send either start_time or startTime — support both
  start_time?: string;
  startTime?: string;
  end_time?: string | null;
  endTime?: string | null;
  location?: string;
};

type EventItem = {
  id: number;
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string | null;
  location?: string;
};

export default function SavedEvents() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listMySaves();
      const items: SavedEventWire[] = data.items || [];
      // normalize keys to camelCase for UI
      const normalized: EventItem[] = items.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        startTime: e.startTime ?? e.start_time,
        endTime: e.endTime ?? e.end_time,
        location: e.location,
      }));
      setEvents(normalized);
    } catch (e: any) {
      setError(e.message || "Failed to load saved events");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const off = on("saves:changed", load);
    return () => off();
  }, []);

  if (loading) return <p style={{ padding: 20 }}>Loading saved events…</p>;

  if (error)
    return (
      <div style={{ padding: 20 }}>
        <p style={{ color: "red" }}>{error}</p>
        <button onClick={load} style={{ marginTop: 8 }}>Retry</button>
      </div>
    );

  if (events.length === 0)
    return <p style={{ padding: 20 }}>You haven’t saved any events yet.</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 12 }}>Saved Events</h2>

      <div
        role="region"
        aria-label="Saved events"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 12,
          marginTop: 8,
        }}
      >
        {events.map((ev) => (
          <article
            key={ev.id}
            aria-label={ev.title}
            style={{
              background: "#141414",
              border: "1px solid #2b2b2b",
              borderRadius: 10,
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <Link
              to={`/events/${ev.id}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              {ev.title}
            </Link>

            <p style={{ fontSize: 13, color: "#9aa", margin: 0 }}>
              {ev.description || "No description"}
            </p>

            <div style={{ fontSize: 12, color: "#bbb" }}>
              <div>
                <strong>Location:</strong> {ev.location || "N/A"}
              </div>
              <div>
                <strong>Starts:</strong>{" "}
                {ev.startTime ? new Date(ev.startTime).toLocaleString() : "N/A"}
              </div>
            </div>

            <div style={{ marginTop: "auto", display: "flex", gap: 8 }}>
              <Link
                to={`/events/${ev.id}`}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid #2b2b2b",
                  textDecoration: "none",
                }}
              >
                View
              </Link>

              {/* Reuse your SaveButton to allow quick Unsave and auto-refresh */}
              <SaveButton
                eventId={ev.id}
                onChange={() => {
                  // optional: re-fetch to reflect any backend-side changes
                  // but not necessary because SaveButton emits "saves:changed"
                }}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
