import { useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Play, Pin, EyeOff, Loader } from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import type { MediaItem } from '../../context/MediaContext';

interface Props {
  item: MediaItem;
  pinned: boolean;
  onOpenMenu: (id: string) => void;
}

// Window for telling a single tap (open menu) apart from a double tap (pin).
const DOUBLE_TAP_MS = 220;

export default function SortableGridItem({ item, pinned, onOpenMenu }: Props) {
  const { togglePinnedId } = useProfile();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  // dnd-kit can fire a click right after a drag ends; track when a drag just
  // finished so we can swallow that click (a reorder shouldn't open the menu).
  const wasDragging = useRef(false);
  const dragEndAt = useRef(0);
  // Pending single-tap timer, cancelled if a second tap arrives (double tap).
  const tapTimer = useRef<number | null>(null);

  useEffect(() => {
    if (wasDragging.current && !isDragging) dragEndAt.current = Date.now();
    wasDragging.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    return () => {
      if (tapTimer.current !== null) window.clearTimeout(tapTimer.current);
    };
  }, []);

  const dragTransform = transform
    ? {
        ...transform,
        scaleX: isDragging ? 1.08 : transform.scaleX,
        scaleY: isDragging ? 1.08 : transform.scaleY,
      }
    : null;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(dragTransform),
    transition: transition ?? 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
    rotate: isDragging ? '-3deg' : '0deg',
    zIndex: isDragging ? 50 : 'auto',
    boxShadow: isDragging
      ? '0 12px 24px -8px rgba(0,0,0,0.6), 0 4px 8px -4px rgba(0,0,0,0.4)'
      : 'none',
    // Reserve vertical panning for the browser (so the page scrolls) while a
    // press-and-hold initiates the drag.
    touchAction: 'pan-y',
    cursor: 'grab',
  };

  const handleClick = () => {
    // Ignore the synthetic click that immediately follows a drag.
    if (isDragging || Date.now() - dragEndAt.current < 250) return;
    if (item.processing) return;
    if (tapTimer.current !== null) {
      // Second tap within the window -> double tap -> pin.
      window.clearTimeout(tapTimer.current);
      tapTimer.current = null;
      togglePinnedId(item.id);
      return;
    }
    tapTimer.current = window.setTimeout(() => {
      tapTimer.current = null;
      onOpenMenu(item.id);
    }, DOUBLE_TAP_MS);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      onContextMenu={(e) => {
        // Right-click (desktop) opens the menu directly.
        e.preventDefault();
        if (!item.processing) onOpenMenu(item.id);
      }}
      className="relative aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-neutral-900"
    >
      {item.processing ? (
        <div className="ig-shimmer absolute inset-0 flex items-center justify-center">
          <Loader size={20} className="animate-spin text-neutral-400" />
        </div>
      ) : (
        <img
          src={item.url}
          alt=""
          style={{ objectPosition: item.objectPosition }}
          className={`h-full w-full object-cover ${
            item.hidden ? 'opacity-30' : ''
          }`}
          draggable={false}
        />
      )}
      {item.hidden && !item.processing && (
        <div className="absolute inset-0 flex items-center justify-center">
          <EyeOff size={20} className="text-white/80 drop-shadow" />
        </div>
      )}
      {pinned && (
        <Pin
          size={16}
          className="absolute right-1.5 top-1.5 fill-white text-white drop-shadow"
        />
      )}
      {!pinned && item.type === 'video' && (
        <Play
          size={16}
          className="absolute right-1.5 top-1.5 fill-white text-white drop-shadow"
        />
      )}
    </div>
  );
}
