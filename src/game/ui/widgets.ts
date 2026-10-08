import Phaser from 'phaser';
import { C, F, hex } from '../theme';
import { hgrad, paint, seeded } from '../art/canvas';

/**
 * In-world UI pieces: engraved brass plaques (buttons), paper cards, typeset text.
 * They are game objects in the scene, so they can be tweened, depth-sorted and lit like
 * everything else — there is no DOM UI.
 */

type FontKey = keyof typeof F;

export interface TextOpts {
  font?: FontKey;
  size?: number;
  color?: string;
  italic?: boolean;
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: number;
  lineSpacing?: number;
  origin?: [number, number];
}

export function txt(scene: Phaser.Scene, x: number, y: number, s: string, o: TextOpts = {}) {
  const t = scene.add.text(x, y, s, {
    fontFamily: F[o.font ?? 'print'],
    fontSize: `${o.size ?? 18}px`,
    fontStyle: [o.italic ? 'italic' : '', o.bold ? 'bold' : ''].join(' ').trim() || 'normal',
    color: o.color ?? C.ink,
    align: o.align ?? 'left',
    wordWrap: o.width ? { width: o.width, useAdvancedWrap: true } : undefined,
    lineSpacing: o.lineSpacing ?? 2,
    resolution: Math.min(2, window.devicePixelRatio || 1) * 1.5,
  });
  const [ox, oy] = o.origin ?? [o.align === 'center' ? 0.5 : o.align === 'right' ? 1 : 0, 0];
  t.setOrigin(ox, oy);
  return t;
}

/** Paper texture of a given size (cached per size + tone). */
export function paperKey(scene: Phaser.Scene, w: number, h: number, tone: 'cream' | 'card' | 'aged' = 'cream') {
  return paint(scene, `paper-${tone}-${w}x${h}`, w, h, (ctx) => {
    const r = seeded(w * 7 + h);
    ctx.fillStyle = tone === 'card' ? '#f1ebdc' : tone === 'aged' ? '#e2d3ae' : '#ebe1c6';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < (w * h) / 900; i++) {
      ctx.fillStyle = `rgba(110,80,30,${0.015 + r() * 0.04})`;
      ctx.beginPath(); ctx.arc(r() * w, r() * h, 1 + r() * 5, 0, Math.PI * 2); ctx.fill();
    }
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(110,75,25,0.22)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    if (tone === 'card') {
      // index-card rules
      ctx.strokeStyle = 'rgba(140,47,36,0.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 46); ctx.lineTo(w, 46); ctx.stroke();
      ctx.strokeStyle = 'rgba(34,64,110,0.18)'; ctx.lineWidth = 1;
      for (let y = 72; y < h; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    }
  });
}

/** A sheet of paper with a soft drop shadow. Returns a container (origin = centre). */
export function paper(scene: Phaser.Scene, x: number, y: number, w: number, h: number, tone: 'cream' | 'card' | 'aged' = 'cream') {
  const c = scene.add.container(x, y);
  const sh = scene.add.rectangle(6, 8, w, h, 0x000000, 0.35);
  const img = scene.add.image(0, 0, paperKey(scene, w, h, tone));
  c.add([sh, img]);
  c.setSize(w, h);
  return c;
}

function plaqueTexture(scene: Phaser.Scene, w: number, h: number, hot: boolean) {
  return paint(scene, `plaque-${w}x${h}-${hot ? 1 : 0}`, w, h, (ctx) => {
    ctx.fillStyle = hgrad(ctx, 0, w, hot
      ? [[0, '#9a7028'], [0.3, '#f3d58a'], [0.6, '#d9ae58'], [1, '#8a6424']]
      : [[0, '#7a5520'], [0.3, '#e2bd6a'], [0.6, '#b8893a'], [1, '#6a4818']]);
    const r = 6;
    ctx.beginPath(); ctx.roundRect(0, 0, w, h, r); ctx.fill();
    ctx.strokeStyle = 'rgba(60,40,10,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(4, 4, w - 8, h - 8, r - 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,250,230,0.35)'; ctx.fillRect(6, 2, w - 12, 2);
    ctx.fillStyle = '#5a3e14';
    for (const sx of [10, w - 10]) { ctx.beginPath(); ctx.arc(sx, h / 2, 2.5, 0, Math.PI * 2); ctx.fill(); }
  });
}

export interface Plaque extends Phaser.GameObjects.Container { setEnabled(on: boolean): Plaque }

/** Engraved brass plate that acts as a button. */
export function plaque(scene: Phaser.Scene, x: number, y: number, label: string, onClick: () => void, o: { w?: number; h?: number; size?: number } = {}): Plaque {
  const h = o.h ?? 40;
  const probe = txt(scene, 0, 0, label, { font: 'sign', size: o.size ?? 17 });
  const w = o.w ?? Math.max(110, Math.ceil(probe.width) + 44);
  probe.destroy();
  const c = scene.add.container(x, y) as Plaque;
  const img = scene.add.image(0, 0, plaqueTexture(scene, w, h, false));
  const t = txt(scene, 0, 1, label, { font: 'sign', size: o.size ?? 17, color: '#2c1d08', origin: [0.5, 0.5] });
  const hi = txt(scene, 0, 2, label, { font: 'sign', size: o.size ?? 17, color: 'rgba(255,240,200,0.35)', origin: [0.5, 0.5] });
  c.add([scene.add.rectangle(3, 4, w, h, 0x000000, 0.35), img, hi, t]);
  c.setSize(w, h);
  let enabled = true;
  img.setInteractive({ useHandCursor: true });
  img.on('pointerover', () => { if (enabled) { img.setTexture(plaqueTexture(scene, w, h, true)); scene.tweens.add({ targets: c, scale: 1.04, duration: 90 }); } });
  img.on('pointerout', () => { img.setTexture(plaqueTexture(scene, w, h, false)); scene.tweens.add({ targets: c, scale: 1, duration: 90 }); });
  img.on('pointerdown', () => {
    if (!enabled) return;
    scene.tweens.add({ targets: c, scale: 0.96, duration: 60, yoyo: true });
    onClick();
  });
  c.setEnabled = (on: boolean) => { enabled = on; c.setAlpha(on ? 1 : 0.45); return c; };
  return c;
}

/** Makes any game object hoverable/clickable with a lift + glow, the shop's "this is interactive" language. */
export function makeHoverable(
  scene: Phaser.Scene, obj: Phaser.GameObjects.Image | Phaser.GameObjects.Container, onClick: () => void,
  o: { lift?: number; glow?: boolean; onOver?: () => void; onOut?: () => void } = {},
) {
  const baseY = obj.y;
  const lift = o.lift ?? 10;
  let glow: Phaser.Filters.Controller | undefined;
  if (o.glow !== false && 'enableFilters' in obj) {
    obj.enableFilters();
    glow = obj.filters!.internal.addGlow(hex(C.brassHi), 6, 0, 1, false, 10, 10);
    glow.active = false;
  }
  if (obj instanceof Phaser.GameObjects.Container) obj.setInteractive({ useHandCursor: true });
  else obj.setInteractive({ useHandCursor: true, pixelPerfect: false });
  obj.on('pointerover', () => {
    scene.tweens.add({ targets: obj, y: baseY - lift, duration: 140, ease: 'Sine.easeOut' });
    if (glow) glow.active = true;
    o.onOver?.();
  });
  obj.on('pointerout', () => {
    scene.tweens.add({ targets: obj, y: baseY, duration: 160, ease: 'Sine.easeOut' });
    if (glow) glow.active = false;
    o.onOut?.();
  });
  obj.on('pointerup', onClick);
  return obj;
}

/** Thin brass rule, a recurring typographic separator. */
export function rule(scene: Phaser.Scene, x: number, y: number, w: number, color = C.brass) {
  return scene.add.rectangle(x, y, w, 1.5, hex(color)).setOrigin(0, 0.5);
}
