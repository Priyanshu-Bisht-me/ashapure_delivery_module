function StatCard({ label, value, accent = 'emerald' }) {
  const accentClasses = {
    emerald: 'border-emerald-200 bg-gradient-to-b from-emerald-50 to-white text-emerald-800',
    blue: 'border-blue-200 bg-gradient-to-b from-blue-50 to-white text-blue-800',
    amber: 'border-amber-200 bg-gradient-to-b from-amber-50 to-white text-amber-800',
    rose: 'border-rose-200 bg-gradient-to-b from-rose-50 to-white text-rose-800',
    slate: 'border-slate-200 bg-gradient-to-b from-slate-50 to-white text-slate-800',
  };

  const cardClass = accentClasses[accent] || accentClasses.slate;

  return (
    <article
      className={`rounded-[26px] border p-4 shadow-[0_22px_48px_-34px_rgba(11,28,48,0.42)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_28px_58px_-36px_rgba(11,28,48,0.44)] ${cardClass}`}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.24em]">{label}</p>
      <p className="mt-3 text-3xl font-extrabold tracking-tight">{value}</p>
    </article>
  );
}

export default StatCard;
