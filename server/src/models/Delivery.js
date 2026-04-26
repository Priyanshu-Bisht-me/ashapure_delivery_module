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
  merchantName: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['assigned', 'picked_up', 'out_for_delivery', 'delivered', 'failed'],
    default: 'assigned',
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Delivery = mongoose.model('Delivery', deliverySchema);

export default Delivery;
