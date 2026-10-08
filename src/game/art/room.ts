import type Phaser from 'phaser';
import { C } from '../theme';
import { DOOR, WINDOWS, WORLD, type Opening } from '../layout';
import { grain, panel, paint, rect, seeded, vgrad } from './canvas';

/* =================================================================================================
 * Outside: the canal seen through the windows. Drawn on its own layer so it can parallax.
 * ================================================================================================= */

const BRICK = ['#6a3b2c', '#5b3226', '#7a4433', '#4e2c22', '#6e4a3a', '#83503a'];
const PLASTER = ['#d9d1bd', '#cfc6ae', '#a9a596', '#e2dccb'];

type Gable = 'step' | 'neck' | 'bell' | 'spout' | 'cornice';

export function canalHouse(ctx: CanvasRenderingContext2D, x: number, w: number, top: number, base: number, r: () => number) {
  const plastered = r() < 0.28;
  const body = plastered ? PLASTER[Math.floor(r() * PLASTER.length)] : BRICK[Math.floor(r() * BRICK.length)];
  const trim = '#e7e1d2';
  const gables: Gable[] = ['step', 'neck', 'bell', 'spout', 'cornice'];
  const gable = gables[Math.floor(r() * gables.length)];
  const gy = top + 46; // where the facade's straight part begins
  const cx = x + w / 2;

  ctx.fillStyle = body;
  ctx.fillRect(x, gy, w, base - gy);

  ctx.beginPath();
  if (gable === 'step') {
    const n = 4, sh = (gy - top) / n, sw = (w / 2 - 10) / n;
    ctx.moveTo(x, gy);
    for (let s = 0; s < n; s++) { ctx.lineTo(x + s * sw, gy - (s + 1) * sh); ctx.lineTo(x + (s + 1) * sw, gy - (s + 1) * sh); }
    for (let s = n - 1; s >= 0; s--) { ctx.lineTo(x + w - (s + 1) * sw, gy - (s + 1) * sh); ctx.lineTo(x + w - s * sw, gy - (s + 1) * sh); }
    ctx.lineTo(x + w, gy);
    ctx.fillStyle = body; ctx.fill();
  } else if (gable === 'neck' || gable === 'spout') {
    const nw = w * (gable === 'neck' ? 0.46 : 0.3);
    ctx.fillStyle = body;
    ctx.fillRect(cx - nw / 2, top + 8, nw, gy - top - 8);
    // claw pieces (klauwstukken) in sandstone
    ctx.fillStyle = trim;
    ctx.beginPath(); ctx.moveTo(x + 2, gy); ctx.quadraticCurveTo(cx - nw / 2, gy, cx - nw / 2, gy - 22); ctx.lineTo(cx - nw / 2, gy); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + w - 2, gy); ctx.quadraticCurveTo(cx + nw / 2, gy, cx + nw / 2, gy - 22); ctx.lineTo(cx + nw / 2, gy); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - nw / 2 - 4, top + 10); ctx.lineTo(cx, top - 6); ctx.lineTo(cx + nw / 2 + 4, top + 10); ctx.fill();
  } else if (gable === 'bell') {
    ctx.moveTo(x, gy);
    ctx.bezierCurveTo(x, gy - 22, cx - w * 0.34, gy - 18, cx - w * 0.28, top + 18);
    ctx.bezierCurveTo(cx - w * 0.22, top - 2, cx + w * 0.22, top - 2, cx + w * 0.28, top + 18);
    ctx.bezierCurveTo(cx + w * 0.34, gy - 18, x + w, gy - 22, x + w, gy);
    ctx.fillStyle = body; ctx.fill();
    ctx.strokeStyle = trim; ctx.lineWidth = 2.5; ctx.stroke();
  } else {
    ctx.fillStyle = body; ctx.fillRect(x, top + 6, w, gy - top);
    ctx.fillStyle = trim; ctx.fillRect(x - 3, top, w + 6, 9);
    for (let d = x; d < x + w; d += 6) ctx.fillRect(d, top + 9, 3, 3);
  }

  // hoisting beam
  if (gable !== 'cornice') { ctx.fillStyle = '#2a1f19'; ctx.fillRect(cx - 2, top + 6, 4, 14); ctx.fillRect(cx - 1, top + 18, 2, 6); }
  // attic window
  ctx.fillStyle = r() < 0.4 ? '#e8b25c' : '#2a3545';
  ctx.fillRect(cx - 6, top + 24, 12, 16);
  ctx.strokeStyle = trim; ctx.lineWidth = 1.5; ctx.strokeRect(cx - 6, top + 24, 12, 16);

  // windows grid
  const cols = w > 80 ? 3 : 2;
  const gap = w / cols;
  for (let y = gy + 12; y < base - 60; y += 44) {
    for (let c = 0; c < cols; c++) {
      const wx = x + gap * c + gap / 2 - 7, lit = r() < 0.18;
      ctx.fillStyle = lit ? '#e9c27a' : '#2b3647';
      ctx.fillRect(wx, y, 14, 26);
      ctx.strokeStyle = trim; ctx.lineWidth = 1.6; ctx.strokeRect(wx, y, 14, 26);
      ctx.beginPath(); ctx.moveTo(wx, y + 13); ctx.lineTo(wx + 14, y + 13); ctx.moveTo(wx + 7, y); ctx.lineTo(wx + 7, y + 26);
      ctx.lineWidth = 0.8; ctx.stroke();
      // navy/green shutters on some houses
      if (!plastered && r() < 0.15) { ctx.fillStyle = r() < 0.5 ? '#1f3550' : '#2f4a3a'; ctx.fillRect(wx - 6, y, 5, 26); ctx.fillRect(wx + 15, y, 5, 26); }
    }
  }
  // stoop and door
  ctx.fillStyle = '#1c2a3d';
  ctx.fillRect(x + 8, base - 46, 14, 40);
  ctx.strokeStyle = trim; ctx.lineWidth = 1.2; ctx.strokeRect(x + 8, base - 46, 14, 40);
  ctx.fillStyle = '#8e8a80'; ctx.fillRect(x + 4, base - 6, 24, 6);
  ctx.fillStyle = r() < 0.5 ? '#d9a456' : '#2a3545';
  ctx.fillRect(x + 30, base - 44, w - 40, 26);
  ctx.strokeStyle = trim; ctx.strokeRect(x + 30, base - 44, w - 40, 26);
  // edge shadow between houses
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x + w - 2, gy, 2, base - gy);
}

function tree(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, r: () => number) {
  ctx.fillStyle = '#231b15';
  ctx.fillRect(x - 3 * s, y - 70 * s, 6 * s, 70 * s);
  const greens = ['rgba(46,62,40,0.92)', 'rgba(56,74,46,0.9)', 'rgba(38,52,34,0.92)'];
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = greens[i % 3];
    ctx.beginPath();
    ctx.ellipse(x + (r() - 0.5) * 70 * s, y - 100 * s + (r() - 0.5) * 50 * s, (24 + r() * 18) * s, (20 + r() * 14) * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function lamppost(ctx: CanvasRenderingContext2D, x: number, base: number) {
  ctx.fillStyle = '#16181b';
  ctx.fillRect(x - 3, base - 170, 6, 170);
  ctx.fillRect(x - 8, base - 8, 16, 8);
  ctx.beginPath(); ctx.moveTo(x - 12, base - 196); ctx.lineTo(x + 12, base - 196); ctx.lineTo(x, base - 210); ctx.fill();
  ctx.fillStyle = 'rgba(243,214,150,0.85)';
  ctx.beginPath(); ctx.moveTo(x - 10, base - 196); ctx.lineTo(x + 10, base - 196); ctx.lineTo(x + 7, base - 172); ctx.lineTo(x - 7, base - 172); ctx.fill();
  ctx.strokeStyle = '#16181b'; ctx.lineWidth = 2; ctx.stroke();
}

export function paintOutside(scene: Phaser.Scene) {
  const W = WORLD.w;
  return paint(scene, 'outside', W, WORLD.h, (ctx) => {
    const r = seeded(1906);
    const quay = 470, water = 482, nearQuay = 548;
    // Dutch overcast sky
    ctx.fillStyle = vgrad(ctx, 0, quay, [[0, '#7f97b2'], [0.55, '#b9c6cf'], [1, '#dfe1d8']]);
    ctx.fillRect(0, 0, W, quay);
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.08 + r() * 0.12})`;
      ctx.beginPath(); ctx.ellipse(r() * W, 60 + r() * 220, 60 + r() * 120, 14 + r() * 22, 0, 0, Math.PI * 2); ctx.fill();
    }
    // far row of canal houses, with a church tower now and then
    let x = -20;
    while (x < W) {
      const w = 62 + Math.floor(r() * 56);
      const top = 190 + Math.floor(r() * 90);
      canalHouse(ctx, x, w, top, quay, r);
      x += w;
      if (r() < 0.04) {
        ctx.fillStyle = '#5a4a40'; ctx.fillRect(x + 4, 120, 30, quay - 120);
        ctx.fillStyle = '#3e5a55'; ctx.beginPath(); ctx.moveTo(x, 122); ctx.lineTo(x + 19, 40); ctx.lineTo(x + 38, 122); ctx.fill();
        x += 40;
      }
    }
    for (let t = 30; t < W; t += 190 + r() * 120) tree(ctx, t, quay + 4, 0.9 + r() * 0.3, r);
    // far quay
    rect(ctx, 0, quay, W, 12, '#6f6c66');
    rect(ctx, 0, quay + 10, W, 2, '#3f3d3a');
    // water with reflections
    ctx.fillStyle = vgrad(ctx, water, nearQuay, [[0, '#3c4c55'], [1, '#26343c']]);
    ctx.fillRect(0, water, W, nearQuay - water);
    for (let i = 0; i < 420; i++) {
      const wy = water + 4 + r() * (nearQuay - water - 8);
      ctx.fillStyle = r() < 0.2 ? 'rgba(233,194,122,0.30)' : `rgba(200,215,225,${0.08 + r() * 0.12})`;
      ctx.fillRect(r() * W, wy, 8 + r() * 30, 1.5);
    }
    // near quay edge + street (klinkers)
    rect(ctx, 0, nearQuay, W, 8, '#8a8680');
    rect(ctx, 0, nearQuay + 8, W, 3, '#4c4945');
    ctx.fillStyle = vgrad(ctx, nearQuay + 11, WORLD.h, [[0, '#6c6258'], [1, '#4a423b']]);
    ctx.fillRect(0, nearQuay + 11, W, WORLD.h);
    for (let y = nearQuay + 14, row = 0; y < WORLD.h; y += 9 + row * 0.6, row++) {
      for (let bx = (row % 2) * 9; bx < W; bx += 18 + row * 0.8) {
        ctx.fillStyle = `rgba(${30 + r() * 20},${25 + r() * 15},${20 + r() * 10},0.35)`;
        ctx.fillRect(bx, y, 16 + row * 0.8, 1.2);
      }
    }
    for (let lx = 260; lx < W; lx += 760) lamppost(ctx, lx, nearQuay + 40);
    // haze to push it back
    ctx.fillStyle = 'rgba(205,215,222,0.12)';
    ctx.fillRect(0, 0, W, nearQuay);
  });
}

/* =================================================================================================
 * The room: ceiling, wallpaper, wainscot, Delft tile plinth, marble floor. Window/door openings are
 * cleared to transparent so the outside layer shows through.
 * ================================================================================================= */

function wallpaper(ctx: CanvasRenderingContext2D, x0: number, x1: number, y0: number, y1: number) {
  ctx.fillStyle = vgrad(ctx, y0, y1, [[0, '#1d3560'], [0.5, C.delft], [1, '#1a3054']]);
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  // fine vertical stripe
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let x = x0; x < x1; x += 22) ctx.fillRect(x, y0, 9, y1 - y0);
  // repeating cream motif: a small four-petal flower in a lozenge lattice
  const sx = 66, sy = 70;
  for (let y = y0 + 30, row = 0; y < y1; y += sy, row++) {
    for (let x = x0 + (row % 2 ? sx / 2 : 0); x < x1; x += sx) {
      ctx.save();
      ctx.translate(x, y);
      ctx.strokeStyle = 'rgba(239,230,207,0.10)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, -sy / 2); ctx.lineTo(sx / 2, 0); ctx.lineTo(0, sy / 2); ctx.lineTo(-sx / 2, 0); ctx.closePath(); ctx.stroke();
      ctx.fillStyle = 'rgba(239,230,207,0.16)';
      for (let k = 0; k < 4; k++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath(); ctx.ellipse(0, -6, 2.6, 6, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(226,189,106,0.35)';
      ctx.beginPath(); ctx.arc(0, 0, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }
}

function delftTile(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, r: () => number) {
  rect(ctx, x, y, s, s, '#ece8dc');
  ctx.fillStyle = 'rgba(0,0,0,0.05)'; ctx.fillRect(x, y + s - 2, s, 2);
  ctx.strokeStyle = C.delft; ctx.fillStyle = C.delft; ctx.lineWidth = 1;
  // corner motifs ("ossenkop" style quarter rings)
  for (const [cx, cy] of [[x, y], [x + s, y], [x, y + s], [x + s, y + s]]) {
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.16, 0, Math.PI * 2); ctx.stroke();
  }
  // a tiny central figure: ship, flower, or bird
  const k = Math.floor(r() * 3);
  const mx = x + s / 2, my = y + s / 2;
  ctx.beginPath();
  if (k === 0) { ctx.moveTo(mx - 6, my + 3); ctx.lineTo(mx + 6, my + 3); ctx.lineTo(mx + 4, my + 6); ctx.lineTo(mx - 4, my + 6); ctx.fill(); ctx.fillRect(mx - 0.5, my - 7, 1, 10); ctx.beginPath(); ctx.moveTo(mx, my - 7); ctx.lineTo(mx + 5, my + 1); ctx.lineTo(mx, my + 1); ctx.fill(); }
  else if (k === 1) { for (let a = 0; a < 5; a++) { ctx.beginPath(); ctx.arc(mx + Math.cos(a * 1.256) * 3.5, my + Math.sin(a * 1.256) * 3.5, 2, 0, Math.PI * 2); ctx.fill(); } }
  else { ctx.moveTo(mx - 6, my); ctx.quadraticCurveTo(mx - 2, my - 5, mx, my); ctx.quadraticCurveTo(mx + 2, my - 5, mx + 6, my); ctx.lineWidth = 1.4; ctx.stroke(); }
}

function marbleFloor(ctx: CanvasRenderingContext2D, W: number, y0: number, y1: number, r: () => number) {
  // Oblique chequerboard (Vermeer floors): rows of diamonds, slightly compressed with depth.
  rect(ctx, 0, y0, W, y1 - y0, C.marbleW);
  let y = y0, row = 0;
  while (y < y1) {
    const h = 20 + row * 4.2;
    const tw = 78;
    const shift = (row % 2) * tw / 2;
    for (let x = -tw + shift; x < W + tw; x += tw) {
      ctx.fillStyle = C.marbleB;
      ctx.beginPath();
      ctx.moveTo(x, y + h / 2); ctx.lineTo(x + tw / 2, y); ctx.lineTo(x + tw, y + h / 2); ctx.lineTo(x + tw / 2, y + h);
      ctx.closePath(); ctx.fill();
    }
    y += h / 2; row++;
  }
  // veins
  for (let i = 0; i < 260; i++) {
    const vx = r() * W, vy = y0 + r() * (y1 - y0);
    ctx.strokeStyle = r() < 0.5 ? 'rgba(120,115,105,0.18)' : 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(vx, vy); ctx.quadraticCurveTo(vx + 10 + r() * 20, vy + (r() - 0.5) * 8, vx + 25 + r() * 30, vy + (r() - 0.5) * 6); ctx.stroke();
  }
  // polish + dim toward the back
  ctx.fillStyle = vgrad(ctx, y0, y1, [[0, 'rgba(10,12,20,0.55)'], [0.3, 'rgba(10,12,20,0.18)'], [1, 'rgba(10,12,20,0.30)']]);
  ctx.fillRect(0, y0, W, y1 - y0);
}

function windowFrame(ctx: CanvasRenderingContext2D, o: Opening) {
  const fw = 14; // frame width
  const { x, w, top, bottom } = o;
  // deep reveal (dagkant)
  ctx.fillStyle = '#d9d2c0'; ctx.fillRect(x - 22, top - 22, 22, bottom - top + 44); ctx.fillRect(x + w, top - 22, 22, bottom - top + 44);
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x + w, top - 22, 22, bottom - top + 44);
  ctx.fillStyle = '#e4ddcb'; ctx.fillRect(x - 22, top - 22, w + 44, 22);
  // sill
  ctx.fillStyle = '#e9e3d4'; ctx.fillRect(x - 34, bottom, w + 68, 14);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x - 34, bottom + 14, w + 68, 4);
  // frame
  ctx.strokeStyle = '#efe9da'; ctx.lineWidth = fw;
  ctx.strokeRect(x + fw / 2, top + fw / 2, w - fw, bottom - top - fw);
  // transom: small panes above, large panes below (typical sash)
  const ty = top + (bottom - top) * 0.3;
  ctx.fillStyle = '#efe9da';
  ctx.fillRect(x, ty - 5, w, 10);
  ctx.fillRect(x + w / 2 - 5, top, 10, bottom - top);
  ctx.lineWidth = 3; ctx.strokeStyle = '#ece6d6';
  for (const fx of [x + w / 4, x + (3 * w) / 4]) { ctx.beginPath(); ctx.moveTo(fx, top); ctx.lineTo(fx, ty); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(x, top + (ty - top) / 2); ctx.lineTo(x + w, top + (ty - top) / 2); ctx.stroke();
  const my = ty + (bottom - ty) / 2;
  ctx.beginPath(); ctx.moveTo(x, my); ctx.lineTo(x + w, my); ctx.stroke();
  // shadow line on frame
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x + w - fw, top, fw, bottom - top);
  // lace half-curtain on the lower part (vitrage)
  const ly = bottom - (bottom - ty) * 0.42;
  ctx.fillStyle = 'rgba(245,242,232,0.42)'; ctx.fillRect(x + fw, ly, w - fw * 2, bottom - ly - fw);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
  for (let lx = x + fw + 6; lx < x + w - fw; lx += 12) {
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx, bottom - fw); ctx.stroke();
    ctx.beginPath(); ctx.arc(lx + 6, ly + 3, 4, 0, Math.PI); ctx.stroke();
  }
  ctx.fillStyle = '#c9b88e'; ctx.fillRect(x + fw, ly - 3, w - fw * 2, 3); // curtain rod
  // folded inner shutters (binnenluiken), navy panels
  for (const sx of [x - 22 - 30, x + w + 22]) {
    panel(ctx, sx, top - 10, 30, (bottom - top) * 0.47, '#1f3354', 4);
    panel(ctx, sx, top + (bottom - top) * 0.5, 30, (bottom - top) * 0.47, '#1f3354', 4);
  }
}

export function paintRoom(scene: Phaser.Scene) {
  const W = WORLD.w;
  return paint(scene, 'room', W, WORLD.h, (ctx) => {
    const r = seeded(1887);
    // ceiling: planks + beams
    rect(ctx, 0, 0, W, WORLD.ceiling, '#2a1b11');
    for (let x = 0; x < W; x += 34) { ctx.fillStyle = x % 68 ? '#30200f' : '#2c1c10'; ctx.fillRect(x, 0, 32, WORLD.ceiling); }
    for (let x = 60; x < W; x += 220) { panel(ctx, x, 0, 46, WORLD.ceiling - 4, '#3d2817', 0); }
    // cornice
    rect(ctx, 0, WORLD.ceiling, W, WORLD.wallTop - WORLD.ceiling, '#e6dfcd');
    for (let x = 0; x < W; x += 10) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x, WORLD.ceiling + 6, 5, 6); }
    rect(ctx, 0, WORLD.wallTop - 4, W, 4, '#b9b09a');
    // wall
    wallpaper(ctx, 0, W, WORLD.wallTop, WORLD.dado);
    // frieze band under the cornice: cream with a delft line
    rect(ctx, 0, WORLD.wallTop, W, 26, '#e3dbc6');
    rect(ctx, 0, WORLD.wallTop + 20, W, 2, C.delft);
    rect(ctx, 0, WORLD.wallTop + 26, W, 3, '#3b2a1a');
    // dado rail + wainscot panels
    rect(ctx, 0, WORLD.dado, W, 10, '#5a3b24');
    rect(ctx, 0, WORLD.dado, W, 2, C.woodHi);
    rect(ctx, 0, WORLD.dado + 10, W, WORLD.plint - WORLD.dado - 10, '#2f1e12');
    for (let x = 4; x < W; x += 104) panel(ctx, x + 4, WORLD.dado + 20, 94, WORLD.plint - WORLD.dado - 34, '#3a2516', 8);
    grain(ctx, 0, WORLD.dado + 10, W, WORLD.plint - WORLD.dado - 10, r, 0.06);
    // Delft tile plinth
    for (let x = 0; x < W; x += 30) delftTile(ctx, x, WORLD.plint, 30, r);
    rect(ctx, 0, WORLD.plint - 3, W, 3, '#2a1a10');
    // floor
    marbleFloor(ctx, W, WORLD.floor, WORLD.h, r);
    ctx.fillStyle = vgrad(ctx, WORLD.floor, WORLD.floor + 30, [[0, 'rgba(0,0,0,0.55)'], [1, 'rgba(0,0,0,0)']]);
    ctx.fillRect(0, WORLD.floor, W, 30);

    // openings
    for (const o of WINDOWS) {
      ctx.clearRect(o.x, o.top, o.w, o.bottom - o.top);
      // faint glass tint + reflection streaks (semi-transparent, outside still visible)
      ctx.fillStyle = 'rgba(190,210,225,0.10)';
      ctx.fillRect(o.x, o.top, o.w, o.bottom - o.top);
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.beginPath(); ctx.moveTo(o.x + 20, o.top); ctx.lineTo(o.x + 70, o.top); ctx.lineTo(o.x + 10, o.bottom); ctx.lineTo(o.x - 40 + 20, o.bottom); ctx.fill();
      windowFrame(ctx, o);
    }
    // door opening + architrave
    ctx.clearRect(DOOR.x, DOOR.top, DOOR.w, DOOR.bottom - DOOR.top);
    ctx.fillStyle = '#e6dfcd';
    ctx.fillRect(DOOR.x - 18, DOOR.top - 26, DOOR.w + 36, 26);
    ctx.fillRect(DOOR.x - 18, DOOR.top, 18, DOOR.bottom - DOOR.top);
    ctx.fillRect(DOOR.x + DOOR.w, DOOR.top, 18, DOOR.bottom - DOOR.top);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(DOOR.x + DOOR.w, DOOR.top, 18, DOOR.bottom - DOOR.top);
  });
}
