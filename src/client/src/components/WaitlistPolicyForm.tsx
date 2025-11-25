// src/components/admin/WaitlistPolicyForm.tsx
import React, { useState, type FormEvent } from "react";
import type { WaitlistPolicy } from "../lib/adminWaitlistPolicy.api";

interface WaitlistPolicyFormProps {
  initialPolicy: WaitlistPolicy | null;
  submitting?: boolean;
  onSubmit: (data: {
    maxSize: number | null;
    autoPromote: boolean;
    enabled: boolean;
  }) => Promise<void> | void;

  /** 🔥 optional shared style injection */
  inputStyle?: React.CSSProperties;
}

const WaitlistPolicyForm: React.FC<WaitlistPolicyFormProps> = ({
  initialPolicy,
  onSubmit,
  submitting = false,
  inputStyle,
}) => {
  const mergedInput = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #2f2f2f",
    background: "#151515",
    color: "white",
    fontSize: 14,
    ...inputStyle,
  };

  const [maxSizeInput, setMaxSizeInput] = useState(
    initialPolicy?.maxSize ? String(initialPolicy.maxSize) : ""
  );
  const [autoPromote, setAutoPromote] = useState(
    initialPolicy?.autoPromote ?? false
  );
  const [enabled, setEnabled] = useState(initialPolicy?.enabled ?? true);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    let maxSize: number | null = null;

    if (maxSizeInput.trim()) {
      const num = Number(maxSizeInput);
      if (!Number.isFinite(num) || num <= 0) {
        return setError("Max size must be positive or blank.");
      }
      maxSize = num;
    }

    await onSubmit({ maxSize, autoPromote, enabled });
    setSuccess("Policy updated.");
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#121212",
        border: "1px solid #2b2b2b",
        borderRadius: 10,
        padding: 20,
      }}
    >
      <h2 style={{ fontSize: 18, marginBottom: 4 }}>Waitlist Policy</h2>
      <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>
        Configure global defaults for waitlist behavior.
      </p>

      {error && (
        <div
          style={{
            background: "#3b0d0d",
            border: "1px solid #b12d2d",
            padding: "8px 12px",
            borderRadius: 6,
            fontSize: 12,
            color: "#fca5a5",
            marginBottom: 10,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            background: "#062a17",
            border: "1px solid #0f8a47",
            padding: "8px 12px",
            borderRadius: 6,
            fontSize: 12,
            color: "#bbf7d0",
            marginBottom: 10,
          }}
        >
          {success}
        </div>
      )}

      {/* Max size */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 14 }}>Max waitlist size</label>
        <input
          type="number"
          value={maxSizeInput}
          onChange={(e) => setMaxSizeInput(e.target.value)}
          placeholder="blank = unlimited"
          style={mergedInput}
        />
      </div>

      {/* Auto promote */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          type="checkbox"
          checked={autoPromote}
          onChange={(e) => setAutoPromote(e.target.checked)}
        />
        <label style={{ fontSize: 14 }}>
          Automatically promote when space opens
        </label>
      </div>

      {/* Enabled */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        <label style={{ fontSize: 14 }}>Enable waitlists globally</label>
      </div>

      {initialPolicy?.updatedAt && (
        <p style={{ fontSize: 11, color: "#7f7f7f", marginBottom: 10 }}>
          Last updated: {new Date(initialPolicy.updatedAt).toLocaleString()}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: "8px 16px",
          borderRadius: 6,
          background: "#2563eb",
          border: "none",
          color: "white",
          cursor: "pointer",
          opacity: submitting ? 0.6 : 1,
        }}
      >
        {submitting ? "Saving…" : "Save Policy"}
      </button>
    </form>
  );
};

export default WaitlistPolicyForm;
