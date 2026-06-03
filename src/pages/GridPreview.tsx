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
import { Pin } from 'lucide-react';
import { useMedia } from '../context/MediaContext';
import { useProfile } from '../context/ProfileContext';
import SortableGridItem from '../components/grid/SortableGridItem';
import ProfileHeader from '../components/profile/ProfileHeader';
import Highlights from '../components/profile/Highlights';
import ProfileTabs from '../components/profile/ProfileTabs';

export default function GridPreview() {
  const { media, reorderMedia } = useMedia();
  const { isPinned, pinFirstN } = useProfile();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
  );

  const sorted = useMemo(() => {
    const pinned = media.filter((m) => isPinned(m.id));
    const rest = media.filter((m) => !isPinned(m.id));
    return [...pinned, ...rest];
  }, [media, isPinned]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sorted.findIndex((m) => m.id === active.id);
    const newIndex = sorted.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    reorderMedia(arrayMove(sorted, oldIndex, newIndex));
  };

  const handlePinFirst3 = () => {
    pinFirstN(media.slice(0, 3).map((m) => m.id), 3);
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
        <>
          <div className="flex items-center justify-between px-3 py-2 text-xs text-neutral-500">
            <span>Double-tap a post to pin · max 3</span>
            <button
              type="button"
              onClick={handlePinFirst3}
              disabled={media.length === 0}
              className="flex items-center gap-1 rounded bg-neutral-800 px-2 py-1 text-neutral-200 disabled:opacity-30"
            >
              <Pin size={12} />
              Pin first 3
            </button>
          </div>
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
                  <SortableGridItem
                    key={item.id}
                    item={item}
                    pinned={isPinned(item.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}
    </div>
  );
}
