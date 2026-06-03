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

export interface Highlight {
  id: string;
  title: string;
  cover: string; // data URL so it persists
}

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
];

const STORAGE_PREFIX = 'ig-sandbox:profile:';

function loadOverrides(username: string): Partial<Overridable> | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + username);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveOverrides(username: string, data: Partial<Overridable>) {
  try {
    localStorage.setItem(STORAGE_PREFIX + username, JSON.stringify(data));
  } catch (e) {
    console.warn('Profile persist failed (quota?):', e);
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
  syncProfileFromInstagram: (accessToken: string) => Promise<void>;
  resetProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

const PIN_CAP = 3;

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);
  // Guard the initial load: don't write defaults over a real saved profile.
  const hydratedRef = useRef(false);

  // Load any persisted overrides for the default username on first mount.
  useEffect(() => {
    const saved = loadOverrides(DEFAULT_PROFILE.username);
    if (saved) {
      setProfileState((prev) => ({ ...prev, ...saved }));
    }
    hydratedRef.current = true;
  }, []);

  // Persist on every change, keyed by current username.
  useEffect(() => {
    if (!hydratedRef.current) return;
    const overrides: Partial<Overridable> = {};
    for (const k of OVERRIDABLE_KEYS) {
      // @ts-expect-error narrow indexed access is fine here
      overrides[k] = profile[k];
    }
    saveOverrides(profile.username, overrides);
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

  const syncProfileFromInstagram = useCallback(async (accessToken: string) => {
    try {
      const ig = await fetchInstagramProfile(accessToken);
      const username = ig.username ?? DEFAULT_PROFILE.username;
      const saved = loadOverrides(username) ?? {};
      setProfileState({
        username,
        name: saved.name ?? ig.name ?? DEFAULT_PROFILE.name,
        biography:
          saved.biography ?? ig.biography ?? DEFAULT_PROFILE.biography,
        profilePictureUrl:
          saved.profilePictureUrl ??
          ig.profile_picture_url ??
          DEFAULT_PROFILE.profilePictureUrl,
        followersCount: ig.followers_count ?? 0,
        followsCount: ig.follows_count ?? 0,
        mediaCount: ig.media_count ?? 0,
        website: saved.website ?? ig.website,
        externalLinks: saved.externalLinks ?? [],
        highlights: saved.highlights ?? [],
        note: saved.note ?? '',
        pinnedIds: saved.pinnedIds ?? [],
      });
    } catch (e) {
      console.warn('Profile sync failed:', e);
    }
  }, []);

  const resetProfile = () => {
    // Wipe localStorage entry for current username and reset to defaults.
    try {
      localStorage.removeItem(STORAGE_PREFIX + profile.username);
    } catch {
      // ignore
    }
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
