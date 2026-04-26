import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAssignedDeliveries, updateDeliveryStatus } from '../api/deliveryApi';
import ConfirmationModal from '../components/ConfirmationModal';
import Layout from '../components/Layout';
import SkeletonBlock from '../components/SkeletonBlock';
import StatusBadge from '../components/StatusBadge';
import ToastMessage from '../components/ToastMessage';
import {
  ACTIVE_ROUTE_STATUSES,
  getAgentActions,
  getDeliveryProgress,
  getRouteStageSummary,
  getStatusLabel,
} from '../utils/deliveryWorkflow';

const statusPriority = {
  accepted: 0,
  reached_pickup: 1,
  picked_up: 2,
  out_for_delivery: 3,
};

const parseEtaMinutes = (eta) => {
  const matchedMinutes = String(eta || '').match(/(\d+)/);
  return matchedMinutes ? Number(matchedMinutes[1]) : 999;
};

const formatDistance = (value) => `${value.toFixed(1)} km`;

const toRadians = (value) => (value * Math.PI) / 180;

const getDistanceInKm = (start, end) => {
  if (!start || !end) {
    return 0;
  }

  const radius = 6371;
  const deltaLat = toRadians(end.lat - start.lat);
  const deltaLng = toRadians(end.lng - start.lng);
  const lat1 = toRadians(start.lat);
  const lat2 = toRadians(end.lat);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return radius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const buildMapSource = (stop) => {
  if (stop?.coordinates?.lat && stop?.coordinates?.lng) {
    return `https://www.google.com/maps?q=${stop.coordinates.lat},${stop.coordinates.lng}&output=embed`;
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(stop?.mapAddress || stop?.address || 'AshaPure Delivery Route')}&output=embed`;
};

function RoutePage() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [modalAction, setModalAction] = useState(null);
  const [failureReason, setFailureReason] = useState('');

  const loadRoute = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getAssignedDeliveries();
      setDeliveries(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load route data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const fetchRoute = async () => {
      try {
        const data = await getAssignedDeliveries();
        if (isActive) {
          setDeliveries(data);
          setLoading(false);
        }
      } catch (requestError) {
        if (isActive) {
          setError(requestError.response?.data?.message || 'Unable to load route data.');
          setLoading(false);
        }
      }
    };

    fetchRoute();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!toast?.message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const sortedDeliveries = useMemo(() => {
    return deliveries
      .filter((delivery) => ACTIVE_ROUTE_STATUSES.includes(delivery.status))
      .sort((first, second) => {
        const priorityGap = (statusPriority[first.status] ?? 99) - (statusPriority[second.status] ?? 99);

        if (priorityGap !== 0) {
          return priorityGap;
        }

        return parseEtaMinutes(first.eta) - parseEtaMinutes(second.eta);
      });
  }, [deliveries]);

  const focusDelivery = sortedDeliveries[0] || null;
  const focusSummary = getRouteStageSummary(focusDelivery);

  const currentStop = useMemo(() => {
    if (!focusDelivery) {
      return null;
    }

    const isPickupStage = ['accepted', 'reached_pickup'].includes(focusDelivery.status);

    return {
      title: isPickupStage ? 'Pickup Stop' : 'Customer Dropoff',
      subtitle: isPickupStage ? focusDelivery.merchantName : focusDelivery.customerName,
      address: isPickupStage ? focusDelivery.pickupAddress || focusDelivery.merchantName : focusDelivery.dropAddress || focusDelivery.address,
      mapAddress: isPickupStage ? focusDelivery.pickupAddress || focusDelivery.merchantName : focusDelivery.dropAddress || focusDelivery.address,
      eta: focusDelivery.eta,
      coordinates: focusDelivery.coordinates,
    };
  }, [focusDelivery]);

  const totalDistance = useMemo(() => {
    if (sortedDeliveries.length === 0) {
      return 0;
    }

    const seedDistance = 1.4;

    return sortedDeliveries.reduce((total, delivery, index) => {
      if (index === 0) {
        return total + seedDistance;
      }

      return total + getDistanceInKm(sortedDeliveries[index - 1].coordinates, delivery.coordinates);
    }, 0);
  }, [sortedDeliveries]);

  const handleAction = async (deliveryId, payload) => {
    setUpdatingId(deliveryId);
    setError('');

    try {
      const updated = await updateDeliveryStatus(deliveryId, payload);
      setDeliveries((current) => current.map((delivery) => (delivery._id === deliveryId ? updated : delivery)));
      setModalAction(null);
      setFailureReason('');
      setToast({
        type: 'success',
        message: `${updated.customerName} moved to ${getStatusLabel(updated.status)}.`,
      });
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to update this delivery.';
      setError(message);
      setToast({ type: 'error', message });
    } finally {
      setUpdatingId('');
    }
  };

  const handleWorkflowAction = async (delivery, action) => {
    if (action.requiresConfirm) {
      setModalAction({ delivery, action });
      setFailureReason('');
      return;
    }

    await handleAction(delivery._id, { status: action.status });
  };

  return (
    <Layout title="Route">
      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <section className="space-y-6">
        <header className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Route Command</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Work through accepted deliveries in real order, update each stage from pickup to doorstep, and keep your
              route state synced with admin and MongoDB.
            </p>
          </div>
          <div className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
            {sortedDeliveries.length} active route {sortedDeliveries.length === 1 ? 'order' : 'orders'}
          </div>
        </header>

        {loading && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <div className="space-y-6">
              <article className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.45)]">
                <SkeletonBlock className="h-5 w-36" />
                <SkeletonBlock className="mt-4 h-[340px] w-full" />
              </article>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                  <article key={item} className="rounded-[26px] border border-emerald-100 bg-white/95 p-4 shadow-[0_20px_44px_-30px_rgba(11,28,48,0.4)]">
                    <SkeletonBlock className="h-4 w-20" />
                    <SkeletonBlock className="mt-4 h-8 w-24" />
                  </article>
                ))}
              </div>
            </div>
            <article className="rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.45)]">
              <SkeletonBlock className="h-5 w-44" />
              <div className="mt-5 space-y-3">
                {[1, 2, 3].map((item) => (
                  <SkeletonBlock key={item} className="h-24 w-full" />
                ))}
              </div>
            </article>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-[26px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <p>{error}</p>
            <button
              type="button"
              onClick={loadRoute}
              className="mt-3 rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-700"
            >
              Retry Route Load
            </button>
          </div>
        )}

        {!loading && !error && sortedDeliveries.length === 0 && (
          <div className="rounded-[26px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            No accepted route work is active right now. Accept an order first and it will appear here with real progress
            controls.
          </div>
        )}

        {!loading && !error && sortedDeliveries.length > 0 && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <div className="space-y-6">
              <article className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white/95 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.45)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 px-5 py-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Map View</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-900">{currentStop?.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">{currentStop?.subtitle}</p>
                  </div>
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {currentStop?.eta || 'ETA pending'}
                  </div>
                </div>
                <div className="aspect-[16/10] w-full overflow-hidden bg-emerald-50">
                  <iframe
                    title="Route Map"
                    src={buildMapSource(currentStop)}
                    className="h-full w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </article>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <article className="rounded-[26px] border border-emerald-100 bg-white/95 p-4 shadow-[0_20px_44px_-30px_rgba(11,28,48,0.4)]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Current Stage</p>
                  <p className="mt-3 text-base font-semibold text-slate-900 md:text-lg">{focusSummary.currentStage}</p>
                </article>
                <article className="rounded-[26px] border border-emerald-100 bg-white/95 p-4 shadow-[0_20px_44px_-30px_rgba(11,28,48,0.4)]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Completed Stops</p>
                  <p className="mt-3 text-3xl font-extrabold text-slate-900">{focusSummary.completedStops}</p>
                </article>
                <article className="rounded-[26px] border border-emerald-100 bg-white/95 p-4 shadow-[0_20px_44px_-30px_rgba(11,28,48,0.4)]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Remaining Stops</p>
                  <p className="mt-3 text-3xl font-extrabold text-slate-900">{focusSummary.remainingStops}</p>
                </article>
                <article className="rounded-[26px] border border-emerald-100 bg-white/95 p-4 shadow-[0_20px_44px_-30px_rgba(11,28,48,0.4)]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Distance</p>
                  <p className="mt-3 text-base font-semibold text-slate-900 md:text-lg">{formatDistance(totalDistance)}</p>
                </article>
              </div>

              <article className="rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.45)]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Live Progress</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-900">{focusDelivery?.customerName}</h2>
                    <p className="mt-1 text-sm text-slate-600">{currentStop?.address}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                    {focusSummary.progress}%
                  </span>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#0f7a54,#2fc487)] transition-all duration-500"
                    style={{ width: `${focusSummary.progress}%` }}
                  />
                </div>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Progress updates only from real workflow actions.
                </p>
              </article>
            </div>

            <div className="space-y-6">
              <article className="rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.45)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Active Deliveries</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-900">Workflow queue</h2>
                  </div>
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {sortedDeliveries.length} orders
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {sortedDeliveries.map((delivery, index) => {
                    const isCurrent = focusDelivery?._id === delivery._id;
                    const progress = getDeliveryProgress(delivery);
                    const actions = getAgentActions(delivery);

                    return (
                      <article
                        key={delivery._id}
                        className={`rounded-[24px] border p-4 transition-all ${
                          isCurrent
                            ? 'border-emerald-300 bg-emerald-50/70 shadow-[0_18px_40px_-30px_rgba(15,122,84,0.55)]'
                            : 'border-emerald-100 bg-slate-50/70 hover:border-emerald-200 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">
                              {index + 1}. {delivery.customerName}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">{delivery.merchantName}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                              Pickup: {delivery.pickupAddress || delivery.merchantName}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                              Drop: {delivery.dropAddress || delivery.address}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            {isCurrent && (
                              <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                                Current
                              </span>
                            )}
                            <div className="mt-2">
                              <StatusBadge status={delivery.status} />
                            </div>
                            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{delivery.eta}</p>
                          </div>
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-emerald-100">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#0f7a54,#2fc487)] transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <span>{getStatusLabel(delivery.status)}</span>
                          <span>{progress}%</span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {actions.map((action) => (
                            <button
                              key={action.key}
                              type="button"
                              disabled={Boolean(updatingId)}
                              onClick={() => handleWorkflowAction(delivery, action)}
                              className={`rounded-xl px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 ${
                                action.tone === 'rose'
                                  ? 'bg-rose-600 hover:bg-rose-700'
                                  : action.tone === 'amber'
                                    ? 'bg-amber-600 hover:bg-amber-700'
                                    : 'bg-emerald-600 hover:bg-emerald-700'
                              }`}
                            >
                              {updatingId === delivery._id ? 'Saving...' : action.label}
                            </button>
                          ))}
                          <Link
                            to={`/delivery/${delivery._id}`}
                            className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
                          >
                            View Details
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </article>
            </div>
          </div>
        )}
      </section>

      <ConfirmationModal
        open={Boolean(modalAction)}
        title={
          modalAction?.action?.status === 'failed'
            ? 'Mark Delivery Failed?'
            : modalAction?.action?.status === 'delivered'
              ? 'Confirm Delivery Completion'
              : 'Confirm Action'
        }
        message={
          modalAction?.action?.status === 'failed'
            ? 'This stops the workflow for this order and records a failure reason for admin review.'
            : modalAction?.action?.status === 'delivered'
              ? 'Confirm that the customer has received this order successfully.'
              : 'Confirm this route update.'
        }
        confirmLabel={modalAction?.action?.label || 'Confirm'}
        tone={modalAction?.action?.tone || 'emerald'}
        loading={updatingId === modalAction?.delivery?._id}
        onClose={() => {
          setModalAction(null);
          setFailureReason('');
        }}
        onConfirm={() => {
          if (!modalAction) {
            return;
          }

          if (modalAction.action.requiresReason && !failureReason.trim()) {
            setToast({ type: 'error', message: 'Please enter a failure reason before confirming.' });
            return;
          }

          handleAction(modalAction.delivery._id, {
            status: modalAction.action.status,
            ...(modalAction.action.requiresReason ? { failureReason: failureReason.trim() } : {}),
          });
        }}
      >
        {modalAction?.action?.requiresReason && (
          <textarea
            value={failureReason}
            onChange={(event) => setFailureReason(event.target.value)}
            rows={4}
            placeholder="Customer unreachable, address issue, store delay..."
            className="mt-4 w-full rounded-2xl border border-emerald-200 bg-emerald-50/30 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400"
          />
        )}
      </ConfirmationModal>
    </Layout>
  );
}

export default RoutePage;
