// src/pages/organizer/EventWaitlistTab.tsx
import  {
    useCallback,
    useEffect,
    useState,
    type FC,
  } from "react";
  import WaitlistTable from "../components/WaitlistTable";
  import type { WaitlistEntry } from "../lib/waitlist.api";
  import {
    fetchWaitlist,
    promoteFromWaitlist,
    removeFromWaitlist,
  } from "../lib/waitlist.api";
  
  // If you have an auth context, replace this with a real hook.
  function useAuthToken() {
    // Example only – adapt to your app:
    const token = window.localStorage.getItem("token") || undefined;
    return { token };
  }
  
  interface EventWaitlistTabProps {
    eventId: string;
    isOwner: boolean; // parent should pass this based on current user vs event.ownerId
  }
  
  const EventWaitlistTab: FC<EventWaitlistTabProps> = ({ eventId, isOwner }) => {
    const { token } = useAuthToken();
  
    const [items, setItems] = useState<WaitlistEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    const loadWaitlist = useCallback(
      async (opts?: { silent?: boolean }) => {
        try {
          if (!opts?.silent) {
            setLoading(true);
          } else {
            setRefreshing(true);
          }
          setError(null);
          const data = await fetchWaitlist(eventId, token);
          setItems(data);
        } catch (err) {
          console.error("Failed to load waitlist", err);
          setError("Failed to load waitlist. Please try again.");
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [eventId, token]
    );
  
    useEffect(() => {
      void loadWaitlist();
    }, [loadWaitlist]);
  
    const handlePromote = useCallback(
      async (entry: WaitlistEntry) => {
        const ok = window.confirm(
          `Promote ${entry.attendeeName} from waitlist to attendee?`
        );
        if (!ok) return;
  
        try {
          setLoading(true);
          await promoteFromWaitlist(eventId, entry.id, token);
          // Option 1: refetch from backend so we stay in sync
          await loadWaitlist({ silent: true });
        } catch (err) {
          console.error("Failed to promote from waitlist", err);
          window.alert("Failed to promote attendee. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      [eventId, token, loadWaitlist]
    );
  
    const handleRemove = useCallback(
      async (entry: WaitlistEntry) => {
        const ok = window.confirm(
          `Remove ${entry.attendeeName} from the waitlist?`
        );
        if (!ok) return;
  
        try {
          setLoading(true);
          await removeFromWaitlist(eventId, entry.id, token);
          await loadWaitlist({ silent: true });
        } catch (err) {
          console.error("Failed to remove from waitlist", err);
          window.alert("Failed to remove attendee. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      [eventId, token, loadWaitlist]
    );
  
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">Waitlist</h2>
            <p className="text-xs text-slate-500">
              View and manage attendees waiting for this event.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {refreshing && (
              <span className="text-xs text-slate-400">
                Syncing with server...
              </span>
            )}
            <button
              type="button"
              className="rounded-md border px-3 py-1 text-xs font-medium"
              disabled={loading}
              onClick={() => {
                void loadWaitlist({ silent: true });
              }}
            >
              Refresh
            </button>
          </div>
        </div>
  
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
  
        {loading && !items.length ? (
          <div className="rounded-md border px-4 py-3 text-sm text-slate-500">
            Loading waitlist...
          </div>
        ) : (
          <WaitlistTable
            items={items}
            loading={loading}
            canManage={isOwner}
            onPromote={handlePromote}
            onRemove={handleRemove}
          />
        )}
      </div>
    );
  };
  
  export default EventWaitlistTab;
  