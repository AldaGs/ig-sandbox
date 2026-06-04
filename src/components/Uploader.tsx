import { useRef } from 'react';
import { Plus } from 'lucide-react';
import { useMedia, type MediaItem } from '../context/MediaContext';
import {
  isImageCandidate,
  readAspectRatio,
  toDisplayableBlob,
} from '../services/image';

// Aspect ratio of an empty grid cell, used for placeholders until the real
// image has been decoded.
const PLACEHOLDER_RATIO = 4 / 5;

export default function Uploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { addMedia, updateMedia } = useMedia();

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const images = selected.filter(isImageCandidate);
    e.target.value = '';
    if (images.length === 0) return;

    // Reverse so the first selected file ends up on top after the prepend.
    const ordered = images.slice().reverse();

    // Drop placeholders in immediately so the user sees the slots fill up
    // (with a loading shimmer) while HEIC decoding / aspect-ratio reads run.
    const placeholders: Omit<MediaItem, 'id'>[] = ordered.map(() => ({
      type: 'image',
      url: '',
      aspect_ratio: PLACEHOLDER_RATIO,
      source: 'local',
      processing: true,
    }));
    const ids = addMedia(placeholders);

    await Promise.all(
      ordered.map(async (file, idx) => {
        const blob = await toDisplayableBlob(file);
        const url = URL.createObjectURL(blob);
        const aspect_ratio = await readAspectRatio(url);
        updateMedia(ids[idx], { url, aspect_ratio, processing: false });
      }),
    );
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        hidden
        onChange={handleFiles}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label="Upload images"
        className="fixed bottom-20 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg active:scale-95 transition-transform"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>
    </>
  );
}
