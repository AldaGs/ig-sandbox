import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { StoryOverlay } from '../../context/ProfileContext';

interface Props {
  overlays: StoryOverlay[];
  onChange: (overlays: StoryOverlay[]) => void;
  editing: boolean;
}

// Stories are designed at ~360 logical px wide; size values in overlays are in
// that reference frame and scale with the container.
const REF_WIDTH = 360;

export default function OverlayLayer({ overlays, onChange, editing }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Deselect when leaving edit mode.
  useEffect(() => {
    if (!editing) setSelectedId(null);
  }, [editing]);

  const update = (id: string, patch: Partial<StoryOverlay>) => {
    onChange(
      overlays.map((o) => (o.id === id ? ({ ...o, ...patch } as StoryOverlay) : o)),
    );
  };

  const remove = (id: string) => {
    onChange(overlays.filter((o) => o.id !== id));
    setSelectedId(null);
  };

  const handlePointerDown = (e: React.PointerEvent, ov: StoryOverlay) => {
    if (!editing) return;
    e.stopPropagation();
    setSelectedId(ov.id);
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const startX = ov.x;
    const startY = ov.y;
    const pointerStart = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - pointerStart.x) / rect.width;
      const dy = (ev.clientY - pointerStart.y) / rect.height;
      update(ov.id, {
        x: Math.max(0, Math.min(1, startX + dx)),
        y: Math.max(0, Math.min(1, startY + dy)),
      });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      onClick={() => setSelectedId(null)}
    >
      {overlays.map((ov) => {
        const isSelected = ov.id === selectedId;
        const scale = (containerRef.current?.clientWidth ?? REF_WIDTH) / REF_WIDTH;
        const renderSize = ov.size * scale;
        return (
          <div
            key={ov.id}
            onPointerDown={(e) => handlePointerDown(e, ov)}
            onClick={(e) => e.stopPropagation()}
            style={{
              left: `${ov.x * 100}%`,
              top: `${ov.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              touchAction: 'none',
            }}
            className={`absolute select-none ${
              editing ? 'cursor-grab' : ''
            } ${isSelected ? 'ring-2 ring-white/70 rounded-md' : ''}`}
          >
            {ov.kind === 'text' ? (
              isSelected && editing ? (
                <input
                  autoFocus
                  value={ov.text}
                  onChange={(e) => update(ov.id, { text: e.target.value })}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{
                    fontSize: renderSize,
                    color: ov.color,
                  }}
                  className="w-40 bg-transparent text-center font-semibold outline-none drop-shadow"
                />
              ) : (
                <span
                  style={{
                    fontSize: renderSize,
                    color: ov.color,
                  }}
                  className="font-semibold drop-shadow"
                >
                  {ov.text || ' '}
                </span>
              )
            ) : (
              <span style={{ fontSize: renderSize }}>{ov.emoji}</span>
            )}
            {isSelected && editing && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  remove(ov.id);
                }}
                className="absolute -right-3 -top-3 grid h-6 w-6 place-items-center rounded-full bg-black/80 text-white"
                aria-label="Delete overlay"
              >
                <X size={12} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
