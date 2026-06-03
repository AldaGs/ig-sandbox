import { useMemo } from 'react';
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
import ProfileHeader from '../components/profile/ProfileHeader';
import Highlights from '../components/profile/Highlights';
import ProfileTabs from '../components/profile/ProfileTabs';

export default function GridPreview() {
  const { media, reorderMedia } = useMedia();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
  );

  // Pinned items always sort to the front. Drag-reorder operates on the
  // visible (sorted) order so dropping a pinned item back among unpinned ones
  // unpins it implicitly only if the user toggles — for now we just keep order.
  const sorted = useMemo(() => {
    const pinned = media.filter((m) => m.pinned);
    const rest = media.filter((m) => !m.pinned);
    return [...pinned, ...rest];
  }, [media]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sorted.findIndex((m) => m.id === active.id);
    const newIndex = sorted.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    reorderMedia(arrayMove(sorted, oldIndex, newIndex));
  };

  return (
    <div className="bg-black text-white">
      <ProfileHeader />
      <Highlights />
      <ProfileTabs />

      {sorted.length === 0 ? (
        <div className="flex h-48 items-center justify-center p-8 text-center text-sm text-neutral-500">
          Upload some media to preview your grid
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sorted.map((m) => m.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-3 gap-px bg-neutral-800">
              {sorted.map((item) => (
                <SortableGridItem key={item.id} item={item} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
