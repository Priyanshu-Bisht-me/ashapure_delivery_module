# Aasapure Delivery Module

## Project Overview

A MERN delivery operations module for dispatch teams and riders. Admins can create and assign deliveries, riders can accept and complete them through a real workflow, and analytics update from MongoDB-backed state changes.

## Features Implemented

- JWT-based login for `admin` and `agent` roles
- Role-based navigation and protected routes
- Admin control center at `/admin`
- Delivery creation with rider assignment and priority
- Pending queue for rejected and unassigned deliveries
- Rider accept, reject, pickup, transit, delivered, and failed workflow actions
- Route page with real action-based progress instead of demo timers
- Delivery detail timeline with persisted timestamps
- Dashboard analytics and summary metrics driven by live delivery records
- Retry, error, loading, and empty states across key pages

## Tech Stack

- React 19
- Vite
- Tailwind CSS
- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- Recharts

## Setup Steps

### 1. Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Configure environment variables

Backend `.env`

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Start the project

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

## Routes

Frontend routes:

- `/login`
- `/signup`
- `/dashboard`
- `/admin`
- `/assigned-deliveries`
- `/route`
- `/summary`
- `/delivery/:deliveryId`

API routes:

- `POST /api/login`
- `POST /api/signup`
- `GET /api/me`
- `GET /api/analytics`
- `GET /api/summary`
- `GET /api/deliveries`
- `GET /api/deliveries/:deliveryId`
- `PUT /api/deliveries/:deliveryId/status`
- `GET /api/admin/agents`
- `POST /api/admin/deliveries`
- `PATCH /api/admin/deliveries/:deliveryId/assign`
- `DELETE /api/admin/deliveries/:deliveryId`

## Demo Credentials

- Admin: `admin@aasapure.com` / `admin123`
- Rider 1: `agent1@aasapure.com` / `agent123`
- Rider 2: `agent2@aasapure.com` / `agent123`

## Workflow States

- `Unassigned`
- `Assigned`
- `Accepted`
- `Rejected`
- `Reached Pickup`
- `Picked Up`
- `Out for Delivery`
- `Delivered`
- `Failed`

Note:

Rejecting an order returns it to `Unassigned` and records `rejectedAt` so admins can reassign it from the pending queue.
