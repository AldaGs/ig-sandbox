import { useEffect, useState } from 'react';
import { Replace, EyeOff, Eye, Trash2, Crop, X } from 'lucide-react';

interface Props {
  hidden: boolean;
  onReplace: () => void;
  onToggleHide: () => void;
  onRemove: () => void;
  onAdjust: () => void;
  onClose: () => void;
}

interface Action {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

const ANIM_MS = 200;

export default function MediaActionSheet({
  hidden,
  onReplace,
  onToggleHide,
  onRemove,
  onAdjust,
  onClose,
}: Props) {
  const [visible, setVisible] = useState(false);

  // Slide/fade in on mount.
  useEffect(() => {
    const r = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(r);
  }, []);

  // Animate out, then run the chosen action (if any) and unmount.
  const dismiss = (action?: () => void) => {
    setVisible(false);
    window.setTimeout(() => {
      action?.();
      onClose();
    }, ANIM_MS);
  };

  const actions: Action[] = [
    { label: 'Replace', icon: <Replace size={18} />, onClick: () => dismiss(onReplace) },
    {
      label: hidden ? 'Unhide' : 'Hide',
      icon: hidden ? <Eye size={18} /> : <EyeOff size={18} />,
      onClick: () => dismiss(onToggleHide),
    },
    { label: 'Adjust preview', icon: <Crop size={18} />, onClick: () => dismiss(onAdjust) },
    {
      label: 'Remove',
      icon: <Trash2 size={18} />,
      onClick: () => dismiss(onRemove),
      danger: true,
    },
  ];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/60 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={() => dismiss()}
    >
      <div
        className={`mb-[max(env(safe-area-inset-bottom),0.5rem)] w-full max-w-md rounded-2xl bg-neutral-900 p-2 text-white shadow-xl transition-transform duration-200 ease-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm hover:bg-neutral-800 ${
              a.danger ? 'text-red-400' : 'text-neutral-100'
            }`}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => dismiss()}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm text-neutral-400 hover:bg-neutral-800"
        >
          <X size={18} />
          Cancel
        </button>
      </div>
    </div>
  );
}
