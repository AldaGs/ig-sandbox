// Render the in-app grid to a downloadable PNG. Pure canvas; no extra deps.

import type { MediaItem } from '../context/MediaContext';

const TILE_W = 360; // ~IG profile tile width at 3 cols on a 1080px canvas
const TILE_H = Math.round((TILE_W * 5) / 4); // 4:5 aspect
const GUTTER = 2; // px gap between tiles (mimics the 1px gap at display res)
const HEADER_H = 96; // px space reserved when including a header

interface ExportOptions {
  items: MediaItem[];
  cols?: number;
  header?: { username: string; postsLabel: string };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // IG CDN serves CORS; data: URLs always work. Setting this lets us draw
    // remote images without tainting the canvas.
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src.slice(0, 60)}…`));
    img.src = src;
  });
}

// Parse the "x% y%" CSS object-position into normalized [0..1, 0..1]. Falls
// back to centered if unset/unparseable.
function parseObjectPosition(value?: string): { x: number; y: number } {
  if (!value) return { x: 0.5, y: 0.5 };
  const [xRaw, yRaw] = value.trim().split(/\s+/);
  const toNum = (raw?: string) => {
    if (!raw) return 0.5;
    const m = raw.match(/^(-?[\d.]+)%/);
    if (!m) return 0.5;
    return Math.max(0, Math.min(1, parseFloat(m[1]) / 100));
  };
  return { x: toNum(xRaw), y: toNum(yRaw) };
}

// Mirrors CSS `object-fit: cover` + `object-position`. Computes the source
// rectangle to draw into the full tile.
function coverRect(
  imgW: number,
  imgH: number,
  destW: number,
  destH: number,
  pos: { x: number; y: number },
) {
  const scale = Math.max(destW / imgW, destH / imgH);
  const srcW = destW / scale;
  const srcH = destH / scale;
  const sx = (imgW - srcW) * pos.x;
  const sy = (imgH - srcH) * pos.y;
  return { sx, sy, sw: srcW, sh: srcH };
}

export async function renderGridToPng({
  items,
  cols = 3,
  header,
}: ExportOptions): Promise<Blob> {
  if (items.length === 0) throw new Error('No items to export');

  const rows = Math.ceil(items.length / cols);
  const canvasW = TILE_W * cols + GUTTER * (cols - 1);
  const headerH = header ? HEADER_H : 0;
  const canvasH = headerH + TILE_H * rows + GUTTER * (rows - 1);

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unsupported');

  // Background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Header
  if (header) {
    ctx.fillStyle = '#ffffff';
    ctx.font =
      '600 26px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(`@${header.username}`, 24, headerH / 2 - 10);
    ctx.font =
      '400 18px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(header.postsLabel, 24, headerH / 2 + 18);
  }

  // Tiles
  await Promise.all(
    items.map(async (item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * (TILE_W + GUTTER);
      const y = headerH + row * (TILE_H + GUTTER);

      try {
        const img = await loadImage(item.url);
        const pos = parseObjectPosition(item.objectPosition);
        const { sx, sy, sw, sh } = coverRect(
          img.naturalWidth,
          img.naturalHeight,
          TILE_W,
          TILE_H,
          pos,
        );
        ctx.drawImage(img, sx, sy, sw, sh, x, y, TILE_W, TILE_H);
      } catch {
        // Render a placeholder for items that fail to load (CORS, 404).
        ctx.fillStyle = '#1f1f1f';
        ctx.fillRect(x, y, TILE_W, TILE_H);
        ctx.fillStyle = '#666';
        ctx.font = '14px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('image unavailable', x + TILE_W / 2, y + TILE_H / 2);
        ctx.textAlign = 'left';
      }
    }),
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))),
      'image/png',
    );
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
