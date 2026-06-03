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

export default function Uploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { addMedia } = useMedia();

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const images = selected.filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) {
      e.target.value = '';
      return;
    }

    const items: Omit<MediaItem, 'id'>[] = await Promise.all(
      images.map(async (file) => {
        const url = URL.createObjectURL(file);
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
        accept="image/*"
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
