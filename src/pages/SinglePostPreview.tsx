import { useEffect, useState } from 'react';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
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
  const activeIndex = active ? drafts.findIndex((d) => d.id === active.id) : -1;

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
      {/* Draft switcher */}
      <div className="flex items-center gap-2 border-b border-neutral-900 px-3 py-2">
        <button
          type="button"
          onClick={() =>
            setActiveId(drafts[(activeIndex - 1 + drafts.length) % drafts.length].id)
          }
          disabled={drafts.length < 2}
          className="rounded-md p-1 text-neutral-400 disabled:opacity-30"
          aria-label="Previous draft"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 text-center text-xs text-neutral-400">
          Draft {activeIndex + 1} of {drafts.length}
        </div>
        <button
          type="button"
          onClick={() =>
            setActiveId(drafts[(activeIndex + 1) % drafts.length].id)
          }
          disabled={drafts.length < 2}
          className="rounded-md p-1 text-neutral-400 disabled:opacity-30"
          aria-label="Next draft"
        >
          <ChevronRight size={18} />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-md p-1 text-neutral-400 hover:text-red-500"
          aria-label="Delete draft"
        >
          <Trash2 size={16} />
        </button>
        <button
          type="button"
          onClick={handleNew}
          className="flex items-center gap-1 rounded-md bg-blue-500 px-2 py-1 text-xs font-semibold text-white"
        >
          <Plus size={14} />
          New
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
  onImagesChange,
}: {
  draft: PostDraft;
  username: string;
  avatar: string;
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
        <div className="flex-1 text-sm font-semibold">{username}</div>
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
