import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

const agentNavLinks = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Route', to: '/route' },
  { label: 'Assigned Deliveries', to: '/assigned-deliveries' },
  { label: 'Summary', to: '/summary' },
];

const adminNavLinks = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Admin', to: '/admin' },
];

const navLinkClass = ({ isActive }) =>
  isActive
    ? 'rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-[0_14px_30px_-16px_rgba(15,122,84,0.8)]'
    : 'rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 hover:text-emerald-800';

function Navbar({ title }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const homePath = isAdmin ? '/admin' : '/dashboard';
  const navLinks = isAdmin ? adminNavLinks : agentNavLinks;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 border-b border-emerald-100/80 bg-white/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <Link to={homePath} className="text-lg font-extrabold tracking-tight text-emerald-700 sm:text-xl">
              Aasapure Delivery Module
            </Link>
            <span className="hidden rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700 sm:block">
              {title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 md:block">
              {user?.role === 'admin' ? 'Admin' : 'Delivery Agent'}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-700 transition-colors hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <nav className="flex min-w-0 items-center gap-1 overflow-x-auto pb-1">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={navLinkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <span className="hidden text-xs font-medium text-slate-500 lg:block">{user?.name || 'Signed In'}</span>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
