// src/lib/api.ts
// -------------------------------------------------------------
// Centralized backend API helpers.
// - Reads base URL and dev user ID from Vite env (with safe fallbacks)
// - Adds Authorization: Bearer <token> if present (dev login)
// - Falls back to X-User-Id for demo/dev if no token is set
// - Exposes both a fetch-based helper (http) and a configured axios instance
// -------------------------------------------------------------

import axios, { type AxiosInstance } from "axios";

// Env + defaults
let API_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:4000";
let DEV_USER_ID = (import.meta.env.VITE_DEV_USER_ID as string) || "3";
const DEFAULT_TIMEOUT_MS = 8000;

// Optional runtime switches (handy for demos/tests)
export function setApiBase(url: string) {
  API_BASE = url.replace(/\/+$/, "");
  api.defaults.baseURL = API_BASE;
}
export function setDevUser(id: string) {
  DEV_USER_ID = id;
}

// Util: parse JSON safely
function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// Core fetch helper with timeout + auth headers
// -------------------------------------------------------------
interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

export async function http(method: string, path: string, body?: unknown): Promise<any> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  // Build headers: prefer Bearer token; fallback to dev X-User-Id
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else if (DEV_USER_ID) {
    headers["X-User-Id"] = DEV_USER_ID;
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text();
    const data = text ? safeJson(text) : null;

    if (!res.ok) {
      const err: ApiError = new Error((data && (data.message as string)) || `HTTP ${res.status}`);
      err.status = res.status;
      err.code = (data && (data.code as string)) || undefined;
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

// -------------------------------------------------------------
// Axios instance (for screens that prefer axios)
// -------------------------------------------------------------
const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
});

// Attach Authorization or X-User-Id automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  config.headers = config.headers ?? {};
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  } else if (DEV_USER_ID) {
    (config.headers as any)["X-User-Id"] = DEV_USER_ID;
  }
  return config;
});



export default api;

// -------------------------------------------------------------
// Save / Unsave / List APIs (using fetch-based http())
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
  const items = Array.isArray(data) ? data : data?.items ?? [];
  return items.some((e: any) => String(e.id) === String(eventId));
}
