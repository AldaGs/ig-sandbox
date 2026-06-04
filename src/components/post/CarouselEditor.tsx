import { useRef, useState } from 'react';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  isImageCandidate,
  downscaleToDataUrl,
  toDisplayableBlob,
} from '../../services/image';

interface Props {
  images: string[];
  aspect: number;
  onChange: (images: string[]) => void;
}

export default function CarouselEditor({ images, aspect, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter(isImageCandidate);
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    try {
      const added: string[] = [];
      for (const f of files) {
        const blob = await toDisplayableBlob(f);
        const dataUrl = await downscaleToDataUrl(blob);
        added.push(dataUrl);
      }
      const next = [...images, ...added];
      onChange(next);
      setIndex(Math.max(0, next.length - 1));
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = (i: number) => {
    const next = images.filter((_, idx) => idx !== i);
    onChange(next);
    setIndex((cur) => Math.max(0, Math.min(cur, next.length - 1)));
  };

  const handleDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = Number(e.active.id);
    const to = Number(e.over.id);
    onChange(arrayMove(images, from, to));
    if (index === from) setIndex(to);
  };

  const cur = images[index];
  const showPrev = images.length > 1 && index > 0;
  const showNext = images.length > 1 && index < images.length - 1;

  return (
    <div>
      {/* Main preview */}
      <div
        className="relative w-full overflow-hidden bg-neutral-900"
        style={{ aspectRatio: aspect }}
      >
        {cur ? (
          <img src={cur} alt="" className="h-full w-full object-cover" />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-neutral-500"
          >
            {busy ? (
              <span>Processing…</span>
            ) : (
              <>
                <Plus size={32} />
                <span>Add photos</span>
              </>
            )}
          </button>
        )}
        {images.length > 1 && (
          <>
            <div className="pointer-events-none absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs">
              {index + 1}/{images.length}
            </div>
            {showPrev && (
              <button
                type="button"
                onClick={() => setIndex((i) => i - 1)}
                className="absolute left-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white"
                aria-label="Previous"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            {showNext && (
              <button
                type="button"
                onClick={() => setIndex((i) => i + 1)}
                className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white"
                aria-label="Next"
              >
                <ChevronRight size={16} />
              </button>
            )}
            <div className="pointer-events-none absolute bottom-2 left-0 right-0 flex justify-center gap-1">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${
                    i === index ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumb strip with reorder + remove */}
      {images.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto bg-neutral-950 p-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.map((_, i) => i)}
              strategy={horizontalListSortingStrategy}
            >
              {images.map((src, i) => (
                <Thumb
                  key={i}
                  id={i}
                  src={src}
                  active={i === index}
                  onSelect={() => setIndex(i)}
                  onRemove={() => handleRemove(i)}
                />
              ))}
            </SortableContext>
          </DndContext>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-dashed border-neutral-700 text-neutral-400 disabled:opacity-40"
            aria-label="Add image"
          >
            <Plus size={20} />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        hidden
        onChange={handleAdd}
      />
    </div>
  );
}

function Thumb({
  id,
  src,
  active,
  onSelect,
  onRemove,
}: {
  id: number;
  src: string;
  active: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    touchAction: 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 ${
        active ? 'border-white' : 'border-transparent'
      }`}
    >
      <img src={src} alt="" className="h-full w-full object-cover" />
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute right-0 top-0 grid h-5 w-5 place-items-center rounded-bl-md bg-black/70 text-white"
        aria-label="Remove image"
      >
        <X size={12} />
      </button>
    </div>
  );
}
