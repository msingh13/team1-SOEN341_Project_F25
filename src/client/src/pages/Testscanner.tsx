// src/client/pages/TestScanner.tsx
import { useEffect } from "react";
// ✅ Import default export and grab the class from it:
import { Html5QrcodeScanner } from "html5-qrcode";

export default function TestScanner() {
  useEffect(() => {
    // initialize scanner instance
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      },
      /* verbose= */ false
    );

    // render live scanner
    scanner.render(
      (decodedText) => {
        console.log("✅ Scanned:", decodedText);
        alert(`Scanned QR text: ${decodedText}`);
      },
      (errorMessage) => {
        // this fires repeatedly for decode failures — safe to ignore
        console.warn(errorMessage);
      }
    );

    // cleanup when unmounting
    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Camera Test</h1>
      <div id="qr-reader" style={{ width: "300px" }} />
    </div>
    
  );
}
