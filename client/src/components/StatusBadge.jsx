const labelMap = {
  assigned: 'Assigned',
  picked_up: 'Picked Up',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  failed: 'Failed',
  pending: 'Pending',
};

const toneMap = {
  assigned: 'border-slate-200 bg-slate-100 text-slate-700',
  picked_up: 'border-sky-200 bg-sky-100 text-sky-700',
  out_for_delivery: 'border-amber-200 bg-amber-100 text-amber-700',
  delivered: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  failed: 'border-rose-200 bg-rose-100 text-rose-700',
  pending: 'border-amber-200 bg-amber-100 text-amber-700',
};

function StatusBadge({ status, label, className = '' }) {
  const resolvedLabel = label || labelMap[status] || status;
  const tone = toneMap[status] || 'border-slate-200 bg-slate-100 text-slate-700';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tone} ${className}`}>
      {resolvedLabel}
    </span>
  );
}

export default StatusBadge;
