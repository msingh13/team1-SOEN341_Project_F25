// src/pages/EventAnalytics.tsx
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

type Analytics = {
  title: string;
  totalTickets: number;
  checkedIn: number;
  remaining: number;
  attendanceRate: number; // 0-100
};

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const DEV_USER_ID = import.meta.env.VITE_DEV_USER_ID || "4";

export default function EventAnalytics({ eventId }: { eventId: number }) {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const headers: Record<string, string> = {};
      const token = localStorage.getItem("token");
      if (token) headers.Authorization = `Bearer ${token}`;
      else headers["X-User-Id"] = DEV_USER_ID;

      const res = await fetch(`${API}/api/org/events/${eventId}/analytics`, { headers });
      if (!res.ok) throw new Error((await res.json())?.message || `HTTP ${res.status}`);

      const json = await res.json();
      setData({
        title: json.title ?? `Event #${eventId}`,
        totalTickets: Number(json.totalTickets ?? json.tickets_issued ?? 0),
        checkedIn: Number(json.checkedIn ?? json.tickets_checked_in ?? 0),
        remaining: Number(json.remaining ?? json.remaining_capacity ?? 0),
        attendanceRate: Number(json.attendanceRate ?? json.attendance_rate ?? 0),
      });
    } catch (e: any) {
      setErr(e?.message || "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [eventId]);

  async function exportCSV() {
    try {
      const headers: Record<string, string> = {};
      const token = localStorage.getItem("token");
      if (token) headers.Authorization = `Bearer ${token}`;
      else headers["X-User-Id"] = DEV_USER_ID;

      const res = await fetch(`${API}/api/org/events/${eventId}/attendees.csv`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `event_${eventId}_attendees.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Export failed");
      console.error(e);
    }
  }

  if (loading) return <p style={{ padding: 20 }}>Loading analytics…</p>;
  if (err) return <p style={{ padding: 20, color: "#ffb5b5" }}>{err}</p>;
  if (!data) return <p style={{ padding: 20 }}>No analytics available.</p>;

  // ---- Fix: chart shows Checked In vs Not Checked In (issued tickets) ----
  const notCheckedIn = Math.max(0, data.totalTickets - data.checkedIn);
  const chartTotal = data.checkedIn + notCheckedIn;

  const chartData =
    chartTotal === 0
      ? []
      : [
          { name: "Checked In", value: data.checkedIn },
          { name: "Not Checked In", value: notCheckedIn },
        ];

  const COLORS = ["#a855ff", "#22c55e"];

  return (
    <div className="container" style={{ padding: 24 }}>
      <header
        className="card-header"
        style={{
          marginBottom: 16,
          borderRadius: 16,
          border: "1px solid rgba(148,163,184,0.25)",
          background:
            "radial-gradient(circle at top left, rgba(168,85,247,0.25), transparent 55%)",
        }}
      >
        <div>
          <h2 className="h2" style={{ margin: 0 }}>
            {data.title} — Analytics
          </h2>
          <p className="muted">Live stats for attendance and capacity.</p>
        </div>
        <button className="btn" onClick={exportCSV}>
          Export Attendees CSV
        </button>
      </header>

      <div
        className="card"
        style={{
          padding: 20,
          display: "grid",
          gap: 24,
          gridTemplateColumns: "minmax(260px, 420px) 1fr",
          borderRadius: 20,
        }}
      >
        <div>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Key Metrics</h3>
          <ul style={{ lineHeight: 1.8, listStyle: "none", paddingLeft: 0, margin: 0 }}>
            <li>
              Total Tickets Issued: <b>{data.totalTickets}</b>
            </li>
            <li>
              Checked In: <b>{data.checkedIn}</b>
            </li>
            <li>
              Not Checked In: <b>{notCheckedIn}</b>
            </li>
            <li>
              Remaining Capacity: <b>{data.remaining}</b>
            </li>
            <li>
              Attendance Rate: <b>{data.attendanceRate}%</b>
            </li>
          </ul>
        </div>

        <div style={{ height: 280 }}>
          {chartTotal === 0 ? (
            <div className="muted" style={{ paddingTop: 40, textAlign: "center" }}>
              No attendees yet — chart will appear once tickets are used.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#020617",
                    border: "1px solid rgba(148,163,184,0.4)",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
