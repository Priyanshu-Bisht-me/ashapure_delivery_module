export const statusLabels = {
  unassigned: 'Unassigned',
  assigned: 'Assigned',
  accepted: 'Accepted',
  reached_pickup: 'Reached Pickup',
  picked_up: 'Picked Up',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  failed: 'Failed',
};

export const ACTIVE_ROUTE_STATUSES = ['accepted', 'reached_pickup', 'picked_up', 'out_for_delivery'];
export const ASSIGNED_QUEUE_STATUSES = ['assigned'];
export const TRANSIT_STATUSES = ['reached_pickup', 'picked_up', 'out_for_delivery'];

const progressByStatus = {
  unassigned: 0,
  assigned: 0,
  accepted: 10,
  reached_pickup: 30,
  picked_up: 50,
  out_for_delivery: 75,
  delivered: 100,
  failed: 0,
};

const routeStages = ['accepted', 'reached_pickup', 'picked_up', 'out_for_delivery', 'delivered'];

export const getStatusLabel = (status) => statusLabels[status] || status;

export const getDeliveryProgress = (delivery) => {
  if (!delivery) {
    return 0;
  }

  if (delivery.status !== 'failed') {
    return progressByStatus[delivery.status] ?? 0;
  }

  if (delivery.outForDeliveryAt) {
    return progressByStatus.out_for_delivery;
  }

  if (delivery.pickedUpAt) {
    return progressByStatus.picked_up;
  }

  if (delivery.pickupReachedAt) {
    return progressByStatus.reached_pickup;
  }

  if (delivery.acceptedAt) {
    return progressByStatus.accepted;
  }

  return 0;
};

export const getRouteStageSummary = (delivery) => {
  if (!delivery) {
    return {
      currentStage: 'No active stage',
      completedStops: 0,
      remainingStops: routeStages.length,
      progress: 0,
    };
  }

  const progress = getDeliveryProgress(delivery);

  if (delivery.status === 'failed') {
    const completedStops = routeStages.filter((stage) => {
      if (stage === 'accepted') {
        return Boolean(delivery.acceptedAt);
      }

      if (stage === 'reached_pickup') {
        return Boolean(delivery.pickupReachedAt);
      }

      if (stage === 'picked_up') {
        return Boolean(delivery.pickedUpAt);
      }

      if (stage === 'out_for_delivery') {
        return Boolean(delivery.outForDeliveryAt);
      }

      return false;
    }).length;

    return {
      currentStage: 'Failed',
      completedStops,
      remainingStops: 0,
      progress,
    };
  }

  const activeStageIndex = routeStages.findIndex((stage) => stage === delivery.status);
  const completedStops = activeStageIndex >= 0 ? activeStageIndex + 1 : 0;
  const remainingStops = Math.max(routeStages.length - completedStops, 0);

  return {
    currentStage: getStatusLabel(delivery.status),
    completedStops,
    remainingStops,
    progress,
  };
};

export const getAgentActions = (delivery) => {
  if (!delivery) {
    return [];
  }

  switch (delivery.status) {
    case 'assigned':
      return [
        { key: 'accept', status: 'accepted', label: 'Accept Order', tone: 'emerald' },
        { key: 'reject', status: 'rejected', label: 'Reject Order', tone: 'rose', requiresConfirm: true },
      ];
    case 'accepted':
      return [{ key: 'start', status: 'reached_pickup', label: 'Start Delivery', tone: 'emerald' }];
    case 'reached_pickup':
      return [{ key: 'picked-up', status: 'picked_up', label: 'Picked Up', tone: 'emerald' }];
    case 'picked_up':
      return [{ key: 'out-for-delivery', status: 'out_for_delivery', label: 'Out for Delivery', tone: 'amber' }];
    case 'out_for_delivery':
      return [
        { key: 'delivered', status: 'delivered', label: 'Mark Delivered', tone: 'emerald', requiresConfirm: true },
        { key: 'failed', status: 'failed', label: 'Mark Failed', tone: 'rose', requiresConfirm: true, requiresReason: true },
      ];
    default:
      return [];
  }
};

export const getTimelineSteps = (delivery) => {
  const finalLabel = delivery?.status === 'failed' ? 'Failed' : 'Delivered';
  const finalDate = delivery?.status === 'failed' ? delivery.failedAt : delivery?.deliveredAt;
  const currentStatus = delivery?.status;
  const finalStatusKey = delivery?.status === 'failed' ? 'failed' : 'delivered';

  const steps = [
    { key: 'assigned', label: 'Assigned', at: delivery?.assignedAt || delivery?.createdAt || null },
    { key: 'accepted', label: 'Accepted', at: delivery?.acceptedAt || null },
    { key: 'reached_pickup', label: 'Reached Pickup', at: delivery?.pickupReachedAt || null },
    { key: 'picked_up', label: 'Picked Up', at: delivery?.pickedUpAt || null },
    { key: 'out_for_delivery', label: 'Out for Delivery', at: delivery?.outForDeliveryAt || null },
    { key: finalStatusKey, label: finalLabel, at: finalDate || null },
  ];

  const currentIndex = steps.findIndex((step) => step.key === currentStatus);

  return steps.map((step, index) => {
    const complete = Boolean(step.at);
    const isCurrent = currentIndex === index;

    return {
      ...step,
      state: isCurrent ? 'current' : complete ? 'complete' : 'pending',
    };
  });
};
