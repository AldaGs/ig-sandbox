import { useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Pin, Eye, EyeOff } from 'lucide-react';
import { useMedia } from '../context/MediaContext';
import { useProfile } from '../context/ProfileContext';
import SortableGridItem from '../components/grid/SortableGridItem';
import TileContent from '../components/grid/TileContent';
import MediaActionSheet from '../components/grid/MediaActionSheet';
import AdjustPreviewModal from '../components/grid/AdjustPreviewModal';
import ProfileHeader from '../components/profile/ProfileHeader';
import Highlights from '../components/profile/Highlights';
import ProfileTabs from '../components/profile/ProfileTabs';
import {
  isImageCandidate,
  readAspectRatio,
  toDisplayableBlob,
} from '../services/image';

export default function GridPreview() {
  const { media, reorderMedia, updateMedia, removeMedia } = useMedia();
  const { isPinned, pinFirstN } = useProfile();

  const [showHidden, setShowHidden] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [adjustId, setAdjustId] = useState<string | null>(null);
  // Id of the tile currently being dragged, rendered in the DragOverlay.
  const [activeId, setActiveId] = useState<string | null>(null);
  // Id of the item currently being targeted by the "Replace" file picker.
  const replaceId = useRef<string | null>(null);
  const replaceInput = useRef<HTMLInputElement>(null);

  // Mouse drags start after a small move. On touch we require a short
  // press-and-hold instead, so a quick swipe scrolls and a tap opens the menu.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  const hasHidden = useMemo(() => media.some((m) => m.hidden), [media]);

  const sorted = useMemo(() => {
    const visible = showHidden ? media : media.filter((m) => !m.hidden);
    const pinned = visible.filter((m) => isPinned(m.id));
    const rest = visible.filter((m) => !isPinned(m.id));
    return [...pinned, ...rest];
  }, [media, isPinned, showHidden]);

  const menuItem = menuId ? media.find((m) => m.id === menuId) : null;
  const adjustItem = adjustId ? media.find((m) => m.id === adjustId) : null;
  const activeItem = activeId ? media.find((m) => m.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sorted.findIndex((m) => m.id === active.id);
    const newIndex = sorted.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(sorted, oldIndex, newIndex);
    // Preserve items not currently shown (e.g. hidden ones) by keeping them.
    const shown = new Set(sorted.map((m) => m.id));
    const others = media.filter((m) => !shown.has(m.id));
    reorderMedia([...newOrder, ...others]);
  };

  const handlePinFirst3 = () => {
    pinFirstN(media.slice(0, 3).map((m) => m.id), 3);
  };

  // The action sheet animates itself closed and then runs these, so they only
  // perform the effect — closing is handled by the sheet's onClose.
  const handleReplaceClick = () => {
    replaceId.current = menuId;
    replaceInput.current?.click();
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = Array.from(e.target.files ?? []).find(isImageCandidate);
    const id = replaceId.current;
    e.target.value = '';
    replaceId.current = null;
    if (!file || !id) return;

    updateMedia(id, { processing: true });
    const blob = await toDisplayableBlob(file);
    const url = URL.createObjectURL(blob);
    const aspect_ratio = await readAspectRatio(url);
    // Reset the crop since it's a new image.
    updateMedia(id, { url, aspect_ratio, processing: false, objectPosition: undefined });
  };

  const handleToggleHide = () => {
    if (menuItem) updateMedia(menuItem.id, { hidden: !menuItem.hidden });
  };

  const handleRemove = () => {
    if (menuId) removeMedia(menuId);
  };

  const handleAdjust = () => {
    setAdjustId(menuId);
  };

  return (
    <div className="bg-black text-white">
      <ProfileHeader />
      <Highlights />
      <ProfileTabs />

      <input
        ref={replaceInput}
        type="file"
        accept="image/*,.heic,.heif"
        hidden
        onChange={handleReplaceFile}
      />

      {sorted.length === 0 && !hasHidden ? (
        <div className="flex h-48 items-center justify-center p-8 text-center text-sm text-neutral-500">
          Upload some media to preview your grid
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-3 py-2 text-xs text-neutral-500">
            <span>Tap a post for options · double-tap to pin</span>
            <div className="flex items-center gap-2">
              {hasHidden && (
                <button
                  type="button"
                  onClick={() => setShowHidden((s) => !s)}
                  className="flex items-center gap-1 rounded bg-neutral-800 px-2 py-1 text-neutral-200"
                >
                  {showHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                  {showHidden ? 'Hide hidden' : 'Show hidden'}
                </button>
              )}
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
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
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
                    onOpenMenu={setMenuId}
                  />
                ))}
              </div>
            </SortableContext>
            {/* The lifted tile follows the pointer and animates into its new
                slot on drop. */}
            <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}>
              {activeItem ? (
                <div
                  className="relative aspect-[4/5] overflow-hidden rounded-sm bg-neutral-900"
                  style={{
                    rotate: '-3deg',
                    boxShadow:
                      '0 12px 24px -8px rgba(0,0,0,0.6), 0 4px 8px -4px rgba(0,0,0,0.4)',
                  }}
                >
                  <TileContent item={activeItem} pinned={isPinned(activeItem.id)} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </>
      )}

      {menuItem && (
        <MediaActionSheet
          hidden={!!menuItem.hidden}
          onReplace={handleReplaceClick}
          onToggleHide={handleToggleHide}
          onRemove={handleRemove}
          onAdjust={handleAdjust}
          onClose={() => setMenuId(null)}
        />
      )}

      {adjustItem && (
        <AdjustPreviewModal
          item={adjustItem}
          onSave={(objectPosition) => {
            updateMedia(adjustItem.id, { objectPosition });
            setAdjustId(null);
          }}
          onClose={() => setAdjustId(null)}
        />
      )}
    </div>
  );
}
