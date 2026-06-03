import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Trash2, Loader, LogOut } from 'lucide-react';
import { useMedia } from '../../context/MediaContext';
import { useProfile } from '../../context/ProfileContext';
import { clearStoredToken } from '../../App';

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

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
    enable_fb_login: '0',
    force_authentication: '1',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'instagram_business_basic',
    response_type: 'code',
  });
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}

export default function Header() {
  const { pathname } = useLocation();
  const { media, clearMedia, isSyncing } = useMedia();
  const { resetProfile } = useProfile();
  const title = titles[pathname] ?? 'Sandbox';

  const [connected, setConnected] = useState<boolean>(
    () => !!localStorage.getItem('ig_access_token'),
  );

  // Re-check token presence whenever syncing flips (ie. after an import).
  useEffect(() => {
    setConnected(!!localStorage.getItem('ig_access_token'));
  }, [isSyncing]);

  const handleClear = () => {
    if (media.length === 0) return;
    if (confirm('Clear all media from the sandbox?')) clearMedia();
  };

  const handleImport = () => {
    const url = buildAuthUrl();
    if (!url) {
      alert(
        'Instagram OAuth is not configured. Set VITE_IG_CLIENT_ID and VITE_IG_REDIRECT_URI.',
      );
      return;
    }
    window.location.href = url;
  };

  const handleDisconnect = () => {
    if (!confirm('Disconnect Instagram and remove imported data?')) return;
    clearStoredToken();
    clearMedia();
    resetProfile();
    setConnected(false);
  };

  return (
    <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-neutral-800 bg-black px-4">
      <span className="text-base font-semibold text-white">ig-sandbox</span>
      <div className="flex items-center gap-3">
        <span className="text-sm text-neutral-500">{title}</span>
        {connected ? (
          <button
            type="button"
            onClick={handleDisconnect}
            aria-label="Disconnect Instagram"
            className="text-neutral-400 hover:text-pink-500"
          >
            <LogOut size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleImport}
            aria-label="Import Instagram feed"
            disabled={isSyncing}
            className="text-neutral-400 hover:text-pink-500 disabled:opacity-30"
          >
            {isSyncing ? (
              <Loader size={18} className="animate-spin" />
            ) : (
              <InstagramIcon size={18} />
            )}
          </button>
        )}
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
