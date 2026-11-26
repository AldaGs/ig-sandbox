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

    // Instagram Login may return either { access_token, user_id } or
    // { data: [{ access_token, user_id, permissions }] } depending on version.
    const short = Array.isArray(shortData?.data) ? shortData.data[0] : shortData;
    const shortToken: string | undefined = short?.access_token;
    const userId = short?.user_id;
    if (!shortToken) {
      return res
        .status(502)
        .json({ error: 'IG token exchange returned no token', detail: shortData });
    }

    // 2) Upgrade short-lived → long-lived token (~60 days).
    const longUrl =
      'https://graph.instagram.com/access_token' +
      `?grant_type=ig_exchange_token` +
      `&client_secret=${encodeURIComponent(clientSecret)}` +
      `&access_token=${encodeURIComponent(shortToken)}`;
    const longRes = await fetch(longUrl);
    const longData = await longRes.json();
    if (!longRes.ok || !longData?.access_token) {
      // Don't block login: fall back to the short-lived token (~1h). The
      // client will prompt a reconnect when it expires.
      console.error('IG long-lived exchange failed', longData);
      return res.status(200).json({
        access_token: shortToken,
        expires_in: 3600,
        user_id: userId,
        long_lived: false,
      });
    }

    // longData: { access_token, token_type: 'bearer', expires_in: <seconds> }
    return res.status(200).json({
      access_token: longData.access_token,
      expires_in: longData.expires_in,
      user_id: userId,
      long_lived: true,
    });
  } catch (e) {
    return res.status(500).json({
      error: 'Unexpected error during token exchange',
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}
