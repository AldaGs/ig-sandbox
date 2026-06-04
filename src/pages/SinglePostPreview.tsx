import { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react';
import { useMedia } from '../context/MediaContext';
import { useProfile } from '../context/ProfileContext';

export default function SinglePostPreview() {
  const { media: allMedia } = useMedia();
  const { profile } = useProfile();
  const [index, setIndex] = useState(0);

  const media = allMedia.filter((m) => !m.hidden && !m.processing);

  if (media.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-neutral-500">
        Upload media to preview a feed post
      </div>
    );
  }

  const current = media[Math.min(index, media.length - 1)];
  const aspect = current.aspect_ratio || 1;
  // IG feed clamps to between 4:5 (0.8) and 1.91:1 (1.91).
  const clamped = Math.min(Math.max(aspect, 0.8), 1.91);

  return (
    <article className="mx-auto max-w-md bg-black text-white">
      {/* Header */}
      <header className="flex items-center gap-3 px-3 py-2">
        <div className="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 p-[1.5px]">
          <div className="h-full w-full overflow-hidden rounded-full bg-black">
            {profile.profilePictureUrl && (
              <img
                src={profile.profilePictureUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>
        </div>
        <div className="flex-1 text-sm font-semibold">{profile.username}</div>
        <span className="text-lg">⋯</span>
      </header>

      {/* Image */}
      <div
        className="w-full bg-neutral-900"
        style={{ aspectRatio: clamped }}
      >
        <img
          src={current.url}
          alt=""
          style={{ objectPosition: current.objectPosition }}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Action row */}
      <div className="flex items-center gap-4 px-3 pt-2 text-white">
        <Heart size={24} />
        <MessageCircle size={24} />
        <Send size={24} />
        <Bookmark size={24} className="ml-auto" />
      </div>

      {/* Likes + caption */}
      <div className="px-3 py-1 text-sm">
        <div className="font-semibold">1,234 likes</div>
        <div>
          <span className="font-semibold">{profile.username}</span>{' '}
          <span className="text-neutral-200">
            {profile.biography.split('\n')[0] || 'Caption goes here…'}
          </span>
        </div>
        <div className="mt-1 text-xs text-neutral-500">View all 56 comments</div>
        <div className="mt-1 text-[11px] uppercase text-neutral-500">
          2 hours ago
        </div>
      </div>

      {/* Switcher */}
      {media.length > 1 && (
        <div className="flex items-center justify-between px-3 py-3 text-xs text-neutral-400">
          <button
            type="button"
            onClick={() =>
              setIndex((i) => (i - 1 + media.length) % media.length)
            }
            className="rounded bg-neutral-800 px-3 py-1.5"
          >
            ‹ Prev
          </button>
          <span>
            {index + 1} / {media.length}
          </span>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % media.length)}
            className="rounded bg-neutral-800 px-3 py-1.5"
          >
            Next ›
          </button>
        </div>
      )}
    </article>
  );
}
