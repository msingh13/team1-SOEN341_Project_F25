import { Link } from "react-router-dom";

type Props = {
  event: {
    id: string | number;
    title: string;
    description?: string;
    category?: string;
    organizer?: string;
    location?: string;
    start_time?: string;
    end_time?: string;
  };
};

export default function EventCard({ event }: Props) {
  const { id, title, category, organizer, location, start_time } = event;
  return (
    <article className="event-card" style={{ background: "#1a1a1a", padding: 12, borderRadius: 10, border: "1px solid #2a2a2a" }}>
      <h3 style={{ margin: 0 }}>
        <Link to={`/events/${id}`} style={{ color: "white", textDecoration: "none" }}>{title}</Link>
      </h3>
      <p style={{ marginTop: 6, color: "#bbb" }}><strong>Date/Time:</strong> {start_time ? new Date(start_time).toLocaleString() : "TBA"}</p>
      <p style={{ marginTop: 2, color: "#bbb" }}><strong>Location:</strong> {location || "TBA"}</p>
      <p style={{ marginTop: 2, color: "#888" }}>
        <strong>Category:</strong> {category || "—"} · <strong>Organizer:</strong> {organizer || "—"}
      </p>
      <div style={{ marginTop: 10 }}>
        <Link className="btn btn-sm" to={`/events/${id}`}>View</Link>
      </div>
    </article>
  );
}
