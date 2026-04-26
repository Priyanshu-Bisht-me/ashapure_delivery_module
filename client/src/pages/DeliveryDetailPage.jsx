import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDeliveryById, updateDeliveryStatus } from '../api/deliveryApi';
import { useAuth } from '../auth/useAuth';
import ConfirmationModal from '../components/ConfirmationModal';
import Layout from '../components/Layout';
import SkeletonBlock from '../components/SkeletonBlock';
import StatusBadge from '../components/StatusBadge';
import ToastMessage from '../components/ToastMessage';
import {
  getAgentActions,
  getDeliveryProgress,
  getRouteStageSummary,
  getStatusLabel,
  getTimelineSteps,
} from '../utils/deliveryWorkflow';

const formatDate = (dateValue) => {
  if (!dateValue) {
    return 'N/A';
  }

  return new Date(dateValue).toLocaleString();
};

function DeliveryDetailPage() {
  const { deliveryId } = useParams();
  const { user } = useAuth();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [modalAction, setModalAction] = useState(null);
  const [failureReason, setFailureReason] = useState('');

  const loadDelivery = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getDeliveryById(deliveryId);
      setDelivery(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load delivery details.');
    } finally {
      setLoading(false);
    }
  }, [deliveryId]);

  useEffect(() => {
    let isActive = true;

    const fetchDelivery = async () => {
      try {
        const data = await getDeliveryById(deliveryId);
        if (isActive) {
          setDelivery(data);
          setLoading(false);
        }
      } catch (requestError) {
        if (isActive) {
          setError(requestError.response?.data?.message || 'Unable to load delivery details.');
          setLoading(false);
        }
      }
    };

    fetchDelivery();

    return () => {
      isActive = false;
    };
  }, [deliveryId]);

  useEffect(() => {
    if (!toast?.message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const isAdmin = user?.role === 'admin';
  const actions = useMemo(() => getAgentActions(delivery), [delivery]);
  const progress = getDeliveryProgress(delivery);
  const summary = getRouteStageSummary(delivery);
  const timelineSteps = useMemo(() => getTimelineSteps(delivery), [delivery]);

  const submitStatusUpdate = async (payload) => {
    if (!delivery) {
      return;
    }

    setUpdatingStatus(payload.status);
    setError('');

    try {
      const updated = await updateDeliveryStatus(delivery._id, payload);
      setDelivery(updated);
      setFailureReason('');
      setModalAction(null);
      setToast({ type: 'success', message: `Status updated to ${getStatusLabel(updated.status)}.` });
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Failed to update status.';
      setError(message);
      setToast({ type: 'error', message });
    } finally {
      setUpdatingStatus('');
    }
  };

  const handleUpdateStatus = async (action) => {
    if (!delivery || delivery.status === action.status) {
      return;
    }

    if (action.requiresConfirm) {
      setModalAction(action);
      setFailureReason('');
      return;
    }

    await submitStatusUpdate({ status: action.status });
  };

  const assignedRiderLabel = delivery?.agentName || delivery?.agentEmail || 'Awaiting assignment';

  return (
    <Layout title="Delivery Detail">
      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <section className="space-y-6">
        <header className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Delivery Detail</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Follow one delivery from assignment through completion, with timeline checkpoints and the same rider
              actions available from the route page.
            </p>
          </div>
          {!loading && !error && delivery && (
            <div className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
              {isAdmin ? 'Admin View Only' : `${summary.currentStage} / ${progress}%`}
            </div>
          )}
        </header>

        {loading && (
          <>
            <article className="rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.42)]">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                  <div key={item}>
                    <SkeletonBlock className="h-3 w-24" />
                    <SkeletonBlock className="mt-3 h-5 w-3/4" />
                  </div>
                ))}
              </div>
            </article>
            <article className="rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.42)]">
              <SkeletonBlock className="h-5 w-48" />
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                  <SkeletonBlock key={item} className="h-14 w-full" />
                ))}
              </div>
            </article>
          </>
        )}

        {error && !loading && (
          <div className="rounded-[26px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <p>{error}</p>
            <button
              type="button"
              onClick={loadDelivery}
              className="mt-3 rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-700"
            >
              Retry Delivery Load
            </button>
          </div>
        )}

        {!loading && !error && delivery && (
          <div className="space-y-6">
            <article className="rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.42)]">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Customer</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{delivery.customerName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Merchant</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{delivery.merchantName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Assigned Rider</p>
                  <p className="mt-1 text-sm text-slate-700">{assignedRiderLabel}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current Status</p>
                  <div className="mt-2">
                    <StatusBadge status={delivery.status} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pickup Address</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{delivery.pickupAddress || delivery.merchantName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Drop Address</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{delivery.dropAddress || delivery.address}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Customer Phone</p>
                  <p className="mt-1 text-sm text-slate-700">{delivery.customerPhone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Failure Reason</p>
                  <p className="mt-1 text-sm text-slate-700">{delivery.failureReason || 'None recorded'}</p>
                </div>
              </div>
            </article>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
              <article className="rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.42)]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Route Progress</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-900">{summary.currentStage}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Completed stops: {summary.completedStops} / Remaining stops: {summary.remainingStops}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                    {progress}%
                  </span>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#0f7a54,#2fc487)] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {!isAdmin && actions.length > 0 && (
                  <div className="mt-5">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Available Actions</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {actions.map((action) => (
                        <button
                          key={action.key}
                          type="button"
                          disabled={Boolean(updatingStatus)}
                          onClick={() => handleUpdateStatus(action)}
                          className={`rounded-xl px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 ${
                            action.tone === 'rose'
                              ? 'bg-rose-600 hover:bg-rose-700'
                              : action.tone === 'amber'
                                ? 'bg-amber-600 hover:bg-amber-700'
                                : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          {updatingStatus === action.status ? 'Saving...' : action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </article>

              <article className="rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.42)]">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Timeline</p>
                <div className="mt-4 space-y-3">
                  {timelineSteps.map((step) => (
                    <div
                      key={step.key}
                      className={`rounded-2xl border p-4 ${
                        step.state === 'complete'
                          ? 'border-emerald-200 bg-emerald-50/70'
                          : step.state === 'current'
                            ? 'border-emerald-300 bg-white shadow-[0_14px_30px_-22px_rgba(15,122,84,0.55)]'
                            : 'border-slate-200 bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {step.state === 'complete' ? 'Done' : step.state === 'current' ? 'Current' : 'Pending'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{step.at ? formatDate(step.at) : 'Waiting for this stage'}</p>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <article className="rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.42)]">
              <h2 className="text-lg font-semibold text-slate-900">Delivery Metadata</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Created At</p>
                  <p className="mt-1 text-sm text-slate-700">{formatDate(delivery.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Assigned At</p>
                  <p className="mt-1 text-sm text-slate-700">{formatDate(delivery.assignedAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Accepted At</p>
                  <p className="mt-1 text-sm text-slate-700">{formatDate(delivery.acceptedAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reached Pickup At</p>
                  <p className="mt-1 text-sm text-slate-700">{formatDate(delivery.pickupReachedAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Picked Up At</p>
                  <p className="mt-1 text-sm text-slate-700">{formatDate(delivery.pickedUpAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Out for Delivery At</p>
                  <p className="mt-1 text-sm text-slate-700">{formatDate(delivery.outForDeliveryAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Delivered At</p>
                  <p className="mt-1 text-sm text-slate-700">{formatDate(delivery.deliveredAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Failed At</p>
                  <p className="mt-1 text-sm text-slate-700">{formatDate(delivery.failedAt)}</p>
                </div>
              </div>
            </article>
          </div>
        )}
      </section>

      <ConfirmationModal
        open={Boolean(modalAction)}
        title={
          modalAction?.status === 'rejected'
            ? 'Reject This Order?'
            : modalAction?.status === 'delivered'
              ? 'Confirm Delivery Completion'
              : modalAction?.status === 'failed'
                ? 'Mark Delivery Failed?'
                : 'Confirm Action'
        }
        message={
          modalAction?.status === 'rejected'
            ? 'Rejecting removes this order from your queue and sends it back to the admin pending pool.'
            : modalAction?.status === 'delivered'
              ? 'Confirm that this order has been delivered to the customer.'
              : modalAction?.status === 'failed'
                ? 'A failure reason is required so the admin panel and database reflect what happened.'
                : 'Confirm this workflow action.'
        }
        confirmLabel={modalAction?.label || 'Confirm'}
        tone={modalAction?.tone || 'emerald'}
        loading={updatingStatus === modalAction?.status}
        onClose={() => {
          setModalAction(null);
          setFailureReason('');
        }}
        onConfirm={() =>
          modalAction &&
          (modalAction.requiresReason && !failureReason.trim()
            ? setToast({ type: 'error', message: 'Please enter a failure reason before confirming.' })
            : submitStatusUpdate({
                status: modalAction.status,
                ...(modalAction.requiresReason ? { failureReason: failureReason.trim() } : {}),
              }))
        }
      >
        {modalAction?.requiresReason && (
          <textarea
            value={failureReason}
            onChange={(event) => setFailureReason(event.target.value)}
            rows={4}
            placeholder="Customer unavailable, access denied, incorrect address..."
            className="mt-4 w-full rounded-2xl border border-emerald-200 bg-emerald-50/30 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400"
          />
        )}
      </ConfirmationModal>
    </Layout>
  );
}

export default DeliveryDetailPage;
