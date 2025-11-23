// client/lib/routes.jsx
import { createBrowserRouter } from "react-router-dom";

// --- Pages ---
import App from "../App.jsx";
import EventsList from "../pages/EventsList.jsx";
import EventDetail from "../pages/EventDetail.jsx";
import OrganizerApprovalsPage from "../pages/admin/OrganizerApprovalsPage.jsx";
import SavedEvents from "../pages/SavedEvents.jsx";
import MyTickets from "../MyTickets.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // your main layout / homepage
    children: [
      { path: "events", element: <EventsList /> },
      { path: "events/:id", element: <EventDetail /> },
      { path: "saved", element: <SavedEvents /> },
      { path: "me/tickets", element: <MyTickets /> },
      { path: "admin/organizers", element: <OrganizerApprovalsPage /> },
    ],
  },
  // fallback for 404
  { path: "*", element: <div style={{ padding: 20 }}>Page not found</div> },
]);
