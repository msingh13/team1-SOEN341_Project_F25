import React, { useState } from 'react';
import axios from 'axios';

export default function CreateEvent() {
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/org/events', form);
      alert('Event created! ID: ' + res.data.id);
    } catch (err) {
      console.error(err);
      alert('Error creating event');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" placeholder="Title" onChange={handleChange} required />
      <input name="description" placeholder="Description" onChange={handleChange} />
      <input type="date" name="date" onChange={handleChange} required />
      <input type="time" name="startTime" onChange={handleChange} />
      <input type="time" name="endTime" onChange={handleChange} />
      <input name="location" placeholder="Location" onChange={handleChange} />
      <input type="number" name="capacity" placeholder="Capacity" onChange={handleChange} />
      <select name="ticketType" onChange={handleChange}>
        <option value="free">Free</option>
        <option value="paid">Paid</option>
      </select>
      <button type="submit">Create Event</button>
    </form>
  );
}
