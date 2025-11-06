import { useEffect, useState } from "react";

export default function OrganizerEvents() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const DEV_USER_ID = import.meta.env.VITE_DEV_USER_ID || "2";
  interface Event {
    id: number;
    title: string;
    startAt: string;
    location: string;
    remaining: number;
    capacity: number;
    status: string;
  }
  
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState("start_asc");

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/me/events?page=${page}&perPage=10&sort=${sort}`,
          { headers: { "X-User-Id": DEV_USER_ID } }
        );
        const data = await res.json();
        setEvents(data.data || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [page, sort]);

  if (loading) return <p>Loading your events...</p>;
  if (!events.length)
    return <p style={{ padding: "1rem" }}>You haven’t created any events yet.</p>;

  return (
    <div style={{ padding: "1.5rem" }}>
      <h2>My Events</h2>

      <div style={{ display: "flex", justifyContent: "space-between", margin: "10px 0" }}>
        <div>
          <label>Sort by:</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="start_asc">Start Date ↑</option>
            <option value="start_desc">Start Date ↓</option>
          </select>
        </div>
        <div>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span style={{ margin: "0 10px" }}>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ background: "#202020" }}>
          <tr>
            <th>Title</th>
            <th>Start Time</th>
            <th>Location</th>
            <th>Capacity / Remaining</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id} style={{ textAlign: "center", borderBottom: "1px solid #333" }}>
              <td>{e.title}</td>
              <td>{new Date(e.startAt).toLocaleString()}</td>
              <td>{e.location}</td>
              <td>{e.remaining} / {e.capacity}</td>
              <td>{e.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
