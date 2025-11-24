// src/components/admin/WaitlistPolicyForm.tsx
import React, { useState, type FormEvent } from "react";
import type { WaitlistPolicy } from "../lib/adminWaitlistPolicy.api";

interface WaitlistPolicyFormProps {
  initialPolicy: WaitlistPolicy | null;
  onSubmit: (data: {
    maxSize: number | null;
    autoPromote: boolean;
    enabled: boolean;
  }) => Promise<void> | void;
  submitting?: boolean;
}

const WaitlistPolicyForm: React.FC<WaitlistPolicyFormProps> = ({
  initialPolicy,
  onSubmit,
  submitting = false,
}) => {
  const [maxSizeInput, setMaxSizeInput] = useState<string>(
    initialPolicy?.maxSize != null ? String(initialPolicy.maxSize) : ""
  );
  const [autoPromote, setAutoPromote] = useState<boolean>(
    initialPolicy?.autoPromote ?? false
  );
  const [enabled, setEnabled] = useState<boolean>(
    initialPolicy?.enabled ?? true
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    let maxSize: number | null = null;
    if (maxSizeInput.trim() !== "") {
      const parsed = Number(maxSizeInput);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setError("Max waitlist size must be a positive number or left blank.");
        return;
      }
      maxSize = parsed;
    }

    try {
      await onSubmit({
        maxSize,
        autoPromote,
        enabled,
      });
      setSuccess("Waitlist policy updated successfully.");
    } catch (err) {
      console.error("Failed to update policy", err);
      setError("Failed to update waitlist policy. Please try again.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-slate-700 bg-[#121212] p-4"
    >
      <h2 className="text-lg font-semibold">Waitlist Policy</h2>
      <p className="text-xs text-slate-400">
        Configure global defaults for how event waitlists behave across the
        platform.
      </p>

      {error && (
        <div className="rounded-md border border-red-500 bg-red-950 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md border border-emerald-500 bg-emerald-950 px-3 py-2 text-xs text-emerald-200">
          {success}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium">
          Max waitlist size (blank = unlimited)
        </label>
        <input
          type="number"
          min={1}
          inputMode="numeric"
          value={maxSizeInput}
          onChange={(e) => setMaxSizeInput(e.target.value)}
          className="w-full rounded-md border border-slate-600 bg-black px-3 py-2 text-sm outline-none focus:border-sky-500"
          placeholder="e.g. 100"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="autoPromote"
          type="checkbox"
          checked={autoPromote}
          onChange={(e) => setAutoPromote(e.target.checked)}
          className="h-4 w-4 rounded border-slate-600 bg-black"
        />
        <label htmlFor="autoPromote" className="text-sm">
          Automatically promote attendees from waitlist when seats open
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="enabled"
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-slate-600 bg-black"
        />
        <label htmlFor="enabled" className="text-sm">
          Waitlist enabled globally
        </label>
      </div>

      {initialPolicy?.updatedAt && (
        <p className="text-[11px] text-slate-500">
          Last updated:{" "}
          {new Date(initialPolicy.updatedAt).toLocaleString() || "—"}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md border border-sky-500 px-4 py-2 text-sm font-medium text-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save Policy"}
        </button>
      </div>
    </form>
  );
};

export default WaitlistPolicyForm;
