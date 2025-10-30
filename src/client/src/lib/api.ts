// src/lib/api.ts
// Mock API for demo (in-memory + localStorage)

export type EventItem = {
  id: string;                // use string ids: "e1", "e2", ...
  title: string;
  description?: string;
  category: "Academic" | "Sports" | "Club" | "Career" | "Social";
  organizer: string;
  location: string;
  start_time: string;        // ISO
  end_time?: string;         // ISO
};

export type ClaimSuccess = {
  ticketId: string;
  eventId: string;
  claimedAt: string;
  qr: string;                // payload for QR
};

export type SavedEventWire = {
  id: string;                // same as EventItem.id
  title: string;
  location?: string;
  start_time?: string;
  end_time?: string | null;
};

// -------------------------------------
// Demo catalog (add more if you want)
// -------------------------------------
const now = Date.now();
const H = (h: number) => 1000 * 60 * 60 * h;

const demoEvents: EventItem[] = [
  {
    id: "e1",
    title: "Welcome Back Fair",
    description: "Clubs, swag, and free snacks on the quad.",
    category: "Social",
    organizer: "CSU",
    location: "Quad",
    start_time: new Date(now + H(24)).toISOString(),
  },
  {
    id: "e2",
    title: "AI Career Night",
    description: "Meet recruiters and alumni working in ML/AI.",
    category: "Career",
    organizer: "IEEE",
    location: "Hall Building H-110",
    start_time: new Date(now + H(48)).toISOString(),
    end_time: new Date(now + H(50)).toISOString(),
  },
  {
    id: "e3",
    title: "Hackathon Kickoff",
    description: "48-hour hack, teams of 4–5, prizes for top 3.",
    category: "Academic",
    organizer: "ECA",
    location: "EV 11.119",
    start_time: new Date(now + H(72)).toISOString(),
  },
  {
    id: "e4",
    title: "Intramural Basketball Tryouts",
    description: "Open gym & assessments.",
    category: "Sports",
    organizer: "Sports Union",
    location: "Gym A",
    start_time: new Date(now + H(96)).toISOString(),
  },
  {
    id: "e5",
    title: "UX Design Meetup",
    description: "Lightning talks + portfolio reviews.",
    category: "Career",
    organizer: "Design Society",
    location: "MB 2.130",
    start_time: new Date(now + H(120)).toISOString(),
  },
];

// -------------------------------------
// localStorage helpers
// -------------------------------------
const LS_SAVED = "ce_saved_events";
const LS_TICKETS = "ce_claimed_tickets";

function readSaved(): SavedEventWire[] {
  try {
    const raw = localStorage.getItem(LS_SAVED);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeSaved(items: SavedEventWire[]) {
  localStorage.setItem(LS_SAVED, JSON.stringify(items));
}

function readTickets(): ClaimSuccess[] {
  try {
    const raw = localStorage.getItem(LS_TICKETS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeTickets(items: ClaimSuccess[]) {
  localStorage.setItem(LS_TICKETS, JSON.stringify(items));
}

// -------------------------------------
// Event listing + filters
// -------------------------------------
export async function listEvents(params: {
  q?: string;
  org?: string;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD (inclusive)
  page?: number;
  limit?: number;
  category?: string[] | string;
} = {}) {
  // simulate network
  await new Promise((r) => setTimeout(r, 200));

  const {
    q, org, from, to, page = 1, limit = 12, category,
  } = params;

  let items = [...demoEvents];

  // keyword in title/description
  if (q && q.trim()) {
    const t = q.toLowerCase();
    items = items.filter(
      (e) =>
        e.title.toLowerCase().includes(t) ||
        (e.description || "").toLowerCase().includes(t)
    );
  }

  // org filter
  if (org) {
    items = items.filter((e) => e.organizer === org);
  }

  // category filter (single or multi)
  if (category) {
    const set = new Set(Array.isArray(category) ? category : [category]);
    items = items.filter((e) => set.has(e.category));
  }

  // date range; 'to' is inclusive end-of-day
  const fromMs = from ? new Date(from + "T00:00:00").getTime() : null;
  const toMs = to ? new Date(to + "T23:59:59").getTime() : null;

  if (fromMs) items = items.filter((e) => new Date(e.start_time).getTime() >= fromMs);
  if (toMs) items = items.filter((e) => new Date(e.start_time).getTime() <= toMs);

  const total = items.length;
  const start = (page - 1) * limit;
  const paged = items.slice(start, start + limit);

  return { items: paged, total, page, limit };
}

export async function getEvent(id: string): Promise<EventItem | null> {
  await new Promise((r) => setTimeout(r, 120));
  return demoEvents.find((e) => e.id === id) || null;
}

// -------------------------------------
// Save to "calendar" (your Saved box)
// -------------------------------------
export async function saveToCalendar(eventId: string) {
  await new Promise((r) => setTimeout(r, 120));
  const ev = demoEvents.find((e) => e.id === eventId);
  if (!ev) throw new Error("Event not found");

  const items = readSaved();
  if (!items.some((x) => x.id === ev.id)) {
    items.push({
      id: ev.id,
      title: ev.title,
      location: ev.location,
      start_time: ev.start_time,
      end_time: ev.end_time ?? null,
    });
    writeSaved(items);
  }
  return { ok: true };
}

export async function unsaveFromCalendar(eventId: string) {
  await new Promise((r) => setTimeout(r, 120));
  writeSaved(readSaved().filter((x) => x.id !== eventId));
  return { ok: true };
}

export async function listSavedEvents(): Promise<{ items: SavedEventWire[] }> {
  await new Promise((r) => setTimeout(r, 120));
  return { items: readSaved() };
}

// -------------------------------------
// Tickets
// -------------------------------------
export async function claimTicket(eventId: string): Promise<ClaimSuccess> {
  await new Promise((r) => setTimeout(r, 300));
  const ev = demoEvents.find((e) => e.id === eventId);
  if (!ev) throw new Error("Event not found");

  const ticket: ClaimSuccess = {
    ticketId: "t_" + Math.random().toString(36).slice(2, 8),
    eventId,
    claimedAt: new Date().toISOString(),
    qr: JSON.stringify({
      type: "CE_TICKET",
      ticketId: "t_" + Math.random().toString(36).slice(2, 8),
      eventId,
      issuedAt: Date.now(),
    }),
  };

  const all = readTickets();
  all.unshift(ticket);
  writeTickets(all);
  return ticket;
}

export async function listTickets(): Promise<{ tickets: ClaimSuccess[] }> {
  await new Promise((r) => setTimeout(r, 120));
  return { tickets: readTickets() };
}
