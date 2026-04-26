import mongoose from 'mongoose';
import Delivery from '../models/Delivery.js';

const connectionStates = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

const seededDeliveries = [
  {
    customerName: 'Aisha Bello',
    address: '12 Admiralty Way, Lekki Phase 1, Lagos',
    customerPhone: '08030000001',
    pickupAddress: 'Fresh Basket Supermarket, Lekki Phase 1, Lagos',
    dropAddress: '12 Admiralty Way, Lekki Phase 1, Lagos',
    merchantName: 'Fresh Basket Supermarket',
    agentName: 'Rider One',
    agentEmail: 'agent1@aasapure.com',
    status: 'assigned',
    earnings: 2500,
    eta: '18 mins',
    coordinates: { lat: 6.4474, lng: 3.4725 },
    assignedAt: new Date('2026-04-26T08:15:00.000Z'),
  },
  {
    customerName: 'Tunde Adeyemi',
    address: '44 Bode Thomas Street, Surulere, Lagos',
    customerPhone: '08030000002',
    pickupAddress: 'Naija Grill Hub, Surulere, Lagos',
    dropAddress: '44 Bode Thomas Street, Surulere, Lagos',
    merchantName: 'Naija Grill Hub',
    agentName: 'Rider Two',
    agentEmail: 'agent2@aasapure.com',
    status: 'accepted',
    earnings: 1800,
    eta: '11 mins',
    coordinates: { lat: 6.5037, lng: 3.3521 },
    assignedAt: new Date('2026-04-26T08:00:00.000Z'),
    acceptedAt: new Date('2026-04-26T08:05:00.000Z'),
  },
  {
    customerName: 'Chioma Okafor',
    address: '5 GRA Avenue, Port Harcourt',
    customerPhone: '08030000003',
    pickupAddress: 'Golden Pharmacy, Port Harcourt',
    dropAddress: '5 GRA Avenue, Port Harcourt',
    merchantName: 'Golden Pharmacy',
    agentName: 'Rider One',
    agentEmail: 'agent1@aasapure.com',
    status: 'reached_pickup',
    earnings: 3200,
    eta: '24 mins',
    coordinates: { lat: 4.8156, lng: 7.0498 },
    assignedAt: new Date('2026-04-26T07:30:00.000Z'),
    acceptedAt: new Date('2026-04-26T07:36:00.000Z'),
    pickupReachedAt: new Date('2026-04-26T07:50:00.000Z'),
  },
  {
    customerName: 'Seyi Aluko',
    address: '19 Iwo Road, Ibadan',
    customerPhone: '08030000004',
    pickupAddress: 'Campus Mart, Ibadan',
    dropAddress: '19 Iwo Road, Ibadan',
    merchantName: 'Campus Mart',
    agentName: 'Rider Two',
    agentEmail: 'agent2@aasapure.com',
    status: 'delivered',
    earnings: 1400,
    eta: 'Delivered',
    coordinates: { lat: 7.4021, lng: 3.947 },
    assignedAt: new Date('2026-04-26T06:15:00.000Z'),
    acceptedAt: new Date('2026-04-26T06:20:00.000Z'),
    pickupReachedAt: new Date('2026-04-26T06:28:00.000Z'),
    pickedUpAt: new Date('2026-04-26T06:35:00.000Z'),
    outForDeliveryAt: new Date('2026-04-26T06:52:00.000Z'),
    deliveredAt: new Date('2026-04-26T07:15:00.000Z'),
  },
  {
    customerName: 'Grace Michael',
    address: '22 Wuse Zone 4, Abuja',
    customerPhone: '08030000005',
    pickupAddress: 'Daily Bread Bakery, Wuse, Abuja',
    dropAddress: '22 Wuse Zone 4, Abuja',
    merchantName: 'Daily Bread Bakery',
    agentName: '',
    agentEmail: '',
    status: 'unassigned',
    earnings: 2100,
    eta: '15 mins',
    coordinates: { lat: 9.0723, lng: 7.4913 },
  },
  {
    customerName: 'Emeka Nwosu',
    address: '8 Independence Layout, Enugu',
    customerPhone: '08030000006',
    pickupAddress: 'Green Veggies Store, Enugu',
    dropAddress: '8 Independence Layout, Enugu',
    merchantName: 'Green Veggies Store',
    agentName: 'Rider Two',
    agentEmail: 'agent2@aasapure.com',
    status: 'picked_up',
    earnings: 2600,
    eta: '13 mins',
    coordinates: { lat: 6.4584, lng: 7.5464 },
    assignedAt: new Date('2026-04-26T09:00:00.000Z'),
    acceptedAt: new Date('2026-04-26T09:08:00.000Z'),
    pickupReachedAt: new Date('2026-04-26T09:15:00.000Z'),
    pickedUpAt: new Date('2026-04-26T09:30:00.000Z'),
  },
  {
    customerName: 'Hadiza Umar',
    address: '30 Zoo Road, Kano',
    customerPhone: '08030000007',
    pickupAddress: 'City Medics, Kano',
    dropAddress: '30 Zoo Road, Kano',
    merchantName: 'City Medics',
    agentName: 'Rider One',
    agentEmail: 'agent1@aasapure.com',
    status: 'failed',
    earnings: 2900,
    eta: 'Delivery failed',
    coordinates: { lat: 12.0022, lng: 8.5919 },
    assignedAt: new Date('2026-04-26T05:40:00.000Z'),
    acceptedAt: new Date('2026-04-26T05:50:00.000Z'),
    pickupReachedAt: new Date('2026-04-26T06:00:00.000Z'),
    pickedUpAt: new Date('2026-04-26T06:12:00.000Z'),
    outForDeliveryAt: new Date('2026-04-26T06:25:00.000Z'),
    failedAt: new Date('2026-04-26T06:50:00.000Z'),
    failureReason: 'Customer phone unreachable after multiple attempts.',
  },
  {
    customerName: 'Kunle Ajayi',
    address: '6 Ring Road, Benin City',
    customerPhone: '08030000008',
    pickupAddress: 'Prime Electronics, Benin City',
    dropAddress: '6 Ring Road, Benin City',
    merchantName: 'Prime Electronics',
    agentName: 'Rider Two',
    agentEmail: 'agent2@aasapure.com',
    status: 'assigned',
    earnings: 3500,
    eta: '27 mins',
    coordinates: { lat: 6.335, lng: 5.6037 },
    assignedAt: new Date('2026-04-26T10:00:00.000Z'),
  },
  {
    customerName: 'Mariam Yusuf',
    address: '14 Ahmadu Bello Way, Kaduna',
    customerPhone: '08030000009',
    pickupAddress: 'Chef Kitchen Express, Kaduna',
    dropAddress: '14 Ahmadu Bello Way, Kaduna',
    merchantName: 'Chef Kitchen Express',
    agentName: 'Rider One',
    agentEmail: 'agent1@aasapure.com',
    status: 'out_for_delivery',
    earnings: 2300,
    eta: '17 mins',
    coordinates: { lat: 10.5264, lng: 7.4388 },
    assignedAt: new Date('2026-04-26T08:20:00.000Z'),
    acceptedAt: new Date('2026-04-26T08:25:00.000Z'),
    pickupReachedAt: new Date('2026-04-26T08:36:00.000Z'),
    pickedUpAt: new Date('2026-04-26T08:45:00.000Z'),
    outForDeliveryAt: new Date('2026-04-26T08:55:00.000Z'),
  },
  {
    customerName: 'Ifeanyi Obi',
    address: '3 Aba Road, Owerri',
    customerPhone: '08030000010',
    pickupAddress: 'Quick Care Diagnostics, Owerri',
    dropAddress: '3 Aba Road, Owerri',
    merchantName: 'Quick Care Diagnostics',
    agentName: 'Rider Two',
    agentEmail: 'agent2@aasapure.com',
    status: 'assigned',
    earnings: 2700,
    eta: '19 mins',
    coordinates: { lat: 5.4763, lng: 7.0258 },
    assignedAt: new Date('2026-04-26T10:20:00.000Z'),
  },
];

export const getHealth = (req, res) => {
  const readyState = mongoose.connection.readyState;

  res.status(200).json({
    ok: true,
    message: 'Delivery API is running',
    database: {
      state: connectionStates[readyState] || 'unknown',
      readyState,
    },
    timestamp: new Date().toISOString(),
  });
};

export const seedDeliveries = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        ok: false,
        message: 'Database is not connected. Connect MongoDB Atlas and try again.',
      });
    }

    await Delivery.deleteMany({});
    const inserted = await Delivery.insertMany(seededDeliveries);

    return res.status(201).json({
      ok: true,
      message: 'Delivery records seeded successfully.',
      count: inserted.length,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Failed to seed delivery records.',
      error: error.message,
    });
  }
};
