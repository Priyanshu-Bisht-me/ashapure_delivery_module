import Delivery from '../models/Delivery.js';

const PENDING_STATUSES = ['assigned', 'picked_up', 'out_for_delivery'];
const VALID_STATUSES = ['assigned', 'picked_up', 'out_for_delivery', 'delivered', 'failed'];
const ALLOWED_TRANSITIONS = {
  assigned: ['picked_up', 'failed'],
  picked_up: ['out_for_delivery', 'failed'],
  out_for_delivery: ['delivered', 'failed'],
  delivered: [],
  failed: [],
};

const statusAliases = {
  assigned: 'assigned',
  'picked up': 'picked_up',
  picked_up: 'picked_up',
  'out for delivery': 'out_for_delivery',
  out_for_delivery: 'out_for_delivery',
  delivered: 'delivered',
  failed: 'failed',
};

const buildRangeForToday = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

const sumEarnings = async (filter) => {
  const result = await Delivery.aggregate([
    { $match: filter },
    { $group: { _id: null, total: { $sum: '$earnings' } } },
  ]);

  return result[0]?.total ?? 0;
};

const isDatabaseConnected = () => Delivery.db.readyState === 1;

const sendDatabaseUnavailable = (res) =>
  res.status(503).json({
    message: 'Database is not connected. Connect MongoDB Atlas and try again.',
  });

const normalizeStatus = (status) => {
  if (typeof status !== 'string') {
    return '';
  }

  const normalizedKey = status.trim().toLowerCase().replace(/-/g, ' ');
  return statusAliases[normalizedKey] || '';
};

export const getAnalytics = async (req, res) => {
  if (!isDatabaseConnected()) {
    return sendDatabaseUnavailable(res);
  }

  try {
    const [totalDeliveries, completed, pending, failed, earnings] = await Promise.all([
      Delivery.countDocuments(),
      Delivery.countDocuments({ status: 'delivered' }),
      Delivery.countDocuments({ status: { $in: PENDING_STATUSES } }),
      Delivery.countDocuments({ status: 'failed' }),
      sumEarnings({ status: 'delivered' }),
    ]);

    return res.status(200).json({
      totalDeliveries,
      completed,
      pending,
      failed,
      earnings,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch dashboard analytics.',
      error: error.message,
    });
  }
};

export const getAssignedDeliveries = async (req, res) => {
  if (!isDatabaseConnected()) {
    return sendDatabaseUnavailable(res);
  }

  try {
    const deliveries = await Delivery.find().sort({ createdAt: -1 });
    return res.status(200).json(deliveries);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch deliveries.',
      error: error.message,
    });
  }
};

export const getDeliveryById = async (req, res) => {
  if (!isDatabaseConnected()) {
    return sendDatabaseUnavailable(res);
  }

  try {
    const delivery = await Delivery.findById(req.params.deliveryId);

    if (!delivery) {
      return res.status(404).json({
        message: 'Delivery not found.',
      });
    }

    return res.status(200).json(delivery);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch delivery details.',
      error: error.message,
    });
  }
};

export const updateDeliveryStatus = async (req, res) => {
  if (!isDatabaseConnected()) {
    return sendDatabaseUnavailable(res);
  }

  try {
    const normalizedStatus = normalizeStatus(req.body?.status);
    const failureReason = typeof req.body?.failureReason === 'string' ? req.body.failureReason.trim() : '';

    if (!normalizedStatus || !VALID_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        message: 'Invalid status value.',
      });
    }

    const delivery = await Delivery.findById(req.params.deliveryId);

    if (!delivery) {
      return res.status(404).json({
        message: 'Delivery not found.',
      });
    }

    if (!ALLOWED_TRANSITIONS[delivery.status]?.includes(normalizedStatus)) {
      return res.status(400).json({
        message: 'Invalid status transition.',
      });
    }

    if (normalizedStatus === 'failed' && !failureReason) {
      return res.status(400).json({
        message: 'Failure reason is required when marking a delivery as failed.',
      });
    }

    const updates = { status: normalizedStatus, failureReason: '' };
    if (normalizedStatus === 'delivered') {
      updates.eta = 'Delivered';
    }

    if (normalizedStatus === 'failed') {
      updates.eta = 'Delivery failed';
      updates.failureReason = failureReason;
    }

    delivery.set(updates);
    const updatedDelivery = await delivery.save();

    return res.status(200).json(updatedDelivery);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update delivery status.',
      error: error.message,
    });
  }
};

export const getTodaySummary = async (req, res) => {
  if (!isDatabaseConnected()) {
    return sendDatabaseUnavailable(res);
  }

  try {
    const { start, end } = buildRangeForToday();
    const dateFilter = { createdAt: { $gte: start, $lt: end } };

    const [todayTotal, completed, pending, failed, earnings] = await Promise.all([
      Delivery.countDocuments(dateFilter),
      Delivery.countDocuments({ ...dateFilter, status: 'delivered' }),
      Delivery.countDocuments({ ...dateFilter, status: { $in: PENDING_STATUSES } }),
      Delivery.countDocuments({ ...dateFilter, status: 'failed' }),
      sumEarnings({ ...dateFilter, status: 'delivered' }),
    ]);

    return res.status(200).json({
      date: start.toISOString(),
      totalDeliveries: todayTotal,
      completed,
      pending,
      failed,
      earnings,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch today summary.',
      error: error.message,
    });
  }
};
