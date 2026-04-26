import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Delivery Agent',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await signup(formState);
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#edfdf5_0%,_#f7fcfa_42%,_#f8fbfa_100%)] px-4 py-10">
      <div className="mx-auto max-w-md rounded-[30px] border border-emerald-100 bg-white/95 p-6 shadow-[0_28px_60px_-38px_rgba(11,28,48,0.42)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-700">Aasapure Delivery</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Signup</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Create a delivery agent account without changing the existing project flow.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="signup-name">
              Full Name
            </label>
            <input
              id="signup-name"
              type="text"
              required
              value={formState.name}
              onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-emerald-200 bg-emerald-50/30 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="signup-email">
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              required
              value={formState.email}
              onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-emerald-200 bg-emerald-50/30 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="signup-password">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              required
              minLength={6}
              value={formState.password}
              onChange={(event) => setFormState((current) => ({ ...current, password: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-emerald-200 bg-emerald-50/30 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Role</label>
            <div className="mt-2 rounded-2xl border border-emerald-200 bg-emerald-50/30 px-4 py-3 text-sm font-medium text-slate-700">
              Delivery Agent
            </div>
          </div>

          {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? 'Creating Account...' : 'Signup'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;
