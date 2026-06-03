import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Play, Pin } from 'lucide-react';
import { useMedia, type MediaItem } from '../../context/MediaContext';

interface Props {
  item: MediaItem;
}

export default function SortableGridItem({ item }: Props) {
  const { togglePin } = useMedia();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

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
    touchAction: 'none',
  };

  const handleDoubleClick = () => togglePin(item.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={handleDoubleClick}
      className="relative aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-neutral-900"
    >
      <img
        src={item.url}
        alt=""
        className="h-full w-full object-cover"
        draggable={false}
      />
      {item.pinned && (
        <Pin
          size={16}
          className="absolute right-1.5 top-1.5 fill-white text-white drop-shadow"
        />
      )}
      {!item.pinned && item.type === 'video' && (
        <Play
          size={16}
          className="absolute right-1.5 top-1.5 fill-white text-white drop-shadow"
        />
      )}
    </div>
  );
}
