import { Grid, Bookmark, User, Lock } from 'lucide-react';

type Tab = 'grid' | 'reels' | 'saved' | 'tagged';

const tabs: {
  id: Tab;
  Icon: React.ComponentType<{ size?: number }>;
  locked: boolean;
}[] = [
  { id: 'grid', Icon: Grid, locked: false },
  // Stand-in for an icon missing from this lucide-react version.
  { id: 'reels', Icon: PlayCircle, locked: true },
  { id: 'saved', Icon: Bookmark, locked: true },
  { id: 'tagged', Icon: User, locked: true },
];

function PlayCircle({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
    </svg>
  );
}

export default function ProfileTabs() {
  // Only the grid tab is active — the rest are previewed for visual
  // accuracy but locked behind a small padlock badge.
  return (
    <nav className="mt-4 flex border-t border-neutral-800">
      {tabs.map(({ id, Icon, locked }) => (
        <button
          key={id}
          type="button"
          disabled={locked}
          aria-disabled={locked}
          title={locked ? 'Not available in the sandbox' : undefined}
          className={`relative flex flex-1 items-center justify-center py-2.5 ${
            locked
              ? 'cursor-not-allowed text-neutral-700'
              : 'border-t border-white text-white'
          }`}
        >
          <Icon size={22} />
          {locked && (
            <Lock
              size={9}
              className="absolute right-1/2 top-1.5 translate-x-3 rounded-full bg-black p-[1px] text-neutral-500"
            />
          )}
        </button>
      ))}
    </nav>
  );
}
