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

export default function MediaActionSheet({
  hidden,
  onReplace,
  onToggleHide,
  onRemove,
  onAdjust,
  onClose,
}: Props) {
  const actions: Action[] = [
    { label: 'Replace', icon: <Replace size={18} />, onClick: onReplace },
    {
      label: hidden ? 'Unhide' : 'Hide',
      icon: hidden ? <Eye size={18} /> : <EyeOff size={18} />,
      onClick: onToggleHide,
    },
    { label: 'Adjust preview', icon: <Crop size={18} />, onClick: onAdjust },
    {
      label: 'Remove',
      icon: <Trash2 size={18} />,
      onClick: onRemove,
      danger: true,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="mb-[max(env(safe-area-inset-bottom),0.5rem)] w-full max-w-md rounded-2xl bg-neutral-900 p-2 text-white shadow-xl"
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
          onClick={onClose}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm text-neutral-400 hover:bg-neutral-800"
        >
          <X size={18} />
          Cancel
        </button>
      </div>
    </div>
  );
}
