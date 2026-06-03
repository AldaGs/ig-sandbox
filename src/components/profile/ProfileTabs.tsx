import { useState } from 'react';
import { Grid, Bookmark, User } from 'lucide-react';

type Tab = 'grid' | 'reels' | 'saved' | 'tagged';

const tabs: { id: Tab; Icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'grid', Icon: Grid },
  // Stand-ins for icons missing from this lucide-react version.
  { id: 'reels', Icon: PlayCircle },
  { id: 'saved', Icon: Bookmark },
  { id: 'tagged', Icon: User },
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

export default function ProfileTabs({
  onChange,
}: {
  onChange?: (tab: Tab) => void;
}) {
  const [active, setActive] = useState<Tab>('grid');
  return (
    <nav className="mt-4 flex border-t border-neutral-800">
      {tabs.map(({ id, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => {
            setActive(id);
            onChange?.(id);
          }}
          className={`flex flex-1 items-center justify-center py-2.5 ${
            active === id
              ? 'border-t border-white text-white'
              : 'text-neutral-500'
          }`}
        >
          <Icon size={22} />
        </button>
      ))}
    </nav>
  );
}
