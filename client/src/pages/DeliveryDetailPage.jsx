import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDeliveryById, updateDeliveryStatus } from '../api/deliveryApi';
import Layout from '../components/Layout';
import SkeletonBlock from '../components/SkeletonBlock';
import StatusBadge from '../components/StatusBadge';
import ToastMessage from '../components/ToastMessage';

const statusOptions = [
  { key: 'assigned', label: 'Assigned' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'failed', label: 'Failed' },
];

const transitionMap = {
  assigned: ['picked_up', 'failed'],
  picked_up: ['out_for_delivery', 'failed'],
  out_for_delivery: ['delivered', 'failed'],
  delivered: [],
  failed: [],
};

const statusButtonClasses = {
  assigned: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  picked_up: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  out_for_delivery: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
  delivered: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
  failed: 'bg-rose-100 text-rose-700 hover:bg-rose-200',
};

const formatDate = (dateValue) => {
  if (!dateValue) {
    return 'N/A';
  }

  return new Date(dateValue).toLocaleString();
};

function DeliveryDetailPage() {
  const { deliveryId } = useParams();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [showFailureDialog, setShowFailureDialog] = useState(false);
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

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const availableTransitions = useMemo(() => transitionMap[delivery?.status] || [], [delivery?.status]);

  const showToast = (type, message) => {
    setToast({ type, message });
  };

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
      setShowFailureDialog(false);
      showToast('success', `Status updated to ${statusOptions.find((item) => item.key === updated.status)?.label || updated.status}.`);
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Failed to update status.';
      setError(message);
      showToast('error', message);
    } finally {
      setUpdatingStatus('');
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!delivery || delivery.status === status) {
      return;
    }

    if (!availableTransitions.includes(status)) {
      showToast(
        'error',
        `Cannot move from ${statusOptions.find((item) => item.key === delivery.status)?.label || delivery.status} to ${
          statusOptions.find((item) => item.key === status)?.label || status
        }.`
      );
      return;
    }

    if (status === 'failed') {
      setShowFailureDialog(true);
      return;
    }

    await submitStatusUpdate({ status });
  };

  const handleFailDelivery = async () => {
    if (!failureReason.trim()) {
      showToast('error', 'Please enter a failure reason before confirming.');
      return;
    }

    await submitStatusUpdate({ status: 'failed', failureReason: failureReason.trim() });
  };

  return (
    <Layout title="Delivery Detail">
      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <section className="space-y-6">
        <header className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Delivery Detail</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Track one delivery and keep status changes inside the required workflow without breaking the demo sequence.</p>
          </div>
          <div className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
            Next allowed: {availableTransitions.length > 0 ? availableTransitions.map((status) => statusOptions.find((item) => item.key === status)?.label).join(', ') : 'No further transitions'}
          </div>
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
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[1, 2, 3, 4, 5].map((item) => (
                  <SkeletonBlock key={item} className="h-11 w-full" />
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Customer</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{delivery.customerName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Merchant</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{delivery.merchantName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Address</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{delivery.address}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Coordinates</p>
                  <p className="mt-1 text-sm text-slate-700">
                    Lat: {delivery.coordinates?.lat}, Lng: {delivery.coordinates?.lng}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current Status</p>
                  <div className="mt-2">
                    <StatusBadge status={delivery.status} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Created At</p>
                  <p className="mt-1 text-sm text-slate-700">{formatDate(delivery.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">ETA</p>
                  <p className="mt-1 text-sm text-slate-700">{delivery.eta}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Failure Reason</p>
                  <p className="mt-1 text-sm text-slate-700">{delivery.failureReason || 'None recorded'}</p>
                </div>
              </div>
            </article>

            <article className="rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.42)]">
              <h2 className="text-lg font-semibold text-slate-900">Update Delivery Status</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Assigned to Picked Up to Out for Delivery to Delivered. Failed is allowed from any in-progress stage.</p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {statusOptions.map((option) => {
                  const isCurrent = delivery.status === option.key;
                  const isUpdating = updatingStatus === option.key;

                  return (
                    <button
                      key={option.key}
                      type="button"
                      disabled={isCurrent || Boolean(updatingStatus)}
                      onClick={() => handleUpdateStatus(option.key)}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${statusButtonClasses[option.key]}`}
                    >
                      {isUpdating ? 'Updating...' : isCurrent ? `${option.label} (Current)` : option.label}
                    </button>
                  );
                })}
              </div>
            </article>
          </div>
        )}
      </section>

      {showFailureDialog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/30 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_24px_55px_-30px_rgba(11,28,48,0.45)]">
            <h2 className="text-xl font-semibold text-slate-900">Confirm Failed Delivery</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">A reason is required before this delivery can move into the failed state.</p>
            <textarea
              value={failureReason}
              onChange={(event) => setFailureReason(event.target.value)}
              rows={4}
              placeholder="Customer unavailable, blocked access, incorrect address..."
              className="mt-4 w-full rounded-2xl border border-emerald-200 bg-emerald-50/30 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400"
            />
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowFailureDialog(false);
                  setFailureReason('');
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFailDelivery}
                disabled={Boolean(updatingStatus)}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
              >
                {updatingStatus === 'failed' ? 'Saving...' : 'Confirm Failed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default DeliveryDetailPage;
