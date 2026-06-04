import { useRef } from 'react';
import { Plus } from 'lucide-react';
import { useMedia, type MediaItem } from '../context/MediaContext';

function readAspectRatio(url: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const r = img.naturalWidth && img.naturalHeight
        ? img.naturalWidth / img.naturalHeight
        : 1;
      resolve(r);
    };
    img.onerror = () => resolve(1);
    img.src = url;
  });
}

// iPhone photos are often HEIC/HEIF, which most browsers can't render in an
// <img> (they show a broken-image icon). Decode those to JPEG up front so the
// rest of the app only ever deals with displayable blobs.
function isImageCandidate(file: File): boolean {
  return file.type.startsWith('image/') || looksLikeHeic(file);
}

function looksLikeHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
}

async function toDisplayableBlob(file: File): Promise<Blob> {
  // Only pull in the (heavy) HEIC decoder for files that look like HEIC, and
  // only at upload time — it's lazy-loaded so it never bloats the main bundle.
  if (!looksLikeHeic(file)) return file;
  try {
    const { heicTo, isHeic } = await import('heic-to');
    if (await isHeic(file)) {
      return await heicTo({ blob: file, type: 'image/jpeg', quality: 0.92 });
    }
  } catch (err) {
    console.error('HEIC conversion failed, using original file', err);
  }
  return file;
}

export default function Uploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { addMedia } = useMedia();

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const images = selected.filter(isImageCandidate);
    if (images.length === 0) {
      e.target.value = '';
      return;
    }

    const items: Omit<MediaItem, 'id'>[] = await Promise.all(
      images.map(async (file) => {
        const blob = await toDisplayableBlob(file);
        const url = URL.createObjectURL(blob);
        const aspect_ratio = await readAspectRatio(url);
        return { url, aspect_ratio, type: 'image' as const, source: 'local' as const };
      }),
    );

    // Reverse so the first selected file lands on top of the grid.
    addMedia(items.reverse());

    e.target.value = '';
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
