import { useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useProfile } from '../../context/ProfileContext';
import type { MediaItem } from '../../context/MediaContext';
import TileContent from './TileContent';

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
  // Whether the current interaction came from a mouse, so long-press on touch
  // never opens the menu (only desktop right-click does).
  const pointerType = useRef<string>('');

  useEffect(() => {
    if (wasDragging.current && !isDragging) dragEndAt.current = Date.now();
    wasDragging.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    return () => {
      if (tapTimer.current !== null) window.clearTimeout(tapTimer.current);
    };
  }, []);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
    // The lifted tile is drawn by the DragOverlay; leave a faint gap here.
    opacity: isDragging ? 0.35 : 1,
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
      onPointerDownCapture={(e) => {
        pointerType.current = e.pointerType;
      }}
      onClick={handleClick}
      onContextMenu={(e) => {
        // Right-click on desktop opens the menu; a touch long-press must not.
        e.preventDefault();
        if (pointerType.current === 'mouse' && !item.processing) {
          onOpenMenu(item.id);
        }
      }}
      className="relative aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-neutral-900"
    >
      <TileContent item={item} pinned={pinned} />
    </div>
  );
}
