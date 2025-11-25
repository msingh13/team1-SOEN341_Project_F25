# Campus Events & Ticketing Web Application

## Project Description
This project is a **Campus Events & Ticketing Web Application** designed to help students discover, organize, and attend events on campus.

The system allows:
- **Students** to browse events, save them, claim tickets, and check in with QR codes.
- **Organizers** to create/manage events, track attendance, configure waitlists, and view analytics dashboards.
- **Administrators** to moderate events, approve organizers, and access global participation statistics.

The application streamlines event management, improves student engagement, and provides insights for organizers and campus administration.

> Inspired by platforms like [CampusGroups](https://www.campusgroups.com)

---

## Objectives
- Gain hands-on experience with Agile & Scrum.
- Practice version control, collaboration, and GitHub workflows.
- Deliver a functional campus-wide event and ticketing system within 10 weeks.

---

## Core Features

### 1. **Student Event Experience**
- Browse & filter events (date, category, organization)
- Save/unsave events
- Claim tickets (with capacity validation)
- QR Code generation for event check-in
- View claimed tickets and waitlist status

### 2. **Organizer Event Management**
- Create, edit, and manage events
- View per-event analytics (issued tickets, check-ins, remaining capacity)
- Export attendee list as CSV
- Validate tickets during check-in
- Configure **waitlist settings** per event (Sprint 4)

### 3. **Administrator Panel**
- Approve or reject organizer accounts
- Moderate event submissions
- View global analytics (ticketing, participation, traffic)
- Manage organizations & role assignments

### 4. **Sprint 4 Feature Waitlist & Auto-Promotion System**
- Students automatically added to waitlist when event is full
- Organizers can configure:
  - Waitlist enable/disable
  - Max waitlist size
  - Auto-promotion offer window
- Automatic promotion when seats become available
- Waitlist tab under “My Tickets”
- Admin global analytics updated to include waitlist activity

--- 
## Team Members 
| Name | Student Number | GitHub Username | 
| ------------------ | -------------- |----------------- | 
| Mandeep Singh | 40289772 | @msingh13 | 
| Yazan Al Lahham | 40237739 | @555yazan | 
| Nabil Khan | 40284257 | @nabnab00 | 
| Michael Santella | 40264501 | @reflexzone13 | 
| Giuseppe Ippolito | 40315749 | @Ippolito4 |
 | Juliano Di Michele | 40282584 | @JulianoDiMichele |
 | Karim Mellouk | 40315111 | @KarimDsama | 
---
 ## Languages & Technologies
 - **Frontend:** React (Vite) 
- **Backend:** Node.js (Express) 
- **Database:** PostgreSQL 
- **Version Control:** GitHub 
- **Agile Tools:** GitHub Issues, Projects, Wiki, and Actions (CI/CD) 
--- 

# Installation and Setup Guide

---

## 1. Clone the Repository

```bash
git clone https://github.com/msingh13/team1-SOEN341_Project_F25.git
cd team1-SOEN341_Project_F25
```

## 2. Backend Setup
```bash
cd src/server
npm install
```

## 3. Create a .env file inside src/server containing:
```bash
PORT=4000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/campus_events {replace with yours}
DB_USER=postgres {replace with yours}
DB_PASS=postgres  {replace with yours}
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campus_events
CORS_ORIGIN=http://localhost:5173/
JWT_SECRET=dev-secret
```

## 4. Reset and seed the database:
```bash
psql "$DATABASE_URL" -f src/server/db/migrations/reset_and_seed.sql
```

## 5. Start backend:
```bash
npm run dev
```

``` bash Backend URL:
http://localhost:4000
```

## 6. Frontend Setup
```bash
cd ../client
npm install
```
## 7. Create a .env file inside src/client containing:
```bash
VITE_API_URL=http://localhost:4000/
VITE_DEV_USER_ID=3
```
## 8. Start frontend
```bash
npm run dev
```

```bash Frontend URL:
http://localhost:5173
```

## Test Login Accounts
```bash
Student:
User ID: 1
Role: student

Organizer:
User ID: 2
Role: organizer

Admin:
User ID: 3
Role: admin
```

## Agile Process
 - Following **Scrum methodology** with 4 sprints (~3 weeks each). 
- **Sprint 1 Deliverables**: 
- GitHub repo setup and initialization.
 - README with description, objectives, features, team info, and tech stack. 
- User stories (US.##) and tasks (Task-##) in GitHub Issues. 
- Meeting minutes in /docs/meetings. - Contribution logs in /docs/logs.
 --- 
## References 
- [Design Mockup Fidelity](https://www.webfx.com/blog/web-design/design-mockup-fidelity/) 
- [Wireframes vs. Prototypes](https://www.webfx.com/blog/web-design/wireframes-vs-prototypes-difference/) 
- [CampusGroups](https://www.campusgroups.com)


