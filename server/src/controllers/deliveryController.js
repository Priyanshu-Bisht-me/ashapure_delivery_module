import Delivery from '../models/Delivery.js';
import User from '../models/User.js';

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

const buildScopedFilter = (user) => {
  if (!user || user.role === 'admin') {
    return {};
  }

  return {
    agentEmail: user.email,
  };
};

const buildAssignedCountMap = async () => {
  const counts = await Delivery.aggregate([
    {
      $match: {
        agentEmail: { $ne: '' },
        status: { $in: PENDING_STATUSES },
      },
    },
    {
      $group: {
        _id: '$agentEmail',
        count: { $sum: 1 },
      },
    },
  ]);

  return counts.reduce((result, item) => {
    result[item._id] = item.count;
    return result;
  }, {});
};

export const getAnalytics = async (req, res) => {
  if (!isDatabaseConnected()) {
    return sendDatabaseUnavailable(res);
  }

  try {
    const scopedFilter = buildScopedFilter(req.user);
    const [totalDeliveries, completed, pending, failed, earnings] = await Promise.all([
      Delivery.countDocuments(scopedFilter),
      Delivery.countDocuments({ ...scopedFilter, status: 'delivered' }),
      Delivery.countDocuments({ ...scopedFilter, status: { $in: PENDING_STATUSES } }),
      Delivery.countDocuments({ ...scopedFilter, status: 'failed' }),
      sumEarnings({ ...scopedFilter, status: 'delivered' }),
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
    const deliveries = await Delivery.find(buildScopedFilter(req.user)).sort({ createdAt: -1 });
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
    const delivery = await Delivery.findOne({
      _id: req.params.deliveryId,
      ...buildScopedFilter(req.user),
    });

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

    const delivery = await Delivery.findOne({
      _id: req.params.deliveryId,
      ...buildScopedFilter(req.user),
    });

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
    const dateFilter = { ...buildScopedFilter(req.user), createdAt: { $gte: start, $lt: end } };

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

export const getAdminAgents = async (req, res) => {
  if (!isDatabaseConnected()) {
    return sendDatabaseUnavailable(res);
  }

  try {
    const [agents, assignedCountMap] = await Promise.all([
      User.find({ role: 'agent' }).sort({ createdAt: 1 }).select('_id name email role createdAt updatedAt'),
      buildAssignedCountMap(),
    ]);

    const mappedAgents = agents.map((agent) => {
      const assignedDeliveriesCount = assignedCountMap[agent.email] || 0;

      return {
        id: agent._id.toString(),
        name: agent.name,
        email: agent.email,
        role: agent.role,
        assignedDeliveriesCount,
        status: assignedDeliveriesCount > 0 ? 'Active' : 'Idle',
      };
    });

    return res.status(200).json(mappedAgents);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch delivery agents.',
      error: error.message,
    });
  }
};

export const createAdminDelivery = async (req, res) => {
  if (!isDatabaseConnected()) {
    return sendDatabaseUnavailable(res);
  }

  try {
    const customerName = String(req.body?.customerName || '').trim();
    const customerPhone = String(req.body?.customerPhone || '').trim();
    const pickupAddress = String(req.body?.pickupAddress || '').trim();
    const dropAddress = String(req.body?.dropAddress || '').trim();
    const merchantName = String(req.body?.merchantName || '').trim();
    const eta = String(req.body?.eta || '').trim();
    const earnings = Number(req.body?.earnings);
    const assignTo = String(req.body?.assignTo || '').trim().toLowerCase();

    if (!customerName || !customerPhone || !pickupAddress || !dropAddress || !merchantName || !eta || !assignTo) {
      return res.status(400).json({
        message: 'All delivery form fields are required.',
      });
    }

    if (Number.isNaN(earnings) || earnings < 0) {
      return res.status(400).json({
        message: 'Earnings must be a valid non-negative number.',
      });
    }

    const assignedAgent = await User.findOne({ email: assignTo, role: 'agent' }).select('name email role');
    if (!assignedAgent) {
      return res.status(400).json({
        message: 'Assigned rider was not found.',
      });
    }

    const delivery = await Delivery.create({
      customerName,
      customerPhone,
      pickupAddress,
      dropAddress,
      address: dropAddress,
      merchantName,
      agentName: assignedAgent.name,
      agentEmail: assignedAgent.email,
      status: 'assigned',
      earnings,
      eta,
      coordinates: {
        lat: 0,
        lng: 0,
      },
    });

    return res.status(201).json(delivery);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create delivery.',
      error: error.message,
    });
  }
};
