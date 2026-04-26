const chartConfig = [
  { key: 'completed', label: 'Completed', colorClass: 'bg-emerald-500' },
  { key: 'pending', label: 'Pending', colorClass: 'bg-amber-500' },
  { key: 'failed', label: 'Failed', colorClass: 'bg-rose-500' },
];

const percentage = (value, total) => {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
};

function StatusChart({ total, completed, pending, failed, title = 'Delivery Status Chart' }) {
  const values = { completed, pending, failed };

  return (
    <article className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-[0_18px_44px_-28px_rgba(11,28,48,0.45)]">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">Distribution based on live records from backend.</p>

      <div className="mt-5 space-y-4">
        {chartConfig.map((item) => {
          const value = values[item.key] || 0;
          const width = `${percentage(value, total)}%`;

          return (
            <div key={item.key}>
              <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-600">
                <span>{item.label}</span>
                <span>{value}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${item.colorClass}`} style={{ width }} />
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export default StatusChart;