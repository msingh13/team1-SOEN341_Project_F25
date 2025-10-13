import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import MyTickets from './MyTickets.tsx'
import "./verify.ts"
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import SavedEvents from "./pages/SavedEvents.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MyTickets />
  </StrictMode>,
)
    <BrowserRouter>
      <Routes>
        {/* Main home route */}
        <Route path="/" element={<App />} />
        {/* ✅ Dedicated Saved Events page */}
        <Route path="/saved" element={<SavedEvents />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
