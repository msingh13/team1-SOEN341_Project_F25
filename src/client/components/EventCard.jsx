export default function EventCard({ event }) {
  const { title, datetime, location, category, organizer } = event;
  return (
    <article className="event-card" aria-label={title}>
      <h3>{title}</h3>
      <p><strong>Date/Time:</strong> {new Date(datetime).toLocaleString()}</p>
      <p><strong>Location:</strong> {location}</p>
      <p><strong>Category:</strong> {category}</p>
      <p><strong>Organizer:</strong> {organizer}</p>
    </article>
  );
}
