import { useState } from 'react';
import { Type, Smile, Check, Pencil } from 'lucide-react';
import { useMedia } from '../context/MediaContext';
import {
  useProfile,
  type StoryOverlay,
  type StoryTextOverlay,
  type StoryStickerOverlay,
} from '../context/ProfileContext';
import OverlayLayer from '../components/story/OverlayLayer';
import VerifiedBadge from '../components/profile/VerifiedBadge';

const STICKERS = ['❤️', '😍', '🔥', '👀', '✨', '⭐', '🎉', '👏', '😂', '💯'];
const TEXT_COLORS = ['#ffffff', '#000000', '#ff3b30', '#ffcc00', '#34c759', '#5ac8fa', '#af52de'];

export default function StoryPreview() {
  const { media: allMedia } = useMedia();
  const { profile, setStoryOverlays } = useProfile();
  const [index, setIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [showStickerTray, setShowStickerTray] = useState(false);
  const [textColor, setTextColor] = useState('#ffffff');

  const media = allMedia.filter((m) => !m.hidden && !m.processing);

  if (media.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-neutral-500">
        Upload media to preview as a story
      </div>
    );
  }

  const current = media[Math.min(index, media.length - 1)];
  const overlays: StoryOverlay[] = profile.storyOverlays[current.id] ?? [];

  const handleOverlaysChange = (next: StoryOverlay[]) => {
    setStoryOverlays(current.id, next);
  };

  const addText = () => {
    const ov: StoryTextOverlay = {
      id: crypto.randomUUID(),
      kind: 'text',
      text: 'Type something',
      x: 0.5,
      y: 0.5,
      color: textColor,
      size: 24,
    };
    handleOverlaysChange([...overlays, ov]);
    setEditing(true);
  };

  const addSticker = (emoji: string) => {
    const ov: StoryStickerOverlay = {
      id: crypto.randomUUID(),
      kind: 'sticker',
      emoji,
      x: 0.5,
      y: 0.5,
      size: 64,
    };
    handleOverlaysChange([...overlays, ov]);
    setShowStickerTray(false);
    setEditing(true);
  };

  const next = () => {
    setEditing(false);
    setIndex((i) => (i + 1) % media.length);
  };
  const prev = () => {
    setEditing(false);
    setIndex((i) => (i - 1 + media.length) % media.length);
  };

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
        style={{ objectPosition: current.objectPosition }}
        className="relative h-full w-full object-contain"
      />

      {/* Overlays (text + stickers) */}
      <OverlayLayer
        overlays={overlays}
        onChange={handleOverlaysChange}
        editing={editing}
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
        <span className="flex items-center gap-1 font-semibold drop-shadow">
          {profile.username}
          {profile.verified && <VerifiedBadge size={12} />}
        </span>
        <span className="text-xs text-white/70 drop-shadow">2h</span>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-white/15 backdrop-blur"
          aria-label={editing ? 'Done editing' : 'Edit overlays'}
        >
          {editing ? <Check size={16} /> : <Pencil size={14} />}
        </button>
      </div>

      {/* Tap zones — only when not editing */}
      {!editing && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute bottom-16 left-0 top-14 w-1/3"
            aria-label="Previous"
          />
          <button
            type="button"
            onClick={next}
            className="absolute bottom-16 right-0 top-14 w-1/3"
            aria-label="Next"
          />
        </>
      )}

      {/* Editor toolbar */}
      {editing && (
        <div className="absolute right-3 top-16 flex flex-col gap-2">
          <button
            type="button"
            onClick={addText}
            className="grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur"
            aria-label="Add text"
          >
            <Type size={18} />
          </button>
          <button
            type="button"
            onClick={() => setShowStickerTray((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur"
            aria-label="Add sticker"
          >
            <Smile size={18} />
          </button>
          {/* Quick color palette for new text overlays */}
          <div className="flex flex-col gap-1 rounded-full bg-black/40 p-1 backdrop-blur">
            {TEXT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setTextColor(c)}
                style={{ background: c }}
                className={`h-5 w-5 rounded-full border ${
                  textColor === c ? 'border-white' : 'border-white/30'
                }`}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sticker tray */}
      {editing && showStickerTray && (
        <div className="absolute inset-x-3 bottom-20 flex flex-wrap justify-center gap-2 rounded-2xl bg-black/70 p-3 backdrop-blur">
          {STICKERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addSticker(s)}
              className="text-3xl"
            >
              {s}
            </button>
          ))}
        </div>
      )}

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
