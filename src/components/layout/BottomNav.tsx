import { NavLink } from 'react-router-dom';
import { Grid, Circle, Square } from 'lucide-react';

const items = [
  { to: '/', label: 'Grid', Icon: Grid },
  { to: '/story', label: 'Story', Icon: Circle },
  { to: '/post', label: 'Post', Icon: Square },
];

export default function BottomNav() {
  return (
    <nav
      className="sticky bottom-0 z-10 flex h-14 items-center justify-around border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-black"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {items.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center justify-center gap-0.5 text-xs ${
              isActive
                ? 'text-black dark:text-white'
                : 'text-neutral-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                size={24}
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
