// src/pages/admin/AdminHome.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

type ByDay = { day: string; issued: number };
type Stats = {
  total_events: number;
  total_tickets: number;
  total_users: number;
  issued_today: number;
  participation_rate: number; 
  by_day: ByDay[];
};

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function AdminHome() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch(`${API}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(await res.text());
        const data: Stats = await res.json();
        if (!cancel) setStats(data);
      } catch (e: any) {
        if (!cancel) setErr(e?.message || "Failed to load stats");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  const maxIssued = useMemo(
    () => Math.max(1, ...(stats?.by_day.map(d => d.issued) ?? [1])),
    [stats]
  );

  if (loading) return <div className="container" style={{ paddingTop: 24 }}>Loading admin stats…</div>;
  if (err) return <div className="container" style={{ paddingTop: 24, color: "tomato" }}>{err}</div>;
  if (!stats) return <div className="container" style={{ paddingTop: 24 }}>No data.</div>;

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <header className="card-header" style={{ marginBottom: 12 }}>
        <div>
          <h1 className="h2">Admin Dashboard</h1>
          <p className="muted">Platform-wide overview at a glance.</p>
        </div>
        <nav style={{ display: "flex", gap: 8 }}>
          <Link className="btn btn-ghost" to="/admin/moderation">Moderation</Link>
          <Link className="btn btn-ghost" to="/admin/organizers">Organizer Approvals</Link>
          <Link className="btn btn-ghost" to="/admin/orgs">Organizations</Link>
          <Link className="btn btn-ghost" to="/admin/waitlist-policy">Waitlist Policy</Link>
        </nav>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginBottom: 16 }}>
        <KPI label="Total Events" value={stats.total_events} />
        <KPI label="Total Tickets" value={stats.total_tickets} />
        <KPI label="Total Users" value={stats.total_users} />
        <KPI label="Tickets Issued Today" value={stats.issued_today} />
        <KPI label="Participation Rate" value={`${stats.participation_rate}%`} />
      </section>

      <section className="card" style={{ padding: 16 }}>
        <h3 className="h3" style={{ marginBottom: 8 }}>Tickets Issued by Day</h3>
        {stats.by_day.length === 0 ? (
          <p className="muted">No issuance yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {stats.by_day.map((d) => (
              <div key={d.day}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span className="muted">{d.day}</span>
                  <span>{d.issued}</span>
                </div>
                <div style={{ background: "#222", height: 8, borderRadius: 4 }}>
                  <div
                    style={{
                      height: 8,
                      width: `${Math.round((d.issued / maxIssued) * 100)}%`,
                      background: "#7c3aed",
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="muted" style={{ fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
