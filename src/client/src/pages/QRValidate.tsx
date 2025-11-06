import { useState } from "react";

export default function QRValidate() {
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const [token, setToken] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function onValidate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/tickets/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json();
      setResult({ ok: res.ok, data });
    } catch (err) {
      setResult({ ok: false, data: { message: "Network error" } });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ padding: 20 }}>
      <h2>QR / Ticket Validation</h2>
      <form onSubmit={onValidate} style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={token}
          onChange={e=>setToken(e.target.value)}
          placeholder="Paste QR token here"
          style={{ flex: 1 }}
        />
        <button className="btn" disabled={loading || !token.trim()}>
          {loading ? "Checking…" : "Validate"}
        </button>
      </form>
      {result && (
        <div style={{ marginTop: 12 }}>
          {result.ok ? (
            <div className="card" style={{ background: "#103d25", border: "1px solid #1f8a4c", color: "#b5ffd4", padding: 12 }}>
              ✅ Checked in — Ticket #{result.data.ticketId}
            </div>
          ) : (
            <div className="card" style={{ background: "#3d1010", border: "1px solid #a43b3b", color: "#ffb5b5", padding: 12 }}>
              ❌ {result.data?.message || "Invalid"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
