import { Play, Pin, EyeOff, Loader } from 'lucide-react';
import type { MediaItem } from '../../context/MediaContext';

// The inner visuals of a grid tile, shared by the in-grid sortable item and the
// floating DragOverlay so a dragged tile looks identical while lifted.
export default function TileContent({
  item,
  pinned,
}: {
  item: MediaItem;
  pinned: boolean;
}) {
  return (
    <>
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
    </>
  );
}
