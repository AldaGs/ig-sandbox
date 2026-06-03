import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = (req.body ?? {}) as { code?: string };
  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  const clientId = process.env.VITE_IG_CLIENT_ID;
  const clientSecret = process.env.IG_CLIENT_SECRET;
  const redirectUri = process.env.VITE_IG_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return res.status(500).json({ error: 'Server is missing IG OAuth config' });
  }

  try {
    // 1) Exchange auth code for short-lived token (~1h).
    const shortBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    });
    const shortRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: shortBody,
    });
    const shortData = await shortRes.json();
    if (!shortRes.ok) {
      return res
        .status(shortRes.status)
        .json({ error: 'IG token exchange failed', detail: shortData });
    }

    // 2) Upgrade short-lived → long-lived token (~60 days).
    const longUrl =
      'https://graph.instagram.com/access_token' +
      `?grant_type=ig_exchange_token` +
      `&client_secret=${encodeURIComponent(clientSecret)}` +
      `&access_token=${encodeURIComponent(shortData.access_token)}`;
    const longRes = await fetch(longUrl);
    const longData = await longRes.json();
    if (!longRes.ok) {
      return res
        .status(longRes.status)
        .json({ error: 'IG long-lived exchange failed', detail: longData });
    }

    // longData: { access_token, token_type: 'bearer', expires_in: <seconds> }
    return res.status(200).json({
      access_token: longData.access_token,
      expires_in: longData.expires_in,
      user_id: shortData.user_id,
    });
  } catch (e) {
    return res.status(500).json({
      error: 'Unexpected error during token exchange',
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}
