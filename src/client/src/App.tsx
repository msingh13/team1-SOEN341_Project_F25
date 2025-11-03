import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CreateEvent from './CreateEvent';
import EditEvent from './EditEvent';

function App() {
  return (
    <Router>
      <nav>
        <Link to="/create">Create Event</Link> | 
        <Link to="/edit">Edit Event</Link>
      </nav>
      <Routes>
        <Route path="/create" element={<CreateEvent />} />
        <Route path="/edit" element={<EditEvent eventId="PUT_EVENT_ID_HERE" />} />
      </Routes>
    </Router>
  );
}

export default App;
