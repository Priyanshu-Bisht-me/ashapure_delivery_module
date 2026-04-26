import { NavLink } from 'react-router-dom';

const links = [
  { label: 'Dashboard', to: '/' },
  { label: 'Route', to: '/route' },
  { label: 'Assigned Deliveries', to: '/assigned-deliveries' },
  { label: 'Summary', to: '/summary' },
];

const linkClass = ({ isActive }) => {
  const baseClass =
    'block rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-200';
  return isActive
    ? `${baseClass} bg-emerald-600 text-white shadow-[0_16px_30px_-18px_rgba(15,122,84,0.85)]`
    : `${baseClass} text-slate-600 hover:translate-x-1 hover:bg-emerald-50 hover:text-emerald-900`;
};

function Sidebar() {
  return (
    <aside className="sticky top-[108px] hidden h-[calc(100vh-136px)] w-64 shrink-0 pr-5 lg:block">
      <div className="rounded-[28px] border border-emerald-100/90 bg-white/95 p-5 shadow-[0_24px_55px_-32px_rgba(11,28,48,0.4)]">
        <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">Dispatch Menu</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">Track routes, orders, and today&apos;s progress from one clean control surface.</p>
        <nav className="mt-4 space-y-1">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">Workflow</p>
          <p className="mt-2 text-xs leading-5 text-slate-600">Assigned to Picked Up to Out for Delivery to Delivered or Failed.</p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
