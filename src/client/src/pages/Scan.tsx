import { useEffect, useRef, useState } from "react";
import { validateTicket } from "../lib/qrVal.api"; // you already have this API helper

export default function Scan() {
  const [token, setToken] = useState("");
  const [result, setResult] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [supportsBarcode, setSupportsBarcode] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Feature-detect built-in BarcodeDetector (Chrome/Edge)
    // Fallback to manual paste if unsupported.
    // @ts-ignore
    setSupportsBarcode(Boolean(window.BarcodeDetector));
  }, []);

  async function onValidate(qrData: string) {
    setBusy(true);
    setResult("");
    try {
      const r = await validateTicket(qrData);
      if (r.ok) {
        setResult(`✅ VALID — ${r.attendee?.name ?? r.attendee?.email ?? "attendee"}; status: ${r.ticket?.status ?? "checked_in"}`);
      } else {
        setResult(r.status === "duplicate" ? "⚠️ Already checked-in (duplicate)" :
                  r.status === "invalid" ? "❌ Invalid" :
                  `❌ Error: ${r.message}`);
      }
    } catch (e: any) {
      setResult(`❌ Failed: ${e?.message ?? e}`);
    } finally {
      setBusy(false);
    }
  }

  async function onPasteSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = token.trim();
    if (!t) return;
    onValidate(t);
  }

  // Decode an uploaded image using the browser's BarcodeDetector if available
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!supportsBarcode) {
      setResult("Your browser doesn’t support camera/image QR decode. Paste the token instead.");
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = async () => {
      try {
        // @ts-ignore
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        const bitmap = await createImageBitmap(img);
        const codes = await detector.detect(bitmap);
        if (!codes.length) {
          setResult("No QR detected in image.");
          return;
        }
        const raw = codes[0].rawValue || "";
        setToken(raw);
        await onValidate(raw);
      } catch (err: any) {
        console.error(err);
        setResult("Failed to decode QR. Paste the token instead.");
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setResult("Could not load image.");
    };
    img.src = url;
    imgRef.current?.setAttribute("src", url);
  }

  return (
    <div className="container" style={{ padding: 24 }}>
      <h2>Scan / Validate Tickets</h2>
      <p className="muted" style={{ marginBottom: 12 }}>
        Upload a QR image (Chrome) or paste the token string.
      </p>

      <div className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
        <form onSubmit={onPasteSubmit} style={{ display: "flex", gap: 8 }}>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste QR token here…"
            style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #333", background: "#1c1c1c", color: "#fff" }}
          />
          <button className="btn" disabled={busy}>{busy ? "Checking…" : "Validate"}</button>
        </form>

        <div>
          <label className="muted">Or upload QR image (PNG/JPG):</label>
          <input type="file" accept="image/*" onChange={onFile} />
          <img ref={imgRef} alt="" style={{ display: "none" }} />
        </div>

        {result && (
          <div
            role="alert"
            className="card"
            style={{
              background: result.startsWith("✅") ? "#103d25" :
                         result.startsWith("⚠️") ? "#3d2e10" : "#3d1010",
              border: `1px solid ${result.startsWith("✅") ? "#1f8a4c" :
                                   result.startsWith("⚠️") ? "#8a6d1f" : "#a43b3b"}`,
              color: result.startsWith("✅") ? "#b5ffd4" :
                     result.startsWith("⚠️") ? "#ffe7a8" : "#ffb5b5",
              padding: 12, borderRadius: 10
            }}
          >
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
