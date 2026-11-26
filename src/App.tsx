import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MediaProvider, useMedia } from './context/MediaContext';
import { ProfileProvider, useProfile } from './context/ProfileContext';
import { DialogProvider, useDialog } from './components/ui/Dialog';
import { UndoProvider } from './context/UndoContext';
import ErrorBoundary from './components/ErrorBoundary';
import UndoToast from './components/UndoToast';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import Uploader from './components/Uploader';
import GridPreview from './pages/GridPreview';
import StoryPreview from './pages/StoryPreview';
import SinglePostPreview from './pages/SinglePostPreview';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import {
  exchangeCodeForToken,
  refreshLongLivedToken,
  IgAuthError,
} from './services/instagram';

const TOKEN_KEY = 'ig_access_token';
const EXPIRES_KEY = 'ig_token_expires_at';
const REFRESH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function storeToken(token: string, expiresInSeconds?: number) {
  localStorage.setItem(TOKEN_KEY, token);
  if (expiresInSeconds) {
    localStorage.setItem(
      EXPIRES_KEY,
      String(Date.now() + expiresInSeconds * 1000),
    );
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

function describeAuthError(raw: string): string {
  const t = raw.toLowerCase();
  if (t.includes('redirect_uri'))
    return 'The login redirect address does not match the app settings. Make sure you opened the app from its main web address.';
  if (t.includes('insufficient developer role') || t.includes('tester') || t.includes('not authorized'))
    return 'This Instagram account is not allowed to use the app yet. The app owner needs to add you as a tester (and you need to accept the invite in Instagram → Settings → Apps and websites).';
  if (t.includes('authorization code') && (t.includes('used') || t.includes('expired')))
    return 'The login link expired or was already used. Please try connecting again.';
  if (t.includes('access_denied') || t.includes('user_denied') || t.includes('denied'))
    return 'Instagram access was not granted. Please try again and tap "Allow".';
  if (t.includes('missing ig oauth config'))
    return 'The server is not configured for Instagram login. Please contact the app owner.';
  return 'Something went wrong while connecting to Instagram. Make sure your account is a Business or Creator account, then try again in Safari (not inside the Instagram app).';
}

function InstagramAuthBridge() {
  const { importInstagramFeed } = useMedia();
  const { syncProfileFromInstagram } = useProfile();
  const dialog = useDialog();
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
        const desc = params.get('error_description') ?? '';
        await dialog.alert({
          title: 'Could not connect Instagram',
          message: `${describeAuthError(`${error} ${desc}`)}${desc ? `\n\nDetails: ${desc}` : ''}`,
        });
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
          const raw = e instanceof Error ? e.message : String(e);
          await dialog.alert({
            title: 'Could not connect Instagram',
            message: `${describeAuthError(raw)}\n\nDetails: ${raw.slice(0, 300)}`,
          });
        } finally {
          window.history.replaceState({}, '', window.location.pathname);
        }
      } else if (token) {
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
            console.warn('Token refresh failed:', e);
          }
        }
      }

      if (token) {
        try {
          await Promise.all([
            syncProfileFromInstagram(token),
            importInstagramFeed(token),
          ]);
        } catch (e) {
          // Token rejected by IG (revoked, password changed, etc.) — clear
          // it and surface a one-shot prompt so the user can reconnect.
          if (e instanceof IgAuthError) {
            clearStoredToken();
            const reconnect = await dialog.confirm({
              title: 'Instagram session expired',
              message:
                'Your Instagram connection is no longer valid. Reconnect to refresh your data?',
              confirmLabel: 'Reconnect',
            });
            if (reconnect) {
              const params = new URLSearchParams({
                enable_fb_login: '0',
                force_authentication: '1',
                client_id: import.meta.env.VITE_IG_CLIENT_ID ?? '',
                redirect_uri: import.meta.env.VITE_IG_REDIRECT_URI ?? '',
                scope: 'instagram_business_basic',
                response_type: 'code',
              });
              window.location.href = `https://www.instagram.com/oauth/authorize?${params.toString()}`;
            }
          } else {
            console.warn('IG sync error:', e);
            await dialog.alert({
              title: 'Could not load your Instagram data',
              message: `Connected, but loading your profile or posts failed. Please try again later.\n\nDetails: ${(e instanceof Error ? e.message : String(e)).slice(0, 300)}`,
            });
          }
        }
      }
    };

    run();
  }, [importInstagramFeed, syncProfileFromInstagram, dialog]);

  return null;
}

export { clearStoredToken };

export default function App() {
  return (
    <ErrorBoundary>
      <ProfileProvider>
        <MediaProvider>
          <UndoProvider>
          <DialogProvider>
          <BrowserRouter>
            <InstagramAuthBridge />
            <div className="flex h-svh w-screen flex-col bg-black text-white">
              <Header />
              <main className="flex-1 overflow-y-auto">
                <Routes>
                  <Route path="/" element={<GridPreview />} />
                  <Route path="/story" element={<StoryPreview />} />
                  <Route path="/post" element={<SinglePostPreview />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                </Routes>
              </main>
              <Uploader />
              <UndoToast />
              <BottomNav />
            </div>
          </BrowserRouter>
          </DialogProvider>
          </UndoProvider>
        </MediaProvider>
      </ProfileProvider>
    </ErrorBoundary>
  );
}
