// src/lib/api.ts
// -------------------------------------------------------------
// Purpose:
//   Centralized helper functions for calling the backend API.
//
// Description:
//   Handles HTTP requests for the Save/Unsave feature (Task STU-03-FE).
//   Includes helper methods for all endpoints:
//     - POST /events/:id/save
//     - DELETE /events/:id/save
//     - GET /me/saves
//
// Notes:
//   - Uses fetch() with consistent error handling
//   - Sends a dev-only "x-user-id" header (since real auth isn't built yet)
// -------------------------------------------------------------

// Base URL for backend API (from .env)
const BASE_URL: string = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Temporary "logged-in" user for local testing
const DEV_USER_ID: string = import.meta.env.VITE_DEV_USER_ID || "3";

// Custom error interface (adds extra properties to normal Error)
interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

// Generic helper for all HTTP calls
async function http(method: string, path: string, body?: any): Promise<any> {
  // Send the HTTP request
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-user-id": DEV_USER_ID, // local dev authentication
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Parse response body (may be JSON or empty)
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // ignore parse errors, leave data as null
  }

  // Handle failed requests with uniform error shape
  if (!res.ok) {
    const err: ApiError = new Error((data && data.message) || `HTTP ${res.status}`);
    err.status = res.status;
    err.code = data?.code;
    err.details = data?.details;
    throw err;
  }

  // Return parsed data for successful requests
  return data;
}

// -------------------------------------------------------------
// STU-03 API ENDPOINTS
// -------------------------------------------------------------

// Save an event for the current user
export function saveEvent(eventId: number | string) {
  return http("POST", `/events/${eventId}/save`);
}

// Remove (unsave) an event from the user's saved list
export function unsaveEvent(eventId: number | string) {
  return http("DELETE", `/events/${eventId}/save`);
}

// Retrieve all events saved by the current user
export function listMySaves() {
  return http("GET", `/me/saves`);
}

// Helper: check if a specific event is already saved
export async function isEventSaved(eventId: number | string): Promise<boolean> {
  const data = await listMySaves();
  // Return true if eventId exists in saved list
  return data.items?.some((e: any) => String(e.id) === String(eventId)) ?? false;
}
