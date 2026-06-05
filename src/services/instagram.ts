import type { MediaItem } from '../context/MediaContext';

interface IgMediaNode {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
}

interface IgMediaResponse {
  data: IgMediaNode[];
  paging?: { next?: string };
}

const IG_GRAPH = 'https://graph.instagram.com';
const FIELDS = 'id,media_type,media_url,permalink,thumbnail_url';

// Thrown when IG rejects a request because the access token is no longer
// valid (expired, revoked, user changed password, app removed). Callers can
// catch this type and trigger a reconnect flow.
export class IgAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IgAuthError';
  }
}

// IG returns errors in a few shapes; this normalizes detection.
async function detectAuthError(res: Response): Promise<string | null> {
  if (res.status === 401 || res.status === 403) {
    return `IG returned ${res.status}`;
  }
  // 400 with body shape { error: { type: "OAuthException", code: 190 } } means
  // token problem too.
  if (res.status === 400) {
    try {
      const cloned = res.clone();
      const body = await cloned.json();
      const err = body?.error;
      if (
        err?.type === 'OAuthException' ||
        err?.code === 190 ||
        err?.code === 102
      ) {
        return err.message ?? 'IG OAuth error';
      }
    } catch {
      // Body wasn't JSON — fall through.
    }
  }
  return null;
}

async function igFetch(url: string): Promise<Response> {
  const res = await fetch(url);
  if (!res.ok) {
    const authMsg = await detectAuthError(res);
    if (authMsg) throw new IgAuthError(authMsg);
  }
  return res;
}

export interface TokenExchangeResponse {
  access_token: string;
  user_id?: string | number;
  token_type?: string;
  expires_in?: number;
}

export interface IgProfile {
  id: string;
  username?: string;
  name?: string;
  biography?: string;
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
  website?: string;
}

export async function fetchInstagramProfile(
  accessToken: string,
): Promise<IgProfile> {
  const fields =
    'id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count,website';
  const url = `${IG_GRAPH}/me?fields=${fields}&access_token=${encodeURIComponent(
    accessToken,
  )}`;
  const res = await igFetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`IG profile fetch failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function refreshLongLivedToken(
  accessToken: string,
): Promise<{ access_token: string; expires_in: number }> {
  const url =
    `${IG_GRAPH}/refresh_access_token` +
    `?grant_type=ig_refresh_token` +
    `&access_token=${encodeURIComponent(accessToken)}`;
  const res = await igFetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`IG token refresh failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function exchangeCodeForToken(
  code: string,
): Promise<TokenExchangeResponse> {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }
  return res.json();
}

// Safety cap so a runaway pagination loop can never hammer the IG API
// indefinitely. A typical IG profile has well under a few thousand posts; if
// somebody really has more, they probably want a different tool anyway.
const MAX_PAGES = 40; // 40 pages x ~25 items = ~1000 posts
const PAGE_LIMIT = 50; // ask IG for the largest page size it'll serve

export async function fetchInstagramMedia(
  accessToken: string,
): Promise<MediaItem[]> {
  const items: MediaItem[] = [];
  let next: string | null = `${IG_GRAPH}/me/media?fields=${FIELDS}&limit=${PAGE_LIMIT}&access_token=${encodeURIComponent(
    accessToken,
  )}`;

  for (let page = 0; page < MAX_PAGES && next; page++) {
    const res: Response = await igFetch(next);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Instagram fetch failed (${res.status}): ${text}`);
    }
    const json: IgMediaResponse = await res.json();
    for (const node of json.data) {
      const mapped = mapNode(node);
      if (mapped) items.push(mapped);
    }
    next = json.paging?.next ?? null;
  }

  return items;
}

function mapNode(node: IgMediaNode): MediaItem | null {
  const isVideo = node.media_type === 'VIDEO';
  const url = isVideo
    ? node.thumbnail_url ?? node.media_url
    : node.media_url ?? node.thumbnail_url;
  if (!url) return null;

  return {
    id: `ig:${node.id}`,
    type: isVideo ? 'video' : 'image',
    url,
    aspect_ratio: 1, // Grid profile view is always 1:1.
    source: 'instagram',
    permalink: node.permalink,
  };
}
