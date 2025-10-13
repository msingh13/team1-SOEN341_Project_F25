// src/components/SaveButton.tsx
// -------------------------------------------------------------
// Purpose:
//   Reusable Save / Unsave button for event pages.
//
// Description:
//   Displays a toggle button that allows the user to save or unsave an event.
//   The button uses optimistic UI updates (updates instantly before
//   waiting for server response) for a smooth user experience.
//
// Props:
//   - eventId: number | string (required)
//   - onChange?: callback that receives the new saved state (true/false)
// -------------------------------------------------------------

import { useEffect, useState } from "react";
import { isEventSaved, saveEvent, unsaveEvent } from "../lib/api";
import { emit } from "../lib/bus";

// TypeScript interface for component props
interface SaveButtonProps {
  eventId: number | string;
  onChange?: (saved: boolean) => void;
}

export default function SaveButton({ eventId, onChange }: SaveButtonProps) {
  // -------------------------------------------------------------
  // State variables
  // -------------------------------------------------------------
  const [saved, setSaved] = useState<boolean>(false);      // whether the event is currently saved
  const [loading, setLoading] = useState<boolean>(true);   // loading state (API calls)
  const [error, setError] = useState<string | null>(null); // for showing any errors

  // -------------------------------------------------------------
  // useEffect → Check if event is already saved on mount
  // -------------------------------------------------------------
  useEffect(() => {
    let ignore = false; // prevents updates after unmount
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const initial = await isEventSaved(eventId);
        if (!ignore) setSaved(initial);
      } catch (e: any) {
        if (!ignore) setError(e.message || "Failed to load save state");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [eventId]);

  // -------------------------------------------------------------
  // toggleSave → Handle button click
  // -------------------------------------------------------------
  async function toggleSave() {
    if (loading) return;
    setError(null);
    setLoading(true);

    const prev = saved; // store previous state for rollback
    setSaved(!prev); // optimistic update — flip UI instantly

    try {
      // Perform API call depending on state
      if (!prev) {
        await saveEvent(eventId);
      } else {
        await unsaveEvent(eventId);
      }

      // Notify any parent component
      onChange?.(!prev);

      // Broadcast that saved events have changed
      // This triggers listeners (like SavedEvents page) to reload
      emit("saves:changed");
    } catch (e: any) {
      // Rollback if request failed
      setSaved(prev);
      setError(e.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------------
  // Render the button and optional error message
  // -------------------------------------------------------------
  return (
    <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      <button
        type="button"
        onClick={toggleSave}
        disabled={loading}
        aria-pressed={saved}
        title={saved ? "Unsave this event" : "Save this event"}
        style={{
          padding: "8px 12px",
          borderRadius: 6,
          border: "1px solid #ccc",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          background: saved ? "#e6f4ea" : "#f6f6f6",
          fontWeight: 600,
          color: saved ? "blue" : "black", //blue when saved, black when unsaved
        }}
      >
        {loading ? "..." : saved ? "Unsave" : "Save"}
      </button>

      {/* Display any error messages below the button */}
      {error && (
        <span role="alert" style={{ color: "#b00020", fontSize: 12 }}>
          {error}
        </span>
      )}
    </div>
  );
}