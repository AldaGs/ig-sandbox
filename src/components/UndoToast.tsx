import { Undo2, X } from 'lucide-react';
import { useUndo } from '../context/UndoContext';

export default function UndoToast() {
  const { current, invoke, dismiss } = useUndo();

  // Reserve the slot during animations to avoid layout pop. We render
  // nothing for now if there's no entry; the slide-up is short enough not
  // to feel jumpy.
  if (!current) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-16 z-30 flex justify-center px-3"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-neutral-800/95 px-4 py-2 text-sm text-white shadow-lg backdrop-blur">
        <span className="truncate">{current.label}</span>
        <button
          type="button"
          onClick={invoke}
          className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20"
        >
          <Undo2 size={12} />
          Undo
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-full p-1 text-neutral-400 hover:text-white"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
