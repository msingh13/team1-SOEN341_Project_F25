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
        totalTickets: Number(json.totalTickets ?? 0),
        checkedIn: Number(json.checkedIn ?? 0),
        remaining: Number(json.remaining ?? 0),
        attendanceRate: Number(json.attendanceRate ?? 0),
      });
    } catch (e: any) {
      setErr(e?.message || "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [eventId]);

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
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }

  if (loading) return <p style={{ padding: 20 }}>Loading analytics…</p>;
  if (err) return <p style={{ padding: 20, color: "#ffb5b5" }}>{err}</p>;
  if (!data) return <p style={{ padding: 20 }}>No analytics available.</p>;

  const chartData = [
    { name: "Checked In", value: data.checkedIn },
    { name: "Remaining", value: Math.max(0, data.remaining) },
  ];

  return (
    <div className="container" style={{ padding: 20 }}>
      <header className="card-header" style={{ marginBottom: 12 }}>
        <div>
          <h2 className="h2" style={{ margin: 0 }}>{data.title} — Analytics</h2>
          <p className="muted">Live stats for attendance and capacity.</p>
        </div>
        <button className="btn" onClick={exportCSV}>Export Attendees CSV</button>
      </header>

      <div className="card" style={{ padding: 16, display: "grid", gap: 16, gridTemplateColumns: "minmax(260px, 420px) 1fr" }}>
        <div>
          <h3>Key Metrics</h3>
          <ul style={{ lineHeight: 1.8 }}>
            <li>Total Tickets Issued: <b>{data.totalTickets}</b></li>
            <li>Checked In: <b>{data.checkedIn}</b></li>
            <li>Remaining Capacity: <b>{data.remaining}</b></li>
            <li>Attendance Rate: <b>{data.attendanceRate}%</b></li>
          </ul>
        </div>

        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="value" outerRadius={110} label>
                {chartData.map((_, i) => <Cell key={i} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
