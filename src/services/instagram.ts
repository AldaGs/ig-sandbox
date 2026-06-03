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

export interface TokenExchangeResponse {
  access_token: string;
  user_id?: string | number;
  token_type?: string;
  expires_in?: number;
}

export async function refreshLongLivedToken(
  accessToken: string,
): Promise<{ access_token: string; expires_in: number }> {
  const url =
    `${IG_GRAPH}/refresh_access_token` +
    `?grant_type=ig_refresh_token` +
    `&access_token=${encodeURIComponent(accessToken)}`;
  const res = await fetch(url);
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

export async function fetchInstagramMedia(
  accessToken: string,
): Promise<MediaItem[]> {
  const url = `${IG_GRAPH}/me/media?fields=${FIELDS}&access_token=${encodeURIComponent(
    accessToken,
  )}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Instagram fetch failed (${res.status}): ${text}`);
  }
  const json: IgMediaResponse = await res.json();

  return json.data
    .map((node) => mapNode(node))
    .filter((m): m is MediaItem => m !== null);
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
