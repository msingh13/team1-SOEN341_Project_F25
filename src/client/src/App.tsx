import { Routes, Route, Link, Outlet, useParams } from "react-router-dom";
import "./App.css";

// Pages
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";
import EventDetail from "./pages/EventDetail";
import OrganizerApprovalsPage from "./pages/admin/OrganizerApprovalsPage";
import OrganizerEvents from "./pages/OrganizerEvents";
import AdminModeration from "./pages/admin/AdminModeration";
import Login from "./pages/Login";
import MyTickets from "./MyTickets";
import SavedEvents from "./pages/SavedEvents";
import EventAnalytics from "./pages/EventAnalytics";
import EventsList from "./pages/EventsList";

// Components
import Header from "./components/Header";

// Auth
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { RoleRoute } from "./auth/guards";

/* ---------- Small wrapper so analytics gets the real :id ---------- */
function EventAnalyticsRoute() {
  const { id } = useParams();
  const eventId = Number(id);
  return <EventAnalytics eventId={Number.isFinite(eventId) ? eventId : 0} />;
}

/* ---------- Layout (Header + Outlet + Footer) ---------- */
function Layout() {
  return (
    <>
      <Header />
      <Outlet />
      <footer className="footer">
        <div className="container footer-inner">
          <span className="muted">© {new Date().getFullYear()} Campus Events — Prototype</span>
          <a className="muted" href="https://vite.dev" target="_blank" rel="noreferrer">
            Built with Vite + React
          </a>
        </div>
      </footer>
    </>
  );
}

/* ---------- Homes by role ---------- */
function StudentHome() {
  return (
    <main className="container">
      <section className="hero">
        <div>
          <h1 className="h1">Find events. Claim tickets. Go.</h1>
          <p className="muted">
            Browse by date, category, or organization and store your tickets securely.
          </p>
        </div>
        <div className="hero-actions" style={{ gap: 8 }}>
          <Link className="btn" to="/events">Browse events</Link>
          <Link className="btn btn-ghost" to="/me/tickets">My tickets</Link>
        </div>
      </section>

      <section className="grid">
        <article className="mini-card">
          <h3 className="h3">Search & Filters</h3>
          <p className="muted">Filter by date, category, and organization.</p>
          <Link to="/events" className="btn btn-ghost" style={{ marginTop: 8 }}>Start browsing</Link>
        </article>
        <article className="mini-card">
          <h3 className="h3">Saved Events</h3>
          <p className="muted">Bookmark your favorites for later.</p>
          <Link to="/me/saves" className="btn btn-ghost" style={{ marginTop: 8 }}>View saved</Link>
        </article>
        <article className="mini-card">
          <h3 className="h3">QR Tickets</h3>
          <p className="muted">Unique QR for fast check-in.</p>
          <Link to="/me/tickets" className="btn btn-ghost" style={{ marginTop: 8 }}>See my tickets</Link>
        </article>
      </section>
    </main>
  );
}

function OrganizerHome() {
  return (
    <main className="container">
      <section className="hero">
        <div>
          <h1 className="h1">Welcome, Organizer</h1>
          <p className="muted">Create events, track capacity, and validate tickets.</p>
        </div>
        <div className="hero-actions" style={{ gap: 8 }}>
          <Link className="btn" to="/organizer/events">My events</Link>
          <Link className="btn btn-ghost" to="/create">Create event</Link>
        </div>
      </section>

      <section className="grid">
        <article className="mini-card">
          <h3 className="h3">Event Management</h3>
          <p className="muted">Edit dates, capacity, and details anytime.</p>
          <Link to="/organizer/events" className="btn btn-ghost" style={{ marginTop: 8 }}>Go to dashboard</Link>
        </article>
        <article className="mini-card">
          <h3 className="h3">Analytics</h3>
          <p className="muted">See issued tickets, check-ins, and remaining seats.</p>
        </article>
        <article className="mini-card">
          <h3 className="h3">QR Validation</h3>
          <p className="muted">Scan and validate tickets at the door.</p>
        </article>
      </section>
    </main>
  );
}

function AdminHome() {
  return (
    <main className="container">
      <section className="hero">
        <div>
          <h1 className="h1">Welcome, Admin</h1>
          <p className="muted">Approve organizers, moderate events, and view platform stats.</p>
        </div>
        <div className="hero-actions" style={{ gap: 8 }}>
          <Link className="btn" to="/admin/organizers">Organizations</Link>
          <Link className="btn btn-ghost" to="/admin/moderation">Moderation</Link>
        </div>
      </section>

      <section className="grid">
        <article className="mini-card">
          <h3 className="h3">Organizer Approvals</h3>
          <p className="muted">Approve or reject organizer accounts.</p>
        </article>
        <article className="mini-card">
          <h3 className="h3">Event Moderation</h3>
          <p className="muted">Publish or reject submitted events.</p>
        </article>
        <article className="mini-card">
          <h3 className="h3">Analytics</h3>
          <p className="muted">Track events, tickets, and participation trends.</p>
        </article>
      </section>
    </main>
  );
}

function HomeLanding() {
  const { user } = useAuth();
  if (!user) return <StudentHome />;                 // logged-out: student-style landing
  if (user.role === "admin") return <AdminHome />;
  if (user.role === "organizer") return <OrganizerHome />;
  return <StudentHome />;
}

/* ---------- App ---------- */
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomeLanding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/events" element={<EventsList />} />
          <Route path="/events/:id" element={<EventDetail />} />

          {/* Student (and above) */}
          <Route
            path="/me/tickets"
            element={
              <RoleRoute roles={["student", "organizer", "admin"]}>
                <MyTickets />
              </RoleRoute>
            }
          />
          <Route
            path="/me/saves"
            element={
              <RoleRoute roles={["student", "organizer", "admin"]}>
                <SavedEvents />
              </RoleRoute>
            }
          />

          {/* Organizer area */}
          <Route
            path="/organizer/events"
            element={
              <RoleRoute roles={["organizer", "admin"]}>
                <OrganizerEvents />
              </RoleRoute>
            }
          />
          <Route
            path="/organizer/events/:id/analytics"
            element={
              <RoleRoute roles={["organizer", "admin"]}>
                <EventAnalyticsRoute />
              </RoleRoute>
            }
          />

          {/* Admin area */}
          <Route
            path="/admin/organizers"
            element={
              <RoleRoute roles={["admin"]}>
                <OrganizerApprovalsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/moderation"
            element={
              <RoleRoute roles={["admin"]}>
                <AdminModeration />
              </RoleRoute>
            }
          />

          {/* Organizer/Admin general */}
          <Route
            path="/create"
            element={
              <RoleRoute roles={["organizer", "admin"]}>
                <CreateEvent />
              </RoleRoute>
            }
          />
          <Route
            path="/edit"
            element={
              <RoleRoute roles={["organizer", "admin"]}>
                <EditEvent />
              </RoleRoute>
            }
          />

          <Route path="*" element={<div className="container">Not Found</div>} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
