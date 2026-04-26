import Delivery from '../models/Delivery.js';
import User from '../models/User.js';

const PENDING_STATUSES = ['unassigned', 'assigned'];
const ACTIVE_ASSIGNMENT_STATUSES = ['assigned', 'accepted', 'reached_pickup', 'picked_up', 'out_for_delivery'];
const IN_TRANSIT_STATUSES = ['reached_pickup', 'picked_up', 'out_for_delivery'];
const VALID_STATUSES = [
  'unassigned',
  'assigned',
  'accepted',
  'reached_pickup',
  'picked_up',
  'out_for_delivery',
  'delivered',
  'failed',
  'rejected',
];
const ALLOWED_TRANSITIONS = {
  unassigned: [],
  assigned: ['accepted', 'rejected'],
  accepted: ['reached_pickup', 'failed'],
  reached_pickup: ['picked_up', 'failed'],
  picked_up: ['out_for_delivery', 'failed'],
  out_for_delivery: ['delivered', 'failed'],
  delivered: [],
  failed: [],
  rejected: [],
};

const statusAliases = {
  unassigned: 'unassigned',
  assigned: 'assigned',
  accepted: 'accepted',
  rejected: 'rejected',
  'reached pickup': 'reached_pickup',
  reached_pickup: 'reached_pickup',
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
        status: { $in: ACTIVE_ASSIGNMENT_STATUSES },
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

const buildTimestampPreservingUpdates = (delivery, status, eventTime) => {
  const timestampUpdates = {
    acceptedAt: delivery.acceptedAt || null,
    pickupReachedAt: delivery.pickupReachedAt || null,
    pickedUpAt: delivery.pickedUpAt || null,
    outForDeliveryAt: delivery.outForDeliveryAt || null,
    deliveredAt: delivery.deliveredAt || null,
    failedAt: null,
  };

  if (status === 'accepted') {
    timestampUpdates.acceptedAt = delivery.acceptedAt || eventTime;
  }

  if (status === 'reached_pickup') {
    timestampUpdates.acceptedAt = delivery.acceptedAt || eventTime;
    timestampUpdates.pickupReachedAt = eventTime;
  }

  if (status === 'picked_up') {
    timestampUpdates.acceptedAt = delivery.acceptedAt || eventTime;
    timestampUpdates.pickupReachedAt = delivery.pickupReachedAt || eventTime;
    timestampUpdates.pickedUpAt = eventTime;
  }

  if (status === 'out_for_delivery') {
    timestampUpdates.acceptedAt = delivery.acceptedAt || eventTime;
    timestampUpdates.pickupReachedAt = delivery.pickupReachedAt || eventTime;
    timestampUpdates.pickedUpAt = delivery.pickedUpAt || eventTime;
    timestampUpdates.outForDeliveryAt = eventTime;
  }

  if (status === 'delivered') {
    timestampUpdates.acceptedAt = delivery.acceptedAt || eventTime;
    timestampUpdates.pickupReachedAt = delivery.pickupReachedAt || eventTime;
    timestampUpdates.pickedUpAt = delivery.pickedUpAt || eventTime;
    timestampUpdates.outForDeliveryAt = delivery.outForDeliveryAt || eventTime;
    timestampUpdates.deliveredAt = eventTime;
  }

  if (status === 'failed') {
    timestampUpdates.failedAt = eventTime;
  }

  return timestampUpdates;
};

export const getAnalytics = async (req, res) => {
  if (!isDatabaseConnected()) {
    return sendDatabaseUnavailable(res);
  }

  try {
    const scopedFilter = buildScopedFilter(req.user);
    const { start, end } = buildRangeForToday();
    const [totalDeliveries, completed, pending, accepted, inTransit, failed, deliveredToday, earnings] = await Promise.all([
      Delivery.countDocuments(scopedFilter),
      Delivery.countDocuments({ ...scopedFilter, status: 'delivered' }),
      Delivery.countDocuments({ ...scopedFilter, status: { $in: PENDING_STATUSES } }),
      Delivery.countDocuments({ ...scopedFilter, status: 'accepted' }),
      Delivery.countDocuments({ ...scopedFilter, status: { $in: IN_TRANSIT_STATUSES } }),
      Delivery.countDocuments({ ...scopedFilter, status: 'failed' }),
      Delivery.countDocuments({
        ...scopedFilter,
        deliveredAt: { $gte: start, $lt: end },
      }),
      sumEarnings({ ...scopedFilter, status: 'delivered' }),
    ]);

    return res.status(200).json({
      totalDeliveries,
      completed,
      pending,
      pendingUnassigned: await Delivery.countDocuments({ ...scopedFilter, status: 'unassigned' }),
      accepted,
      inTransit,
      active: accepted + inTransit,
      failed,
      deliveredToday,
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
    if (req.user?.role !== 'agent') {
      return res.status(403).json({
        message: 'Only delivery agents can update delivery workflow states.',
      });
    }

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

    const eventTime = new Date();
    const updates = {
      status: normalizedStatus,
      failureReason: '',
    };

    if (normalizedStatus === 'rejected') {
      delivery.set({
        status: 'unassigned',
        agentName: '',
        agentEmail: '',
        failureReason: '',
        eta: 'Awaiting rider assignment',
        assignedAt: null,
        acceptedAt: null,
        rejectedAt: eventTime,
        pickupReachedAt: null,
        pickedUpAt: null,
        outForDeliveryAt: null,
        deliveredAt: null,
        failedAt: null,
      });

      const updatedDelivery = await delivery.save();
      return res.status(200).json(updatedDelivery);
    }

    if (normalizedStatus === 'accepted') {
      updates.acceptedAt = eventTime;
      updates.failureReason = '';
    }

    if (normalizedStatus === 'reached_pickup') {
      updates.pickupReachedAt = eventTime;
    }

    if (normalizedStatus === 'picked_up') {
      updates.pickedUpAt = eventTime;
    }

    if (normalizedStatus === 'out_for_delivery') {
      updates.outForDeliveryAt = eventTime;
    }

    if (normalizedStatus === 'delivered') {
      updates.eta = 'Delivered';
      updates.deliveredAt = eventTime;
    }

    if (normalizedStatus === 'failed') {
      updates.eta = 'Delivery failed';
      updates.failureReason = failureReason;
      updates.failedAt = eventTime;
    }

    delivery.set(buildTimestampPreservingUpdates(delivery, normalizedStatus, eventTime));
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

    const [todayTotal, completed, pending, active, failed, earnings] = await Promise.all([
      Delivery.countDocuments(dateFilter),
      Delivery.countDocuments({ ...dateFilter, status: 'delivered' }),
      Delivery.countDocuments({ ...dateFilter, status: { $in: PENDING_STATUSES } }),
      Delivery.countDocuments({ ...dateFilter, status: { $in: ['accepted', ...IN_TRANSIT_STATUSES] } }),
      Delivery.countDocuments({ ...dateFilter, status: 'failed' }),
      sumEarnings({ ...dateFilter, status: 'delivered' }),
    ]);

    return res.status(200).json({
      date: start.toISOString(),
      totalDeliveries: todayTotal,
      completed,
      pending,
      active,
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

    if (!customerName || !customerPhone || !pickupAddress || !dropAddress || !merchantName || !eta) {
      return res.status(400).json({
        message: 'All delivery form fields are required.',
      });
    }

    if (Number.isNaN(earnings) || earnings < 0) {
      return res.status(400).json({
        message: 'Earnings must be a valid non-negative number.',
      });
    }

    const assignedAgent = assignTo
      ? await User.findOne({ email: assignTo, role: 'agent' }).select('name email role')
      : null;

    if (assignTo && !assignedAgent) {
      return res.status(400).json({
        message: 'Assigned rider was not found.',
      });
    }

    const createdAt = new Date();

    const delivery = await Delivery.create({
      customerName,
      customerPhone,
      pickupAddress,
      dropAddress,
      address: dropAddress,
      merchantName,
      agentName: assignedAgent?.name || '',
      agentEmail: assignedAgent?.email || '',
      status: assignedAgent ? 'assigned' : 'unassigned',
      earnings,
      eta,
      coordinates: {
        lat: 0,
        lng: 0,
      },
      assignedAt: assignedAgent ? createdAt : null,
    });

    return res.status(201).json(delivery);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create delivery.',
      error: error.message,
    });
  }
};

export const assignAdminDelivery = async (req, res) => {
  if (!isDatabaseConnected()) {
    return sendDatabaseUnavailable(res);
  }

  try {
    const assignTo = String(req.body?.assignTo || '').trim().toLowerCase();

    if (!assignTo) {
      return res.status(400).json({
        message: 'Select a rider before assigning this delivery.',
      });
    }

    const assignedAgent = await User.findOne({ email: assignTo, role: 'agent' }).select('name email role');
    if (!assignedAgent) {
      return res.status(400).json({
        message: 'Assigned rider was not found.',
      });
    }

    const delivery = await Delivery.findById(req.params.deliveryId);

    if (!delivery) {
      return res.status(404).json({
        message: 'Delivery not found.',
      });
    }

    if (!['unassigned', 'assigned'].includes(delivery.status)) {
      return res.status(400).json({
        message: 'Only pending deliveries can be assigned from the admin panel.',
      });
    }

    const assignedAt = new Date();

    delivery.set({
      agentName: assignedAgent.name,
      agentEmail: assignedAgent.email,
      status: 'assigned',
      eta: delivery.eta || 'Awaiting acceptance',
      failureReason: '',
      assignedAt,
      rejectedAt: null,
      acceptedAt: null,
      pickupReachedAt: null,
      pickedUpAt: null,
      outForDeliveryAt: null,
      deliveredAt: null,
      failedAt: null,
    });

    const updatedDelivery = await delivery.save();
    return res.status(200).json(updatedDelivery);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to assign delivery.',
      error: error.message,
    });
  }
};
