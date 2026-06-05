import { useRef } from 'react';
import { useProfile, fileToDataUrl } from '../../context/ProfileContext';
import { useMedia } from '../../context/MediaContext';
import VerifiedBadge from './VerifiedBadge';

export default function ProfileHeader() {
  const { profile, setProfile, setNote } = useProfile();
  const { media } = useMedia();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setProfile({ profilePictureUrl: dataUrl });
    } finally {
      e.target.value = '';
    }
  };

  const formatCount = (n: number) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1)}M`
      : n >= 10_000
        ? `${(n / 1000).toFixed(0)}K`
        : n.toLocaleString();

  const postsCount = profile.mediaCount || media.length;

  return (
    <section className="px-4 pt-3">
      {/* Top row: avatar + stats */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative h-20 w-20 overflow-hidden rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 p-[2px]"
            aria-label="Change profile picture"
          >
            <div className="h-full w-full overflow-hidden rounded-full bg-black">
              {profile.profilePictureUrl ? (
                <img
                  src={profile.profilePictureUrl}
                  alt={profile.username}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                  no pfp
                </div>
              )}
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleAvatarChange}
          />
          {/* Note bubble */}
          <input
            value={profile.note}
            onChange={(e) => setNote(e.target.value.slice(0, 60))}
            placeholder="Note…"
            className="absolute -top-3 left-1/2 w-24 -translate-x-1/2 rounded-2xl border border-neutral-700 bg-neutral-900 px-2 py-1 text-center text-[10px] text-white outline-none placeholder:text-neutral-500"
          />
        </div>

        <div className="flex flex-1 items-center justify-around text-center text-sm">
          <Stat label="posts" value={formatCount(postsCount)} />
          <Stat label="followers" value={formatCount(profile.followersCount)} />
          <Stat label="following" value={formatCount(profile.followsCount)} />
        </div>
      </div>

      {/* Editable name + bio + website */}
      <div className="mt-3 space-y-0.5 text-sm leading-snug">
        <div className="flex items-center gap-1.5">
          <input
            value={profile.name}
            onChange={(e) => setProfile({ name: e.target.value })}
            placeholder="Name"
            className="block flex-1 bg-transparent font-semibold text-white outline-none placeholder:text-neutral-600"
          />
          <button
            type="button"
            onClick={() => setProfile({ verified: !profile.verified })}
            title={
              profile.verified
                ? 'Verified badge on — tap to remove'
                : 'Verified badge off — tap to add'
            }
            className={`grid h-5 w-5 place-items-center ${
              profile.verified ? '' : 'opacity-30 grayscale'
            }`}
            aria-label="Toggle verified badge"
          >
            <VerifiedBadge size={16} />
          </button>
        </div>
        <textarea
          value={profile.biography}
          onChange={(e) => setProfile({ biography: e.target.value })}
          placeholder="Bio"
          rows={Math.min(6, Math.max(2, profile.biography.split('\n').length))}
          className="block w-full resize-none bg-transparent text-sm text-neutral-200 outline-none placeholder:text-neutral-600"
        />
        <div className="flex items-center gap-1 text-blue-400">
          <span>🔗</span>
          <input
            value={profile.website ?? ''}
            onChange={(e) => setProfile({ website: e.target.value })}
            placeholder="Add a link"
            className="block w-full bg-transparent text-sm text-blue-400 outline-none placeholder:text-neutral-600"
          />
        </div>
      </div>

      {/* Public action buttons */}
      <div className="mt-3 flex gap-1.5">
        <button
          type="button"
          className="flex-1 rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-semibold text-white active:bg-blue-600"
        >
          Follow
        </button>
        <button
          type="button"
          className="flex-1 rounded-lg bg-neutral-800 px-3 py-1.5 text-sm font-semibold text-white active:bg-neutral-700"
        >
          Message
        </button>
        <button
          type="button"
          aria-label="Suggested"
          className="rounded-lg bg-neutral-800 px-3 py-1.5 text-sm font-semibold text-white active:bg-neutral-700"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </button>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-semibold">{value}</div>
      <div className="text-xs text-neutral-400">{label}</div>
    </div>
  );
}
