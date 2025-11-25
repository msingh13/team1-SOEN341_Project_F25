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

  /** 🔥 Custom injected input styles */
  inputStyle?: React.CSSProperties;

  // Link util
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
  inputStyle,
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

  const mergedInput = {
    width: "120px",
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #2f2f2f",
    background: "#0f0f0f",
    color: "white",
    fontSize: 12,
    ...inputStyle, // override with injected styles
  };

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          background: "#121212",
          border: "1px solid #2d2d2d",
          padding: 12,
          borderRadius: 10,
        }}
      >
        {/* Event ID */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, color: "#b0b0b0" }}>Event ID</label>
          <input
            type="text"
            style={mergedInput}
            value={filters.eventId ?? ""}
            onChange={(e) => handleFilterChange("eventId", e.target.value)}
            placeholder="e.g. 42"
          />
        </div>

        {/* Org ID */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, color: "#b0b0b0" }}>Org ID</label>
          <input
            type="text"
            style={mergedInput}
            value={filters.orgId ?? ""}
            onChange={(e) => handleFilterChange("orgId", e.target.value)}
            placeholder="e.g. 7"
          />
        </div>

        {/* User ID */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, color: "#b0b0b0" }}>User ID</label>
          <input
            type="text"
            style={mergedInput}
            value={filters.userId ?? ""}
            onChange={(e) => handleFilterChange("userId", e.target.value)}
            placeholder="e.g. 15"
          />
        </div>

        {/* From date */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, color: "#b0b0b0" }}>From</label>
          <input
            type="date"
            style={mergedInput}
            value={filters.from ?? ""}
            onChange={(e) => handleFilterChange("from", e.target.value)}
          />
        </div>

        {/* To date */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, color: "#b0b0b0" }}>To</label>
          <input
            type="date"
            style={mergedInput}
            value={filters.to ?? ""}
            onChange={(e) => handleFilterChange("to", e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          overflowX: "auto",
          borderRadius: 10,
          border: "1px solid #2b2b2b",
          background: "#101010",
        }}
      >
        <table style={{ width: "100%", fontSize: 12 }}>
          <thead style={{ background: "#0c0c0c", color: "#9ca3af" }}>
            <tr>
              <th className="px-3 py-2 text-left">Changed At</th>
              <th className="px-3 py-2 text-left">Admin</th>
              <th className="px-3 py-2 text-left">Old Policy</th>
              <th className="px-3 py-2 text-left">New Policy</th>
              <th className="px-3 py-2 text-left">Links</th>
            </tr>
          </thead>

          <tbody>
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 12, textAlign: "center", color: "#777" }}>
                  No audit entries found.
                </td>
              </tr>
            )}

            {items.map((row) => (
              <tr
                key={row.id}
                style={{ borderTop: "1px solid #1e1e1e" }}
              >
                <td className="px-3 py-2">{new Date(row.changedAt).toLocaleString()}</td>
                <td className="px-3 py-2">{row.adminId ?? "—"}</td>

                <td className="px-3 py-2">
                  <code style={{ fontSize: 11, color: "#ccc" }}>
                    {JSON.stringify(row.oldValue || {}, null, 2)}
                  </code>
                </td>

                <td className="px-3 py-2">
                  <code style={{ fontSize: 11, color: "#7dd3fc" }}>
                    {JSON.stringify(row.newValue || {}, null, 2)}
                  </code>
                </td>

                <td className="px-3 py-2">
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {row.eventId && buildEventLink ? (
                      <a href={buildEventLink(row.eventId)} style={{ color: "#38bdf8", fontSize: 11 }}>
                        View event #{row.eventId}
                      </a>
                    ) : (
                      <span style={{ color: "#555", fontSize: 11 }}>No event link</span>
                    )}

                    {row.userId && buildUserLink ? (
                      <a href={buildUserLink(row.userId)} style={{ color: "#38bdf8", fontSize: 11 }}>
                        View user #{row.userId}
                      </a>
                    ) : (
                      <span style={{ color: "#555", fontSize: 11 }}>No user link</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {loading && (
              <tr>
                <td colSpan={5} style={{ padding: 12, textAlign: "center", color: "#999" }}>
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        style={{
          fontSize: 12,
          color: "#aaa",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>
          Page {page} of {totalPages} ({total} entries)
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={loading || page <= 1}
            style={{
              padding: "6px 12px",
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: 6,
              color: "white",
              opacity: page <= 1 ? 0.4 : 1,
            }}
          >
            Prev
          </button>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={loading || page >= totalPages}
            style={{
              padding: "6px 12px",
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: 6,
              color: "white",
              opacity: page >= totalPages ? 0.4 : 1,
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaitlistAuditTable;
