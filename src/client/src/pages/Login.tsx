// src/client/src/pages/Login.tsx
import { useState } from "react";
import api from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

export default function Login() {
  const [id, setId] = useState("3");
  const [role, setRole] = useState<"student" | "organizer" | "admin">("student");
  const [err, setErr] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      // 🔹 Log in via dev route
      const { data } = await api.post("/dev/login", { id: Number(id), role, password: "demo" });
      login(data.token);

      // 🔹 Determine redirect target
      const params = new URLSearchParams(location.search);
      const returnTo = params.get("returnTo");

      // 🔹 Default by role if not coming from a redirect
      const defaultByRole =
        role === "admin"
          ? "/admin"
          : role === "organizer"
          ? "/organizer/events"
          : "/";

      // 🔹 Redirect to intended page or default
      navigate(returnTo || defaultByRole, { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Login failed");
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, marginTop: 40 }}>
      <h1 className="h1">Sign In</h1>
      <form onSubmit={onSubmit} className="card" style={{ padding: 16 }}>
        <label className="muted">User ID</label>
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          type="number"
          min={1}
          required
        />

        <label className="muted">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
        >
          <option value="student">Student</option>
          <option value="organizer">Organizer</option>
          <option value="admin">Admin</option>
        </select>

        <button className="btn" type="submit" style={{ marginTop: 12 }}>
          Sign In
        </button>

        {err && (
          <p role="alert" style={{ color: "tomato" }}>
            {err}
          </p>
        )}
      </form>
    </div>
  );
}
