// src/components/Header.tsx
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Header() {
  const { user, logout, hasRole } = useAuth();

  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Link to="/" className="brand" style={{ fontSize: "1.35rem", fontWeight: 800 }}>
          Campus Events
        </Link>

        <nav className="links">
          <Link to="/events">Browse</Link>

          {hasRole("student", "organizer", "admin") && (
            <Link to="/me/tickets">My Tickets</Link>
          )}

          {/* Organizer */}
          {hasRole("organizer") && (
            <>
              <Link to="/organizer/events">Organizer</Link>
              <Link to="/create">Create Event</Link>
              <Link to="/scan">Scan</Link>
            </>
          )}

          {/* Admin */}
          {hasRole("admin") && (
            <>
              <Link to="/admin">Admin</Link>
              <Link to="/admin/moderation">Moderation</Link>
              <Link to="/admin/organizers">Approvals</Link>
              <Link to="/admin/orgs">Organizations</Link>
              <Link to="/admin/waitlist-policy">Waitlist Policy</Link>
            </>
          )}

          {!user ? (
            <Link to="/login">Login</Link>
          ) : (
            <button onClick={logout} className="btn btn-ghost">Logout</button>
          )}
        </nav>
      </div>
    </header>
  );
}
