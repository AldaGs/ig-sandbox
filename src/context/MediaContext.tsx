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
  // Hidden items stay in the sandbox but are kept out of the grid/previews
  // until the user reveals them.
  hidden?: boolean;
  // CSS object-position (e.g. "50% 30%") for the grid crop, set via "Adjust
  // preview".
  objectPosition?: string;
  // True while a freshly-added file is still being decoded/converted, so the
  // UI can show a placeholder in its place.
  processing?: boolean;
}

interface MediaContextValue {
  media: MediaItem[];
  isSyncing: boolean;
  syncError: string | null;
  addMedia: (items: Omit<MediaItem, 'id'> | Omit<MediaItem, 'id'>[]) => string[];
  updateMedia: (id: string, patch: Partial<Omit<MediaItem, 'id'>>) => void;
  removeMedia: (id: string) => void;
  reorderMedia: (items: MediaItem[]) => void;
  clearMedia: () => void;
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
    return withIds.map((i) => i.id);
  };

  const updateMedia: MediaContextValue['updateMedia'] = (id, patch) => {
    setMedia((prev) => {
      const target = prev.find((m) => m.id === id);
      // If the url is being swapped out (e.g. "Replace"), free the old blob.
      if (target && patch.url && patch.url !== target.url) revoke(target.url);
      return prev.map((m) => (m.id === id ? { ...m, ...patch } : m));
    });
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
        updateMedia,
        removeMedia,
        reorderMedia,
        clearMedia,
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
