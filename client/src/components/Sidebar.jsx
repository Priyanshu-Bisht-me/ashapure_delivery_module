import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

const agentLinks = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Route', to: '/route' },
  { label: 'Assigned Deliveries', to: '/assigned-deliveries' },
  { label: 'Summary', to: '/summary' },
];

const adminLinks = [
  { label: 'Dashboard', to: '/admin', hash: '' },
  { label: 'Create Delivery', to: '/admin#create-delivery', hash: '#create-delivery' },
  { label: 'Delivery Agents', to: '/admin#delivery-agents', hash: '#delivery-agents' },
  { label: 'Recent Deliveries', to: '/admin#recent-deliveries', hash: '#recent-deliveries' },
];

const linkClass = ({ isActive }) => {
  const baseClass =
    'block rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-200';
  return isActive
    ? `${baseClass} bg-emerald-600 text-white shadow-[0_16px_30px_-18px_rgba(15,122,84,0.85)]`
    : `${baseClass} text-slate-600 hover:translate-x-1 hover:bg-emerald-50 hover:text-emerald-900`;
};

const actionClass = (isActive = false) => {
  const baseClass =
    'block w-full rounded-xl px-3 py-2 text-left text-xs font-bold uppercase tracking-wide transition-all duration-200';
  return isActive
    ? `${baseClass} bg-emerald-600 text-white shadow-[0_16px_30px_-18px_rgba(15,122,84,0.85)]`
    : `${baseClass} text-slate-600 hover:translate-x-1 hover:bg-emerald-50 hover:text-emerald-900`;
};

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="sticky top-[108px] hidden h-[calc(100vh-136px)] w-64 shrink-0 pr-5 lg:block">
      <div className="rounded-[28px] border border-emerald-100/90 bg-white/95 p-5 shadow-[0_24px_55px_-32px_rgba(11,28,48,0.4)]">
        <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">
          {isAdmin ? 'Admin Menu' : 'Dispatch Menu'}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {isAdmin
            ? 'Manage deliveries, riders, and recent dispatch activity from one focused control surface.'
            : 'Track routes, orders, and today&apos;s progress from one clean control surface.'}
        </p>
        <nav className="mt-4 space-y-1">
          {isAdmin
            ? adminLinks.map((link) => {
                const isActive =
                  location.pathname === '/admin' &&
                  (link.hash ? location.hash === link.hash : location.hash === '');

                return (
                  <Link key={link.to} to={link.to} className={actionClass(isActive)}>
                    {link.label}
                  </Link>
                );
              })
            : agentLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={linkClass}>
                  {link.label}
                </NavLink>
              ))}
        </nav>
        {isAdmin ? (
          <button type="button" onClick={handleLogout} className={`mt-6 ${actionClass(false)}`}>
            Logout
          </button>
        ) : (
          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">Workflow</p>
            <p className="mt-2 text-xs leading-5 text-slate-600">Assigned to Picked Up to Out for Delivery to Delivered or Failed.</p>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
