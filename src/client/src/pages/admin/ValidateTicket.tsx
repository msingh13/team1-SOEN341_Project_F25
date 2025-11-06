// src/client/pages/admin/ValidateTicket.tsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { BrowserQRCodeReader } from "@zxing/browser";
import { validateTicket, type ValidateFailure, type ValidateSuccess } from "../../lib/qrVal.api.ts";

type Mode = "scan" | "upload";

function Pill({ kind, children }: { kind: "success" | "error" | "warn"; children: React.ReactNode }) {
  const styles: Record<string, React.CSSProperties> = {
    success: { background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065F46" },
    error:   { background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B" },
    warn:    { background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" },
  };
  return <div style={{ ...styles[kind], padding: 10, borderRadius: 8, fontWeight: 500 }}>{children}</div>;
}

export default function ValidateTicket() {
  const [mode, setMode] = useState<Mode>("scan");
  const [loading, setLoading] = useState(false);
  const [rawQR, setRawQR] = useState<string | null>(null);
  const [result, setResult] = useState<ValidateSuccess | ValidateFailure | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const reader = useMemo(() => new BrowserQRCodeReader(), []);

  const runValidation = useCallback(async (qrText: string) => {
    if (!qrText) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setRawQR(qrText);
    try {
      const res = await validateTicket(qrText);
      setResult(res);
      if (!res.ok) setError(res.message || "Invalid or duplicate ticket");
    } catch {
      setError("Network or server error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Live scanner using html5-qrcode (no React wrapper)
  useEffect(() => {
    if (mode !== "scan") return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        aspectRatio: 1.0,
      },
      false
    );

    let last = ""; // debounce same QR
    scanner.render(
      (decodedText /*, decodedResult*/) => {
        if (decodedText && decodedText !== last) {
          last = decodedText;
          void runValidation(decodedText);
        }
      },
      (_err) => { /* ignore frame errors */ }
    );

    return () => {
      // clean up camera and DOM node when leaving the page or switching mode
      scanner.clear().catch(() => {});
    };
  }, [mode, runValidation]);

  // Decode uploaded image → validate (ZXing)
  async function onUploadChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    try {
      const decodeResult = await reader.decodeFromImageUrl(url);
      const text = decodeResult?.getText?.();
      if (text) await runValidation(text);
      else setError("Could not read a QR code from that image.");
    } catch {
      setError("Could not read a QR code from that image.");
    } finally {
      URL.revokeObjectURL(url);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "1rem" }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>QR Ticket Validation</h1>
      <p style={{ color: "#555", marginBottom: 16 }}>
        Scan with your camera or upload an image to validate a ticket.
      </p>

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          onClick={() => setMode("scan")}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            background: mode === "scan" ? "#111" : "#eee",
            color: mode === "scan" ? "#fff" : "#111",
            cursor: "pointer",
          }}
        >
          Live Scan
        </button>
        <button
          onClick={() => setMode("upload")}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            background: mode === "upload" ? "#111" : "#eee",
            color: mode === "upload" ? "#fff" : "#111",
            cursor: "pointer",
          }}
        >
          Upload Image
        </button>
      </div>

      {/* Scanner or Uploader */}
      {mode === "scan" ? (
        <div style={{ borderRadius: 14, overflow: "hidden", marginBottom: 16, maxWidth: 520 }}>
          <div id="qr-reader" style={{ width: "100%" }} />
        </div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={onUploadChange} />
        </div>
      )}

      
      {loading && <Pill kind="warn">Validating…</Pill>}
      {!loading && error && <Pill kind="error">❌ {error}</Pill>}
      {!loading && result && result.ok && <Pill kind="success">✅ Valid ticket</Pill>}
      {!loading && result && !result.ok && !error && (
        <Pill kind={result.status === "duplicate" ? "warn" : "error"}>
          {result.status === "duplicate" ? "⚠️ Already checked-in" : "❌ Invalid ticket"}
        </Pill>
      )}

      {/* Details (valid only) */}
      {!loading && result && result.ok && (
        <div style={{ marginTop: 12, border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
          {rawQR && (
            <div style={{ fontSize: 12, wordBreak: "break-all", marginBottom: 6 }}>
              <span style={{ color: "#6b7280" }}>QR Data:</span>{" "}
              <span style={{ fontFamily: "monospace" }}>{rawQR}</span>
            </div>
          )}
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Attendee</div>
            <div style={{ fontSize: 16 }}>
              {(result as ValidateSuccess).attendee?.name ?? "Unknown"}
              {(result as ValidateSuccess).attendee?.email ? ` • ${(result as ValidateSuccess).attendee!.email}` : ""}
            </div>
          </div>
          {(result as ValidateSuccess).ticket?.eventTitle && (
            <div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>Event</div>
              <div style={{ fontSize: 16 }}>{(result as ValidateSuccess).ticket!.eventTitle}</div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 12, color: "#6B7280" }}>
        • On iOS Safari, camera access requires HTTPS or localhost. Use “Upload Image” if camera is blocked.
      </div>
    </div>
  );
}
