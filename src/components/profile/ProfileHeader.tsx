import { useRef } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { useMedia } from '../../context/MediaContext';

export default function ProfileHeader() {
  const { profile, setProfile, setNote } = useProfile();
  const { media } = useMedia();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setProfile({ profilePictureUrl: url });
    e.target.value = '';
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

      {/* Name + bio + links */}
      <div className="mt-3 text-sm leading-snug">
        <div className="font-semibold">{profile.name}</div>
        <pre className="whitespace-pre-wrap font-sans text-sm text-neutral-200">
          {profile.biography}
        </pre>
        {profile.website && (
          <a
            href={profile.website}
            target="_blank"
            rel="noreferrer"
            className="text-blue-400"
          >
            🔗 {profile.website.replace(/^https?:\/\//, '')}
          </a>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        <Btn>Edit profile</Btn>
        <Btn>View archive</Btn>
      </div>
      <div className="mt-1.5">
        <Btn full>Ad tools</Btn>
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

function Btn({ children, full }: { children: React.ReactNode; full?: boolean }) {
  return (
    <button
      type="button"
      className={`${full ? 'w-full' : ''} rounded-lg bg-neutral-800 px-3 py-1.5 text-sm font-semibold text-white active:bg-neutral-700`}
    >
      {children}
    </button>
  );
}
