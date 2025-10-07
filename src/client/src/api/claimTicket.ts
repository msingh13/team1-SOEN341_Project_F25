export type ClaimTicketResponse = {
  ticketId: number;
  eventId: number;
  qrToken: string;
};

export async function claimTicket(eventId: number): Promise<ClaimTicketResponse> {
  const base = import.meta.env.VITE_API_URL as string;
  const userId = import.meta.env.VITE_DEMO_USER_ID || "1";

  const res = await fetch(`${base}/events/${eventId}/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": String(userId),
    },
  });

  // surface useful errors
  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch {}

  if (!res.ok) {
    const code = data?.code || `HTTP_${res.status}`;
    const message = data?.message || "Unable to claim ticket";
    throw new Error(`${code}: ${message}`);
  }

  return data as ClaimTicketResponse;
}
