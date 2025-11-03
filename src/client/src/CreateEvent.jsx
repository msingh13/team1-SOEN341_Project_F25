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
    createdBy: 'yazan', // or dynamic user
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/org/events', form);
      alert('Event created with ID: ' + res.data.id);
      setForm({
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        capacity: '',
        ticketType: 'free',
        createdBy: 'yazan',
      });
    } catch (err) {
      console.error(err);
      alert('Error creating event');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Event</h2>
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
      <button type="submit">Create</button>
    </form>
  );
}
