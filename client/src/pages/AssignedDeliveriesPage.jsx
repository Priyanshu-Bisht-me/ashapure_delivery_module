import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAssignedDeliveries } from '../api/deliveryApi';
import DeliveryCard from '../components/DeliveryCard';
import Layout from '../components/Layout';
import SkeletonBlock from '../components/SkeletonBlock';
import StatusBadge from '../components/StatusBadge';

function AssignedDeliveriesPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <Layout title="Assigned Deliveries">
      <section className="space-y-6">
        <header className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Assigned Deliveries</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Track all assigned milk-delivery orders, scan their current status, and open any order detail in one step.</p>
          </div>
          <div className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
            {deliveries.length} records loaded
          </div>
        </header>

        {loading && (
          <>
            <div className="space-y-4 lg:hidden">
              {[1, 2, 3].map((item) => (
                <article key={item} className="rounded-[26px] border border-emerald-100 bg-white/95 p-4 shadow-[0_20px_44px_-30px_rgba(11,28,48,0.4)]">
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
                  <div key={item} className="grid grid-cols-[1.2fr_1fr_0.8fr_0.7fr_0.8fr] gap-4">
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

        {!loading && !error && deliveries.length === 0 && (
          <div className="rounded-[26px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            No deliveries are available yet. Seed the backend or create new delivery records to populate this list.
          </div>
        )}

        {!loading && !error && deliveries.length > 0 && (
          <>
            <div className="space-y-4 lg:hidden">
              {deliveries.map((delivery) => (
                <DeliveryCard key={delivery._id} delivery={delivery} />
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
                    {deliveries.map((delivery) => (
                      <tr key={delivery._id} className="transition-colors hover:bg-emerald-50/45">
                        <td className="px-5 py-4 text-sm font-medium text-slate-900">{delivery.customerName}</td>
                        <td className="px-5 py-4 text-sm text-slate-700">{delivery.merchantName}</td>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          <StatusBadge status={delivery.status} />
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">{delivery.eta}</td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            to={`/delivery/${delivery._id}`}
                            className="inline-flex rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700"
                          >
                            View Details
                          </Link>
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
    </Layout>
  );
}

export default AssignedDeliveriesPage;
