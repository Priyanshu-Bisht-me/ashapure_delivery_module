import { useCallback, useEffect, useMemo, useState } from 'react';
import { getTodaySummary } from '../api/deliveryApi';
import Layout from '../components/Layout';
import SkeletonBlock from '../components/SkeletonBlock';
import StatCard from '../components/StatCard';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value || 0);

function SummaryPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getTodaySummary();
      setSummary(data);
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
        const data = await getTodaySummary();
        if (isActive) {
          setSummary(data);
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

  const completionRate = useMemo(() => {
    if (!summary || summary.totalDeliveries === 0) {
      return '0%';
    }

    return `${Math.round((summary.completed / summary.totalDeliveries) * 100)}%`;
  }, [summary]);

  return (
    <Layout title="Summary">
      <section className="space-y-6">
        <header className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Today Summary</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Operational snapshot of today&apos;s delivery performance with a clear breakdown of waiting work, active
              route progress, completed drops, failed orders, and earnings.
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
            <article className="rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.42)]">
              <SkeletonBlock className="h-5 w-40" />
              <SkeletonBlock className="mt-4 h-4 w-full" />
              <SkeletonBlock className="mt-2 h-4 w-2/3" />
            </article>
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

        {!loading && !error && summary && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <StatCard label="Today's Deliveries" value={summary.totalDeliveries} accent="emerald" />
              <StatCard label="Pending" value={summary.pending} accent="amber" />
              <StatCard label="Active Route" value={summary.active || 0} accent="emerald" />
              <StatCard label="Completed" value={summary.completed} accent="blue" />
              <StatCard label="Failed" value={summary.failed} accent="rose" />
              <StatCard label="Today's Earnings" value={formatCurrency(summary.earnings)} accent="emerald" />
            </div>

            {summary.totalDeliveries === 0 ? (
              <div className="rounded-[26px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                No delivery activity has been recorded for today yet.
              </div>
            ) : (
              <article className="rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.42)]">
                <h2 className="text-lg font-semibold text-slate-900">Performance Insight</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Completion rate today: <span className="font-semibold text-emerald-700">{completionRate}</span>
                </p>
              </article>
            )}
          </>
        )}
      </section>
    </Layout>
  );
}

export default SummaryPage;
