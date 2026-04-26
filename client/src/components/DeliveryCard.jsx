import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

function DeliveryCard({ delivery }) {
  return (
    <article className="rounded-[26px] border border-emerald-100 bg-white/95 p-4 shadow-[0_20px_44px_-30px_rgba(11,28,48,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_28px_58px_-36px_rgba(11,28,48,0.44)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-slate-900">{delivery.customerName}</h3>
          <p className="mt-1 text-sm text-slate-500">{delivery.address}</p>
          <p className="mt-1 text-sm text-slate-600">Merchant: {delivery.merchantName}</p>
        </div>
        <StatusBadge status={delivery.status} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-slate-600">
          <span className="font-medium">ETA:</span> {delivery.eta}
        </div>
        <Link
          to={`/delivery/${delivery._id}`}
          className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700"
        >
          View Details
        </Link>
      </div>
    </article>
  );
}

export default DeliveryCard;
