import React, { useState, type JSX } from "react";
import axios from "axios";

type TicketType = "free" | "paid";

interface FormState {
  title: string;
  description: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  location: string;
  capacity: string;   // keep as string for controlled input; cast on submit
  ticketType: TicketType;
  createdBy: string;  // optional UI-only field
}

type Toast = { type: "success" | "error"; msg: string } | null;

interface CreateEventResponse {
  id?: string | number;
  // ...any other fields your API returns
}

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #2b2b2b",
  background: "#1b1b1b",
  color: "white",
};

export default function CreateEvent(): JSX.Element {
  const BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";
  const DEV_USER_ID = (import.meta as any).env?.VITE_DEV_USER_ID || "2";

  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    capacity: "",
    ticketType: "free",
    createdBy: "yazan",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<Toast>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    try {
      const start = new Date(`${form.date}T${form.startTime || "09:00"}`);
      const end = new Date(`${form.date}T${form.endTime || "17:00"}`);

      const payload = {
        title: form.title,
        description: form.description,
        location: form.location,
        capacity: Number(form.capacity || 0),
        ticket_type: form.ticketType,
        start_time: isNaN(start.getTime()) ? null : start.toISOString(),
        end_time: isNaN(end.getTime()) ? null : end.toISOString(),
        // created_by: form.createdBy, // uncomment if your API expects it
      };

      const res = await axios.post<CreateEventResponse>(`${BASE_URL}/events`, payload, {
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": DEV_USER_ID,
        },
      });

      setToast({ type: "success", msg: `✅ Event created (ID ${res.data.id ?? "?"})` });
      setForm({
        title: "",
        description: "",
        date: "",
        startTime: "",
        endTime: "",
        location: "",
        capacity: "",
        ticketType: "free",
        createdBy: "yazan",
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setToast({ type: "error", msg: "❌ Error creating event" });
    } finally {
      setLoading(false);
      window.setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div style={{ padding: 24, color: "#fff", maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: 16 }}>Create Event</h1>

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
          style={{ ...inputStyle, height: 80 }}
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
        <select name="ticketType" value={form.ticketType} onChange={handleChange} style={inputStyle}>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: loading ? "#555" : "#2563eb",
            color: "white",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: 6,
          }}
        >
          {loading ? "Creating…" : "Create Event"}
        </button>
      </form>

      <p style={{ marginTop: 10, color: "#888", textAlign: "center", fontSize: 13 }}>
        Organizer demo — posts to {BASE_URL}/events
      </p>
    </div>
  );
}
