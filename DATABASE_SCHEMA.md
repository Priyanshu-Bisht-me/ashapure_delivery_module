# Database Schema

## Users

Collection: `users`

Fields:

- `name`
- `email`
- `passwordHash`
- `role`

Role values:

- `admin`
- `agent`

## Deliveries

Collection: `deliveries`

Core fields:

- `customerName`
- `customerPhone`
- `pickupAddress`
- `dropAddress`
- `address`
- `merchantName`
- `priority`
- `agentName`
- `agentEmail`
- `status`
- `earnings`
- `eta`
- `failureReason`

Workflow timestamps:

- `assignedAt`
- `acceptedAt`
- `rejectedAt`
- `pickupReachedAt`
- `pickedUpAt`
- `outForDeliveryAt`
- `deliveredAt`
- `failedAt`

Other fields:

- `coordinates.lat`
- `coordinates.lng`
- `createdAt`

Status values:

- `unassigned`
- `assigned`
- `accepted`
- `reached_pickup`
- `picked_up`
- `out_for_delivery`
- `delivered`
- `failed`

## Payments

Payments are conceptual in the current project and are not stored in a dedicated collection yet.

Suggested future fields:

- `riderId`
- `deliveryId`
- `amount`
- `status`
- `paidAt`

## ER Diagram Text

- Users `(1)` -> Many Deliveries
- Users `(1 Rider)` -> Many Payments

In practice:

- One rider can be assigned to many deliveries over time.
- One admin can create and manage many deliveries.
- A future payments model would link one rider to many payout records.
