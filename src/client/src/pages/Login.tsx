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
      const { data } = await api.post("/dev/login", {
        id: Number(id),
        role,
        password: "demo",
      });

      login(data.token);

      const params = new URLSearchParams(location.search);
      const returnTo = params.get("returnTo");

      const defaultByRole =
        role === "admin"
          ? "/admin"
          : role === "organizer"
          ? "/organizer/events"
          : "/";

      navigate(returnTo || defaultByRole, { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Login failed");
    }
  }

  return (
    <div
      className="container"
      style={{
        maxWidth: 420,
        marginTop: 80,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h1 className="h1" style={{ marginBottom: 24 }}>
        Sign In
      </h1>

      <form
        onSubmit={onSubmit}
        className="card"
        style={{
          width: "100%",
          padding: 24,
          borderRadius: 12,
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(6px)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
        {/* User ID */}
        <label className="muted" style={{ marginBottom: 6, fontSize: 14 }}>
          User ID
        </label>
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          type="number"
          min={1}
          required
          style={{
            marginBottom: 16,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #333",
            background: "#1e1e1e",
            color: "white",
            fontSize: 15,
          }}
        />

        {/* Role */}
        <br/>
        <label className="muted" style={{ marginBottom: 6, fontSize: 14 }}>
          Role
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #333",
            background: "#1e1e1e",
            color: "white",
            fontSize: 15,
            marginBottom: 20,
          }}
        >
          <option value="student">Student</option>
          <option value="organizer">Organizer</option>
          <option value="admin">Admin</option>
        </select>

        {/* Submit */}
        <button
          className="btn"
          type="submit"
          style={{
            width: "100%",
            padding: "10px 0",
            fontSize: 16,
            borderRadius: 8,
          }}
        >
          Sign In
        </button>

        {/* Error */}
        {err && (
          <p
            role="alert"
            style={{
              marginTop: 16,
              color: "#ff6b6b",
              fontWeight: 500,
              textAlign: "center",
            }}
          >
            {err}
          </p>
        )}
      </form>
    </div>
  );
}
