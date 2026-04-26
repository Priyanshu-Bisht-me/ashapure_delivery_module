import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formState, setFormState] = useState({
    email: 'agent1@aasapure.com',
    password: 'agent123',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await login(formState);
      const roleRedirect = response.user?.role === 'admin' ? '/admin' : '/dashboard';
      const requestedPath = location.state?.from?.pathname;
      const nextPath =
        response.user?.role === 'admin'
          ? requestedPath === '/admin'
            ? requestedPath
            : roleRedirect
          : requestedPath && requestedPath !== '/admin'
            ? requestedPath
            : roleRedirect;

      navigate(nextPath, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#edfdf5_0%,_#f7fcfa_42%,_#f8fbfa_100%)] px-4 py-10">
      <div className="mx-auto max-w-md rounded-[30px] border border-emerald-100 bg-white/95 p-6 shadow-[0_28px_60px_-38px_rgba(11,28,48,0.42)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-700">Aasapure Delivery</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Login</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Sign in to continue into the delivery workspace.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={formState.email}
              onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-emerald-200 bg-emerald-50/30 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              value={formState.password}
              onChange={(event) => setFormState((current) => ({ ...current, password: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-emerald-200 bg-emerald-50/30 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400"
            />
          </div>

          {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? 'Signing In...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-slate-700">
          <p className="font-semibold text-emerald-800">Demo Account</p>
          <p className="mt-2">agent1@aasapure.com / agent123</p>
        </div>

        <p className="mt-6 text-sm text-slate-600">
          Need an account?{' '}
          <Link to="/signup" className="font-semibold text-emerald-700 hover:text-emerald-800">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
