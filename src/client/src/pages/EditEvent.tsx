import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

// --- types ---
type TicketType = "free" | "paid";

interface EditEventProps {
  /** Optional prop to support both prop and /events/:id/edit */
  eventId?: string;
}

interface EventWire {
  id: string;
  title: string;
  description?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  capacity?: number | null;
  ticket_type?: TicketType | null;
}

interface FormState {
  title: string;
  description: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  location: string;
  capacity: string;   // keep as string for input control, cast on submit
  ticketType: TicketType;
}

type Toast = { type: "success" | "error"; msg: string } | null;

// --- helpers ---
function isoToParts(iso?: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { date, time };
}

function partsToIso(
  date: string | null | undefined,
  time?: string | null,
  fallbackTime: string = "09:00"
): string | null {
  if (!date) return null;
  const t = time || fallbackTime;
  const iso = new Date(`${date}T${t}`);
  return isNaN(iso.getTime()) ? null : iso.toISOString();
}

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #2b2b2b",
  background: "#1b1b1b",
  color: "white",
};

export default function EditEvent(props: EditEventProps): JSX.Element {
  const { id: idFromRoute } = useParams<{ id: string }>();
  const eventId = props.eventId ?? idFromRoute; // supports both prop and /events/:id/edit

  const BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";
  const DEV_USER_ID = (import.meta as any).env?.VITE_DEV_USER_ID || "2"; // organizer for dev

  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    capacity: "",
    ticketType: "free",
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<Toast>(null);
  const [err, setErr] = useState<string | null>(null);

  // --- load event ---
  useEffect(() => {
    let cancel = false;

    async function load() {
      if (!eventId) {
        setErr("Missing event id");
        setLoading(false);
        return;
      }
      setLoading(true);
      setErr(null);

      try {
        const res = await axios.get<EventWire>(`${BASE_URL}/events/${eventId}`, {
          headers: { "X-User-Id": DEV_USER_ID },
        });
        const ev = res.data;
        const start = isoToParts(ev.start_time ?? null);
        const end = isoToParts(ev.end_time ?? null);

        if (!cancel) {
          setForm({
            title: ev.title || "",
            description: ev.description || "",
            date: start.date || "",
            startTime: start.time || "",
            endTime: end.time || "",
            location: ev.location || "",
            capacity: String(ev.capacity ?? ""),
            ticketType: (ev.ticket_type as TicketType) || "free",
          });
        }
      } catch (e: unknown) {
        const message =
          axios.isAxiosError(e)
            ? e.response?.data?.message ?? e.message
            : e instanceof Error
            ? e.message
            : "Failed to load event";
        if (!cancel) setErr(message);
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    load();
    return () => {
      cancel = true;
    };
  }, [eventId, BASE_URL, DEV_USER_ID]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!eventId) return;

    setSaving(true);
    setToast(null);
    setErr(null);

    try {
      const payload = {
        title: form.title,
        description: form.description,
        location: form.location,
        capacity: Number(form.capacity || 0),
        ticket_type: form.ticketType,
        start_time: partsToIso(form.date, form.startTime, "09:00"),
        end_time: partsToIso(form.date, form.endTime, "17:00"),
      };

      await axios.put(`${BASE_URL}/events/${eventId}`, payload, {
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": DEV_USER_ID,
        },
      });

      setToast({ type: "success", msg: "✅ Event updated" });
    } catch (e: unknown) {
      const message =
        axios.isAxiosError(e)
          ? e.response?.data?.message ?? e.message
          : e instanceof Error
          ? e.message
          : "Update failed";
      setErr(message);
      setToast({ type: "error", msg: "❌ Error updating event" });
    } finally {
      setSaving(false);
      window.setTimeout(() => setToast(null), 3000);
    }
  }

  // --- export attendees CSV ---
  const handleExportCSV = async () => {
    if (!eventId) return;
    try {
      const response = await axios.get<Blob>(`/api/org/events/${eventId}/attendees.csv`, {
        responseType: "blob",
      });

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `event_${eventId}_attendees.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error exporting CSV:", error);
      alert("Error exporting CSV");
    }
  };

  if (loading) return <p style={{ padding: 24 }}>Loading event…</p>;

  if (err) {
    return (
      <div style={{ padding: 24, color: "#fff", maxWidth: 600, margin: "0 auto" }}>
        <div
          style={{
            background: "#3d1010",
            border: "1px solid #a43b3b",
            color: "#ffb5b5",
            padding: 12,
            borderRadius: 10,
          }}
        >
          {err}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, color: "#fff", maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: 16 }}>Edit Event</h1>

      {toast && (
        <div
          role="status"
          style={{
            background: toast.type === "success" ? "#103d25" : "#3d1010",
            border: `1px solid ${toast.type === "success" ? "#1f8a4c" : "#a43b3b"}`,
            color: toast.type === "success" ? "#b5ffd4" : "#ffb5b5",
            textAlign: "center",
            padding: "10px 12px",
            borderRadius: 10,
            marginBottom: 12,
          }}
        >
          {toast.msg}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: 10,
          background: "#141414",
          border: "1px solid #2b2b2b",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <input
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          required
          style={inputStyle}
        />

        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          style={{ ...inputStyle, height: 100 }}
        />

        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          required
          style={inputStyle}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="time"
            name="startTime"
            value={form.startTime}
            onChange={handleChange}
            style={{ ...inputStyle, flex: 1 }}
          />
          <input
            type="time"
            name="endTime"
            value={form.endTime}
            onChange={handleChange}
            style={{ ...inputStyle, flex: 1 }}
          />
        </div>

        <input
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          type="number"
          name="capacity"
          placeholder="Capacity"
          value={form.capacity}
          onChange={handleChange}
          style={inputStyle}
        />

        <select
          name="ticketType"
          value={form.ticketType}
          onChange={handleChange}
          style={inputStyle}
        >
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>

        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: saving ? "#555" : "#2563eb",
              color: "white",
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
              flex: 1,
            }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>

          {/* Optional CSV export button */}
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: "#334155",
              color: "white",
              border: "none",
              cursor: "pointer",
              flex: 1,
            }}
          >
            Export Attendees CSV
          </button>
        </div>
      </form>

      <p style={{ marginTop: 10, color: "#888", textAlign: "center", fontSize: 13 }}>
        Organizer demo — GET/PUT {BASE_URL}/events/{eventId}
      </p>
    </div>
  );
}
