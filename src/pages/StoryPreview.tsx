import { useState } from 'react';
import { useMedia } from '../context/MediaContext';
import { useProfile } from '../context/ProfileContext';

export default function StoryPreview() {
  const { media } = useMedia();
  const { profile } = useProfile();
  const [index, setIndex] = useState(0);

  if (media.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-neutral-500">
        Upload media to preview as a story
      </div>
    );
  }

  const current = media[Math.min(index, media.length - 1)];
  const next = () => setIndex((i) => (i + 1) % media.length);
  const prev = () => setIndex((i) => (i - 1 + media.length) % media.length);

  return (
    <div className="relative mx-auto aspect-[9/16] h-full max-h-full w-full max-w-md overflow-hidden bg-black">
      {/* Background image (blurred) for letterboxing */}
      <img
        src={current.url}
        alt=""
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
      />
      <img
        src={current.url}
        alt=""
        className="relative h-full w-full object-contain"
      />

      {/* Progress bars */}
      <div className="absolute left-2 right-2 top-2 flex gap-0.5">
        {media.map((_, i) => (
          <div
            key={i}
            className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30"
          >
            <div
              className={`h-full bg-white ${
                i < index ? 'w-full' : i === index ? 'w-1/3' : 'w-0'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Top user row */}
      <div className="absolute left-3 right-3 top-5 flex items-center gap-2 text-sm text-white">
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
        <span className="font-semibold drop-shadow">{profile.username}</span>
        <span className="text-xs text-white/70 drop-shadow">2h</span>
      </div>

      {/* Tap zones */}
      <button
        type="button"
        onClick={prev}
        className="absolute bottom-0 left-0 top-12 w-1/3"
        aria-label="Previous"
      />
      <button
        type="button"
        onClick={next}
        className="absolute bottom-0 right-0 top-12 w-1/3"
        aria-label="Next"
      />

      {/* Reply bar */}
      <div className="absolute inset-x-3 bottom-3 flex items-center gap-2">
        <div className="flex-1 rounded-full border border-white/40 px-4 py-2 text-sm text-white/70">
          Send message
        </div>
        <span className="text-xl text-white">♡</span>
        <span className="text-xl text-white">➤</span>
      </div>
    </div>
  );
}
