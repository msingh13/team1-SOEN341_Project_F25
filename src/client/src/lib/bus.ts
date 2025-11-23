// src/lib/bus.ts
// -------------------------------------------------------------
// Purpose:
//   A tiny in-memory event bus (Pub/Sub system) for the app.
//   Lets components send and receive simple events without
//   needing a global state manager like Redux.
//
// Description:
//   - Components can call `emit("eventName")` to broadcast a message.
//   - Other components can call `on("eventName", handler)` to listen.
//   - When the event fires, all subscribed handlers run.
//
// Example:
//   on("saves:changed", () => refreshSavedList());
//   emit("saves:changed"); // triggers the above listener
// -------------------------------------------------------------

// A map of event names → sets of handler functions
type Handler = () => void;
const handlers = new Map<string, Set<Handler>>();

// Subscribe (listen) to an event
export function on(event: string, handler: Handler) {
  // Create a new set for this event if none exists
  if (!handlers.has(event)) handlers.set(event, new Set());
  // Add this handler to the event's handler set
  handlers.get(event)!.add(handler);

  // Return an unsubscribe function so caller can stop listening later
  return () => off(event, handler);
}

// Unsubscribe (stop listening) to an event
export function off(event: string, handler: Handler) {
  handlers.get(event)?.delete(handler);
}

// Publish (emit) an event — notifies all listeners
export function emit(event: string) {
  handlers.get(event)?.forEach((h) => {
    try {
      h(); // safely call each subscribed handler
    } catch {
      // Ignore errors so one bad listener doesn't break others
    }
  });
}