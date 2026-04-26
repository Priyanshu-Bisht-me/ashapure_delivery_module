import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAssignedDeliveries, getTodaySummary } from '../api/deliveryApi';
import Layout from '../components/Layout';
import SkeletonBlock from '../components/SkeletonBlock';
import StatCard from '../components/StatCard';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value || 0);

const isSameDay = (dateValue, baseDate = new Date()) => {
  if (!dateValue) {
    return false;
  }

  const date = new Date(dateValue);
  return (
    date.getFullYear() === baseDate.getFullYear() &&
    date.getMonth() === baseDate.getMonth() &&
    date.getDate() === baseDate.getDate()
  );
};

const formatDuration = (minutes) => {
  if (!minutes) {
    return 'N/A';
  }

  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return `${hours}h ${remainingMinutes}m`;
};

const formatDateTime = (dateValue) => {
  if (!dateValue) {
    return 'N/A';
  }

  return new Date(dateValue).toLocaleString();
};

function SummaryPage() {
  const [summary, setSummary] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [summaryResponse, deliveriesResponse] = await Promise.all([
        getTodaySummary().catch(() => null),
        getAssignedDeliveries(),
      ]);

      setSummary(summaryResponse);
      setDeliveries(deliveriesResponse);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load today summary.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const fetchSummary = async () => {
      try {
        const [summaryResponse, deliveriesResponse] = await Promise.all([
          getTodaySummary().catch(() => null),
          getAssignedDeliveries(),
        ]);

        if (isActive) {
          setSummary(summaryResponse);
          setDeliveries(deliveriesResponse);
          setLoading(false);
        }
      } catch (requestError) {
        if (isActive) {
          setError(requestError.response?.data?.message || 'Unable to load today summary.');
          setLoading(false);
        }
      }
    };

    fetchSummary();

    return () => {
      isActive = false;
    };
  }, []);

  const deliveredToday = useMemo(
    () => deliveries.filter((delivery) => isSameDay(delivery.deliveredAt)),
    [deliveries]
  );
  const failedToday = useMemo(
    () => deliveries.filter((delivery) => isSameDay(delivery.failedAt)),
    [deliveries]
  );
  const pendingToday = useMemo(() => {
    if (summary?.pending !== undefined) {
      return summary.pending;
    }

    return deliveries.filter(
      (delivery) => isSameDay(delivery.createdAt) && ['unassigned', 'assigned'].includes(delivery.status)
    ).length;
  }, [deliveries, summary]);
  const totalEarnings = useMemo(
    () => deliveries.filter((delivery) => delivery.status === 'delivered').reduce((total, delivery) => total + Number(delivery.earnings || 0), 0),
    [deliveries]
  );
  const unpaidEarnings = totalEarnings;
  const averageDeliveryTime = useMemo(() => {
    const durations = deliveries
      .filter((delivery) => delivery.assignedAt && delivery.deliveredAt)
      .map((delivery) => (new Date(delivery.deliveredAt) - new Date(delivery.assignedAt)) / 60000)
      .filter((minutes) => minutes > 0);

    if (durations.length === 0) {
      return 0;
    }

    return durations.reduce((total, value) => total + value, 0) / durations.length;
  }, [deliveries]);
  const topRider = useMemo(() => {
    const riderMap = new Map();

    deliveries
      .filter((delivery) => delivery.status === 'delivered')
      .forEach((delivery) => {
        const key = delivery.agentName || delivery.agentEmail || 'Unassigned';
        const current = riderMap.get(key) || { label: key, count: 0, earnings: 0 };
        current.count += 1;
        current.earnings += Number(delivery.earnings || 0);
        riderMap.set(key, current);
      });

    const sortedRiders = [...riderMap.values()].sort((first, second) => {
      if (second.count !== first.count) {
        return second.count - first.count;
      }

      return second.earnings - first.earnings;
    });

    return sortedRiders[0] || null;
  }, [deliveries]);
  const completionRate = useMemo(() => {
    const totalForToday = summary?.totalDeliveries ?? deliveries.filter((delivery) => isSameDay(delivery.createdAt)).length;
    if (!totalForToday) {
      return '0%';
    }

    return `${Math.round((deliveredToday.length / totalForToday) * 100)}%`;
  }, [deliveries, deliveredToday.length, summary]);
  const recentCompletedOrders = useMemo(
    () =>
      [...deliveries]
        .filter((delivery) => delivery.status === 'delivered')
        .sort((first, second) => new Date(second.deliveredAt || second.createdAt) - new Date(first.deliveredAt || first.createdAt))
        .slice(0, 5),
    [deliveries]
  );

  return (
    <Layout title="Summary">
      <section className="space-y-6">
        <header className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Today Summary</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Business snapshot for today with real delivery results, earnings visibility, rider performance signals,
              and the latest completed orders.
            </p>
          </div>
          <div className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
            Daily operations view
          </div>
        </header>

        {loading && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <article key={item} className="rounded-[26px] border border-emerald-100 bg-white/95 p-4 shadow-[0_22px_48px_-34px_rgba(11,28,48,0.42)]">
                  <SkeletonBlock className="h-4 w-24" />
                  <SkeletonBlock className="mt-4 h-10 w-28" />
                </article>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <article className="rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.42)]">
                <SkeletonBlock className="h-5 w-40" />
                <SkeletonBlock className="mt-4 h-40 w-full" />
              </article>
              <article className="rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.42)]">
                <SkeletonBlock className="h-5 w-36" />
                <SkeletonBlock className="mt-4 h-40 w-full" />
              </article>
            </div>
          </>
        )}

        {error && !loading && (
          <div className="rounded-[26px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <p>{error}</p>
            <button
              type="button"
              onClick={loadSummary}
              className="mt-3 rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-700"
            >
              Retry Summary Load
            </button>
          </div>
        )}

        {!loading && !error && deliveries.length === 0 && (
          <div className="rounded-[26px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            No delivery activity has been recorded yet, so today&apos;s summary is still empty.
          </div>
        )}

        {!loading && !error && deliveries.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <StatCard label="Completed Today" value={deliveredToday.length} accent="blue" />
              <StatCard label="Failed Today" value={failedToday.length} accent="rose" />
              <StatCard label="Pending Today" value={pendingToday} accent="amber" />
              <StatCard label="Total Earnings" value={formatCurrency(totalEarnings)} accent="emerald" />
              <StatCard label="Unpaid Earnings" value={formatCurrency(unpaidEarnings)} accent="emerald" />
              <StatCard label="Avg Delivery Time" value={formatDuration(averageDeliveryTime)} accent="emerald" />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <article className="rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.42)]">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Performance Insight</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">Completion and rider performance</h2>
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Completion Rate</p>
                    <p className="mt-3 text-3xl font-extrabold text-slate-900">{completionRate}</p>
                    <p className="mt-2 text-sm text-slate-600">Based on deliveries created today.</p>
                  </div>
                  <div className="rounded-[24px] border border-emerald-100 bg-slate-50/80 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Top Rider</p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">{topRider?.label || 'No completed orders yet'}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {topRider ? `${topRider.count} completed orders / ${formatCurrency(topRider.earnings)}` : 'Waiting for completed deliveries.'}
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.42)]">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Payout Note</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">Unpaid earnings assumption</h2>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  This project does not have a payment settlement model yet, so all delivered earnings are treated as unpaid until a payouts flow is added.
                </p>
                <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Current unpaid amount: <span className="font-semibold">{formatCurrency(unpaidEarnings)}</span>
                </div>
              </article>
            </div>

            <article className="rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.42)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Recent Completed Orders</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">Latest successful deliveries</h2>
                </div>
                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {recentCompletedOrders.length} recent completions
                </div>
              </div>

              {recentCompletedOrders.length === 0 ? (
                <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  No completed deliveries yet, so the completion feed is still empty.
                </div>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="min-w-full divide-y divide-emerald-100">
                    <thead className="bg-emerald-50/80">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">Rider</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">Earnings</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">Completed At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                      {recentCompletedOrders.map((delivery) => (
                        <tr key={delivery._id} className="transition-colors hover:bg-emerald-50/45">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{delivery.customerName}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{delivery.agentName || delivery.agentEmail || 'Unassigned'}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{formatCurrency(delivery.earnings)}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{formatDateTime(delivery.deliveredAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          </>
        )}
      </section>
    </Layout>
  );
}

export default SummaryPage;
