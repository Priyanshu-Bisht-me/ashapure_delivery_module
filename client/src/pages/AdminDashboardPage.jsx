import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  assignAdminDelivery,
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
  const location = useLocation();
  const [analytics, setAnalytics] = useState(null);
  const [agents, setAgents] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [assignSelections, setAssignSelections] = useState({});
  const [formState, setFormState] = useState(initialFormState);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assigningId, setAssigningId] = useState('');
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

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const target = document.getElementById(location.hash.slice(1));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  const recentDeliveries = useMemo(() => deliveries, [deliveries]);
  const activeRiders = useMemo(() => agents.filter((agent) => agent.status === 'Active').length, [agents]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const created = await createAdminDelivery({
        ...formState,
        earnings: Number(formState.earnings),
        assignTo: formState.assignTo,
      });

      setToast({
        type: 'success',
        message:
          created.status === 'assigned'
            ? 'Delivery created and assigned successfully.'
            : 'Delivery created in the pending unassigned pool.',
      });
      setFormState(initialFormState);
      await loadAdminData();
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to create delivery.';
      setError(message);
      setToast({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignDelivery = async (deliveryId) => {
    setAssigningId(deliveryId);
    setError('');

    try {
      const assignTo = assignSelections[deliveryId] || agents[0]?.email || '';
      await assignAdminDelivery(deliveryId, { assignTo });
      setToast({ type: 'success', message: 'Delivery assigned to rider successfully.' });
      await loadAdminData();
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to assign delivery.';
      setError(message);
      setToast({ type: 'error', message });
    } finally {
      setAssigningId('');
    }
  };

  return (
    <Layout title="Admin Dashboard">
      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <section className="space-y-6">
        <header className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Run the real delivery workflow from one control center: create jobs, assign riders, monitor in-transit
              work, and review completed or failed outcomes from live backend data.
            </p>
          </div>
          {analytics && (
            <div className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
              {analytics.totalDeliveries} total deliveries
            </div>
          )}
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard label="Pending Unassigned" value={analytics.pendingUnassigned} accent="amber" />
              <StatCard label="Accepted Deliveries" value={analytics.accepted} accent="emerald" />
              <StatCard label="In Transit Deliveries" value={analytics.inTransit} accent="blue" />
              <StatCard label="Delivered Today" value={analytics.deliveredToday} accent="emerald" />
              <StatCard label="Failed Deliveries" value={analytics.failed} accent="rose" />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <article
                id="create-delivery"
                className="scroll-mt-32 rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.45)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Create Delivery</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-900">Create assigned or pending work</h2>
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
                    value={formState.assignTo}
                    onChange={(event) => setFormState((current) => ({ ...current, assignTo: event.target.value }))}
                    className="rounded-2xl border border-emerald-200 bg-emerald-50/30 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400"
                  >
                    <option value="">Leave Unassigned</option>
                    {agents.map((agent) => (
                      <option key={agent.email} value={agent.email}>
                        {agent.name} ({agent.email})
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60 md:col-span-2"
                  >
                    {submitting ? 'Creating Delivery...' : 'Create Delivery'}
                  </button>
                </form>
              </article>

              <article
                id="delivery-agents"
                className="scroll-mt-32 rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.45)]"
              >
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Delivery Agents</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">Current rider roster</h2>
                <p className="mt-2 text-sm text-slate-600">{agents.length} total agents available for assignment.</p>

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

            <article
              id="recent-deliveries"
              className="scroll-mt-32 rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.45)]"
            >
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Recent Deliveries</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">Latest workflow state across all deliveries</h2>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full divide-y divide-emerald-100">
                  <thead className="bg-emerald-50/80">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">Rider</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">Merchant</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">Failure</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50">
                    {recentDeliveries.map((delivery) => (
                      <tr key={delivery._id} className="transition-colors hover:bg-emerald-50/45">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{delivery.customerName}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{delivery.agentName || delivery.agentEmail || 'Unassigned'}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{delivery.merchantName}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={delivery.status} />
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">{delivery.failureReason || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          {delivery.status === 'unassigned' ? (
                            <div className="flex min-w-[250px] justify-end gap-2">
                              <select
                                value={assignSelections[delivery._id] || agents[0]?.email || ''}
                                onChange={(event) =>
                                  setAssignSelections((current) => ({
                                    ...current,
                                    [delivery._id]: event.target.value,
                                  }))
                                }
                                className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-400"
                              >
                                {agents.map((agent) => (
                                  <option key={agent.email} value={agent.email}>
                                    {agent.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                disabled={assigningId === delivery._id || agents.length === 0}
                                onClick={() => handleAssignDelivery(delivery._id)}
                                className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60"
                              >
                                {assigningId === delivery._id ? 'Assigning...' : 'Assign Rider'}
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-500">{delivery.eta}</span>
                          )}
                        </td>
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
