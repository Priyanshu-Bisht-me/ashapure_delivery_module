import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getAnalytics, getAssignedDeliveries } from '../api/deliveryApi';
import Layout from '../components/Layout';
import SkeletonBlock from '../components/SkeletonBlock';
import StatCard from '../components/StatCard';

const chartColors = ['#0f7a54', '#2563eb', '#f59e0b', '#e11d48'];
const statusLabels = {
  completed: 'Delivered',
  pending: 'Pending',
  failed: 'Failed',
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value || 0);

const buildFallbackAnalytics = (deliveries) => {
  const completed = deliveries.filter((delivery) => delivery.status === 'delivered').length;
  const failed = deliveries.filter((delivery) => delivery.status === 'failed').length;
  const pending = deliveries.filter((delivery) =>
    ['assigned', 'picked_up', 'out_for_delivery'].includes(delivery.status)
  ).length;
  const earnings = deliveries
    .filter((delivery) => delivery.status === 'delivered')
    .reduce((total, delivery) => total + Number(delivery.earnings || 0), 0);

  return {
    totalDeliveries: deliveries.length,
    completed,
    pending,
    failed,
    earnings,
  };
};

const buildLastSevenDays = (deliveries) => {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);

    return {
      key,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      deliveries: 0,
      earnings: 0,
    };
  });

  const lookup = Object.fromEntries(days.map((day) => [day.key, day]));

  deliveries.forEach((delivery) => {
    const key = new Date(delivery.createdAt).toISOString().slice(0, 10);
    const day = lookup[key];

    if (!day) {
      return;
    }

    day.deliveries += 1;
    if (delivery.status === 'delivered') {
      day.earnings += Number(delivery.earnings || 0);
    }
  });

  return days;
};

function DashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [deliveriesResponse, analyticsResponse] = await Promise.all([
        getAssignedDeliveries().catch(() => null),
        getAnalytics().catch(() => null),
      ]);

      if (!deliveriesResponse && !analyticsResponse) {
        throw new Error('Unable to load dashboard analytics.');
      }

      const nextDeliveries = deliveriesResponse || [];
      setDeliveries(nextDeliveries);
      setAnalytics(analyticsResponse || buildFallbackAnalytics(nextDeliveries));
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to load dashboard analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const fetchDashboard = async () => {
      try {
        const [deliveriesResponse, analyticsResponse] = await Promise.all([
          getAssignedDeliveries().catch(() => null),
          getAnalytics().catch(() => null),
        ]);

        if (!deliveriesResponse && !analyticsResponse) {
          throw new Error('Unable to load dashboard analytics.');
        }

        if (isActive) {
          const nextDeliveries = deliveriesResponse || [];
          setDeliveries(nextDeliveries);
          setAnalytics(analyticsResponse || buildFallbackAnalytics(nextDeliveries));
          setLoading(false);
        }
      } catch (requestError) {
        if (isActive) {
          setError(requestError.response?.data?.message || requestError.message || 'Unable to load dashboard analytics.');
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      isActive = false;
    };
  }, []);

  const statusDistribution = useMemo(() => {
    if (!analytics) {
      return [];
    }

    return [
      { name: statusLabels.completed, value: analytics.completed },
      { name: statusLabels.pending, value: analytics.pending },
      { name: statusLabels.failed, value: analytics.failed },
    ];
  }, [analytics]);

  const weeklyChartData = useMemo(() => buildLastSevenDays(deliveries), [deliveries]);

  return (
    <Layout title="Dashboard">
      <section className="space-y-6">
        <header className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Delivery Dashboard</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Live analytics for your milk-delivery operations with a compact executive view of fulfillment, failures, revenue, and trend movement.</p>
          </div>
        </header>

        {loading && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {[1, 2, 3, 4, 5].map((item) => (
                <article key={item} className="rounded-[26px] border border-emerald-100 bg-white/95 p-4 shadow-[0_22px_48px_-34px_rgba(11,28,48,0.42)]">
                  <SkeletonBlock className="h-4 w-24" />
                  <SkeletonBlock className="mt-4 h-10 w-28" />
                </article>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {[1, 2, 3].map((item) => (
                <article key={item} className={`rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.45)] ${item === 3 ? 'xl:col-span-2' : ''}`}>
                  <SkeletonBlock className="h-5 w-40" />
                  <SkeletonBlock className="mt-4 h-64 w-full" />
                </article>
              ))}
            </div>
          </>
        )}

        {error && !loading && (
          <div className="rounded-[26px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <p>{error}</p>
            <button
              type="button"
              onClick={loadDashboard}
              className="mt-3 rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-700"
            >
              Retry Dashboard Load
            </button>
          </div>
        )}

        {!loading && !error && analytics && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard label="Total Deliveries" value={analytics.totalDeliveries} accent="emerald" />
              <StatCard label="Completed" value={analytics.completed} accent="blue" />
              <StatCard label="Pending" value={analytics.pending} accent="amber" />
              <StatCard label="Failed" value={analytics.failed} accent="rose" />
              <StatCard label="Earnings" value={formatCurrency(analytics.earnings)} accent="emerald" />
            </div>

            {analytics.totalDeliveries === 0 ? (
              <div className="rounded-[26px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                No deliveries found yet. Seed the backend records to populate the dashboard.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <article className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.45)]">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Status Distribution</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">Pie Chart</h2>
                  <div className="mt-5 h-72 min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusDistribution} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={4}>
                          {statusDistribution.map((entry, index) => (
                            <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                <article className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.45)]">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Daily Earnings</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">Bar Chart</h2>
                  <div className="mt-5 h-72 min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                        <XAxis dataKey="label" stroke="#475569" />
                        <YAxis stroke="#475569" />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Bar dataKey="earnings" fill="#0f7a54" radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                <article className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.45)] xl:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Last 7 Days Deliveries</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">Line Chart</h2>
                  <div className="mt-5 h-80 min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                        <XAxis dataKey="label" stroke="#475569" />
                        <YAxis stroke="#475569" allowDecimals={false} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="deliveries"
                          stroke="#139968"
                          strokeWidth={3}
                          dot={{ r: 4, fill: '#0f7a54' }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </article>
              </div>
            )}
          </>
        )}
      </section>
    </Layout>
  );
}

export default DashboardPage;
