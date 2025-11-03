// src/client/lib/api.ts
const API_BASE = (import.meta as any)?.env?.VITE_API_URL || "http://localhost:3000";

export function getAuthToken(): string | null {
  const raw = localStorage.getItem("token");
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (obj?.token) return obj.token;
    if (obj?.jwt) return obj.jwt;
    if (typeof obj === "string") return obj;
  } catch { return raw; }
  return null;
}

export type ValidateSuccess = {
  ok: true;
  status: "valid";
  attendee: { id?: string | number; name?: string; email?: string };
  ticket?: { id?: string | number; eventTitle?: string; status?: string };
};
export type ValidateFailure = {
  ok: false;
  status: "invalid" | "duplicate" | "error";
  message: string;
};

export async function validateTicket(qrData: string): Promise<ValidateSuccess | ValidateFailure> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/org/tickets/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ qrData }), 
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, status: data?.status || "error", message: data?.message || "Validation failed" };
    }
  return { ok: true, status: "valid", attendee: data.attendee ?? data.user ?? {}, ticket: data.ticket ?? {} };
}
