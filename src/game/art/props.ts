import type Phaser from 'phaser';
import { C, F } from '../theme';
import { fitText, grain, hgrad, panel, paint, rect, seeded, text, vgrad } from './canvas';

/* Each function paints one prop texture and returns its key. Sizes are the texture size in px. */

export function paintDoor(scene: Phaser.Scene, w: number, h: number) {
  return paint(scene, 'door', w, h, (ctx) => {
    const r = seeded(7);
    rect(ctx, 0, 0, w, h, '#1d2f45');
    grain(ctx, 0, 0, w, h, r, 0.07, true);
    // glass upper half with reversed gilt lettering seen from inside
    const gx = 22, gy = 26, gw = w - 44, gh = h * 0.5;
    ctx.clearRect(gx, gy, gw, gh);
    ctx.fillStyle = 'rgba(190,210,225,0.16)'; ctx.fillRect(gx, gy, gw, gh);
    ctx.strokeStyle = '#2a4060'; ctx.lineWidth = 4; ctx.strokeRect(gx, gy, gw, gh);
    ctx.save();
    ctx.translate(w / 2, gy + gh * 0.32); ctx.scale(-1, 1);
    text(ctx, 'MUZIEK', 0, 0, `22px ${F.sign}`, 'rgba(214,176,92,0.85)');
    text(ctx, 'HANDEL', 0, 26, `22px ${F.sign}`, 'rgba(214,176,92,0.85)');
    ctx.restore();
    // lower panels
    panel(ctx, 20, gy + gh + 20, w - 40, (h - gh - gy) * 0.4, '#22364f', 8);
    panel(ctx, 20, gy + gh + 30 + (h - gh - gy) * 0.4, w - 40, (h - gh - gy) * 0.4, '#22364f', 8);
    // brass: handle, letterbox, kick plate
    rect(ctx, w - 34, h * 0.56, 8, 34, C.brass);
    rect(ctx, w / 2 - 34, gy + gh + 8, 68, 8, C.brass);
    rect(ctx, 6, h - 30, w - 12, 24, '#8a6a32');
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(6, h - 30, w - 12, 3);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 3; ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
  });
}

export function paintDoorBell(scene: Phaser.Scene) {
  return paint(scene, 'doorbell', 40, 60, (ctx) => {
    ctx.strokeStyle = '#2a2016'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(4, 4); ctx.quadraticCurveTo(20, 4, 20, 20); ctx.stroke();
    ctx.fillStyle = hgrad(ctx, 8, 32, [[0, '#8a6424'], [0.4, C.brassHi], [1, '#7a5520']]);
    ctx.beginPath(); ctx.moveTo(20, 18); ctx.bezierCurveTo(8, 22, 10, 44, 6, 50); ctx.lineTo(34, 50); ctx.bezierCurveTo(30, 44, 32, 22, 20, 18); ctx.fill();
    ctx.fillStyle = '#4a3416'; ctx.beginPath(); ctx.arc(20, 53, 4, 0, Math.PI * 2); ctx.fill();
  });
}

export function paintPiano(scene: Phaser.Scene) {
  const w = 340, h = 400;
  return paint(scene, 'piano', w, h, (ctx) => {
    const r = seeded(11);
    const body = '#1e120c';
    // top lid + cabinet
    panel(ctx, 6, 0, w - 12, 20, '#2b1a10', 0);
    rect(ctx, 14, 20, w - 28, 190, body);
    grain(ctx, 14, 20, w - 28, 190, r, 0.12);
    // fretwork panel with faded silk behind (period upright)
    ctx.fillStyle = '#5b2a26'; ctx.fillRect(50, 40, w - 100, 110);
    ctx.strokeStyle = '#2b1a10'; ctx.lineWidth = 5;
    for (let i = 0; i < 7; i++) {
      const cx = 70 + i * ((w - 140) / 6);
      ctx.beginPath(); ctx.arc(cx, 95, 22, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, 45); ctx.quadraticCurveTo(cx + 18, 95, cx, 145); ctx.quadraticCurveTo(cx - 18, 95, cx, 45); ctx.stroke();
    }
    ctx.strokeStyle = C.brass; ctx.lineWidth = 2; ctx.strokeRect(50, 40, w - 100, 110);
    // brass candle sconces
    for (const sx of [28, w - 28]) {
      ctx.strokeStyle = C.brass; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sx, 120); ctx.quadraticCurveTo(sx + (sx < w / 2 ? -14 : 14), 100, sx + (sx < w / 2 ? -10 : 10), 84); ctx.stroke();
      rect(ctx, sx + (sx < w / 2 ? -16 : 4), 80, 12, 5, C.brassHi);
      rect(ctx, sx + (sx < w / 2 ? -13 : 7), 52, 6, 28, '#efe8d6');
      ctx.fillStyle = '#f3c76a'; ctx.beginPath(); ctx.ellipse(sx + (sx < w / 2 ? -10 : 10), 46, 3, 6, 0, 0, Math.PI * 2); ctx.fill();
    }
    // music desk ledge
    panel(ctx, 30, 150, w - 60, 14, '#2e1c12', 0);
    // key slip + keyboard
    rect(ctx, 10, 205, w - 20, 16, '#2e1c12');
    const kx = 22, kw = w - 44, ky = 221, kh = 34;
    rect(ctx, kx, ky, kw, kh, '#efeadb');
    const white = 36;
    for (let i = 0; i <= white; i++) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(kx + (i * kw) / white, ky, 1, kh); }
    for (let i = 0; i < white; i++) {
      if ([0, 1, 3, 4, 5].includes(i % 7)) rect(ctx, kx + ((i + 0.68) * kw) / white, ky, (kw / white) * 0.62, kh * 0.6, '#14100c');
    }
    rect(ctx, 10, ky + kh, w - 20, 8, '#2a180f');
    // lower body, legs (consoles), panels
    rect(ctx, 14, ky + kh + 8, w - 28, h - ky - kh - 8, body);
    panel(ctx, 50, ky + kh + 26, w - 100, 80, '#24160e', 8);
    for (const lx of [16, w - 46]) {
      panel(ctx, lx, ky + kh + 8, 30, 46, '#2a190f', 0);
      ctx.fillStyle = C.brass; ctx.fillRect(lx + 6, ky + kh + 52, 18, 3);
    }
    // pedals
    for (const px of [w / 2 - 34, w / 2 - 8, w / 2 + 18]) {
      ctx.fillStyle = hgrad(ctx, px, px + 16, [[0, '#8a6424'], [0.5, C.brassHi], [1, '#7a5520']]);
      ctx.fillRect(px, h - 22, 16, 8);
    }
    rect(ctx, 6, h - 12, w - 12, 12, '#160d08');
    // varnish highlight
    ctx.fillStyle = 'rgba(255,230,190,0.07)'; ctx.fillRect(14, 20, w - 28, 6);
  });
}

export function paintStool(scene: Phaser.Scene) {
  return paint(scene, 'stool', 90, 110, (ctx) => {
    ctx.fillStyle = '#5a2a24'; ctx.beginPath(); ctx.ellipse(45, 16, 40, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a3a30'; ctx.beginPath(); ctx.ellipse(45, 12, 38, 9, 0, 0, Math.PI * 2); ctx.fill();
    rect(ctx, 36, 22, 18, 30, '#2a180f');
    ctx.strokeStyle = '#2a180f'; ctx.lineWidth = 6;
    for (const [x0, x1] of [[40, 10], [50, 80], [45, 45]]) { ctx.beginPath(); ctx.moveTo(x0, 50); ctx.lineTo(x1, 106); ctx.stroke(); }
    ctx.fillStyle = C.brass; for (const x of [10, 80, 45]) ctx.fillRect(x - 4, 104, 8, 5);
  });
}

/** The big sheet-music cabinet. `labels` fill the pigeonhole label holders. */
export function paintCabinet(scene: Phaser.Scene, labels: string[]) {
  const w = 760, h = 630;
  return paint(scene, 'cabinet', w, h, (ctx) => {
    const r = seeded(31);
    const wood = '#33200f';
    // cornice with signboard
    panel(ctx, 0, 0, w, 26, '#3e2715', 0);
    rect(ctx, 0, 24, w, 6, '#1f140a');
    rect(ctx, 30, 30, w - 60, 54, '#1b2a44');
    ctx.strokeStyle = C.brass; ctx.lineWidth = 2; ctx.strokeRect(36, 36, w - 72, 42);
    text(ctx, 'BLADMUZIEK', w / 2, 58, `30px ${F.sign}`, C.brassHi);
    ctx.font = `30px ${F.sign}`;
    // carcass
    rect(ctx, 8, 84, w - 16, h - 84, wood);
    grain(ctx, 8, 84, w - 16, h - 84, r, 0.1, true);
    // pigeonholes 7 x 5
    const cols = 7, rows = 5, gx = 24, gy = 96, cw = (w - 48) / cols, ch = 64;
    let li = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = gx + col * cw, y = gy + row * ch;
        rect(ctx, x + 3, y + 3, cw - 6, ch - 6, '#120b06');
        // stacked sheet music (seen edge-on) with occasional coloured wrappers
        let sy = y + ch - 6;
        const stack = 4 + Math.floor(r() * 9);
        for (let s = 0; s < stack && sy > y + 14; s++) {
          const th = 2 + Math.floor(r() * 4);
          const colour = r() < 0.2 ? ['#6f8a6a', '#9c4a3a', '#5f7389', '#b8904a', '#6e4d5e'][Math.floor(r() * 5)] : ['#e6dcc2', '#d8caa6', '#cdbb92', '#e9e2cf'][Math.floor(r() * 4)];
          ctx.fillStyle = colour;
          ctx.fillRect(x + 6 + r() * 4, sy - th, cw - 16 - r() * 6, th);
          ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 6, sy - 1, cw - 14, 1);
          sy -= th;
        }
        // brass label holder with card
        rect(ctx, x + cw / 2 - 30, y + ch - 2, 60, 14, C.brass);
        rect(ctx, x + cw / 2 - 27, y + ch, 54, 10, '#efe6cf');
        const label = labels[li++ % labels.length];
        ctx.font = fitText(ctx, label, F.print, 9, 50);
        ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, x + cw / 2, y + ch + 5.5);
      }
    }
    // drawer section
    const dy = gy + rows * ch + 26;
    rect(ctx, 8, dy - 12, w - 16, 10, '#4a2f1a');
    const dcols = 4, drows = 3, dw = (w - 48) / dcols, dh = (h - dy - 24) / drows;
    for (let row = 0; row < drows; row++) {
      for (let col = 0; col < dcols; col++) {
        const x = 24 + col * dw, y = dy + row * dh;
        panel(ctx, x + 3, y + 3, dw - 6, dh - 6, '#3c2615', 6);
        rect(ctx, x + dw / 2 - 22, y + dh / 2 - 14, 44, 14, C.brass);
        rect(ctx, x + dw / 2 - 19, y + dh / 2 - 12, 38, 10, '#efe6cf');
        ctx.fillStyle = hgrad(ctx, x + dw / 2 - 18, x + dw / 2 + 18, [[0, '#8a6424'], [0.5, C.brassHi], [1, '#7a5520']]);
        ctx.beginPath(); ctx.ellipse(x + dw / 2, y + dh / 2 + 10, 18, 5, 0, 0, Math.PI); ctx.fill();
      }
    }
    rect(ctx, 0, h - 12, w, 12, '#1f140a');
    ctx.fillStyle = 'rgba(255,230,190,0.05)'; ctx.fillRect(8, 84, 6, h - 96);
  });
}

export function paintLadder(scene: Phaser.Scene) {
  return paint(scene, 'ladder', 90, 560, (ctx) => {
    ctx.strokeStyle = '#5e3f27'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(18, 560); ctx.moveTo(72, 0); ctx.lineTo(78, 560); ctx.stroke();
    ctx.lineWidth = 6;
    for (let y = 40; y < 560; y += 52) { ctx.beginPath(); ctx.moveTo(14, y); ctx.lineTo(76, y); ctx.stroke(); }
    ctx.fillStyle = C.brass; ctx.fillRect(4, 0, 82, 8);
    ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(18, 552, 7, 0, Math.PI * 2); ctx.arc(78, 552, 7, 0, Math.PI * 2); ctx.fill();
  });
}

export function paintCounter(scene: Phaser.Scene) {
  const w = 620, h = 230;
  return paint(scene, 'counter', w, h, (ctx) => {
    const r = seeded(41);
    // top with a thick moulded edge
    panel(ctx, 0, 0, w, 22, '#5a3a22', 0);
    rect(ctx, 0, 20, w, 6, '#22160d');
    rect(ctx, 10, 26, w - 20, h - 36, '#38230f');
    grain(ctx, 10, 26, w - 20, h - 36, r, 0.1);
    const n = 5, pw = (w - 40) / n;
    for (let i = 0; i < n; i++) panel(ctx, 20 + i * pw + 4, 40, pw - 8, h - 74, '#3f2814', 10);
    // a band of delft tiles inset in the middle panel — the shop's one indulgence
    for (let i = 0; i < 4; i++) {
      const tx = 20 + 2 * pw + pw / 2 - 52 + i * 26, ty = 92;
      rect(ctx, tx, ty, 24, 24, '#ece8dc');
      ctx.strokeStyle = C.delft; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(tx + 12, ty + 12, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx + 12, ty + 4); ctx.lineTo(tx + 12, ty + 20); ctx.moveTo(tx + 4, ty + 12); ctx.lineTo(tx + 20, ty + 12); ctx.stroke();
    }
    rect(ctx, 0, h - 10, w, 10, '#1a1009');
  });
}

export function paintRegister(scene: Phaser.Scene) {
  return paint(scene, 'register', 130, 140, (ctx) => {
    const g = hgrad(ctx, 0, 130, [[0, '#7a5520'], [0.35, C.brassHi], [0.6, C.brass], [1, '#6a4818']]);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(10, 140); ctx.lineTo(18, 60); ctx.lineTo(112, 60); ctx.lineTo(120, 140); ctx.fill();
    ctx.fillRect(30, 20, 70, 44);
    rect(ctx, 38, 26, 54, 22, '#1c1a16');
    text(ctx, 'ƒ 1,50', 65, 37, `14px ${F.print}`, '#efe6cf');
    ctx.fillStyle = '#2a2016';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.arc(32 + i * 22, 80 + j * 16, 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#efe6cf';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.arc(32 + i * 22, 79 + j * 16, 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = '#4a3416'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(120, 90); ctx.lineTo(128, 70); ctx.stroke();
  });
}

export function paintCardIndex(scene: Phaser.Scene) {
  return paint(scene, 'cardindex', 150, 96, (ctx) => {
    const r = seeded(51);
    panel(ctx, 0, 30, 150, 66, '#4a2f1a', 0);
    grain(ctx, 0, 30, 150, 66, r, 0.1);
    for (let i = 0; i < 2; i++) {
      panel(ctx, 8 + i * 70, 40, 64, 48, '#56371f', 4);
      rect(ctx, 26 + i * 70, 50, 28, 12, C.brass); rect(ctx, 28 + i * 70, 52, 24, 8, '#efe6cf');
      ctx.fillStyle = C.brassHi; ctx.beginPath(); ctx.arc(40 + i * 70, 74, 5, 0, Math.PI * 2); ctx.fill();
    }
    // cards sticking up out of the open top drawer
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = i % 4 === 0 ? '#e7d3a0' : '#efe9da';
      ctx.fillRect(12 + i * 9, 6 + r() * 10, 7, 30);
      if (i % 4 === 0) { ctx.fillStyle = C.delft; ctx.fillRect(12 + i * 9, 4 + r() * 6, 7, 5); }
    }
  });
}

export function paintLedger(scene: Phaser.Scene) {
  return paint(scene, 'ledger', 170, 44, (ctx) => {
    ctx.fillStyle = '#5b2a26';
    ctx.beginPath(); ctx.moveTo(0, 44); ctx.lineTo(10, 18); ctx.lineTo(85, 26); ctx.lineTo(160, 18); ctx.lineTo(170, 44); ctx.fill();
    ctx.fillStyle = '#efe6cf';
    ctx.beginPath(); ctx.moveTo(6, 40); ctx.lineTo(14, 12); ctx.quadraticCurveTo(50, 2, 85, 18); ctx.quadraticCurveTo(120, 2, 156, 12); ctx.lineTo(164, 40); ctx.quadraticCurveTo(120, 30, 85, 38); ctx.quadraticCurveTo(50, 30, 6, 40); ctx.fill();
    ctx.strokeStyle = 'rgba(40,30,20,0.35)'; ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(20, 20 + i * 4); ctx.lineTo(78, 24 + i * 4); ctx.moveTo(92, 24 + i * 4); ctx.lineTo(150, 20 + i * 4); ctx.stroke(); }
    // quill pen
    ctx.strokeStyle = '#d8d0c0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(120, 30); ctx.lineTo(168, 0); ctx.stroke();
  });
}

export function paintShopkeeper(scene: Phaser.Scene) {
  const w = 140, h = 280;
  return paint(scene, 'shopkeeper', w, h, (ctx) => {
    const cx = w / 2;
    // body: white shirt, navy waistcoat, sleeve garters
    ctx.fillStyle = '#efe9da';
    ctx.beginPath(); ctx.moveTo(cx - 52, h); ctx.lineTo(cx - 46, 120); ctx.quadraticCurveTo(cx, 98, cx + 46, 120); ctx.lineTo(cx + 52, h); ctx.fill();
    ctx.fillStyle = '#1b2a44';
    ctx.beginPath(); ctx.moveTo(cx - 34, h); ctx.lineTo(cx - 30, 122); ctx.lineTo(cx, 150); ctx.lineTo(cx + 30, 122); ctx.lineTo(cx + 34, h); ctx.fill();
    ctx.fillStyle = C.brassHi; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(cx, 162 + i * 22, 2.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = C.brass; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx - 20, 190); ctx.quadraticCurveTo(cx - 5, 205, cx + 18, 186); ctx.stroke(); // watch chain
    ctx.fillStyle = '#8c2f24'; ctx.fillRect(cx - 52, 160, 12, 6); ctx.fillRect(cx + 40, 160, 12, 6); // garters
    // collar + bow tie
    ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - 12, 104, 24, 12);
    ctx.fillStyle = '#1c1c1c'; ctx.beginPath(); ctx.moveTo(cx, 114); ctx.lineTo(cx - 12, 108); ctx.lineTo(cx - 12, 120); ctx.closePath(); ctx.moveTo(cx, 114); ctx.lineTo(cx + 12, 108); ctx.lineTo(cx + 12, 120); ctx.fill();
    // head
    ctx.fillStyle = '#e1b998';
    ctx.beginPath(); ctx.ellipse(cx, 66, 26, 34, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(cx - 10, 92, 20, 14);
    // hair (receding, grey) + side whiskers
    ctx.fillStyle = '#8b8378';
    ctx.beginPath(); ctx.ellipse(cx, 42, 26, 14, 0, Math.PI, 0); ctx.fill();
    ctx.fillRect(cx - 27, 44, 6, 30); ctx.fillRect(cx + 21, 44, 6, 30);
    // eyes, spectacles, moustache
    ctx.fillStyle = '#2a2420'; ctx.beginPath(); ctx.arc(cx - 9, 64, 2.4, 0, Math.PI * 2); ctx.arc(cx + 9, 64, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.brass; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(cx - 9, 64, 6, 0, Math.PI * 2); ctx.moveTo(cx + 15, 64); ctx.arc(cx + 9, 64, 6, 0, Math.PI * 2); ctx.moveTo(cx - 3, 64); ctx.lineTo(cx + 3, 64); ctx.stroke();
    ctx.fillStyle = '#6f675c';
    ctx.beginPath(); ctx.moveTo(cx, 80); ctx.quadraticCurveTo(cx - 18, 76, cx - 22, 88); ctx.quadraticCurveTo(cx - 10, 84, cx, 86); ctx.quadraticCurveTo(cx + 10, 84, cx + 22, 88); ctx.quadraticCurveTo(cx + 18, 76, cx, 80); ctx.fill();
    ctx.fillStyle = 'rgba(160,90,70,0.25)'; ctx.beginPath(); ctx.arc(cx - 15, 76, 5, 0, Math.PI * 2); ctx.arc(cx + 15, 76, 5, 0, Math.PI * 2); ctx.fill();
    // arms resting forward
    ctx.fillStyle = '#e7e1d2'; ctx.fillRect(cx - 58, 170, 16, 90); ctx.fillRect(cx + 42, 170, 16, 90);
  });
}

export function paintClock(scene: Phaser.Scene) {
  // Frisian tail clock (staartklok)
  return paint(scene, 'clock', 90, 270, (ctx) => {
    const r = seeded(61);
    ctx.fillStyle = '#2b1a10';
    ctx.beginPath(); ctx.moveTo(10, 30); ctx.quadraticCurveTo(45, 0, 80, 30); ctx.lineTo(80, 110); ctx.lineTo(10, 110); ctx.fill();
    ctx.fillStyle = C.brass; ctx.beginPath(); ctx.arc(45, 12, 6, 0, Math.PI * 2); ctx.fill();
    // painted dial: cream with delft-blue corner flowers
    rect(ctx, 16, 32, 58, 70, '#ece6d6');
    ctx.fillStyle = C.delft; for (const [x, y] of [[22, 38], [68, 38], [22, 96], [68, 96]]) { ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = '#2a2016'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(45, 67, 24, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.fillStyle = '#2a2016'; ctx.fillRect(45 + Math.cos(a) * 20 - 1, 67 + Math.sin(a) * 20 - 1, 2, 2); }
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(45, 67); ctx.lineTo(45, 52); ctx.moveTo(45, 67); ctx.lineTo(57, 72); ctx.stroke();
    // tail case
    rect(ctx, 28, 110, 34, 150, '#2b1a10');
    grain(ctx, 28, 110, 34, 150, r, 0.12, true);
    ctx.clearRect(34, 120, 22, 120);
    ctx.fillStyle = 'rgba(190,210,225,0.12)'; ctx.fillRect(34, 120, 22, 120);
    rect(ctx, 24, 258, 42, 12, '#1f140a');
  });
}

export function paintPendulum(scene: Phaser.Scene) {
  return paint(scene, 'pendulum', 24, 120, (ctx) => {
    rect(ctx, 11, 0, 2, 100, '#7a5520');
    ctx.fillStyle = hgrad(ctx, 2, 22, [[0, '#7a5520'], [0.5, C.brassHi], [1, '#7a5520']]);
    ctx.beginPath(); ctx.arc(12, 106, 10, 0, Math.PI * 2); ctx.fill();
  });
}

export function paintWallShelf(scene: Phaser.Scene) {
  return paint(scene, 'wallshelf', 440, 230, (ctx) => {
    const r = seeded(71);
    for (let s = 0; s < 3; s++) {
      const y = 60 + s * 72;
      // boxes and bound volumes
      let x = 12;
      while (x < 420) {
        if (r() < 0.45) {
          const bw = 40 + r() * 34, bh = 30 + r() * 22;
          panel(ctx, x, y - bh, bw, bh, ['#cdbb92', '#b9a27a', '#d8caa6', '#a99060'][Math.floor(r() * 4)], 0);
          rect(ctx, x + bw / 2 - 10, y - bh + 8, 20, 9, '#efe6cf');
          x += bw + 3;
        } else {
          const bw = 8 + r() * 8, bh = 40 + r() * 20;
          rect(ctx, x, y - bh, bw, bh, ['#2f3b52', '#5b2a26', '#3f5a4c', '#22385c', '#6e4d5e'][Math.floor(r() * 5)]);
          rect(ctx, x, y - bh + 8, bw, 2, C.brass);
          x += bw + 1;
        }
      }
      panel(ctx, 0, y, 440, 10, '#4a2f1a', 0);
      // brackets
      ctx.fillStyle = '#2a190f';
      for (const bx of [20, 410]) { ctx.beginPath(); ctx.moveTo(bx, y + 10); ctx.lineTo(bx + 10, y + 10); ctx.lineTo(bx, y + 30); ctx.fill(); }
    }
  });
}

export function paintGramophone(scene: Phaser.Scene) {
  return paint(scene, 'gramophone', 200, 250, (ctx) => {
    const r = seeded(81);
    // horn: brass, flaring up and to the right
    ctx.fillStyle = hgrad(ctx, 40, 200, [[0, '#6a4818'], [0.45, C.brassHi], [0.75, C.brass], [1, '#5a3e14']]);
    ctx.beginPath();
    ctx.moveTo(78, 150); ctx.bezierCurveTo(90, 110, 110, 60, 150, 20);
    ctx.bezierCurveTo(180, 0, 205, 30, 196, 70);
    ctx.bezierCurveTo(170, 90, 120, 120, 94, 160); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(80,50,15,0.5)'; ctx.lineWidth = 1.2;
    for (let i = 1; i < 7; i++) { ctx.beginPath(); ctx.moveTo(84 + i * 3, 152 - i * 2); ctx.bezierCurveTo(100 + i * 6, 100 - i * 6, 130 + i * 7, 60 - i * 6, 150 + i * 7, 22 + i * 2); ctx.stroke(); }
    ctx.fillStyle = '#3a2810'; ctx.beginPath(); ctx.ellipse(176, 46, 14, 26, 0.75, 0, Math.PI * 2); ctx.fill();
    // tone arm
    ctx.strokeStyle = '#8a6424'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(86, 156); ctx.lineTo(70, 178); ctx.stroke();
    // turntable + record (edge view)
    ctx.fillStyle = '#121212'; ctx.beginPath(); ctx.ellipse(70, 184, 58, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7c2f22'; ctx.beginPath(); ctx.ellipse(70, 183, 12, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    // oak box with crank
    panel(ctx, 10, 190, 140, 56, '#5a3a20', 6);
    grain(ctx, 10, 190, 140, 56, r, 0.12);
    ctx.strokeStyle = '#2a2016'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(150, 218); ctx.lineTo(166, 218); ctx.lineTo(166, 236); ctx.stroke();
    rect(ctx, 160, 232, 14, 8, '#1a1a1a');
  });
}

export function paintSideTable(scene: Phaser.Scene) {
  return paint(scene, 'sidetable', 170, 230, (ctx) => {
    ctx.fillStyle = '#4a2f1a'; ctx.beginPath(); ctx.ellipse(85, 14, 82, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5e3f27'; ctx.beginPath(); ctx.ellipse(85, 10, 80, 9, 0, 0, Math.PI * 2); ctx.fill();
    // delft-blue tablecloth edge
    ctx.fillStyle = C.delft; ctx.beginPath(); ctx.moveTo(10, 12); ctx.lineTo(160, 12); ctx.lineTo(150, 50); ctx.quadraticCurveTo(85, 62, 20, 50); ctx.fill();
    ctx.strokeStyle = '#efe6cf'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(20, 46); ctx.quadraticCurveTo(85, 58, 150, 46); ctx.stroke();
    rect(ctx, 78, 56, 14, 150, '#3a2616');
    ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(85, 200); ctx.quadraticCurveTo(50, 210, 30, 228); ctx.moveTo(85, 200); ctx.quadraticCurveTo(120, 210, 140, 228); ctx.stroke();
  });
}

export function paintPoster(scene: Phaser.Scene) {
  return paint(scene, 'poster', 190, 280, (ctx) => {
    rect(ctx, 0, 0, 190, 280, '#e8dcbc');
    ctx.fillStyle = 'rgba(120,90,40,0.10)'; for (let i = 0; i < 60; i++) ctx.fillRect(Math.random() * 190, Math.random() * 280, 3, 3);
    rect(ctx, 8, 8, 174, 264, 'rgba(0,0,0,0)');
    ctx.strokeStyle = C.delft; ctx.lineWidth = 2; ctx.strokeRect(10, 10, 170, 260); ctx.strokeRect(14, 14, 162, 252);
    text(ctx, 'CONCERTGEBOUW', 95, 36, `17px ${F.sign}`, C.delft);
    rect(ctx, 30, 48, 130, 1.5, C.orange);
    text(ctx, 'Groote Zaal', 95, 62, `italic 13px ${F.print}`, C.ink);
    text(ctx, 'WOENSDAG', 95, 88, `12px ${F.sign}`, C.ink);
    text(ctx, '14 November 1906', 95, 104, `14px ${F.print}`, C.ink);
    rect(ctx, 50, 116, 90, 1, C.inkSoft);
    text(ctx, 'Te Deum', 95, 138, `bold 20px ${F.print}`, C.red);
    text(ctx, 'A. DIEPENBROCK', 95, 160, `12px ${F.sign}`, C.ink);
    text(ctx, 'Directie:', 95, 186, `italic 11px ${F.print}`, C.inkSoft);
    text(ctx, 'W. MENGELBERG', 95, 202, `13px ${F.sign}`, C.ink);
    text(ctx, 'Solisten: A. Noordewier-Reddingius', 95, 222, `10px ${F.print}`, C.ink);
    text(ctx, 'Aanvang 8 uur · Entrée ƒ 1,—', 95, 250, `10px ${F.print}`, C.inkSoft);
    // tack pins
    ctx.fillStyle = C.brass; for (const [x, y] of [[8, 8], [182, 8]]) { ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }
  });
}

export function paintLamp(scene: Phaser.Scene) {
  return paint(scene, 'lamp', 100, 250, (ctx) => {
    rect(ctx, 48, 0, 4, 150, '#6a4818');
    ctx.fillStyle = C.brass; ctx.beginPath(); ctx.ellipse(50, 150, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(40, 150, 20, 18);
    // opaline glass shade
    ctx.fillStyle = vgrad(ctx, 165, 240, [[0, '#fff6dc'], [0.6, '#f2dfb0'], [1, '#d9b877']]);
    ctx.beginPath(); ctx.moveTo(36, 166); ctx.bezierCurveTo(10, 190, 0, 220, 6, 236); ctx.lineTo(94, 236); ctx.bezierCurveTo(100, 220, 90, 190, 64, 166); ctx.fill();
    ctx.fillStyle = C.brass; ctx.fillRect(4, 234, 92, 5);
    ctx.fillStyle = '#fff8e2'; ctx.beginPath(); ctx.ellipse(50, 240, 30, 6, 0, 0, Math.PI * 2); ctx.fill();
  });
}

/** Soft radial glow for additive light. */
export function paintGlow(scene: Phaser.Scene) {
  return paint(scene, 'glow', 256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,236,200,0.9)');
    g.addColorStop(0.35, 'rgba(255,214,150,0.35)');
    g.addColorStop(1, 'rgba(255,200,130,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  });
}

export function paintLightBeam(scene: Phaser.Scene, w: number, h: number) {
  return paint(scene, `beam-${w}`, w + 360, h, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(230,236,240,0.20)');
    g.addColorStop(1, 'rgba(230,236,240,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w + 360, h); ctx.lineTo(360, h); ctx.fill();
  });
}

export function paintPalm(scene: Phaser.Scene) {
  return paint(scene, 'palm', 280, 360, (ctx) => {
    const r = seeded(91);
    // fronds
    for (let i = 0; i < 13; i++) {
      const a = -Math.PI / 2 + (r() - 0.5) * 2.6;
      const len = 120 + r() * 90;
      const x0 = 140, y0 = 236;
      const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len * 0.9 + 30;
      ctx.strokeStyle = '#2f3f24'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, y1 - 40, x1, y1); ctx.stroke();
      for (let t = 0.2; t < 1; t += 0.07) {
        const px = x0 + (x1 - x0) * t, py = y0 + (y1 - 40 - y0) * t * 2 * (1 - t) + (y1 - y0) * t * t;
        ctx.strokeStyle = ['#3d5530', '#344a29', '#4a6338'][Math.floor(r() * 3)]; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a + 1.3) * 26 * (1 - t * 0.6), py + 22 * (1 - t * 0.5)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a - 1.3) * 26 * (1 - t * 0.6), py + 22 * (1 - t * 0.5)); ctx.stroke();
      }
    }
    // Delft jardinière
    ctx.fillStyle = '#eeeae0';
    ctx.beginPath(); ctx.moveTo(80, 236); ctx.lineTo(200, 236); ctx.bezierCurveTo(214, 280, 196, 330, 178, 344); ctx.lineTo(102, 344); ctx.bezierCurveTo(84, 330, 66, 280, 80, 236); ctx.fill();
    rect(ctx, 76, 230, 128, 12, '#e4e0d4');
    ctx.strokeStyle = C.delft; ctx.lineWidth = 2.5; ctx.strokeRect(80, 232, 120, 8);
    ctx.fillStyle = C.delft;
    // windmill-free decoration: a flowering branch and a border of scallops
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(110, 330); ctx.bezierCurveTo(120, 300, 150, 290, 170, 262); ctx.stroke();
    for (const [x, y] of [[124, 302], [140, 290], [158, 276], [168, 262], [132, 316]]) { ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); }
    for (let x = 90; x < 192; x += 12) { ctx.beginPath(); ctx.arc(x, 250, 5, 0, Math.PI); ctx.stroke(); }
    rect(ctx, 96, 344, 88, 12, '#d9d4c6');
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(170, 240, 22, 104);
  });
}

export function paintChair(scene: Phaser.Scene) {
  // Bentwood chair
  return paint(scene, 'chair', 110, 200, (ctx) => {
    ctx.strokeStyle = '#2a190f'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(30, 196); ctx.lineTo(34, 110); ctx.bezierCurveTo(30, 40, 40, 6, 62, 6); ctx.bezierCurveTo(84, 6, 86, 40, 80, 70); ctx.stroke();
    ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(56, 50, 16, 30, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(90, 196); ctx.lineTo(84, 112); ctx.stroke();
    ctx.fillStyle = '#5b2a26'; ctx.beginPath(); ctx.ellipse(60, 112, 40, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2a190f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(60, 150, 30, 6, 0, 0, Math.PI * 2); ctx.stroke();
  });
}

export function paintEasel(scene: Phaser.Scene) {
  return paint(scene, 'easel', 80, 130, (ctx) => {
    ctx.strokeStyle = '#4a2f1a'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(10, 128); ctx.moveTo(40, 0); ctx.lineTo(70, 128); ctx.moveTo(40, 0); ctx.lineTo(40, 124); ctx.stroke();
    rect(ctx, 6, 92, 68, 6, '#5e3f27');
  });
}

/** Small music note glyph for particles. */
export function paintNote(scene: Phaser.Scene) {
  return paint(scene, 'note', 26, 36, (ctx) => {
    ctx.fillStyle = '#f3e3b8';
    ctx.beginPath(); ctx.ellipse(9, 29, 7, 5, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(14, 4, 2.5, 26);
    ctx.beginPath(); ctx.moveTo(16, 4); ctx.quadraticCurveTo(26, 10, 22, 22); ctx.quadraticCurveTo(22, 12, 16, 12); ctx.fill();
  });
}

export function paintMote(scene: Phaser.Scene) {
  return paint(scene, 'mote', 8, 8, (ctx) => {
    const g = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
    g.addColorStop(0, 'rgba(255,248,230,1)'); g.addColorStop(1, 'rgba(255,248,230,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 8, 8);
  });
}

/** Boat drifting on the canal (outside layer). */
export function paintBoat(scene: Phaser.Scene) {
  return paint(scene, 'boat', 180, 60, (ctx) => {
    ctx.fillStyle = '#2b2620';
    ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(180, 30); ctx.lineTo(160, 52); ctx.lineTo(16, 52); ctx.fill();
    rect(ctx, 0, 28, 180, 4, '#7c2f22');
    // cargo: crates and sacks under a tarp
    ctx.fillStyle = '#7a6a52'; ctx.beginPath(); ctx.moveTo(30, 30); ctx.quadraticCurveTo(80, 4, 140, 30); ctx.fill();
    // skipper with pole
    rect(ctx, 152, 6, 10, 24, '#1f2a3a');
    ctx.fillStyle = '#d8b494'; ctx.beginPath(); ctx.arc(157, 4, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(140, -10); ctx.lineTo(176, 60); ctx.stroke();
  });
}

/** A passer-by on the street outside (2 frames). */
export function paintPasserby(scene: Phaser.Scene) {
  for (let f = 0; f < 2; f++) {
    paint(scene, `passerby-${f}`, 40, 110, (ctx) => {
      ctx.fillStyle = '#2a2a30';
      ctx.beginPath(); ctx.moveTo(10, 100); ctx.lineTo(14, 30); ctx.lineTo(26, 30); ctx.lineTo(32, 100); ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(f ? 12 : 16, 98, 7, 12); ctx.fillRect(f ? 22 : 18, 98, 7, 12);
      ctx.fillStyle = '#d8b494'; ctx.beginPath(); ctx.arc(20, 22, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(11, 12, 18, 4); ctx.fillRect(14, 4, 12, 9);
    });
  }
}

/** The visitor (player): long navy coat, cream scarf, bowler. 6 walk frames + idle. */
export function paintPlayer(scene: Phaser.Scene) {
  const W = 80, H = 170;
  const frames = 6;
  for (let f = 0; f <= frames; f++) {
    // painted at 2x so the sprite stays crisp at shop scale
    paint(scene, `player-${f}`, W * 2, H * 2, (ctx) => {
      ctx.scale(2, 2);
      const idle = f === frames;
      const ph = (f / frames) * Math.PI * 2;
      const swing = idle ? 0 : Math.sin(ph);
      const bob = idle ? 0 : Math.abs(Math.cos(ph)) * 2;
      const cx = W / 2;
      const hip = 104 - bob;
      // legs
      const leg = (dir: number, shade: string) => {
        const a = dir * swing * 0.42;
        const kx = cx + Math.sin(a) * 30, ky = hip + Math.cos(a) * 30;
        const fx = kx + Math.sin(a * 0.6) * 30, fy = Math.min(H - 6, ky + 32);
        ctx.strokeStyle = shade; ctx.lineWidth = 10; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx, hip); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
        ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.ellipse(fx + 5, fy + 2, 9, 4.5, 0, 0, Math.PI * 2); ctx.fill();
      };
      leg(-1, '#161a24');
      leg(1, '#1e2330');
      // coat
      ctx.fillStyle = '#1d2c48';
      ctx.beginPath(); ctx.moveTo(cx - 17, 50 - bob); ctx.lineTo(cx + 17, 50 - bob); ctx.lineTo(cx + 22 + swing * 3, 128 - bob); ctx.lineTo(cx - 22 + swing * 3, 128 - bob); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(cx + 6, 54 - bob, 4, 70);
      ctx.fillStyle = C.brassHi; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(cx + 9, 68 + i * 16 - bob, 1.8, 0, Math.PI * 2); ctx.fill(); }
      // arm
      const aa = -swing * 0.5;
      ctx.strokeStyle = '#18253e'; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(cx, 58 - bob); ctx.lineTo(cx + Math.sin(aa) * 44, 58 - bob + Math.cos(aa) * 44); ctx.stroke();
      ctx.fillStyle = '#e1b998'; ctx.beginPath(); ctx.arc(cx + Math.sin(aa) * 46, 58 - bob + Math.cos(aa) * 46, 4.5, 0, Math.PI * 2); ctx.fill();
      // scarf
      ctx.fillStyle = '#e8dcc0'; ctx.fillRect(cx - 12, 44 - bob, 24, 9);
      ctx.fillRect(cx + 4, 48 - bob, 7, 26);
      // head + bowler
      ctx.fillStyle = '#e1b998'; ctx.beginPath(); ctx.ellipse(cx + 2, 32 - bob, 11, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a2a1e'; ctx.fillRect(cx - 9, 26 - bob, 6, 12);
      ctx.fillStyle = '#16161a';
      ctx.beginPath(); ctx.ellipse(cx + 1, 21 - bob, 18, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 1, 15 - bob, 11, 10, 0, Math.PI, 0); ctx.fill();
      ctx.fillRect(cx - 10, 14 - bob, 22, 7);
      ctx.fillStyle = '#e1b998'; ctx.beginPath(); ctx.arc(cx + 12, 33 - bob, 2.5, 0, Math.PI * 2); ctx.fill(); // nose
    });
  }
  return { frames };
}

/** Soft elliptical floor shadow. */
export function paintShadow(scene: Phaser.Scene) {
  return paint(scene, 'shadow', 128, 32, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save(); ctx.scale(1, 0.25); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(64, 64, 64, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  });
}

/** Screen-space vignette: darkened corners like an old photograph. */
export function paintVignette(scene: Phaser.Scene) {
  return paint(scene, 'vignette', 1600, 900, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.45, w / 2, h / 2, w * 0.62);
    g.addColorStop(0, 'rgba(8,10,18,0)');
    g.addColorStop(1, 'rgba(8,10,18,0.55)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
}
