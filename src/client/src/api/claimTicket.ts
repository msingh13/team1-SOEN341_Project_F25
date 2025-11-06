// src/client/src/api/claimTicket.ts
import api from "../lib/api"; // axios instance that adds Authorization or X-User-Id

export type ClaimSuccess = {
  ticketId: number | string;
  eventId: number;
  qrToken?: string;
  claimedAt?: string;
};

export type ClaimErrorReason = "sold_out" | "already_claimed" | "unauthorized";

export class ClaimTicketError extends Error {
  reason: ClaimErrorReason;
  constructor(reason: ClaimErrorReason, message?: string) {
    super(message || reason);
    this.name = "ClaimTicketError";
    this.reason = reason;
  }
}

/**
 * Calls the backend: POST /events/:id/tickets
 * Backend response shape (per your server):
 *   { ticketId: <number>, qrToken: <string>, eventId: <number> }
 */
export async function claimTicket(eventId: number): Promise<ClaimSuccess> {
  try {
    const { data } = await api.post(`/events/${eventId}/tickets`, {});
    // normalize just in case
    return {
      ticketId: data.ticketId ?? data.id,
      eventId: data.eventId ?? eventId,
      qrToken: data.qrToken ?? data.qr_token,
      claimedAt: data.issued_at,
    };
  } catch (err: any) {
    const code = err?.response?.data?.code;
    if (code === "SOLD_OUT") throw new ClaimTicketError("sold_out", "Sold out");
    if (code === "ALREADY_CLAIMED") throw new ClaimTicketError("already_claimed", "You already claimed a ticket");
    if (err?.response?.status === 401 || err?.response?.status === 403) {
      throw new ClaimTicketError("unauthorized", "You must be signed in");
    }
    throw err;
  }
}
