export type ClaimSuccess = {
  ticketId: string;
  eventId: string;
  claimedAt: string;
  seat?: string;
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

export async function claimTicket(eventId: string): Promise<ClaimSuccess> {
  // simulate network delay so you see loading
  await new Promise((r) => setTimeout(r, 600));

  // 👇 Trigger different errors by eventId suffix (easy to test)
  if (eventId.endsWith("_sold")) {
    throw new ClaimTicketError("sold_out", "Sorry, this event is sold out.");
  }
  if (eventId.endsWith("_dup")) {
    throw new ClaimTicketError("already_claimed", "You already claimed a ticket.");
  }
  if (eventId.endsWith("_unauth")) {
    throw new ClaimTicketError("unauthorized", "You must be signed in.");
  }

  // success
  return {
    ticketId: "t_" + Math.random().toString(36).slice(2, 8),
    eventId,
    claimedAt: new Date().toISOString(),
    seat: "GA",
  };
}
