import { useEffect, useState } from "react";
export default function AdminStats() {
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const [stats, setStats] = useState<{events:number; tickets:number; checkedIn:number} | null>(null);
  useEffect(() => {
    (async () => {
      const res = await fetch(`${API}/admin/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` },
      });
      const data = await res.json();
      setStats(data);
    })();
  }, []);
  if (!stats) return <div className="container">Loading…</div>;
  return (
    <div className="container" style={{ padding: 20 }}>
      <h2>Platform Analytics</h2>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
        <Stat label="Events" value={stats.events}/>
        <Stat label="Tickets Issued" value={stats.tickets}/>
        <Stat label="Checked In" value={stats.checkedIn}/>
      </div>
    </div>
  );
}
function Stat({label,value}:{label:string;value:number}) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="muted">{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
    </div>
  );
}
