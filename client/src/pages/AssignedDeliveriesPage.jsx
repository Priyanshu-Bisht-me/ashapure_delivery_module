import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAssignedDeliveries, updateDeliveryStatus } from '../api/deliveryApi';
import ConfirmationModal from '../components/ConfirmationModal';
import Layout from '../components/Layout';
import SkeletonBlock from '../components/SkeletonBlock';
import StatusBadge from '../components/StatusBadge';
import ToastMessage from '../components/ToastMessage';
import { ASSIGNED_QUEUE_STATUSES } from '../utils/deliveryWorkflow';

function AssignedDeliveriesPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [rejectingDelivery, setRejectingDelivery] = useState(null);

  const loadDeliveries = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getAssignedDeliveries();
      setDeliveries(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load deliveries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const fetchDeliveries = async () => {
      try {
        const data = await getAssignedDeliveries();
        if (isActive) {
          setDeliveries(data);
          setLoading(false);
        }
      } catch (requestError) {
        if (isActive) {
          setError(requestError.response?.data?.message || 'Unable to load deliveries.');
          setLoading(false);
        }
      }
    };

    fetchDeliveries();

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

  const assignedDeliveries = useMemo(
    () => deliveries.filter((delivery) => ASSIGNED_QUEUE_STATUSES.includes(delivery.status)),
    [deliveries]
  );

  const handleAction = async (deliveryId, status) => {
    setUpdatingId(deliveryId);
    setError('');

    try {
      await updateDeliveryStatus(deliveryId, { status });
      setDeliveries((current) => current.filter((delivery) => delivery._id !== deliveryId));
      setRejectingDelivery(null);
      setToast({
        type: 'success',
        message:
          status === 'accepted'
            ? 'Order accepted and moved into your route queue.'
            : 'Order rejected and returned to the admin pending pool.',
      });
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to update this delivery.';
      setError(message);
      setToast({ type: 'error', message });
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <Layout title="Assigned Deliveries">
      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <section className="space-y-6">
        <header className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Assigned Deliveries</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Review newly assigned deliveries, accept the jobs you can handle, or reject them back into the admin
              pending pool with one confirmed action.
            </p>
          </div>
          <div className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
            {assignedDeliveries.length} awaiting response
          </div>
        </header>

        {loading && (
          <>
            <div className="space-y-4 lg:hidden">
              {[1, 2, 3].map((item) => (
                <article
                  key={item}
                  className="rounded-[26px] border border-emerald-100 bg-white/95 p-4 shadow-[0_20px_44px_-30px_rgba(11,28,48,0.4)]"
                >
                  <SkeletonBlock className="h-5 w-40" />
                  <SkeletonBlock className="mt-3 h-4 w-full" />
                  <SkeletonBlock className="mt-2 h-4 w-3/4" />
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <SkeletonBlock className="h-4 w-24" />
                    <SkeletonBlock className="h-10 w-28" />
                  </div>
                </article>
              ))}
            </div>
            <article className="hidden overflow-hidden rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.45)] lg:block">
              <div className="space-y-3">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="grid grid-cols-[1.2fr_1fr_0.8fr_0.7fr_1fr] gap-4">
                    <SkeletonBlock className="h-12" />
                    <SkeletonBlock className="h-12" />
                    <SkeletonBlock className="h-12" />
                    <SkeletonBlock className="h-12" />
                    <SkeletonBlock className="h-12" />
                  </div>
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
              onClick={loadDeliveries}
              className="mt-3 rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-700"
            >
              Retry Delivery Load
            </button>
          </div>
        )}

        {!loading && !error && assignedDeliveries.length === 0 && (
          <div className="rounded-[26px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            No assigned deliveries need action right now. Accepted orders move into your route page and rejected ones
            return to admin.
          </div>
        )}

        {!loading && !error && assignedDeliveries.length > 0 && (
          <>
            <div className="space-y-4 lg:hidden">
              {assignedDeliveries.map((delivery) => (
                <article
                  key={delivery._id}
                  className="rounded-[26px] border border-emerald-100 bg-white/95 p-4 shadow-[0_20px_44px_-30px_rgba(11,28,48,0.4)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900">{delivery.customerName}</h3>
                      <p className="mt-1 text-sm text-slate-500">{delivery.dropAddress || delivery.address}</p>
                      <p className="mt-1 text-sm text-slate-600">Pickup: {delivery.pickupAddress || delivery.merchantName}</p>
                    </div>
                    <StatusBadge status={delivery.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-600">
                    <p>
                      <span className="font-semibold text-slate-700">Merchant:</span> {delivery.merchantName}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Phone:</span> {delivery.customerPhone || 'Not provided'}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">ETA:</span> {delivery.eta}
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      disabled={updatingId === delivery._id}
                      onClick={() => handleAction(delivery._id, 'accepted')}
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {updatingId === delivery._id ? 'Saving...' : 'Accept Order'}
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(updatingId)}
                      onClick={() => setRejectingDelivery(delivery)}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-60"
                    >
                      Reject Order
                    </button>
                    <Link
                      to={`/delivery/${delivery._id}`}
                      className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-center text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
                    >
                      View Details
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-[28px] border border-emerald-100 bg-white/95 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.45)] lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-emerald-100">
                  <thead className="bg-emerald-50/80">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">Customer</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">Merchant</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">Status</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">ETA</th>
                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50">
                    {assignedDeliveries.map((delivery) => (
                      <tr key={delivery._id} className="transition-colors hover:bg-emerald-50/45">
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-900">{delivery.customerName}</p>
                          <p className="mt-1 text-xs text-slate-500">{delivery.customerPhone || 'No phone on file'}</p>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          <p>{delivery.merchantName}</p>
                          <p className="mt-1 text-xs text-slate-500">{delivery.pickupAddress || delivery.merchantName}</p>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          <StatusBadge status={delivery.status} />
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">{delivery.eta}</td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              disabled={updatingId === delivery._id}
                              onClick={() => handleAction(delivery._id, 'accepted')}
                              className="inline-flex rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {updatingId === delivery._id ? 'Saving...' : 'Accept Order'}
                            </button>
                            <button
                              type="button"
                              disabled={Boolean(updatingId)}
                              onClick={() => setRejectingDelivery(delivery)}
                              className="inline-flex rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-60"
                            >
                              Reject Order
                            </button>
                            <Link
                              to={`/delivery/${delivery._id}`}
                              className="inline-flex rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
                            >
                              View Details
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>

      <ConfirmationModal
        open={Boolean(rejectingDelivery)}
        title="Reject This Order?"
        message="Rejecting this order removes it from your assigned queue and sends it back to the admin pending pool for reassignment."
        confirmLabel="Confirm Reject"
        tone="rose"
        loading={updatingId === rejectingDelivery?._id}
        onClose={() => setRejectingDelivery(null)}
        onConfirm={() => rejectingDelivery && handleAction(rejectingDelivery._id, 'rejected')}
      />
    </Layout>
  );
}

export default AssignedDeliveriesPage;
