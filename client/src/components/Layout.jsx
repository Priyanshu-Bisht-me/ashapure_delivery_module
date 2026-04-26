import Navbar from './Navbar';
import Sidebar from './Sidebar';

function Layout({ title, children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_#edfdf5_0%,_#f7fcfa_42%,_#f8fbfa_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(15,122,84,0.04),transparent_28%,transparent_72%,rgba(19,153,104,0.06))]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(15,122,84,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,122,84,0.04)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-emerald-100/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 top-0 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />

      <Navbar title={title} />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl px-3 pb-6 sm:px-4 lg:px-6">
        <Sidebar />
        <main className="min-w-0 flex-1 py-4 sm:py-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
