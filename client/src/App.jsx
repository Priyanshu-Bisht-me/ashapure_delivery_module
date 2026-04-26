import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const AssignedDeliveriesPage = lazy(() => import('./pages/AssignedDeliveriesPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DeliveryDetailPage = lazy(() => import('./pages/DeliveryDetailPage'));
const RoutePage = lazy(() => import('./pages/RoutePage'));
const SummaryPage = lazy(() => import('./pages/SummaryPage'));

function App() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f4faf8] px-4 py-6">
          <div className="mx-auto max-w-7xl animate-pulse space-y-4">
            <div className="h-10 w-48 rounded-2xl bg-emerald-100/80" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="h-32 rounded-[26px] bg-emerald-100/70" />
              <div className="h-32 rounded-[26px] bg-emerald-100/70" />
              <div className="h-32 rounded-[26px] bg-emerald-100/70" />
            </div>
          </div>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/assigned-deliveries" element={<AssignedDeliveriesPage />} />
        <Route path="/delivery/:deliveryId" element={<DeliveryDetailPage />} />
        <Route path="/route" element={<RoutePage />} />
        <Route path="/summary" element={<SummaryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
