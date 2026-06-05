import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { fetchInstagramProfile } from '../services/instagram';
import { fetchAsDownscaledDataUrl } from '../services/image';
import {
  idbGetProfile,
  idbSetProfile,
  idbDeleteProfile,
} from '../services/idb';

export interface Highlight {
  id: string;
  title: string;
  cover: string; // data URL so it persists
}

export type PostAspect = '1:1' | '4:5' | '1.91:1';

export interface PostDraft {
  id: string;
  images: string[]; // data URLs, downscaled
  aspect: PostAspect;
  caption: string;
  createdAt: number;
}

export interface StoryTextOverlay {
  id: string;
  kind: 'text';
  text: string;
  // 0..1 normalized so overlays rescale with the story frame.
  x: number;
  y: number;
  color: string;
  size: number; // px at a 360-wide frame
}

export interface StoryStickerOverlay {
  id: string;
  kind: 'sticker';
  emoji: string;
  x: number;
  y: number;
  size: number;
}

export type StoryOverlay = StoryTextOverlay | StoryStickerOverlay;

export interface Profile {
  username: string;
  name: string;
  biography: string;
  profilePictureUrl: string;
  followersCount: number;
  followsCount: number;
  mediaCount: number;
  website?: string;
  externalLinks: string[];
  highlights: Highlight[];
  note: string;
  pinnedIds: string[]; // ids of media items pinned for this profile
  postDrafts: PostDraft[];
  storyOverlays: Record<string, StoryOverlay[]>; // keyed by media id
  // The IG API doesn't expose is_verified for owner accounts, so we treat
  // this as a user-controlled toggle for preview purposes.
  verified: boolean;
}

const DEFAULT_PROFILE: Profile = {
  username: 'your_handle',
  name: 'Your Name',
  biography: 'Tagline\nMore tagline\n',
  profilePictureUrl: '',
  followersCount: 0,
  followsCount: 0,
  mediaCount: 0,
  externalLinks: [],
  highlights: [],
  note: '',
  pinnedIds: [],
  postDrafts: [],
  storyOverlays: {},
  verified: false,
};

// Fields the user can override (and that should persist per IG username).
type Overridable = Pick<
  Profile,
  | 'name'
  | 'biography'
  | 'profilePictureUrl'
  | 'website'
  | 'externalLinks'
  | 'highlights'
  | 'note'
  | 'pinnedIds'
  | 'postDrafts'
  | 'storyOverlays'
  | 'verified'
>;
const OVERRIDABLE_KEYS: (keyof Overridable)[] = [
  'name',
  'biography',
  'profilePictureUrl',
  'website',
  'externalLinks',
  'highlights',
  'note',
  'pinnedIds',
  'postDrafts',
  'storyOverlays',
  'verified',
];

const STORAGE_PREFIX = 'ig-sandbox:profile:';

async function loadOverrides(
  username: string,
): Promise<Partial<Overridable> | null> {
  return idbGetProfile<Partial<Overridable>>(username);
}

async function saveOverrides(
  username: string,
  data: Partial<Overridable>,
): Promise<void> {
  await idbSetProfile(username, data);
}

// One-time migration: copy any pre-IDB profiles out of localStorage into the
// new store, then remove the localStorage entries. Safe to run on every load
// — once the localStorage entry is gone the loop has no work to do.
async function migrateLocalStorageProfiles(): Promise<void> {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(STORAGE_PREFIX)) keys.push(k);
  }
  for (const key of keys) {
    const username = key.slice(STORAGE_PREFIX.length);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const data = JSON.parse(raw) as Partial<Overridable>;
      // Only write if there isn't already an IDB record (don't clobber).
      const existing = await idbGetProfile(username);
      if (!existing) await idbSetProfile(username, data);
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Migration of ${key} failed; leaving in localStorage:`, e);
    }
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

interface ProfileContextValue {
  profile: Profile;
  setProfile: (p: Partial<Profile>) => void;
  setNote: (note: string) => void;
  addHighlight: (h: Omit<Highlight, 'id'>) => void;
  removeHighlight: (id: string) => void;
  togglePinnedId: (id: string) => void;
  pinFirstN: (ids: string[], n?: number) => void;
  isPinned: (id: string) => boolean;
  // Post drafts
  createPostDraft: () => string;
  updatePostDraft: (id: string, patch: Partial<Omit<PostDraft, 'id'>>) => void;
  deletePostDraft: (id: string) => void;
  // Story overlays
  setStoryOverlays: (mediaId: string, overlays: StoryOverlay[]) => void;
  syncProfileFromInstagram: (accessToken: string) => Promise<void>;
  resetProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

const PIN_CAP = 3;

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);
  // Guard the initial load: don't write defaults over a real saved profile.
  const hydratedRef = useRef(false);

  // Migrate any pre-IDB localStorage data, then load overrides for the
  // default username. We don't gate render on this — the UI shows defaults
  // until the load resolves, which is sub-50ms in practice.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await migrateLocalStorageProfiles();
      const saved = await loadOverrides(DEFAULT_PROFILE.username);
      if (cancelled) return;
      if (saved) {
        setProfileState((prev) => ({ ...prev, ...saved }));
      }
      hydratedRef.current = true;
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist on every change, keyed by current username. Fire-and-forget;
  // IDB writes are async but ordered by the browser per object store.
  useEffect(() => {
    if (!hydratedRef.current) return;
    const overrides: Partial<Overridable> = {};
    for (const k of OVERRIDABLE_KEYS) {
      // @ts-expect-error narrow indexed access is fine here
      overrides[k] = profile[k];
    }
    void saveOverrides(profile.username, overrides);
  }, [profile]);

  const setProfile = useCallback((patch: Partial<Profile>) => {
    setProfileState((prev) => ({ ...prev, ...patch }));
  }, []);

  const setNote = useCallback((note: string) => {
    setProfileState((prev) => ({ ...prev, note }));
  }, []);

  const addHighlight: ProfileContextValue['addHighlight'] = (h) => {
    setProfileState((prev) => ({
      ...prev,
      highlights: [...prev.highlights, { ...h, id: crypto.randomUUID() }],
    }));
  };

  const removeHighlight = (id: string) => {
    setProfileState((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((h) => h.id !== id),
    }));
  };

  const togglePinnedId = (id: string) => {
    setProfileState((prev) => {
      const has = prev.pinnedIds.includes(id);
      if (has) {
        return { ...prev, pinnedIds: prev.pinnedIds.filter((x) => x !== id) };
      }
      if (prev.pinnedIds.length >= PIN_CAP) return prev;
      return { ...prev, pinnedIds: [...prev.pinnedIds, id] };
    });
  };

  const pinFirstN = (ids: string[], n: number = PIN_CAP) => {
    setProfileState((prev) => ({
      ...prev,
      pinnedIds: ids.slice(0, n),
    }));
  };

  const isPinned = useCallback(
    (id: string) => profile.pinnedIds.includes(id),
    [profile.pinnedIds],
  );

  const createPostDraft = (): string => {
    const id = crypto.randomUUID();
    setProfileState((prev) => ({
      ...prev,
      postDrafts: [
        { id, images: [], aspect: '1:1', caption: '', createdAt: Date.now() },
        ...prev.postDrafts,
      ],
    }));
    return id;
  };

  const updatePostDraft: ProfileContextValue['updatePostDraft'] = (id, patch) => {
    setProfileState((prev) => ({
      ...prev,
      postDrafts: prev.postDrafts.map((d) =>
        d.id === id ? { ...d, ...patch } : d,
      ),
    }));
  };

  const deletePostDraft = (id: string) => {
    setProfileState((prev) => ({
      ...prev,
      postDrafts: prev.postDrafts.filter((d) => d.id !== id),
    }));
  };

  const setStoryOverlays = (mediaId: string, overlays: StoryOverlay[]) => {
    setProfileState((prev) => ({
      ...prev,
      storyOverlays: { ...prev.storyOverlays, [mediaId]: overlays },
    }));
  };

  const syncProfileFromInstagram = useCallback(async (accessToken: string) => {
    try {
      const ig = await fetchInstagramProfile(accessToken);
      const username = ig.username ?? DEFAULT_PROFILE.username;
      const saved = (await loadOverrides(username)) ?? {};

      // Avatar resolution:
      // 1. If the saved avatar is a data URL, the user either uploaded it or
      //    we cached it on a previous sync — keep it.
      // 2. Otherwise (saved is missing or is a stale CDN URL), try to cache
      //    the fresh IG URL as a downscaled data URL so it survives the
      //    ~24h CDN expiry.
      // 3. If caching fails (CORS, network), fall back to the raw URL — the
      //    user will see it for now and we'll retry next sync.
      let avatar = saved.profilePictureUrl ?? '';
      const isUserOverride = avatar.startsWith('data:');
      if (!isUserOverride && ig.profile_picture_url) {
        const cached = await fetchAsDownscaledDataUrl(ig.profile_picture_url);
        avatar = cached ?? ig.profile_picture_url;
      }
      if (!avatar) avatar = DEFAULT_PROFILE.profilePictureUrl;

      setProfileState({
        username,
        name: saved.name ?? ig.name ?? DEFAULT_PROFILE.name,
        biography:
          saved.biography ?? ig.biography ?? DEFAULT_PROFILE.biography,
        profilePictureUrl: avatar,
        followersCount: ig.followers_count ?? 0,
        followsCount: ig.follows_count ?? 0,
        mediaCount: ig.media_count ?? 0,
        website: saved.website ?? ig.website,
        externalLinks: saved.externalLinks ?? [],
        highlights: saved.highlights ?? [],
        note: saved.note ?? '',
        pinnedIds: saved.pinnedIds ?? [],
        postDrafts: saved.postDrafts ?? [],
        storyOverlays: saved.storyOverlays ?? {},
        verified: saved.verified ?? false,
      });
    } catch (e) {
      console.warn('Profile sync failed:', e);
    }
  }, []);

  const resetProfile = () => {
    // Wipe the IDB entry for the current username and reset to defaults.
    // Fire-and-forget delete; the state reset doesn't need to wait.
    void idbDeleteProfile(profile.username);
    hydratedRef.current = false;
    setProfileState(DEFAULT_PROFILE);
    setTimeout(() => {
      hydratedRef.current = true;
    }, 0);
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        setProfile,
        setNote,
        addHighlight,
        removeHighlight,
        togglePinnedId,
        pinFirstN,
        isPinned,
        createPostDraft,
        updatePostDraft,
        deletePostDraft,
        setStoryOverlays,
        syncProfileFromInstagram,
        resetProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
