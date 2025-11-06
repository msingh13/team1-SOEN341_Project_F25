import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  listOrgs, createOrg, updateOrg, deleteOrg,
  assignRole, removeRole, type Org, type Role
} from "../../api/adminOrgs";

type Toast = { type: "success" | "error"; msg: string } | null;

function Guard({ children }: { children: React.ReactNode }) {
  const [sp] = useSearchParams();
  const isAdmin = sp.get("dev") === "1" || import.meta.env.VITE_ADMIN_BYPASS === "1";
  if (!isAdmin) {
    return (
      <div className="container" style={{ padding: 24 }}>
        <h1 className="h2">Organizations</h1>
        <div className="card" style={{ background: "#2a1c1c", border: "1px solid #a43b3b", color: "#ffb5b5" }}>
          <b>Access denied</b>
          <div className="muted">Administrators only. (Dev tip: add <code>?dev=1</code> to the URL.)</div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Org[] | null>(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<Toast>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Org | null>(null);

  const [membersOpenId, setMembersOpenId] = useState<number | null>(null);
  const activeOrg = useMemo(() => orgs?.find(o => o.id === membersOpenId) ?? null, [orgs, membersOpenId]);

  async function refresh() {
    try {
      const data = await listOrgs();
      setOrgs(data);
    } catch (e: any) {
      setToast({ type: "error", msg: e?.message ?? "Failed to load organizations" });
    }
  }

  useEffect(() => { refresh(); }, []);

  function filtered(list: Org[] | null) {
    if (!list) return null;
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(o =>
      o.name.toLowerCase().includes(q) || (o.description ?? "").toLowerCase().includes(q)
    );
  }

  function onCloseToast() { setToast(null); }
  function showSuccess(msg: string) { setToast({ type: "success", msg }); setTimeout(onCloseToast, 2200); }
  function showError(msg: string) { setToast({ type: "error", msg }); }

  async function onSubmitOrg(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const description = String(fd.get("description") || "").trim();

    try {
      if (editing) {
        const updated = await updateOrg(editing.id, { name, description });
        setOrgs(prev => prev?.map(o => (o.id === updated.id ? updated : o)) ?? [updated]);
        showSuccess("Organization updated");
      } else {
        const created = await createOrg({ name, description });
        setOrgs(prev => [created, ...(prev ?? [])]);
        showSuccess("Organization created");
      }
      setEditing(null);
      setFormOpen(false);
      e.currentTarget.reset();
    } catch (err: any) {
      showError(err?.message ?? "Save failed");
    }
  }

  async function onDeleteOrg(org: Org) {
    if (!confirm(`Delete organization "${org.name}"? This cannot be undone.`)) return;
    try {
      await deleteOrg(org.id);
      setOrgs(prev => prev?.filter(o => o.id !== org.id) ?? null);
      showSuccess("Organization deleted");
    } catch (err: any) {
      showError(err?.message ?? "Delete failed");
    }
  }

  // --- Member management ---

  async function onAssign(userId: number, role: Role) {
    if (!activeOrg) return;
    try {
      const updated = await assignRole(activeOrg.id, userId, role);
      setOrgs(prev => prev?.map(o => (o.id === updated.id ? updated : o)) ?? [updated]);
      showSuccess("Role assigned");
    } catch (err: any) {
      showError(err?.message ?? "Assign failed");
    }
  }

  async function onRemove(userId: number) {
    if (!activeOrg) return;
    try {
      const updated = await removeRole(activeOrg.id, userId);
      setOrgs(prev => prev?.map(o => (o.id === updated.id ? updated : o)) ?? [updated]);
      showSuccess("Member removed");
    } catch (err: any) {
      // Surface safeguard error message if backend enforces last-admin rule
      showError(err?.message ?? "Remove failed");
    }
  }

  const list = filtered(orgs);

  return (
    <Guard>
      <div className="container" style={{ padding: 24 }}>
        <header className="card-header" style={{ marginBottom: 12 }}>
          <div>
            <h1 className="h2">Organizations</h1>
            <p className="muted">Create, edit, and manage roles for each organization.</p>
          </div>
          <button className="btn" onClick={() => { setEditing(null); setFormOpen(true); }}>
            + New Organization
          </button>
        </header>

        {toast && (
          <div
            role="status"
            aria-live="polite"
            className="card"
            style={{
              marginBottom: 12,
              background: toast.type === "success" ? "#103d25" : "#3d1010",
              border: `1px solid ${toast.type === "success" ? "#1f8a4c" : "#a43b3b"}`,
              color: toast.type === "success" ? "#b5ffd4" : "#ffb5b5",
            }}
            onClick={onCloseToast}
          >
            {toast.msg}
          </div>
        )}

        <div className="card" style={{ padding: 16 }}>
          <div className="flex" style={{ gap: 12, marginBottom: 12 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search organizations…"
              style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #333", background: "#1c1c1c", color: "#fff" }}
            />
          </div>

          {!list ? (
            <div className="muted">Loading…</div>
          ) : list.length === 0 ? (
            <div className="muted">No organizations found.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th style={{ padding: 8 }}>Name</th>
                  <th style={{ padding: 8 }}>Description</th>
                  <th style={{ padding: 8, whiteSpace: "nowrap" }}>Members</th>
                  <th style={{ padding: 8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((o) => (
                  <tr key={o.id}>
                    <td style={{ padding: 8, width: "25%" }}><b>{o.name}</b></td>
                    <td style={{ padding: 8 }}>{o.description}</td>
                    <td style={{ padding: 8 }}>{o.members?.length ?? 0}</td>
                    <td style={{ padding: 8, whiteSpace: "nowrap" }}>
                      <button className="btn btn-ghost" onClick={() => { setEditing(o); setFormOpen(true); }}>Edit</button>{" "}
                      <button className="btn btn-ghost" onClick={() => setMembersOpenId(o.id)}>Members</button>{" "}
                      <button className="btn btn-ghost" onClick={() => onDeleteOrg(o)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Create/Edit Modal */}
        {formOpen && (
          <dialog open style={{ padding: 0, border: "1px solid #2b2b2b", borderRadius: 12, width: "min(560px, 96vw)" }}>
            <form onSubmit={onSubmitOrg}>
              <div className="card-header" style={{ padding: 16 }}>
                <h3 className="h3" style={{ margin: 0 }}>{editing ? "Edit organization" : "Create organization"}</h3>
              </div>
              <div style={{ padding: 16 }}>
                <label className="muted">Name</label>
                <input name="name" defaultValue={editing?.name ?? ""} required minLength={2}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #333", background: "#1c1c1c", color: "#fff", marginBottom: 10 }} />
                <label className="muted">Description</label>
                <textarea name="description" defaultValue={editing?.description ?? ""} rows={3}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #333", background: "#1c1c1c", color: "#fff" }} />
              </div>
              <footer className="card-footer" style={{ padding: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => { setFormOpen(false); setEditing(null); }}>Cancel</button>
                <button className="btn">{editing ? "Save" : "Create"}</button>
              </footer>
            </form>
          </dialog>
        )}

        {/* Members Drawer */}
        {activeOrg && (
          <dialog open style={{ padding: 0, border: "1px solid #2b2b2b", borderRadius: 12, width: "min(720px, 96vw)" }}>
            <div className="card-header" style={{ padding: 16 }}>
              <h3 className="h3" style={{ margin: 0 }}>Members — {activeOrg.name}</h3>
            </div>

            <div style={{ padding: 16 }}>
              <AssignForm orgId={activeOrg.id} onAssign={onAssign} />
              <div className="muted" style={{ margin: "12px 0 6px" }}>Current members</div>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left" }}>
                    <th style={{ padding: 8 }}>User ID</th>
                    <th style={{ padding: 8 }}>Role</th>
                    <th style={{ padding: 8 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeOrg.members ?? []).map(m => (
                    <tr key={`${m.user_id}:${m.role}`}>
                      <td style={{ padding: 8 }}>{m.user_id}</td>
                      <td style={{ padding: 8 }}>
                        <span className="badge">{m.role}</span>
                      </td>
                      <td style={{ padding: 8 }}>
                        <button className="btn btn-ghost" onClick={() => onRemove(m.user_id)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="card-footer" style={{ padding: 12 }}>
              <button className="btn" onClick={() => setMembersOpenId(null)}>Close</button>
            </footer>
          </dialog>
        )}
      </div>
    </Guard>
  );
}

function AssignForm({ orgId, onAssign }: { orgId: number; onAssign: (userId: number, role: Role) => void | Promise<void> }) {
  const [userId, setUserId] = useState<string>("");
  const [role, setRole] = useState<Role>("member");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const id = Number(userId);
        if (!Number.isFinite(id)) return alert("Enter a numeric user id");
        await onAssign(id, role);
        setUserId("");
        setRole("member");
      }}
      style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}
    >
      <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User ID"
             style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #333", background: "#1c1c1c", color: "#fff" }} />
      <select value={role} onChange={(e) => setRole(e.target.value as Role)}
              style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #333", background: "#1c1c1c", color: "#fff" }}>
        <option value="member">Member</option>
        <option value="organizer">Organizer</option>
        <option value="admin">Admin</option>
      </select>
      <button className="btn" type="submit">Assign</button>
    </form>
  );
}
