import { useRef } from 'react';
import { Plus } from 'lucide-react';
import { useProfile, fileToDataUrl } from '../../context/ProfileContext';

export default function Highlights() {
  const { profile, addHighlight, removeHighlight } = useProfile();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const cover = await fileToDataUrl(file);
      const title =
        prompt('Highlight title')?.slice(0, 16) ||
        `H${profile.highlights.length + 1}`;
      addHighlight({ cover, title });
    } finally {
      e.target.value = '';
    }
  };

  return (
    <section className="mt-4 overflow-x-auto px-4">
      <div className="flex gap-4">
        <div className="flex w-16 shrink-0 flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-16 w-16 items-center justify-center rounded-full border border-neutral-700 text-neutral-300"
            aria-label="Add highlight"
          >
            <Plus size={28} />
          </button>
          <span className="text-[11px] text-neutral-300">New</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleAdd}
          />
        </div>
        {profile.highlights.map((h) => (
          <div key={h.id} className="flex w-16 shrink-0 flex-col items-center gap-1">
            <button
              type="button"
              onDoubleClick={() => removeHighlight(h.id)}
              className="h-16 w-16 overflow-hidden rounded-full border border-neutral-600"
              title="Double-click to remove"
            >
              <img src={h.cover} alt={h.title} className="h-full w-full object-cover" />
            </button>
            <span className="w-full truncate text-center text-[11px] text-neutral-300">
              {h.title}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
