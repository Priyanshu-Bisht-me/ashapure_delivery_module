import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

function ProtectedRoute({ children, allowedRoles, redirectTo }) {
  const { authReady, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#f4faf8] px-4 py-6">
        <div className="mx-auto max-w-md animate-pulse space-y-4">
          <div className="h-10 w-40 rounded-2xl bg-emerald-100/80" />
          <div className="h-48 rounded-[26px] bg-emerald-100/70" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to={redirectTo || (user?.role === 'admin' ? '/admin' : '/dashboard')} replace />;
  }

  return children;
}

export default ProtectedRoute;
