import { createContext, useContext, useEffect, useMemo, useState } from "react";

type User = { id: number; role: "student" | "organizer" | "admin" };
type AuthState = {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  hasRole: (...roles: User["role"][]) => boolean;
};

const AuthCtx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(null);

  // Decode payload (naive) – JWT is base64url: header.payload.sig
  useEffect(() => {
    if (!token) { setUser(null); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      if (payload?.id) {
        setUser({ id: Number(payload.id), role: (payload.role ?? "student") });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, [token]);

  const apiSetToken = (tok: string | null) => {
    if (tok) { localStorage.setItem("token", tok); }
    else { localStorage.removeItem("token"); }
    setToken(tok);
  };

  const value = useMemo<AuthState>(() => ({
    user,
    token,
    login: (tok) => apiSetToken(tok),
    logout: () => apiSetToken(null),
    hasRole: (...roles) => (user ? roles.includes(user.role) : false),
  }), [user, token]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
