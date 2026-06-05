// Shared image helpers used when bringing local files into the sandbox.

export function readAspectRatio(url: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const r =
        img.naturalWidth && img.naturalHeight
          ? img.naturalWidth / img.naturalHeight
          : 1;
      resolve(r);
    };
    img.onerror = () => resolve(1);
    img.src = url;
  });
}

export function looksLikeHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
}

export function isImageCandidate(file: File): boolean {
  return file.type.startsWith('image/') || looksLikeHeic(file);
}

// iPhone photos are often HEIC/HEIF, which most browsers can't render in an
// <img> (they show a broken-image icon). Decode those to JPEG so the rest of
// the app only ever deals with displayable blobs. The (heavy) decoder is
// lazy-loaded and only for files that look like HEIC, so it never bloats the
// main bundle nor runs for ordinary JPEG/PNG uploads.
export async function toDisplayableBlob(file: File): Promise<Blob> {
  if (!looksLikeHeic(file)) return file;
  try {
    const { heicTo, isHeic } = await import('heic-to');
    if (await isHeic(file)) {
      return await heicTo({ blob: file, type: 'image/jpeg', quality: 0.92 });
    }
  } catch (err) {
    console.error('HEIC conversion failed, using original file', err);
  }
  return file;
}

// Downscale + recompress for persistence. localStorage caps at ~5MB per
// origin, so post drafts (which may have several images each, x several
// drafts) need to be small enough to fit. ~1080px wide JPEG @ 0.82 lands at
// 120-250KB for typical photos.
export async function downscaleToDataUrl(
  blob: Blob,
  maxDim = 1080,
  quality = 0.82,
): Promise<string> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unsupported');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', quality);
}

// Fetch a remote image and embed it as a downscaled data URL so we can
// persist it past the original URL's expiry (IG CDN URLs die in ~24h).
// Returns null on any network/CORS failure so callers can fall back to the
// raw URL.
export async function fetchAsDownscaledDataUrl(
  url: string,
  maxDim = 320,
  quality = 0.85,
): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await downscaleToDataUrl(blob, maxDim, quality);
  } catch {
    return null;
  }
}
