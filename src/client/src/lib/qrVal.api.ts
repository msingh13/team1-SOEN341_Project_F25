// src/client/lib/qrVal.api.ts
const API_BASE = (import.meta as any)?.env?.VITE_API_URL || "http://localhost:4000";

function getAuthToken(): string | null {
  return localStorage.getItem("token");
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

  // ✅ backend expects { token } and endpoint is /tickets/validate
  const res = await fetch(`${API_BASE}/tickets/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ token: qrData }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, status: data?.code === "DUPLICATE" ? "duplicate" : "error", message: data?.message || "Validation failed" };
  }

  // your controller returns: ticketId, eventId, userId, status, checkedInAt
  return {
    ok: true,
    status: "valid",
    attendee: { id: data.userId }, // you can extend later
    ticket: { id: data.ticketId, status: data.status },
  };
}
