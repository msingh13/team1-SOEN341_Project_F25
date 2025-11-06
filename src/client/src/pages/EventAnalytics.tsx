import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function EventAnalytics({ eventId }: { eventId: number }) {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/org/events/${eventId}/analytics`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Failed to fetch analytics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 10000);
    return () => clearInterval(interval);
  }, [eventId]);

  if (loading) return <p>Loading analytics…</p>;
  if (!data) return <p>No analytics available.</p>;

  const chartData = [
    { name: "Checked In", value: data.checkedIn },
    { name: "Remaining", value: data.remaining },
  ];
  const COLORS = ["#00C49F", "#FF8042"];

  return (
    <div style={{ padding: "1.5rem" }}>
      <h2>{data.title} — Analytics</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
        <div>
          <h3>Key Metrics</h3>
          <ul>
            <li>Total Tickets Issued: <b>{data.totalTickets}</b></li>
            <li>Checked In: <b>{data.checkedIn}</b></li>
            <li>Remaining Capacity: <b>{data.remaining}</b></li>
            <li>Attendance Rate: <b>{data.attendanceRate}%</b></li>
          </ul>
        </div>
        <PieChart width={300} height={300}>
          <Pie data={chartData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label>
            {chartData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>
    </div>
  );
}
