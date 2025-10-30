import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

export default function EditEvent(props) {
  const { id: idFromRoute } = useParams();
  const eventId = props.eventId ?? idFromRoute; // supports both prop and /events/:id/edit
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const DEV_USER_ID = import.meta.env.VITE_DEV_USER_ID || "2"; // organizer for dev

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    capacity: "",
    ticketType: "free",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [err, setErr] = useState(null);

  // --- helpers ---
  function isoToParts(iso) {
    if (!iso) return { date: "", time: "" };
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return { date, time };
  }

  function partsToIso(date, time, fallbackTime = "09:00") {
    if (!date) return null;
    const t = time || fallbackTime;
    return new Date(`${date}T${t}`).toISOString();
  }

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
        const res = await axios.get(`${BASE_URL}/events/${eventId}`, {
          headers: { "X-User-Id": DEV_USER_ID },
        });
        const ev = res.data;
        const start = isoToParts(ev.start_time);
        const end = isoToParts(ev.end_time);
        if (!cancel) {
          setForm({
            title: ev.title || "",
            description: ev.description || "",
            date: start.date || "",
            startTime: start.time || "",
            endTime: end.time || "",
            location: ev.location || "",
            capacity: String(ev.capacity ?? ""),
            ticketType: ev.ticket_type || "free",
          });
        }
      } catch (e) {
        if (!cancel) setErr(e?.response?.data?.message || e.message || "Failed to load event");
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();
    return () => { cancel = true; };
  }, [eventId, BASE_URL]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
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
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Update failed");
      setToast({ type: "error", msg: "❌ Error updating event" });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  }

  if (loading) return <p style={{ padding: 24 }}>Loading event…</p>;
  if (err) {
    return (
      <div style={{ padding: 24, color: "#fff", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ background: "#3d1010", border: "1px solid #a43b3b", color: "#ffb5b5", padding: 12, borderRadius: 10 }}>
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
        <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required style={inputStyle} />
        <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} style={{ ...inputStyle, height: 100 }} />

        <input type="date" name="date" value={form.date} onChange={handleChange} required style={inputStyle} />

        <div style={{ display: "flex", gap: 8 }}>
          <input type="time" name="startTime" value={form.startTime} onChange={handleChange} style={{ ...inputStyle, flex: 1 }} />
          <input type="time" name="endTime" value={form.endTime} onChange={handleChange} style={{ ...inputStyle, flex: 1 }} />
        </div>

        <input name="location" placeholder="Location" value={form.location} onChange={handleChange} style={inputStyle} />
        <input type="number" name="capacity" placeholder="Capacity" value={form.capacity} onChange={handleChange} style={inputStyle} />

        <select name="ticketType" value={form.ticketType} onChange={handleChange} style={inputStyle}>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>

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
            marginTop: 6,
          }}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>

      <p style={{ marginTop: 10, color: "#888", textAlign: "center", fontSize: 13 }}>
        Organizer demo — GET/PUT {BASE_URL}/events/{eventId}
      </p>
    </div>
  );
}

const inputStyle = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #2b2b2b",
  background: "#1b1b1b",
  color: "white",
};
