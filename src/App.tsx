import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MediaProvider, useMedia } from './context/MediaContext';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import Uploader from './components/Uploader';
import GridPreview from './pages/GridPreview';
import StoryPreview from './pages/StoryPreview';
import SinglePostPreview from './pages/SinglePostPreview';
import {
  exchangeCodeForToken,
  refreshLongLivedToken,
} from './services/instagram';

const TOKEN_KEY = 'ig_access_token';
const EXPIRES_KEY = 'ig_token_expires_at';
const REFRESH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // refresh if <7d remaining

function storeToken(token: string, expiresInSeconds?: number) {
  localStorage.setItem(TOKEN_KEY, token);
  if (expiresInSeconds) {
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    localStorage.setItem(EXPIRES_KEY, String(expiresAt));
  }
}

function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_KEY);
}

function getStoredExpiry(): number | null {
  const raw = localStorage.getItem(EXPIRES_KEY);
  return raw ? Number(raw) : null;
}

function InstagramAuthBridge() {
  const { importInstagramFeed } = useMedia();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');

      if (error) {
        console.warn(
          'Instagram auth error:',
          error,
          params.get('error_description'),
        );
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }

      let token = localStorage.getItem(TOKEN_KEY);

      if (code) {
        try {
          const data = await exchangeCodeForToken(code);
          token = data.access_token;
          storeToken(token, data.expires_in);
        } catch (e) {
          console.error(e);
        } finally {
          window.history.replaceState({}, '', window.location.pathname);
        }
      } else if (token) {
        // Token already stored — refresh proactively if near expiry.
        const expiresAt = getStoredExpiry();
        const expired = expiresAt !== null && Date.now() >= expiresAt;
        const nearExpiry =
          expiresAt !== null && expiresAt - Date.now() < REFRESH_WINDOW_MS;

        if (expired) {
          clearStoredToken();
          token = null;
        } else if (nearExpiry) {
          try {
            const refreshed = await refreshLongLivedToken(token);
            token = refreshed.access_token;
            storeToken(token, refreshed.expires_in);
          } catch (e) {
            console.warn('Token refresh failed, will retry next load:', e);
          }
        }
      }

      if (token) {
        await importInstagramFeed(token);
      }
    };

    run();
  }, [importInstagramFeed]);

  return null;
}

export default function App() {
  return (
    <MediaProvider>
      <BrowserRouter>
        <InstagramAuthBridge />
        <div className="flex h-svh w-screen flex-col bg-white text-black dark:bg-black dark:text-white">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<GridPreview />} />
              <Route path="/story" element={<StoryPreview />} />
              <Route path="/post" element={<SinglePostPreview />} />
            </Routes>
          </main>
          <Uploader />
          <BottomNav />
        </div>
      </BrowserRouter>
    </MediaProvider>
  );
}
