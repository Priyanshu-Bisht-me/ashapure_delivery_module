# Database Schema

## Overview

The project currently uses two real MongoDB collections:

- `users`
- `deliveries`

A `payments` model is not implemented yet, but a conceptual structure is included below for future expansion.

## Collection: users

Model file: `server/src/models/User.js`

### Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | `String` | Yes | User display name |
| `email` | `String` | Yes | Unique, lowercase, trimmed |
| `passwordHash` | `String` | Yes | Bcrypt-hashed password |
| `role` | `String` | Yes | Enum: `admin`, `agent` |
| `createdAt` | `Date` | Auto | Added by Mongoose timestamps |
| `updatedAt` | `Date` | Auto | Added by Mongoose timestamps |

### Rules

- `email` must be unique
- Public signup creates `agent` users only
- Admin users are expected to be seeded or created securely outside public signup

## Collection: deliveries

Model file: `server/src/models/Delivery.js`

### Core Fields

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `customerName` | `String` | Yes | - | Customer full name |
| `address` | `String` | Yes | - | General delivery address fallback |
| `customerPhone` | `String` | No | `''` | Customer contact number |
| `pickupAddress` | `String` | No | `''` | Pickup location |
| `dropAddress` | `String` | No | `''` | Final drop location |
| `merchantName` | `String` | Yes | - | Merchant or store name |
| `priority` | `String` | No | `normal` | Enum: `normal`, `high`, `urgent` |
| `agentName` | `String` | No | `''` | Assigned rider name |
| `agentEmail` | `String` | No | `''` | Assigned rider email |
| `status` | `String` | Yes | `unassigned` | Current delivery workflow state |
| `earnings` | `Number` | Yes | - | Rider earnings for this order |
| `eta` | `String` | Yes | - | Human-readable ETA or terminal label |
| `failureReason` | `String` | No | `''` | Required when marked failed |

### Coordinate Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `coordinates.lat` | `Number` | Yes | Latitude |
| `coordinates.lng` | `Number` | Yes | Longitude |

### Workflow Timestamp Fields

| Field | Type | Default | Meaning |
| --- | --- | --- | --- |
| `assignedAt` | `Date` | `null` | Order assigned to rider |
| `acceptedAt` | `Date` | `null` | Rider accepted order |
| `rejectedAt` | `Date` | `null` | Rider rejected order |
| `pickupReachedAt` | `Date` | `null` | Rider reached pickup point |
| `pickedUpAt` | `Date` | `null` | Order collected from merchant |
| `outForDeliveryAt` | `Date` | `null` | Rider left for customer delivery |
| `deliveredAt` | `Date` | `null` | Order delivered successfully |
| `failedAt` | `Date` | `null` | Delivery failed |
| `createdAt` | `Date` | `Date.now` | Record creation time |

### Status Enum

The stored delivery statuses are:

- `unassigned`
- `assigned`
- `accepted`
- `reached_pickup`
- `picked_up`
- `out_for_delivery`
- `delivered`
- `failed`

### Lifecycle Notes

- Admin-created deliveries are stored as `assigned`
- Rider rejection returns the delivery to `unassigned`
- `failureReason` is stored when a delivery is marked `failed`
- Delivered and failed states are terminal from an operations perspective

## Conceptual Collection: payments

There is no `payments` collection in the current implementation. If payment settlement is added later, a structure like this would fit the current system:

| Field | Type | Notes |
| --- | --- | --- |
| `riderId` | `ObjectId` | Reference to a rider user |
| `deliveryId` | `ObjectId` | Reference to a delivery |
| `amount` | `Number` | Payout amount |
| `status` | `String` | Example: `pending`, `paid` |
| `paidAt` | `Date` | Settlement timestamp |
| `createdAt` | `Date` | Record creation |

## Relationships

### Users to Deliveries

- One `agent` can be linked to many deliveries over time
- The current implementation stores rider linkage denormalized as `agentName` and `agentEmail`
- Delivery assignment is based on rider email, not a MongoDB `ObjectId` reference

### Admin to Deliveries

- Admins create, assign, reassign, and cancel deliveries
- Admin ownership is not stored directly on the delivery document

### Users to Payments

- One rider could have many payment records in a future payout system

## ER Diagram Text

```text
Users (admin) -> manages -> many Deliveries
Users (agent) -> fulfills -> many Deliveries
Users (agent) -> receives -> many Payments
Deliveries -> may generate -> one Payment
```

## Example Delivery Document

```json
{
  "_id": "deliveryObjectId",
  "customerName": "John Doe",
  "address": "221B Baker Street",
  "customerPhone": "9999999999",
  "pickupAddress": "Merchant Pickup Point",
  "dropAddress": "221B Baker Street",
  "merchantName": "Aasapure Central",
  "priority": "urgent",
  "agentName": "Rider One",
  "agentEmail": "agent1@aasapure.com",
  "status": "out_for_delivery",
  "earnings": 1900,
  "eta": "15 mins",
  "failureReason": "",
  "coordinates": {
    "lat": 0,
    "lng": 0
  },
  "assignedAt": "2026-04-26T10:00:00.000Z",
  "acceptedAt": "2026-04-26T10:05:00.000Z",
  "rejectedAt": null,
  "pickupReachedAt": "2026-04-26T10:15:00.000Z",
  "pickedUpAt": "2026-04-26T10:20:00.000Z",
  "outForDeliveryAt": "2026-04-26T10:30:00.000Z",
  "deliveredAt": null,
  "failedAt": null,
  "createdAt": "2026-04-26T09:58:00.000Z"
}
```

## Current Design Notes

- The schema favors simplicity and fast delivery flow updates
- Rider linkage is email-based, which keeps assignment logic simple
- Summary, analytics, and admin counts are derived from delivery status values
- If the project grows, the next likely improvements are:
  - rider `ObjectId` references
  - payment settlement collection
  - soft delete or cancellation audit trail
  - admin action audit logs
