import { useEffect, useState } from 'react';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Plus,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { useProfile, type PostDraft } from '../context/ProfileContext';
import { useDialog } from '../components/ui/Dialog';
import AspectRatioToggle, {
  aspectToNumber,
} from '../components/post/AspectRatioToggle';
import CarouselEditor from '../components/post/CarouselEditor';
import CaptionEditor, {
  HighlightedCaption,
} from '../components/post/CaptionEditor';
import VerifiedBadge from '../components/profile/VerifiedBadge';

export default function SinglePostPreview() {
  const { profile, createPostDraft, updatePostDraft, deletePostDraft } =
    useProfile();
  const dialog = useDialog();
  const drafts = profile.postDrafts;
  const [activeId, setActiveId] = useState<string | null>(
    () => drafts[0]?.id ?? null,
  );

  // Keep activeId valid as drafts come and go.
  useEffect(() => {
    if (drafts.length === 0) {
      setActiveId(null);
      return;
    }
    if (!activeId || !drafts.some((d) => d.id === activeId)) {
      setActiveId(drafts[0].id);
    }
  }, [drafts, activeId]);

  const active = drafts.find((d) => d.id === activeId) ?? null;

  const handleNew = () => {
    const id = createPostDraft();
    setActiveId(id);
  };

  const handleDelete = async () => {
    if (!active) return;
    const ok = await dialog.confirm({
      title: 'Delete draft',
      message: 'This draft will be removed from your sandbox.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (ok) deletePostDraft(active.id);
  };

  if (!active) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-neutral-500">No post drafts yet</p>
        <button
          type="button"
          onClick={handleNew}
          className="flex items-center gap-1 rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus size={16} />
          New post
        </button>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-md bg-black pb-8 text-white">
      {/* Draft strip */}
      <div className="flex items-center gap-2 border-b border-neutral-900 px-2 py-2">
        <div className="flex flex-1 items-center gap-1.5 overflow-x-auto">
          {drafts.map((d) => {
            const cover = d.images[0];
            const isActive = d.id === active.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setActiveId(d.id)}
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 ${
                  isActive ? 'border-white' : 'border-transparent'
                }`}
                aria-label={`Draft ${d.id}`}
              >
                {cover ? (
                  <img
                    src={cover}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-800 text-neutral-500">
                    <ImageIcon size={18} />
                  </div>
                )}
                {d.images.length > 1 && (
                  <span className="absolute right-1 top-1 rounded bg-black/70 px-1 text-[10px] leading-tight text-white">
                    {d.images.length}
                  </span>
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleNew}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-dashed border-neutral-700 text-neutral-400"
            aria-label="New draft"
          >
            <Plus size={20} />
          </button>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-md p-1.5 text-neutral-400 hover:text-red-500"
          aria-label="Delete draft"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Aspect ratio */}
      <div className="flex items-center justify-between px-3 py-2 text-xs text-neutral-400">
        <span>Aspect ratio</span>
        <AspectRatioToggle
          value={active.aspect}
          onChange={(v) => updatePostDraft(active.id, { aspect: v })}
        />
      </div>

      {/* IG card preview (also the editor) */}
      <FeedCard
        draft={active}
        username={profile.username}
        avatar={profile.profilePictureUrl}
        verified={profile.verified}
        onImagesChange={(images) => updatePostDraft(active.id, { images })}
      />

      {/* Caption editor */}
      <div className="px-3 pt-3">
        <CaptionEditor
          value={active.caption}
          onChange={(caption) => updatePostDraft(active.id, { caption })}
        />
      </div>
    </article>
  );
}

function FeedCard({
  draft,
  username,
  avatar,
  verified,
  onImagesChange,
}: {
  draft: PostDraft;
  username: string;
  avatar: string;
  verified: boolean;
  onImagesChange: (images: string[]) => void;
}) {
  return (
    <div>
      {/* Header */}
      <header className="flex items-center gap-3 px-3 py-2">
        <div className="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 p-[1.5px]">
          <div className="h-full w-full overflow-hidden rounded-full bg-black">
            {avatar && (
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            )}
          </div>
        </div>
        <div className="flex flex-1 items-center gap-1 text-sm font-semibold">
          {username}
          {verified && <VerifiedBadge size={13} />}
        </div>
        <span className="text-lg">⋯</span>
      </header>

      <CarouselEditor
        images={draft.images}
        aspect={aspectToNumber(draft.aspect)}
        onChange={onImagesChange}
      />

      {/* Action row */}
      <div className="flex items-center gap-4 px-3 pt-2 text-white">
        <Heart size={24} />
        <MessageCircle size={24} />
        <Send size={24} />
        <Bookmark size={24} className="ml-auto" />
      </div>

      {/* Likes + caption preview */}
      <div className="px-3 py-1 text-sm">
        <div className="font-semibold">1,234 likes</div>
        <div className="whitespace-pre-wrap">
          <span className="font-semibold">{username}</span>{' '}
          <HighlightedCaption text={draft.caption || 'Caption goes here…'} />
        </div>
        <div className="mt-1 text-xs text-neutral-500">View all 56 comments</div>
        <div className="mt-1 text-[11px] uppercase text-neutral-500">just now</div>
      </div>
    </div>
  );
}
