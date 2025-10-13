import { createBrowserRouter } from 'react-router-dom';
import EventsList from './pages/EventsList.jsx';

export const router = createBrowserRouter([
  { path: '/events', element: <EventsList /> },
]);
