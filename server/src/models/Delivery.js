import mongoose from 'mongoose';

const coordinatesSchema = new mongoose.Schema(
  {
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const deliverySchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  customerPhone: {
    type: String,
    default: '',
    trim: true,
  },
  pickupAddress: {
    type: String,
    default: '',
    trim: true,
  },
  dropAddress: {
    type: String,
    default: '',
    trim: true,
  },
  merchantName: {
    type: String,
    required: true,
    trim: true,
  },
  priority: {
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal',
  },
  agentName: {
    type: String,
    default: '',
    trim: true,
  },
  agentEmail: {
    type: String,
    default: '',
    lowercase: true,
    trim: true,
  },
  status: {
    type: String,
    required: true,
    enum: [
      'unassigned',
      'assigned',
      'accepted',
      'reached_pickup',
      'picked_up',
      'out_for_delivery',
      'delivered',
      'failed',
    ],
    default: 'unassigned',
  },
  earnings: {
    type: Number,
    required: true,
    min: 0,
  },
  eta: {
    type: String,
    required: true,
    trim: true,
  },
  failureReason: {
    type: String,
    default: '',
    trim: true,
  },
  coordinates: {
    type: coordinatesSchema,
    required: true,
  },
  assignedAt: {
    type: Date,
    default: null,
  },
  acceptedAt: {
    type: Date,
    default: null,
  },
  rejectedAt: {
    type: Date,
    default: null,
  },
  pickupReachedAt: {
    type: Date,
    default: null,
  },
  pickedUpAt: {
    type: Date,
    default: null,
  },
  outForDeliveryAt: {
    type: Date,
    default: null,
  },
  deliveredAt: {
    type: Date,
    default: null,
  },
  failedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Delivery = mongoose.model('Delivery', deliverySchema);

export default Delivery;
