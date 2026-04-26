# Aasapure Delivery Module

## Overview

This project is a MERN-based delivery operations module built for two roles:

- `admin`: manages deliveries, assigns riders, monitors live operations, and reviews analytics
- `agent`: accepts assigned jobs, updates delivery progress, and completes the rider workflow

The system is database-backed end to end. Delivery actions update the rider UI, admin panel, analytics, summary data, and MongoDB records in real time after refresh.

## What Is Implemented

### Authentication and Access Control

- JWT-based authentication
- Protected frontend routes
- Protected backend API routes
- Public signup restricted to delivery agents only
- Admin users blocked from rider-only workflow pages
- Agent users blocked from the admin control center

### Admin System

- Dedicated admin control center at `/admin`
- Role-based navigation with admin-only simplified menu
- Delivery stats cards using live backend data
- Create Delivery form with:
  - `customerName`
  - `customerPhone`
  - `pickupAddress`
  - `dropAddress`
  - `merchantName`
  - `assignedRider`
  - `earnings`
  - `priority`
- Immediate rider assignment during delivery creation
- Reassign rider action
- Cancel order action
- Pending queue for deliveries returned to the admin pool
- Recent deliveries list with current delivery status
- Delivery agents list with active/idle counts

### Rider System

- Rider dashboard at `/dashboard`
- Assigned Deliveries page showing only that rider's deliveries
- Accept Order flow
- Reject Order flow with confirmation
- Route page with active workflow actions
- Delivery detail page with action controls and timeline
- Summary page with rider business insights

### Delivery Workflow

Supported statuses:

- `unassigned`
- `assigned`
- `accepted`
- `reached_pickup`
- `picked_up`
- `out_for_delivery`
- `delivered`
- `failed`

Behavior:

- Admin-created deliveries start as `assigned`
- Rider rejection returns the order to `unassigned`
- Delivered and failed orders become terminal states
- Failed deliveries require a failure reason
- Workflow timestamps are persisted for each important stage

### Analytics and Reporting

- Dashboard analytics from MongoDB
- Role-scoped analytics for admins and riders
- Summary page with:
  - completed today
  - failed today
  - pending today
  - total earnings
  - unpaid earnings placeholder logic
  - average delivery time
  - top rider
  - completion rate
  - recent completed orders

### UI Quality and States

- Existing green theme preserved
- Loading states
- Error cards with retry actions
- Empty states on data-driven pages
- Mobile-friendly layouts for core pages

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Tailwind CSS
- Recharts
- Axios

### Backend

- Node.js
- Express
- MongoDB Atlas
- Mongoose
- JWT
- bcryptjs

## Project Structure

```text
delivery/
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── utils/
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/
├── README.md
└── DATABASE_SCHEMA.md
```

## Setup

### 1. Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Configure environment variables

Backend `server/.env`

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
```

Frontend `client/.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Run the project

Backend:

```bash
cd server
npm run dev
```

Frontend:

```bash
cd client
npm run dev
```

### 4. Production build

```bash
cd client
npm run build
```

## Demo Credentials

- Admin: `admin@aasapure.com` / `admin123`
- Rider 1: `agent1@aasapure.com` / `agent123`
- Rider 2: `agent2@aasapure.com` / `agent123`

## Frontend Routes

- `/login`
- `/signup`
- `/dashboard`
- `/admin`
- `/assigned-deliveries`
- `/route`
- `/summary`
- `/delivery/:deliveryId`

## Backend API Routes

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Delivery and Analytics

- `GET /api/health`
- `GET /api/analytics`
- `GET /api/summary`
- `GET /api/summary/today`
- `GET /api/deliveries`
- `GET /api/deliveries/:deliveryId`
- `PUT /api/deliveries/:deliveryId/status`
- `PATCH /api/deliveries/:deliveryId/status`

### Admin

- `GET /api/admin/agents`
- `POST /api/admin/deliveries`
- `PATCH /api/admin/deliveries/:deliveryId/assign`
- `DELETE /api/admin/deliveries/:deliveryId`

## Workflow Actions

### Admin Flow

1. Admin logs in and lands on `/admin`
2. Admin creates a delivery and selects a rider
3. Delivery is saved to MongoDB as `assigned`
4. Assigned rider sees the order in Assigned Deliveries
5. Admin can reassign or cancel while the order is still active

### Rider Flow

1. Rider logs in and lands on `/dashboard`
2. Rider sees assigned deliveries only
3. Rider accepts or rejects the order
4. Accepted orders appear in the Route page workflow
5. Rider updates progress through:
   - `accepted`
   - `reached_pickup`
   - `picked_up`
   - `out_for_delivery`
   - `delivered` or `failed`
6. Each action persists timestamps and status in MongoDB

## Progress Mapping

The route and detail experience use real action-driven progress:

- `accepted` = `10%`
- `reached_pickup` = `30%`
- `picked_up` = `50%`
- `out_for_delivery` = `75%`
- `delivered` = `100%`
- `failed` = stopped state

## Business Rules

- Only authenticated users can access protected pages and APIs
- Only admins can create, assign, reassign, or cancel deliveries
- Only agents can update rider workflow statuses
- Agents can update only deliveries scoped to their own account
- Rejected orders are returned to the admin pool
- Failed orders require a reason
- Delivered and failed orders cannot be reassigned or cancelled

## Database Notes

- Users are stored in MongoDB with hashed passwords
- Deliveries store rider assignment, workflow status, timestamps, and earnings
- Demo users are auto-seeded by the backend bootstrap logic
- Legacy placeholder data can coexist with newly created deliveries

For the full schema, see [DATABASE_SCHEMA.md](/c:/Users/ray4s/Desktop/delivery/DATABASE_SCHEMA.md).

## Submission Checklist

- Backend starts cleanly
- MongoDB Atlas connects
- Frontend builds successfully
- Admin login redirects to `/admin`
- Rider login redirects to `/dashboard`
- Create delivery works
- Rider workflow persists to database
- Analytics and summary reflect delivery changes

