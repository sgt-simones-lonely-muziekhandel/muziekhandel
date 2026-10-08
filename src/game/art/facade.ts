import type Phaser from 'phaser';
import { C, F } from '../theme';
import { canalHouse, lamppost } from './room';
import { grain, panel, paint, rect, seeded, text, vgrad } from './canvas';

/** Shop front seen from the street. Display windows are cleared so the lit interior shows through. */
export const FACADE = {
  shopX: 430, shopW: 740,
  fascia: { y: 352, h: 84 },
  windowsY: [452, 790] as [number, number],
  leftWin: [470, 735] as [number, number],
  rightWin: [865, 1130] as [number, number],
  door: { x: 800, bottom: 800 },
};

export function paintFacade(scene: Phaser.Scene) {
  return paint(scene, 'facade', 1600, 900, (ctx) => {
    const r = seeded(1610);
    const { shopX, shopW } = FACADE;
    ctx.fillStyle = vgrad(ctx, 0, 600, [[0, '#7f97b2'], [1, '#dcdfd6']]);
    ctx.fillRect(0, 0, 1600, 900);
    // neighbours, drawn at scale
    for (const [x, w, top] of [[-40, 470, 40], [1170, 470, 10]] as const) {
      ctx.save(); ctx.translate(x, 0); ctx.scale(2.4, 2.4);
      canalHouse(ctx, 0, w / 2.4, top / 2.4, 800 / 2.4, r);
      ctx.restore();
    }
    // the shop's own house: brick, tall white windows
    ctx.fillStyle = '#5b3226';
    ctx.fillRect(shopX, 0, shopW, 800);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let y = 0; y < 352; y += 8) for (let x = shopX + ((y / 8) % 2) * 10; x < shopX + shopW; x += 20) ctx.fillRect(x, y, 19, 1);
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 4; i++) {
        const wx = shopX + 70 + i * 165, wy = 20 + row * 170, ww = 100, wh = 140;
        rect(ctx, wx - 6, wy - 6, ww + 12, wh + 12, '#e7e1d2');
        ctx.fillStyle = r() < 0.3 ? '#e2b76c' : '#2b3647'; ctx.fillRect(wx, wy, ww, wh);
        ctx.strokeStyle = '#e7e1d2'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(wx, wy + wh * 0.42); ctx.lineTo(wx + ww, wy + wh * 0.42); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.stroke();
        ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(wx, wy + wh * 0.21); ctx.lineTo(wx + ww, wy + wh * 0.21); ctx.stroke();
        rect(ctx, wx - 10, wy + wh + 6, ww + 20, 8, '#c9c2b0');
      }
    }
    // shopfront (winkelpui): painted navy wood
    const py = FACADE.fascia.y;
    rect(ctx, shopX - 10, py - 12, shopW + 20, 12, '#e7e1d2');
    rect(ctx, shopX, py, shopW, 800 - py, '#1b2a44');
    grain(ctx, shopX, py, shopW, 800 - py, r, 0.06, true);
    // fascia with gilt letters
    panel(ctx, shopX + 20, py + 8, shopW - 40, FACADE.fascia.h - 16, '#14213a', 6);
    text(ctx, 'MUZIEKHANDEL  VAN DER VELDE', 800, py + 36, `40px ${F.sign}`, '#d9b25e');
    text(ctx, 'Bladmuziek · Instrumenten · Grammofoons — Opgericht 1887', 800, py + 64, `italic 15px ${F.print}`, '#c9b98e');
    // display windows (cleared) + mullions + reflections
    const [wy0, wy1] = FACADE.windowsY;
    for (const [x0, x1] of [FACADE.leftWin, FACADE.rightWin]) {
      ctx.clearRect(x0, wy0, x1 - x0, wy1 - wy0);
      ctx.fillStyle = 'rgba(180,200,215,0.10)'; ctx.fillRect(x0, wy0, x1 - x0, wy1 - wy0);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.beginPath(); ctx.moveTo(x0 + 30, wy0); ctx.lineTo(x0 + 110, wy0); ctx.lineTo(x0 + 10, wy1); ctx.lineTo(x0 - 70 + 30, wy1); ctx.fill();
      ctx.strokeStyle = '#1b2a44'; ctx.lineWidth = 10; ctx.strokeRect(x0, wy0, x1 - x0, wy1 - wy0);
      ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x0, wy0 + 70); ctx.lineTo(x1, wy0 + 70); ctx.stroke();
      ctx.lineWidth = 2; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x0 + ((x1 - x0) * k) / 4, wy0); ctx.lineTo(x0 + ((x1 - x0) * k) / 4, wy0 + 70); ctx.stroke(); }
      // gilt lettering on the glass
      text(ctx, x0 < 800 ? 'BLADMUZIEK' : 'PIANO\'S', (x0 + x1) / 2, wy0 + 100, `22px ${F.sign}`, 'rgba(217,178,94,0.9)');
      rect(ctx, x0 - 6, wy1, x1 - x0 + 12, 10, '#e7e1d2');
    }
    // door recess (door sprite goes on top)
    rect(ctx, 740, 440, 120, 360, '#0d1524');
    // pilasters
    for (const px of [shopX + 6, 748 - 14, 852, shopX + shopW - 26]) panel(ctx, px, py + FACADE.fascia.h, 20, 800 - py - FACADE.fascia.h, '#22385c', 0);
    // stoop + street
    rect(ctx, 720, 800, 160, 14, '#9a958b');
    ctx.fillStyle = vgrad(ctx, 800, 900, [[0, '#6c6258'], [1, '#3e3730']]);
    ctx.fillRect(0, 814, 1600, 86);
    rect(ctx, 0, 800, 720, 14, '#8a857c'); rect(ctx, 880, 800, 720, 14, '#8a857c');
    for (let y = 820; y < 900; y += 10) for (let x = (y / 10) % 2 ? 0 : 12; x < 1600; x += 24) { ctx.fillStyle = 'rgba(20,15,10,0.3)'; ctx.fillRect(x, y, 22, 1.5); }
    lamppost(ctx, 300, 812); lamppost(ctx, 1300, 812);
    // house number on the transom
    text(ctx, '217', 800, 456, `16px ${F.sign}`, C.brassHi);
  });
}

/** Warm interior glimpsed through the display windows. */
export function paintShopGlow(scene: Phaser.Scene) {
  return paint(scene, 'shopglow', 700, 360, (ctx) => {
    ctx.fillStyle = vgrad(ctx, 0, 360, [[0, '#3a2a1c'], [0.6, '#5a3f26'], [1, '#2a1c12']]);
    ctx.fillRect(0, 0, 700, 360);
    const g = ctx.createRadialGradient(350, 80, 10, 350, 120, 380);
    g.addColorStop(0, 'rgba(255,214,150,0.55)'); g.addColorStop(1, 'rgba(255,200,130,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 700, 360);
    // shelves inside
    for (let y = 70; y < 300; y += 70) { ctx.fillStyle = 'rgba(30,18,10,0.8)'; ctx.fillRect(0, y, 700, 8); }
    rect(ctx, 0, 300, 700, 60, '#22160d');
  });
}
