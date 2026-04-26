import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAssignedDeliveries } from '../api/deliveryApi';
import SkeletonBlock from '../components/SkeletonBlock';
import Layout from '../components/Layout';

const activeStatuses = ['assigned', 'picked_up', 'out_for_delivery'];
const statusPriority = {
  out_for_delivery: 0,
  picked_up: 1,
  assigned: 2,
};
const statusLabels = {
  assigned: 'Assigned',
  picked_up: 'Picked Up',
  out_for_delivery: 'Out for Delivery',
};
const trackingMoments = [
  { label: 'Picked Up', hint: 'Driver has collected the order.', progress: 22 },
  { label: 'Reached halfway', hint: 'Route is moving smoothly through the midpoint.', progress: 48 },
  { label: '5 mins away', hint: 'Final turn sequence is underway.', progress: 76 },
  { label: 'Arriving now', hint: 'Delivery handoff is about to happen.', progress: 100 },
];

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

  return `https://www.google.com/maps?q=${encodeURIComponent(stop?.address || 'AshaPure Delivery Route')}&output=embed`;
};

function RoutePage() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trackingIndex, setTrackingIndex] = useState(0);

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

  const sortedDeliveries = useMemo(() => {
    return deliveries
      .filter((delivery) => activeStatuses.includes(delivery.status))
      .sort((first, second) => {
        const priorityGap = (statusPriority[first.status] ?? 99) - (statusPriority[second.status] ?? 99);

        if (priorityGap !== 0) {
          return priorityGap;
        }

        return parseEtaMinutes(first.eta) - parseEtaMinutes(second.eta);
      });
  }, [deliveries]);

  const routeStops = useMemo(() => {
    if (sortedDeliveries.length === 0) {
      return [];
    }

    const firstDelivery = sortedDeliveries[0];

    return [
      {
        id: `pickup-${firstDelivery._id}`,
        type: 'pickup',
        title: 'Merchant Pickup',
        subtitle: firstDelivery.merchantName,
        address: `${firstDelivery.merchantName} dispatch point`,
        eta: 'Ready now',
        coordinates: firstDelivery.coordinates,
      },
      ...sortedDeliveries.map((delivery, index) => ({
        id: delivery._id,
        type: 'dropoff',
        title: `${index + 1}. ${delivery.customerName}`,
        subtitle: statusLabels[delivery.status] || delivery.status,
        address: delivery.address,
        eta: delivery.eta,
        coordinates: delivery.coordinates,
      })),
    ];
  }, [sortedDeliveries]);

  const currentStopIndex = useMemo(() => {
    if (sortedDeliveries.length === 0) {
      return 0;
    }

    return sortedDeliveries[0].status === 'assigned' ? 0 : 1;
  }, [sortedDeliveries]);

  const currentStop = routeStops[currentStopIndex] || null;
  const remainingStops = routeStops.length > 0 ? routeStops.length - currentStopIndex - 1 : 0;

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

  useEffect(() => {
    if (!currentStop) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTrackingIndex((currentIndex) => (currentIndex + 1) % trackingMoments.length);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [currentStop]);

  const trackingState = trackingMoments[trackingIndex];

  return (
    <Layout title="Route">
      <section className="space-y-6">
        <header className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Route Command</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Optimized stop order, live route context, and a lightweight map view designed for fast route demos and operator walkthroughs.</p>
          </div>
          <div className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
            Optimized by status priority and ETA
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

        {!loading && !error && routeStops.length === 0 && (
          <div className="rounded-[26px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            No active route stops are available right now. Assigned, picked-up, or out-for-delivery jobs will appear here.
          </div>
        )}

        {!loading && !error && routeStops.length > 0 && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <div className="space-y-6">
              <article className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white/95 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.45)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 px-5 py-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Map View</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-900">{currentStop?.title}</h2>
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
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Current Stop</p>
                  <p className="mt-3 text-base font-semibold text-slate-900 md:text-lg">{currentStop?.title}</p>
                </article>
                <article className="rounded-[26px] border border-emerald-100 bg-white/95 p-4 shadow-[0_20px_44px_-30px_rgba(11,28,48,0.4)]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Remaining Stops</p>
                  <p className="mt-3 text-3xl font-extrabold text-slate-900">{remainingStops}</p>
                </article>
                <article className="rounded-[26px] border border-emerald-100 bg-white/95 p-4 shadow-[0_20px_44px_-30px_rgba(11,28,48,0.4)]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">ETA</p>
                  <p className="mt-3 text-base font-semibold text-slate-900 md:text-lg">{currentStop?.eta}</p>
                </article>
                <article className="rounded-[26px] border border-emerald-100 bg-white/95 p-4 shadow-[0_20px_44px_-30px_rgba(11,28,48,0.4)]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Distance</p>
                  <p className="mt-3 text-base font-semibold text-slate-900 md:text-lg">{formatDistance(totalDistance)}</p>
                </article>
              </div>
            </div>

            <div className="space-y-6">
              <article className="rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.45)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Optimized Route Sequence</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-900">Stop-by-stop plan</h2>
                  </div>
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {routeStops.length} stops
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {routeStops.map((stop, index) => {
                    const isCurrent = index === currentStopIndex;

                    return (
                      <article
                        key={stop.id}
                        className={`rounded-[24px] border p-4 transition-all ${isCurrent ? 'border-emerald-300 bg-emerald-50/70 shadow-[0_18px_40px_-30px_rgba(15,122,84,0.55)]' : 'border-emerald-100 bg-slate-50/70 hover:border-emerald-200 hover:bg-white'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{stop.title}</p>
                            <p className="mt-1 text-sm text-slate-600">{stop.subtitle}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-500">{stop.address}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            {isCurrent && (
                              <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                                Current
                              </span>
                            )}
                            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{stop.eta}</p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </article>

              <article className="rounded-[28px] border border-emerald-100 bg-white/95 p-5 shadow-[0_24px_55px_-36px_rgba(11,28,48,0.45)]">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Live Tracking Demo</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{trackingState.label}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{trackingState.hint}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                    {trackingState.progress}%
                  </span>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#0f7a54,#2fc487)] transition-all duration-700"
                    style={{ width: `${trackingState.progress}%` }}
                  />
                </div>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Demo cycle refreshes every 4 seconds without GPS.
                </p>
              </article>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}

export default RoutePage;
