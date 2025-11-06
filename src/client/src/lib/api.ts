// src/lib/api.ts
// -------------------------------------------------------------
// Centralized backend API helpers (Save/Unsave + My Saves).
// Reads base URL and dev user ID from Vite env, with safe fallbacks.
// Adds a request timeout to avoid hanging UI during demo.
// -------------------------------------------------------------

let API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
let DEV_USER_ID = import.meta.env.VITE_DEV_USER_ID || "3";
const DEFAULT_TIMEOUT_MS = 8000;

// Optional runtime switches (handy for demos/tests)
export function setApiBase(url: string) { API_BASE = url.replace(/\/+$/, ""); }
export function setDevUser(id: string)   { DEV_USER_ID = id; }

// Custom error type
interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

// Core fetch helper with timeout
async function http(method: string, path: string, body?: unknown): Promise<any> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-user-id": DEV_USER_ID, // dev auth header (backend should accept this)
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text();
    const data = text ? safeJson(text) : null;

    if (!res.ok) {
      const err: ApiError = new Error((data && data.message) || `HTTP ${res.status}`);
      err.status = res.status;
      err.code = (data && data.code) as string | undefined;
      err.details = data?.details;
      throw err;
    }
    return data;
  } catch (e: any) {
    if (e?.name === "AbortError") {
      const err: ApiError = new Error("Request timed out");
      err.code = "TIMEOUT";
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(t);
  }
}

function safeJson(text: string) {
  try { return JSON.parse(text); } catch { return null; }
}

// -------------------------------------------------------------
// Save / Unsave / List APIs
// -------------------------------------------------------------
export function saveEvent(eventId: number | string) {
  return http("POST", `/events/${eventId}/save`);
}

export function unsaveEvent(eventId: number | string) {
  return http("DELETE", `/events/${eventId}/save`);
}

export function listMySaves() {
  return http("GET", `/me/saves`);
}

export async function isEventSaved(eventId: number | string): Promise<boolean> {
  const data = await listMySaves();
  return data?.items?.some((e: any) => String(e.id) === String(eventId)) ?? false;
}
