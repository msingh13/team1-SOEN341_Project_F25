// src/components/admin/WaitlistAuditTable.tsx
import React from "react";
import type {
  WaitlistAuditItem,
  AuditFilters,
} from "../lib/adminWaitlistPolicy.api";

interface WaitlistAuditTableProps {
  items: WaitlistAuditItem[];
  page: number;
  pageSize: number;
  total: number;
  loading?: boolean;
  filters: AuditFilters;
  onFiltersChange: (next: AuditFilters) => void;
  onPageChange: (page: number) => void;
  // for link navigation
  buildEventLink?: (eventId: number) => string;
  buildUserLink?: (userId: number) => string;
}

const WaitlistAuditTable: React.FC<WaitlistAuditTableProps> = ({
  items,
  page,
  pageSize,
  total,
  loading = false,
  filters,
  onFiltersChange,
  onPageChange,
  buildEventLink,
  buildUserLink,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleFilterChange = (
    key: keyof AuditFilters,
    value: string | undefined
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
      page: 1,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 rounded-lg border border-slate-700 bg-[#121212] p-3 text-xs">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-slate-400">Event ID</label>
          <input
            type="text"
            value={filters.eventId ?? ""}
            onChange={(e) => handleFilterChange("eventId", e.target.value)}
            className="w-32 rounded border border-slate-600 bg-black px-2 py-1 text-xs"
            placeholder="e.g. 42"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-slate-400">Org ID</label>
          <input
            type="text"
            value={filters.orgId ?? ""}
            onChange={(e) => handleFilterChange("orgId", e.target.value)}
            className="w-32 rounded border border-slate-600 bg-black px-2 py-1 text-xs"
            placeholder="e.g. 7"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-slate-400">User ID</label>
          <input
            type="text"
            value={filters.userId ?? ""}
            onChange={(e) => handleFilterChange("userId", e.target.value)}
            className="w-32 rounded border border-slate-600 bg-black px-2 py-1 text-xs"
            placeholder="e.g. 15"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-slate-400">From date</label>
          <input
            type="date"
            value={filters.from ?? ""}
            onChange={(e) => handleFilterChange("from", e.target.value)}
            className="rounded border border-slate-600 bg-black px-2 py-1 text-xs"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-slate-400">To date</label>
          <input
            type="date"
            value={filters.to ?? ""}
            onChange={(e) => handleFilterChange("to", e.target.value)}
            className="rounded border border-slate-600 bg-black px-2 py-1 text-xs"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-700 bg-[#101010]">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-900/60 text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-2 text-left">Changed At</th>
              <th className="px-3 py-2 text-left">Admin</th>
              <th className="px-3 py-2 text-left">Old Policy</th>
              <th className="px-3 py-2 text-left">New Policy</th>
              <th className="px-3 py-2 text-left">Links</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !loading && (
              <tr>
                <td
                  className="px-3 py-4 text-center text-slate-500"
                  colSpan={5}
                >
                  No audit entries found for these filters.
                </td>
              </tr>
            )}

            {items.map((row) => {
              const oldValue = row.oldValue || {};
              const newValue = row.newValue || {};

              return (
                <tr
                  key={row.id}
                  className="border-t border-slate-800 hover:bg-slate-900/60"
                >
                  <td className="px-3 py-2 align-top">
                    {new Date(row.changedAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {row.adminId ?? "—"}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <code className="whitespace-pre-wrap text-[11px] text-slate-300">
                      {JSON.stringify(oldValue, null, 2)}
                    </code>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <code className="whitespace-pre-wrap text-[11px] text-sky-300">
                      {JSON.stringify(newValue, null, 2)}
                    </code>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex flex-col gap-1">
                      {row.eventId && buildEventLink ? (
                        <a
                          href={buildEventLink(row.eventId)}
                          className="text-[11px] text-sky-400 hover:underline"
                        >
                          View event #{row.eventId}
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          No event link
                        </span>
                      )}

                      {row.userId && buildUserLink ? (
                        <a
                          href={buildUserLink(row.userId)}
                          className="text-[11px] text-sky-400 hover:underline"
                        >
                          View user #{row.userId}
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          No user link
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {loading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-4 text-center text-slate-400"
                >
                  Loading audit entries…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Page {page} of {totalPages} ({total} entries)
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(page - 1)}
            className="rounded-md border border-slate-600 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => onPageChange(page + 1)}
            className="rounded-md border border-slate-600 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaitlistAuditTable;
