# PFTD Backend — Resource Planning & Capacity API

Node.js + Express + MongoDB (Mongoose) API for the Resource Planning &
Capacity Management System.

## Setup

```bash
cd backend
npm install
cp .env.example .env   # then edit values (Windows: copy .env.example .env)
npm run seed           # creates an initial admin (admin@pftd.com / admin123)
npm run dev            # start with auto-reload  (or: npm start)
```

Server runs on `http://localhost:5000`.

## Folder structure

```
backend/
├── config/
│   ├── constants.js      # capacity / status thresholds, roles
│   └── db.js             # MongoDB connection
├── controllers/
│   ├── auth.controller.js
│   ├── plan.controller.js
│   └── admin.controller.js
├── cron/
│   └── cleanup.js        # weekly archive job
├── middleware/
│   ├── auth.middleware.js   # protect + adminOnly
│   └── error.middleware.js
├── models/
│   ├── user.model.js
│   └── plan.model.js
├── routers/
│   ├── auth.routes.js
│   ├── plan.routes.js
│   └── admin.routes.js
├── utils/
│   ├── asyncHandler.js
│   ├── capacity.js       # status / utilization / freeAt math
│   ├── generateToken.js
│   └── week.js           # ISO week helpers
├── seed.js
└── server.js
```

## API

### Auth
| Method | Path                | Access | Body |
| ------ | ------------------- | ------ | ---- |
| POST   | /api/auth/register  | public | name, email, password |
| POST   | /api/auth/login     | public | email, password |
| POST   | /api/auth/logout    | public | – |
| GET    | /api/auth/me        | user   | – |

### Plans (employee)
| Method | Path             | Body |
| ------ | ---------------- | ---- |
| POST   | /api/plans       | taskName, description, userEstimatedTime, week |
| GET    | /api/plans/my    | ?week=2026-W22 (optional) |
| PUT    | /api/plans/:id   | partial plan fields |
| DELETE | /api/plans/:id   | – |

### Admin
| Method | Path                              | Body |
| ------ | --------------------------------- | ---- |
| POST   | /api/admin/users                  | name, email, password, role |
| GET    | /api/admin/users                  | – |
| GET    | /api/admin/users/:id/plans        | – |
| POST   | /api/admin/users/:id/plans        | taskName, adminExpectedTime, week |
| PATCH  | /api/admin/plans/:id              | adminExpectedTime, status |
| GET    | /api/admin/resource-dashboard     | – |

## Capacity logic
- `DAILY_CAPACITY` minutes per planning window (default 480 = 8h day; set
  2400 for a 5-day week).
- Assigned minutes use the admin's expected time when set, otherwise the
  employee's estimate.
- `remaining >= 120` → Available · `remaining > 0` → Partially Occupied ·
  else Occupied.
- Utilization = `assigned / capacity * 100`.
- `freeAt` = workday start (`WORKDAY_START`, default 09:00) + assigned minutes.