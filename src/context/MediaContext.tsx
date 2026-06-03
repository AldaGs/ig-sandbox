import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { fetchInstagramMedia } from '../services/instagram';

export type MediaSource = 'local' | 'instagram';
export type MediaType = 'image' | 'video';

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
  aspect_ratio: number;
  source: MediaSource;
  permalink?: string;
  pinned?: boolean;
}

interface MediaContextValue {
  media: MediaItem[];
  isSyncing: boolean;
  syncError: string | null;
  addMedia: (items: Omit<MediaItem, 'id'> | Omit<MediaItem, 'id'>[]) => void;
  removeMedia: (id: string) => void;
  reorderMedia: (items: MediaItem[]) => void;
  clearMedia: () => void;
  togglePin: (id: string) => void;
  importInstagramFeed: (accessToken: string) => Promise<void>;
}

const MediaContext = createContext<MediaContextValue | undefined>(undefined);

function revoke(url: string) {
  if (url.startsWith('blob:')) URL.revokeObjectURL(url);
}

export function MediaProvider({ children }: { children: ReactNode }) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const addMedia: MediaContextValue['addMedia'] = (input) => {
    const arr = Array.isArray(input) ? input : [input];
    const withIds: MediaItem[] = arr.map((i) => ({
      ...i,
      id: crypto.randomUUID(),
    }));
    setMedia((prev) => [...withIds, ...prev]);
  };

  const removeMedia: MediaContextValue['removeMedia'] = (id) => {
    setMedia((prev) => {
      const target = prev.find((m) => m.id === id);
      if (target) revoke(target.url);
      return prev.filter((m) => m.id !== id);
    });
  };

  const reorderMedia: MediaContextValue['reorderMedia'] = (items) => {
    setMedia(items);
  };

  const togglePin = (id: string) => {
    setMedia((prev) => {
      const pinnedCount = prev.filter((m) => m.pinned).length;
      return prev.map((m) => {
        if (m.id !== id) return m;
        // IG cap is 3 pinned posts; enforce it.
        if (!m.pinned && pinnedCount >= 3) return m;
        return { ...m, pinned: !m.pinned };
      });
    });
  };

  const clearMedia = () => {
    setMedia((prev) => {
      prev.forEach((m) => revoke(m.url));
      return [];
    });
  };

  const importInstagramFeed = useCallback(async (accessToken: string) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const liveItems = await fetchInstagramMedia(accessToken);
      setMedia((prev) => {
        // Drop any previously-imported IG items; keep local uploads.
        const local = prev.filter((m) => m.source === 'local');
        // Append IG items to the end of the local-only list.
        return [...local, ...liveItems];
      });
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : 'Failed to import feed');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return (
    <MediaContext.Provider
      value={{
        media,
        isSyncing,
        syncError,
        addMedia,
        removeMedia,
        reorderMedia,
        clearMedia,
        togglePin,
        importInstagramFeed,
      }}
    >
      {children}
    </MediaContext.Provider>
  );
}

export function useMedia() {
  const ctx = useContext(MediaContext);
  if (!ctx) throw new Error('useMedia must be used within MediaProvider');
  return ctx;
}
