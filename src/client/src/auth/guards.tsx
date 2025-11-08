// src/client/src/auth/guards.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname || "/" }}
      />
    );
  }
  return children;
}

export function RoleRoute({
  roles,
  children,
}: {
  roles: ("student" | "organizer" | "admin")[];
  children: JSX.Element;
}) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname || "/" }}
      />
    );
  }
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}