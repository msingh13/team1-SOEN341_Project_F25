import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function EditEvent({ eventId }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    capacity: '',
    ticketType: 'free',
  });

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await axios.get('/api/org/events'); // Fallback: adjust if you want a GET /api/org/events/:id route
        const event = res.data.find(e => e.id === eventId);
        if (event) {
          setForm({
            title: event.title,
            description: event.description,
            date: event.date,
            startTime: event.start_time || '',
            endTime: event.end_time || '',
            location: event.location,
            capacity: event.capacity,
            ticketType: event.ticket_type,
          });
        }
      } catch (err) {
        console.error(err);
        alert('Error fetching event');
      }
    }
    fetchEvent();
  }, [eventId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/org/events/${eventId}`, form);
      alert('Event updated');
    } catch (err) {
      console.error(err);
      alert('Error updating event');
    }
  };

  // --- NEW FUNCTION TO MAKE THE BUTTON WORK ---
  const handleExportCSV = async () => {
    try {
      // Use axios to get the CSV file as a blob
      const response = await axios.get(`/api/org/events/${eventId}/attendees.csv`, {
        responseType: 'blob',
      });

      const blob = response.data;
      
      // Create a temporary link to trigger the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `event_${eventId}_attendees.csv`; // Sets the download filename
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting CSV');
    }
  };

  return (
    // We use <> (a Fragment) to return both the form and the new button
    <>
      <form onSubmit={handleSubmit}>
        <h2>Edit Event</h2>
        <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
        <input name="description" placeholder="Description" value={form.description} onChange={handleChange} />
        <input name="date" type="date" value={form.date} onChange={handleChange} required />
        <input name="startTime" type="time" value={form.startTime} onChange={handleChange} />
        <input name="endTime" type="time" value={form.endTime} onChange={handleChange} />
        <input name="location" placeholder="Location" value={form.location} onChange={handleChange} />
        <input name="capacity" type="number" placeholder="Capacity" value={form.capacity} onChange={handleChange} />
        <select name="ticketType" value={form.ticketType} onChange={handleChange}>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>
        <button type="submit">Update</button>
      </form>

      {/* --- NEW BUTTON --- */}
      <hr style={{ margin: '20px 0' }} />
      <h3>Event Tools</h3>
      <button 
        onClick={handleExportCSV} 
        style={{ padding: '10px', backgroundColor: 'green', color: 'white', border: 'none', cursor: 'pointer' }}
      >
        Export Attendees (CSV)
      </button>
    </>
  );
}
