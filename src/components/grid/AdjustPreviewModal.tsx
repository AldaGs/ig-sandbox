import { useRef, useState } from 'react';
import type { MediaItem } from '../../context/MediaContext';

interface Props {
  item: MediaItem;
  onSave: (objectPosition: string) => void;
  onClose: () => void;
}

interface Pos {
  x: number;
  y: number;
}

function parsePosition(value: string | undefined): Pos {
  if (!value) return { x: 50, y: 50 };
  const [x, y] = value.split(/\s+/).map((p) => parseFloat(p));
  return {
    x: Number.isFinite(x) ? x : 50,
    y: Number.isFinite(y) ? y : 50,
  };
}

const clamp = (n: number) => Math.min(100, Math.max(0, n));

export default function AdjustPreviewModal({ item, onSave, onClose }: Props) {
  const [pos, setPos] = useState<Pos>(() => parsePosition(item.objectPosition));
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; pos: Pos } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, pos };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    // Dragging the image one way reveals the opposite side, so subtract.
    setPos({
      x: clamp(drag.current.pos.x - (dx / rect.width) * 100),
      y: clamp(drag.current.pos.y - (dy / rect.height) * 100),
    });
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs text-center text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-3 text-sm text-neutral-300">
          Drag to reposition the grid crop
        </p>
        <div
          ref={frameRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="mx-auto aspect-[4/5] w-full touch-none select-none overflow-hidden rounded-lg bg-neutral-900"
          style={{ cursor: 'move' }}
        >
          <img
            src={item.url}
            alt=""
            draggable={false}
            style={{ objectPosition: `${pos.x}% ${pos.y}%` }}
            className="pointer-events-none h-full w-full object-cover"
          />
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg bg-neutral-800 px-4 py-2.5 text-sm text-neutral-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(`${Math.round(pos.x)}% ${Math.round(pos.y)}%`)}
            className="flex-1 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
