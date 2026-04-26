# Aasapure Delivery Module

A demo-ready delivery operations module for Aasapure with analytics, workflow controls, route tracking, and MongoDB-backed persistence.

## Features

- Dashboard analytics
- Delivery workflow management
- Route tracking
- MongoDB persistence
- Charts
- Responsive UI

## Tech Stack

- React
- Vite
- Node.js
- Express
- MongoDB Atlas
- Recharts

## Setup

### Backend

```bash
cd server
npm install
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

## Environment Variables

### Backend

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
```

### Frontend

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Demo Credentials

No login or demo credentials are required.

## Workflow States

Assigned -> Picked Up -> Out for Delivery -> Delivered / Failed

## Project Structure

- `client/` - React + Vite frontend
- `server/` - Express + MongoDB API

## Notes

- The route page uses a Google Maps embed iframe and does not require a Google Maps API key.
- Delivery status rules are enforced in both the UI and backend.
- MongoDB Atlas is required for persistent demo data.
