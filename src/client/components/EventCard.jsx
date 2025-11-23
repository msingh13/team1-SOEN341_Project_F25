export default function EventCard({ event }) {
  const { title, datetime, location, category, organizer } = event;

  const formattedDate = new Date(datetime).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="event-card" aria-label={title}>
      <h3 className="event-title">{title}</h3>
      <p className="event-meta">
        <strong>Date/Time:</strong> {formattedDate}
      </p>
      <p className="event-meta">
        <strong>Location:</strong> {location}
      </p>
      <p className="event-meta">
        <strong>Category:</strong> {category}
      </p>
      <p className="event-meta">
        <strong>Organizer:</strong> {organizer}
      </p>
    </article>
  );
}
