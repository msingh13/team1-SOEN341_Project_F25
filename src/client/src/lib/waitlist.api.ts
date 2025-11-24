// src/lib/waitlist.api.ts
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export type WaitlistStatus = "WAITING" | "PROMOTED" | "REMOVED";

export interface WaitlistEntry {
  id: string;
  userId: string;
  attendeeName: string;
  joinedAt: string; // ISO string
  status: WaitlistStatus;
}

export async function fetchWaitlist(eventId: string, token?: string) {
  const res = await axios.get<WaitlistEntry[]>(
    `${BASE_URL}/organizer/events/${eventId}/waitlist`,
    {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    }
  );
  return res.data;
}

export async function promoteFromWaitlist(
  eventId: string,
  entryId: string,
  token?: string
) {
  const res = await axios.post<WaitlistEntry>(
    `${BASE_URL}/organizer/events/${eventId}/waitlist/${entryId}/promote`,
    {},
    {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    }
  );
  return res.data;
}

export async function removeFromWaitlist(
  eventId: string,
  entryId: string,
  token?: string
) {
  const res = await axios.delete(
    `${BASE_URL}/organizer/events/${eventId}/waitlist/${entryId}`,
    {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    }
  );
  return res.data;
}
