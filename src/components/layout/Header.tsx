import { useLocation } from 'react-router-dom';
import { Trash2, Instagram, Loader2 } from 'lucide-react';
import { useMedia } from '../../context/MediaContext';

const titles: Record<string, string> = {
  '/': 'Grid',
  '/story': 'Story',
  '/post': 'Post',
};

function buildAuthUrl(): string | null {
  const clientId = import.meta.env.VITE_IG_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_IG_REDIRECT_URI;
  if (!clientId || !redirectUri) return null;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'user_profile,user_media',
    response_type: 'code',
  });
  return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
}

export default function Header() {
  const { pathname } = useLocation();
  const { media, clearMedia, isSyncing } = useMedia();
  const title = titles[pathname] ?? 'Sandbox';

  const handleClear = () => {
    if (media.length === 0) return;
    if (confirm('Clear all media from the sandbox?')) clearMedia();
  };

  const handleImport = () => {
    const url = buildAuthUrl();
    if (!url) {
      alert('Instagram OAuth is not configured. Set VITE_IG_CLIENT_ID and VITE_IG_REDIRECT_URI.');
      return;
    }
    window.location.href = url;
  };

  return (
    <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-black">
      <span className="text-base font-semibold text-black dark:text-white">
        ig-sandbox
      </span>
      <div className="flex items-center gap-3">
        <span className="text-sm text-neutral-500">{title}</span>
        <button
          type="button"
          onClick={handleImport}
          aria-label="Import Instagram feed"
          disabled={isSyncing}
          className="text-neutral-400 hover:text-pink-500 disabled:opacity-30"
        >
          {isSyncing ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Instagram size={18} />
          )}
        </button>
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear grid"
          disabled={media.length === 0}
          className="text-neutral-400 hover:text-red-500 disabled:opacity-30"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </header>
  );
}
