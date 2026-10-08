import Phaser from 'phaser';

/**
 * Procedural art: every sprite in the shop is painted once at boot with Canvas 2D and handed to
 * Phaser as a texture. To replace one with hand-drawn art, load a PNG under the same key in
 * BootScene.preload — `paint` skips keys that already exist.
 */
export function paint(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): string {
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, Math.ceil(w), Math.ceil(h));
  if (!tex) throw new Error(`Could not create texture ${key}`);
  draw(tex.getContext(), w, h);
  tex.refresh();
  return key;
}

/** Seeded PRNG so "random" details (books, windows, wear) are stable between reloads. */
export function seeded(seed: number | string) {
  let s = typeof seed === 'number' ? seed : [...seed].reduce((a, c) => Math.imul(a ^ c.charCodeAt(0), 16777619), 2166136261);
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

export function vgrad(ctx: CanvasRenderingContext2D, y0: number, y1: number, stops: [number, string][]) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

export function hgrad(ctx: CanvasRenderingContext2D, x0: number, x1: number, stops: [number, string][]) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

/** A raised wooden panel with bevel highlights. */
export function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, base: string, inset = 6) {
  rect(ctx, x, y, w, h, base);
  ctx.fillStyle = 'rgba(255,220,170,0.10)';
  ctx.fillRect(x, y, w, 2);
  ctx.fillRect(x, y, 2, h);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(x, y + h - 2, w, 2);
  ctx.fillRect(x + w - 2, y, 2, h);
  if (inset > 0 && w > inset * 3 && h > inset * 3) {
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + inset + 0.5, y + inset + 0.5, w - inset * 2 - 1, h - inset * 2 - 1);
    ctx.strokeStyle = 'rgba(255,220,170,0.08)';
    ctx.strokeRect(x + inset + 2, y + inset + 2, w - inset * 2 - 4, h - inset * 2 - 4);
  }
}

/** Subtle wood grain over an area. */
export function grain(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: () => number, alpha = 0.08, vertical = false) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
  ctx.lineWidth = 1;
  const n = Math.floor((vertical ? w : h) / 3);
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    if (vertical) {
      const gx = x + r() * w;
      ctx.moveTo(gx, y);
      ctx.bezierCurveTo(gx + (r() - 0.5) * 6, y + h / 3, gx + (r() - 0.5) * 6, y + (2 * h) / 3, gx + (r() - 0.5) * 4, y + h);
    } else {
      const gy = y + r() * h;
      ctx.moveTo(x, gy);
      ctx.bezierCurveTo(x + w / 3, gy + (r() - 0.5) * 5, x + (2 * w) / 3, gy + (r() - 0.5) * 5, x + w, gy + (r() - 0.5) * 3);
    }
    ctx.stroke();
  }
  ctx.restore();
}

export function text(
  ctx: CanvasRenderingContext2D, s: string, x: number, y: number,
  font: string, fill: string, align: CanvasTextAlign = 'center', baseline: CanvasTextBaseline = 'middle',
) {
  ctx.font = font;
  ctx.fillStyle = fill;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(s, x, y);
}

/** Shrink a font until the string fits `maxW`. Returns the font string used. */
export function fitText(ctx: CanvasRenderingContext2D, s: string, family: string, size: number, maxW: number, weight = '') {
  let px = size;
  ctx.font = `${weight} ${px}px ${family}`;
  while (px > 7 && ctx.measureText(s).width > maxW) {
    px -= 1;
    ctx.font = `${weight} ${px}px ${family}`;
  }
  return ctx.font;
}

export function wrapLines(ctx: CanvasRenderingContext2D, s: string, maxW: number): string[] {
  const words = s.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}
