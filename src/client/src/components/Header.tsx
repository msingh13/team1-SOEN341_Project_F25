import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Header() {
  const { user, logout, hasRole } = useAuth();

  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Link to="/" className="brand">🎓 Campus Events</Link>
        <nav className="links">
          <Link to="/">Home</Link>

          {hasRole("student", "organizer", "admin") && (
            <Link to="/me/tickets">My Tickets</Link>
          )}

          {hasRole("organizer", "admin") && (
            <Link to="/organizer/events">Organizer Dashboard</Link>
          )}

          {hasRole("organizer", "admin") && (
            <Link to="/organizer/scan">Scan</Link>
          )}

          {hasRole("admin") && (
            <>
              <Link to="/admin/organizers">Admin</Link>
              <Link to="/admin/moderation">Moderation</Link>
              <Link to="/admin/stats">Analytics</Link>
            </>
          )}

          {hasRole("organizer", "admin") && (
            <>
              <Link to="/create">Create Event</Link>
              <Link to="/edit">Edit Event</Link>
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
