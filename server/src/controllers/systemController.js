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
    merchantName: 'Fresh Basket Supermarket',
    status: 'assigned',
    earnings: 2500,
    eta: '18 mins',
    coordinates: { lat: 6.4474, lng: 3.4725 },
  },
  {
    customerName: 'Tunde Adeyemi',
    address: '44 Bode Thomas Street, Surulere, Lagos',
    merchantName: 'Naija Grill Hub',
    status: 'picked_up',
    earnings: 1800,
    eta: '11 mins',
    coordinates: { lat: 6.5037, lng: 3.3521 },
  },
  {
    customerName: 'Chioma Okafor',
    address: '5 GRA Avenue, Port Harcourt',
    merchantName: 'Golden Pharmacy',
    status: 'out_for_delivery',
    earnings: 3200,
    eta: '24 mins',
    coordinates: { lat: 4.8156, lng: 7.0498 },
  },
  {
    customerName: 'Seyi Aluko',
    address: '19 Iwo Road, Ibadan',
    merchantName: 'Campus Mart',
    status: 'delivered',
    earnings: 1400,
    eta: 'Delivered',
    coordinates: { lat: 7.4021, lng: 3.947 },
  },
  {
    customerName: 'Grace Michael',
    address: '22 Wuse Zone 4, Abuja',
    merchantName: 'Daily Bread Bakery',
    status: 'assigned',
    earnings: 2100,
    eta: '15 mins',
    coordinates: { lat: 9.0723, lng: 7.4913 },
  },
  {
    customerName: 'Emeka Nwosu',
    address: '8 Independence Layout, Enugu',
    merchantName: 'Green Veggies Store',
    status: 'picked_up',
    earnings: 2600,
    eta: '13 mins',
    coordinates: { lat: 6.4584, lng: 7.5464 },
  },
  {
    customerName: 'Hadiza Umar',
    address: '30 Zoo Road, Kano',
    merchantName: 'City Medics',
    status: 'failed',
    earnings: 2900,
    eta: 'Delivery failed',
    coordinates: { lat: 12.0022, lng: 8.5919 },
  },
  {
    customerName: 'Kunle Ajayi',
    address: '6 Ring Road, Benin City',
    merchantName: 'Prime Electronics',
    status: 'assigned',
    earnings: 3500,
    eta: '27 mins',
    coordinates: { lat: 6.335, lng: 5.6037 },
  },
  {
    customerName: 'Mariam Yusuf',
    address: '14 Ahmadu Bello Way, Kaduna',
    merchantName: 'Chef Kitchen Express',
    status: 'picked_up',
    earnings: 2300,
    eta: '17 mins',
    coordinates: { lat: 10.5264, lng: 7.4388 },
  },
  {
    customerName: 'Ifeanyi Obi',
    address: '3 Aba Road, Owerri',
    merchantName: 'Quick Care Diagnostics',
    status: 'out_for_delivery',
    earnings: 2700,
    eta: '19 mins',
    coordinates: { lat: 5.4763, lng: 7.0258 },
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
