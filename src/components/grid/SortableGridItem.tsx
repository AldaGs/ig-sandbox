import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Play, Pin } from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import type { MediaItem } from '../../context/MediaContext';

interface Props {
  item: MediaItem;
  pinned: boolean;
  // Only locally uploaded media can be reordered; imported Instagram posts are
  // shown for context but stay put.
  draggable: boolean;
}

export default function SortableGridItem({ item, pinned, draggable }: Props) {
  const { togglePinnedId } = useProfile();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: { draggable: !draggable } });

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
    // For draggable tiles, reserve vertical panning for the browser (so the page
    // still scrolls) while a press-and-hold initiates the drag. Non-draggable
    // tiles keep default touch behaviour and never capture the gesture.
    touchAction: draggable ? 'pan-y' : undefined,
    cursor: draggable ? 'grab' : undefined,
  };

  const handleDoubleClick = () => togglePinnedId(item.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(draggable ? listeners : {})}
      onDoubleClick={handleDoubleClick}
      className="relative aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-neutral-900"
    >
      <img
        src={item.url}
        alt=""
        className="h-full w-full object-cover"
        draggable={false}
      />
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
