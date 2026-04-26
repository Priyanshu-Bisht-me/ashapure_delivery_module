import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createAdminDelivery,
  getAdminAgents,
  getAnalytics,
  getAssignedDeliveries,
} from '../api/deliveryApi';
import Layout from '../components/Layout';
import SkeletonBlock from '../components/SkeletonBlock';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import ToastMessage from '../components/ToastMessage';

const initialFormState = {
  customerName: '',
  customerPhone: '',
  pickupAddress: '',
  dropAddress: '',
  merchantName: '',
  earnings: '',
  eta: '',
  assignTo: '',
};

function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [agents, setAgents] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [formState, setFormState] = useState(initialFormState);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [analyticsResponse, agentsResponse, deliveriesResponse] = await Promise.all([
        getAnalytics(),
        getAdminAgents(),
        getAssignedDeliveries(),
      ]);

      setAnalytics(analyticsResponse);
      setAgents(agentsResponse);
      setDeliveries(deliveriesResponse);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load admin dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const fetchAdminData = async () => {
      try {
        const [analyticsResponse, agentsResponse, deliveriesResponse] = await Promise.all([
          getAnalytics(),
          getAdminAgents(),
          getAssignedDeliveries(),
        ]);

        if (isActive) {
          setAnalytics(analyticsResponse);
          setAgents(agentsResponse);
          setDeliveries(deliveriesResponse);
          setLoading(false);
        }
      } catch (requestError) {
        if (isActive) {
          setError(requestError.response?.data?.message || 'Unable to load admin dashboard.');
          setLoading(false);
        }
      }
    };

    fetchAdminData();

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

  const recentDeliveries = useMemo(() => deliveries.slice(0, 6), [deliveries]);
  const activeRiders = useMemo(() => agents.filter((agent) => agent.status === 'Active').length, [agents]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await createAdminDelivery({
        ...formState,
        earnings: Number(formState.earnings),
        assignTo: formState.assignTo || agents[0]?.email || '',
      });
      setToast({ type: 'success', message: 'Delivery created and assigned successfully.' });
      setFormState({
        ...initialFormState,
        assignTo: agents[0]?.email || '',
      });
      await loadAdminData();
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to create delivery.';
      setError(message);
      setToast({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Admin Dashboard">
      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <section className="space-y-6">
        <header className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Monitor delivery volume, assign work to riders, and review the latest operations from one admin control panel.</p>
          </div>
        </header>

        {loading && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <article key={item} className="rounded-[26px] border border-emerald-100 bg-white/95 p-4 shadow-[0_22px_48px_-34px_rgba(11,28,48,0.42)]">
                  <SkeletonBlock className="h-4 w-24" />
                  <SkeletonBlock className="mt-4 h-10 w-28" />
                </article>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <article className="rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.45)]">
                <SkeletonBlock className="h-5 w-40" />
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                    <SkeletonBlock key={item} className="h-12 w-full" />
                  ))}
                </div>
              </article>
              <article className="rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.45)]">
                <SkeletonBlock className="h-5 w-36" />
                <div className="mt-5 space-y-3">
                  {[1, 2, 3].map((item) => (
                    <SkeletonBlock key={item} className="h-20 w-full" />
                  ))}
                </div>
              </article>
            </div>
          </>
        )}

        {error && !loading && (
          <div className="rounded-[26px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <p>{error}</p>
            <button
              type="button"
              onClick={loadAdminData}
              className="mt-3 rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-700"
            >
              Retry Admin Load
            </button>
          </div>
        )}

        {!loading && !error && analytics && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total Deliveries" value={analytics.totalDeliveries} accent="emerald" />
              <StatCard label="Pending Deliveries" value={analytics.pending} accent="amber" />
              <StatCard label="Completed Deliveries" value={analytics.completed} accent="blue" />
              <StatCard label="Total Delivery Agents" value={agents.length} accent="emerald" />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <article className="rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.45)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Create Delivery</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-900">Assign a rider immediately</h2>
                  </div>
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {activeRiders} active riders
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    required
                    placeholder="Customer Name"
                    value={formState.customerName}
                    onChange={(event) => setFormState((current) => ({ ...current, customerName: event.target.value }))}
                    className="rounded-2xl border border-emerald-200 bg-emerald-50/30 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400"
                  />
                  <input
                    required
                    placeholder="Customer Phone"
                    value={formState.customerPhone}
                    onChange={(event) => setFormState((current) => ({ ...current, customerPhone: event.target.value }))}
                    className="rounded-2xl border border-emerald-200 bg-emerald-50/30 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400"
                  />
                  <input
                    required
                    placeholder="Pickup Address"
                    value={formState.pickupAddress}
                    onChange={(event) => setFormState((current) => ({ ...current, pickupAddress: event.target.value }))}
                    className="rounded-2xl border border-emerald-200 bg-emerald-50/30 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 md:col-span-2"
                  />
                  <input
                    required
                    placeholder="Drop Address"
                    value={formState.dropAddress}
                    onChange={(event) => setFormState((current) => ({ ...current, dropAddress: event.target.value }))}
                    className="rounded-2xl border border-emerald-200 bg-emerald-50/30 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 md:col-span-2"
                  />
                  <input
                    required
                    placeholder="Merchant Name"
                    value={formState.merchantName}
                    onChange={(event) => setFormState((current) => ({ ...current, merchantName: event.target.value }))}
                    className="rounded-2xl border border-emerald-200 bg-emerald-50/30 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400"
                  />
                  <input
                    required
                    type="number"
                    min="0"
                    placeholder="Earnings"
                    value={formState.earnings}
                    onChange={(event) => setFormState((current) => ({ ...current, earnings: event.target.value }))}
                    className="rounded-2xl border border-emerald-200 bg-emerald-50/30 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400"
                  />
                  <input
                    required
                    placeholder="ETA"
                    value={formState.eta}
                    onChange={(event) => setFormState((current) => ({ ...current, eta: event.target.value }))}
                    className="rounded-2xl border border-emerald-200 bg-emerald-50/30 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400"
                  />
                  <select
                    required
                    value={formState.assignTo || agents[0]?.email || ''}
                    onChange={(event) => setFormState((current) => ({ ...current, assignTo: event.target.value }))}
                    className="rounded-2xl border border-emerald-200 bg-emerald-50/30 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400"
                  >
                    {agents.map((agent) => (
                      <option key={agent.email} value={agent.email}>
                        {agent.name} ({agent.email})
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={submitting || agents.length === 0}
                    className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60 md:col-span-2"
                  >
                    {submitting ? 'Creating Delivery...' : 'Create Delivery'}
                  </button>
                </form>
              </article>

              <article className="rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.45)]">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Delivery Agents</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">Current rider roster</h2>

                <div className="mt-5 space-y-3">
                  {agents.map((agent) => (
                    <article key={agent.email} className="rounded-[24px] border border-emerald-100 bg-slate-50/70 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{agent.name}</p>
                          <p className="mt-1 text-sm text-slate-600">{agent.email}</p>
                          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">{agent.role}</p>
                        </div>
                        <StatusBadge
                          status={agent.status === 'Active' ? 'delivered' : 'assigned'}
                          label={agent.status}
                        />
                      </div>
                      <p className="mt-3 text-sm text-slate-600">Assigned Deliveries: {agent.assignedDeliveriesCount}</p>
                    </article>
                  ))}
                </div>
              </article>
            </div>

            <article className="rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.45)]">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Recent Deliveries</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">Latest assigned and active work</h2>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full divide-y divide-emerald-100">
                  <thead className="bg-emerald-50/80">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">Rider</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">Merchant</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">ETA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50">
                    {recentDeliveries.map((delivery) => (
                      <tr key={delivery._id} className="transition-colors hover:bg-emerald-50/45">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{delivery.customerName}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{delivery.agentName || delivery.agentEmail}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{delivery.merchantName}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={delivery.status} />
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">{delivery.eta}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </>
        )}
      </section>
    </Layout>
  );
}

export default AdminDashboardPage;
