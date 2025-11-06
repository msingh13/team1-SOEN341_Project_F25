import { useState, useEffect, useRef } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function QRValidate() {
  const [token, setToken] = useState("");
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Optional: use native BarcodeDetector if available (Chrome)
  useEffect(() => {
    let stop = false;
    (async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (!('BarcodeDetector' in window)) return;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const detector = new BarcodeDetector({ formats: ['qr_code'] });
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const v = videoRef.current!;
      v.srcObject = stream; await v.play();
      async function tick() {
        if (stop) return;
        try {
          const codes = await detector.detect(v);
          if (codes?.[0]?.rawValue) {
            setToken(codes[0].rawValue);
          }
        } catch {}
        requestAnimationFrame(tick);
      }
      tick();
    })();
    return () => { stop = true; videoRef.current?.srcObject && (videoRef.current.srcObject as MediaStream).getTracks().forEach(t=>t.stop()); };
  }, []);

  async function validate(tok: string) {
    setErr(null); setResult(null);
    try {
      const res = await fetch(`${API}/tickets/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ token: tok.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Validation failed');
      setResult(data);
    } catch (e:any) { setErr(e.message); }
  }

  return (
    <div className="container" style={{ padding: 24 }}>
      <h1 className="h2">Validate Ticket</h1>
      <div className="card" style={{ padding: 12, display: 'grid', gap: 8 }}>
        <input value={token} onChange={(e)=>setToken(e.target.value)} placeholder="Paste QR token…" />
        <button className="btn" onClick={()=>validate(token)} disabled={!token.trim()}>Validate</button>
        <video ref={videoRef} playsInline muted style={{ width: '100%', borderRadius: 8, border: '1px solid #333' }} />
      </div>
      {err && <p style={{ color: '#ffb5b5' }}>{err}</p>}
      {result && (
        <div className="card" style={{ marginTop: 12, padding: 12 }}>
          <b>Checked in!</b>
          <div>Ticket #{result.ticketId}</div>
          <div>Event #{result.eventId}</div>
          <div>User #{result.userId}</div>
          <div>When: {new Date(result.checkedInAt).toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}
