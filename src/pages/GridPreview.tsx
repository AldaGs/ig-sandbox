import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useMedia } from '../context/MediaContext';
import SortableGridItem from '../components/grid/SortableGridItem';

export default function GridPreview() {
  const { media, reorderMedia } = useMedia();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = media.findIndex((m) => m.id === active.id);
    const newIndex = media.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    reorderMedia(arrayMove(media, oldIndex, newIndex));
  };

  if (media.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-neutral-500">
        Upload some media to preview your grid
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={media.map((m) => m.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 gap-px bg-neutral-200 dark:bg-neutral-800">
          {media.map((item) => (
            <SortableGridItem key={item.id} item={item} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
