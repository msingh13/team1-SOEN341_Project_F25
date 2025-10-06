import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import MyTickets from './MyTickets.tsx'
import "./verify.ts"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MyTickets />
  </StrictMode>,
)
