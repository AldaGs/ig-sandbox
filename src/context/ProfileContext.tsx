import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { fetchInstagramProfile } from '../services/instagram';

export interface Highlight {
  id: string;
  title: string;
  cover: string; // image URL
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
  externalLinks: string[]; // additional bio links
  highlights: Highlight[];
  note: string;
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
};

interface ProfileContextValue {
  profile: Profile;
  setProfile: (p: Partial<Profile>) => void;
  setNote: (note: string) => void;
  addHighlight: (h: Omit<Highlight, 'id'>) => void;
  removeHighlight: (id: string) => void;
  syncProfileFromInstagram: (accessToken: string) => Promise<void>;
  resetProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);

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

  const syncProfileFromInstagram = useCallback(async (accessToken: string) => {
    try {
      const ig = await fetchInstagramProfile(accessToken);
      setProfileState((prev) => ({
        ...prev,
        username: ig.username ?? prev.username,
        name: ig.name ?? prev.name,
        biography: ig.biography ?? prev.biography,
        profilePictureUrl: ig.profile_picture_url ?? prev.profilePictureUrl,
        followersCount: ig.followers_count ?? prev.followersCount,
        followsCount: ig.follows_count ?? prev.followsCount,
        mediaCount: ig.media_count ?? prev.mediaCount,
        website: ig.website ?? prev.website,
      }));
    } catch (e) {
      console.warn('Profile sync failed:', e);
    }
  }, []);

  const resetProfile = () => setProfileState(DEFAULT_PROFILE);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        setProfile,
        setNote,
        addHighlight,
        removeHighlight,
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
