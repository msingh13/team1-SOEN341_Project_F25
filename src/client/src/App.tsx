// src/App.tsx
import { Routes, Route, Outlet, useParams } from "react-router-dom";
import "./App.css";

// Pages
import Home from "./pages/Home";
import BrowseEvents from "./pages/BrowseEvents";
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";
import EventDetail from "./pages/EventDetail";
import OrganizerEvents from "./pages/OrganizerEvents";
import EventAnalytics from "./pages/EventAnalytics";
import OrganizerApprovalsPage from "./pages/admin/OrganizerApprovalsPage";
import AdminModeration from "./pages/admin/AdminModeration";
import OrganizationsPage from "./pages/admin/OrganizationsPage";
import Login from "./pages/Login";
import MyTickets from "./MyTickets";
import SavedEvents from "./pages/SavedEvents";
import Scan from "./pages/Scan";
import AdminHome from "./pages/admin/AdminHome";
import WaitlistPolicyPage from "./pages/WaitlistPolicyPage";

// Components
import Header from "./components/Header";

// Auth
import { AuthProvider } from "./auth/AuthContext";
import { RoleRoute } from "./auth/guards";

/* ---------- Layout ---------- */
function Layout() {
  return (
    <div className="app-shell">
      <Header />

      {/* main content area */}
      <main className="app-main">
        <Outlet />
      </main>

      {/* subtle fade into footer so cards don’t look “cut off” */}
      <div className="footer-gradient" />

      <footer className="footer">
        <div className="container footer-inner">
          <span className="muted">
            © {new Date().getFullYear()} Campus Events — Prototype
          </span>
          <span className="muted">
            Built with <span className="footer-accent">Vite + React</span>
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Analytics wrapper uses :id ---------- */
function EventAnalyticsRoute() {
  const { id } = useParams();
  const eventId = Number(id);
  return <EventAnalytics eventId={Number.isFinite(eventId) ? eventId : 0} />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<BrowseEvents />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/login" element={<Login />} />

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

          {/* Organizer */}
          <Route
            path="/organizer/events"
            element={
              <RoleRoute roles={["organizer"]}>
                <OrganizerEvents />
              </RoleRoute>
            }
          />
          <Route
            path="/organizer/events/:id/edit"
            element={
              <RoleRoute roles={["organizer", "admin"]}>
                <EditEvent />
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
          <Route
            path="/create"
            element={
              <RoleRoute roles={["organizer"]}>
                <CreateEvent />
              </RoleRoute>
            }
          />
          <Route
            path="/scan"
            element={
              <RoleRoute roles={["organizer", "admin"]}>
                <Scan />
              </RoleRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin/moderation"
            element={
              <RoleRoute roles={["admin"]}>
                <AdminModeration />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/organizers"
            element={
              <RoleRoute roles={["admin"]}>
                <OrganizerApprovalsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/orgs"
            element={
              <RoleRoute roles={["admin"]}>
                <OrganizationsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/waitlist-policy"
            element={
              <RoleRoute roles={["admin"]}>
                <WaitlistPolicyPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <RoleRoute roles={["admin"]}>
                <AdminHome />
              </RoleRoute>
            }
          />

          {/* TEMP: bypass guard to test admin page renders */}
          <Route path="/__admin_raw" element={<AdminHome />} />

          {/* 404 */}
          <Route path="*" element={<div className="container">Not Found</div>} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
