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
