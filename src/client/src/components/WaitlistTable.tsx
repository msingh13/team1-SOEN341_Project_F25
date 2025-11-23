// src/components/organizer/WaitlistTable.tsx
import type { FC } from "react";
import type { WaitlistEntry } from "../lib/waitlist.api";

interface WaitlistTableProps {
  items: WaitlistEntry[];
  loading?: boolean;
  canManage: boolean;
  onPromote: (entry: WaitlistEntry) => void;
  onRemove: (entry: WaitlistEntry) => void;
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
};

const WaitlistTable: FC<WaitlistTableProps> = ({
  items,
  loading = false,
  canManage,
  onPromote,
  onRemove,
}) => {
  if (!items.length) {
    return (
      <div className="rounded-md border p-4 text-sm text-slate-500">
        No one is currently on the waitlist for this event.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-4 py-2 text-left font-semibold">Attendee</th>
            <th className="px-4 py-2 text-left font-semibold">Joined</th>
            <th className="px-4 py-2 text-left font-semibold">Status</th>
            <th className="px-4 py-2 text-left font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((entry) => (
            <tr
              key={entry.id}
              className="border-t last:border-b hover:bg-slate-50"
            >
              <td className="px-4 py-2">{entry.attendeeName}</td>
              <td className="px-4 py-2">{formatDateTime(entry.joinedAt)}</td>
              <td className="px-4 py-2">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs uppercase tracking-wide">
                  {entry.status}
                </span>
              </td>
              <td className="px-4 py-2">
                {canManage ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={
                        loading ||
                        entry.status === "PROMOTED" ||
                        entry.status === "REMOVED"
                      }
                      className="rounded-md border px-3 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => onPromote(entry)}
                    >
                      Promote
                    </button>
                    <button
                      type="button"
                      disabled={loading || entry.status === "REMOVED"}
                      className="rounded-md border px-3 py-1 text-xs font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => onRemove(entry)}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">
                    View-only (not event owner)
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WaitlistTable;
