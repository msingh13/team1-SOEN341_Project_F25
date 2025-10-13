// src/pages/SavedEvents.tsx
// -------------------------------------------------------------
// Purpose:
//   Displays a list of all events that the current user has saved.
//
// Description:
//   - Fetches saved events from the backend (or mock mode).
//   - Shows loading and error states.
//   - Renders each event in a simple grid/card layout.
// -------------------------------------------------------------

import { useEffect, useState } from "react";
import { listMySaves } from "../lib/api"; // our helper from api.ts
import { on } from "../lib/bus";

// Type definition for a single event item
interface EventItem {
  id: number;
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string | null;
  location?: string;
}

export default function SavedEvents() {
  // -------------------------------------------------------------
  // State variables
  // -------------------------------------------------------------
  const [events, setEvents] = useState<EventItem[]>([]); // list of saved events
  const [loading, setLoading] = useState<boolean>(true); // tracks if data is loading
  const [error, setError] = useState<string | null>(null); // tracks any errors

  // -------------------------------------------------------------
  // useEffect → fetch saved events on mount AND when "saves:changed" event fires
  // -------------------------------------------------------------
  useEffect(() => {
    // Helper function to load saved events
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await listMySaves();
        setEvents(data.items || []);
      } catch (e: any) {
        setError(e.message || "Failed to load saved events");
      } finally {
        setLoading(false);
      }
    }

    // 1️⃣ Load events initially when the component mounts
    load();

    // 2️⃣ Subscribe to global "saves:changed" event
    const off = on("saves:changed", () => {
      // Whenever SaveButton emits this event, reload list
      load();
    });

    // 3️⃣ Cleanup: unsubscribe when component unmounts
    return () => off();
  }, []);// empty dependency → runs only once when component mounts

  // -------------------------------------------------------------
  // Render UI for different states (loading, error, no data)
  // -------------------------------------------------------------
  if (loading) return <p style={{ padding: 20 }}>Loading saved events...</p>;
  if (error) return <p style={{ padding: 20, color: "red" }}>{error}</p>;
  if (events.length === 0)
    return <p style={{ padding: 20 }}>You haven't saved any events yet.</p>;

  // -------------------------------------------------------------
  // Render the list of saved events in a grid layout
  // -------------------------------------------------------------
  return (
    <div style={{ padding: 20 }}>
      <h2>Saved Events</h2>

      {/* Grid layout for event cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: 16,
          marginTop: 16,
        }}
      >
        {/* Map over events array and display each event */}
        {events.map((ev) => (
          <div
            key={ev.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 12,
              background: "#fafafa",
            }}
          >
            <h3 style={{ marginBottom: 8 }}>{ev.title}</h3>

            {/* Event description */}
            <p style={{ fontSize: 14, color: "#555" }}>
              {ev.description || "No description"}
            </p>

            {/* Location */}
            <p style={{ fontSize: 12, color: "#777" }}>
              Location: {ev.location || "N/A"}
            </p>

            {/* Start time */}
            <p style={{ fontSize: 12, color: "#777" }}>
              Starts:{" "}
              {ev.startTime
                ? new Date(ev.startTime).toLocaleString()
                : "N/A"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}