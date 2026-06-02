# PFTD — Resource Planning & Capacity Management System

Know who is available, who is occupied, when a person becomes free, how much
work is assigned, and how much more can be assigned.

- **backend/** — Node.js + Express + MongoDB API ([backend/README.md](backend/README.md))
- **frontend/** — React + Vite SPA ([frontend/README.md](frontend/README.md))

## Quick start

```bash
# 1. Backend
cd backend
npm install
copy .env.example .env      # then edit MONGO_URI + JWT_SECRET (mac/linux: cp)
npm run seed                # creates admin@pftd.com / admin123
npm run dev                 # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Open http://localhost:5173, log in as the seeded admin, and use
**Create User** to add employees. Employees log in, create weekly plans, and
see their capacity; admins set expected times, approve plans, assign tasks,
and watch the resource dashboard.

## Capacity rules
- 1 day = 480 minutes (configurable; use 2400 for a 5-day week).
- Assigned minutes use the admin's expected time when set, else the user's
  estimate.
- `remaining >= 120` → Available · `> 0` → Partially Occupied · else Occupied.
- Utilization = assigned / capacity × 100. `freeAt` = 09:00 + assigned minutes.
- Plans auto-archive every Sunday at midnight (node-cron).