// src/pages/admin/OrganizerApprovalsPage.tsx
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

type Pending = {
  id: number;
  name: string;
  email: string;
  organization: string;
  submittedAt: string;
};

export default function OrganizerApprovalsPage() {
  const [search] = useSearchParams();

  // DEV ONLY ACCESS: ?dev=1 OR VITE_ADMIN_BYPASS=1
  const isAdmin =
    search.get("dev") === "1" || import.meta.env.VITE_ADMIN_BYPASS === "1";

  const [pending, setPending] = useState<Pending[]>([
    {
      id: 101,
      name: "Avery Chen",
      email: "avery@club.ca",
      organization: "Robotics Club",
      submittedAt: new Date().toISOString(),
    },
    {
      id: 102,
      name: "Jordan Patel",
      email: "jordan@music.ca",
      organization: "Music Society",
      submittedAt: new Date().toISOString(),
    },
  ]);

  if (!isAdmin) {
    return (
      <div style={{ padding: 24, color: "#fff", textAlign: "center" }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Organizer Approvals</h1>
        <div
          style={{
            margin: "16px auto",
            maxWidth: 520,
            padding: 16,
            borderRadius: 10,
            background: "#2a1c1c",
            border: "1px solid #a43b3b",
            color: "#ffb5b5",
          }}
        >
          <strong>Access denied</strong>
          <div style={{ fontSize: 14, opacity: 0.9, marginTop: 6 }}>
            You must be an administrator to view this page. Try adding{" "}
            <code>?dev=1</code> to the URL.
          </div>
        </div>
      </div>
    );
  }

  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  // TODO: replace with real POST /admin/organizers/:id/approve|reject
  async function postDecision(_id: number, _action: "approve" | "reject") {
    await new Promise((r) => setTimeout(r, 500)); // simulate network
    return { ok: true };
  }

  async function onDecision(row: Pending, action: "approve" | "reject") {
    setBusyId(row.id);
    // optimistic remove
    setPending((prev) => prev.filter((r) => r.id !== row.id));
    try {
      const res = await postDecision(row.id, action);
      if (!res.ok) throw new Error("Request failed");
      setToast({
        type: "success",
        msg: `${action === "approve" ? "Approved" : "Rejected"} ${row.name}`,
      });
    } catch (e) {
      // revert on error
      setPending((prev) => [row, ...prev]);
      setToast({ type: "error", msg: (e as Error).message || "Action failed" });
    } finally {
      setBusyId(null);
      // auto-hide toast
      setTimeout(() => setToast(null), 2500);
    }
  }

  return (
    <div style={{ padding: 24, color: "#fff" }}>
      <h1 style={{ fontSize: 24, marginBottom: 12, textAlign: "center" }}>
        Organizer Approvals
      </h1>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            margin: "0 auto 12px",
            maxWidth: 520,
            padding: "10px 12px",
            borderRadius: 10,
            background: toast.type === "success" ? "#103d25" : "#3d1010",
            border: `1px solid ${toast.type === "success" ? "#1f8a4c" : "#a43b3b"}`,
            color: toast.type === "success" ? "#b5ffd4" : "#ffb5b5",
            textAlign: "center",
          }}
        >
          {toast.msg}
        </div>
      )}

      <div
        style={{
          background: "#141414",
          borderRadius: 12,
          padding: 16,
          maxWidth: 620,
          margin: "0 auto",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
        <p style={{ marginBottom: 8, color: "#bbb", textAlign: "center" }}>
          Pending Organizer Requests ({pending.length})
        </p>

        {pending.length === 0 ? (
          <div style={{ color: "#9aa", textAlign: "center", padding: 16 }}>
            No pending organizer requests.
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {pending.map((org) => (
              <li
                key={org.id}
                style={{
                  background: "#1f1f1f",
                  marginBottom: 10,
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #2b2b2b",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <strong>{org.name}</strong> — {org.email} · {org.organization}
                    <br />
                    <small>
                      Submitted {new Date(org.submittedAt).toLocaleString()}
                    </small>
                  </div>
                  <div style={{ whiteSpace: "nowrap" }}>
                    <button
                      type="button"
                      onClick={() => onDecision(org, "approve")}
                      disabled={busyId === org.id}
                      style={{
                        marginRight: 8,
                        padding: "6px 12px",
                        borderRadius: 8,
                        cursor: busyId === org.id ? "not-allowed" : "pointer",
                      }}
                    >
                      {busyId === org.id ? "Working…" : "Approve"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDecision(org, "reject")}
                      disabled={busyId === org.id}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        cursor: busyId === org.id ? "not-allowed" : "pointer",
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p style={{ marginTop: 8, textAlign: "center", color: "#778" }}>
        (UI mocked — real endpoints coming next)
      </p>
    </div>
  );
}
