import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import { useAuth } from './auth/useAuth';

const AssignedDeliveriesPage = lazy(() => import('./pages/AssignedDeliveriesPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DeliveryDetailPage = lazy(() => import('./pages/DeliveryDetailPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RoutePage = lazy(() => import('./pages/RoutePage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const SummaryPage = lazy(() => import('./pages/SummaryPage'));

function RoleHomeRedirect() {
  const { user } = useAuth();

  return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
}

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
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <SignupPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RoleHomeRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assigned-deliveries"
          element={
            <ProtectedRoute>
              <AssignedDeliveriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery/:deliveryId"
          element={
            <ProtectedRoute>
              <DeliveryDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/route"
          element={
            <ProtectedRoute>
              <RoutePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/summary"
          element={
            <ProtectedRoute>
              <SummaryPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
