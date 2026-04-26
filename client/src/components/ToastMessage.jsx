function ToastMessage({ toast, onClose }) {
  if (!toast?.message) {
    return null;
  }

  const toneClasses =
    toast.type === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700';

  return (
    <div className="fixed left-4 right-4 top-4 z-50 mx-auto max-w-sm sm:left-auto sm:right-4 sm:mx-0">
      <div className={`rounded-2xl border px-4 py-3 shadow-[0_24px_55px_-30px_rgba(11,28,48,0.35)] ${toneClasses}`}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium">{toast.message}</p>
          <button type="button" onClick={onClose} className="text-xs font-bold uppercase tracking-wide">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ToastMessage;
