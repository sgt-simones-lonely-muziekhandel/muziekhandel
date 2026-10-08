import type Phaser from 'phaser';
import type { Person } from '../../data/model';
import { hgrad, paint, seeded } from './canvas';

/**
 * A sepia "cabinet photograph" in an oval gilt frame, generated from the person record.
 * Seeded by id so each person always looks the same. Swap for a real image (e.g. from
 * Wikimedia via the person's sameAs link) by loading `portrait-<id>` before this runs.
 */
export function portraitKey(p: Person) { return `portrait-${p.id}`; }

export function paintPortrait(scene: Phaser.Scene, p: Person, w = 150, h = 190) {
  return paint(scene, portraitKey(p), w, h, (ctx) => {
    const r = seeded(p.id);
    const cx = w / 2, cy = h / 2;
    const rx = w / 2 - 16, ry = h / 2 - 16;

    // frame: carved gilt oval
    ctx.fillStyle = hgrad(ctx, 0, w, [[0, '#6a4818'], [0.3, '#e2bd6a'], [0.55, '#b8893a'], [0.8, '#e8c878'], [1, '#5a3e14']]);
    ctx.beginPath(); ctx.ellipse(cx, cy, w / 2 - 2, h / 2 - 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(70,45,10,0.6)'; ctx.lineWidth = 1;
    for (let a = 0; a < Math.PI * 2; a += 0.18) {
      ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * (w / 2 - 9), cy + Math.sin(a) * (h / 2 - 9), 3, 2, a, 0, Math.PI * 2); ctx.stroke();
    }

    // photo
    ctx.save();
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.clip();
    const bg = ctx.createRadialGradient(cx - 10, cy - 20, 10, cx, cy, ry * 1.2);
    bg.addColorStop(0, '#d9c8a4'); bg.addColorStop(1, '#6e5a42');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

    const female = p.gender === 'female';
    const skin = '#c7a682', shade = 'rgba(70,50,30,0.35)', dark = '#2e241b';
    const headY = cy - ry * 0.18, hw = rx * 0.42, hh = ry * 0.4;

    // shoulders / clothing
    ctx.fillStyle = female ? '#2b2420' : '#231d18';
    ctx.beginPath(); ctx.moveTo(cx - rx * 1.1, h); ctx.quadraticCurveTo(cx - rx * 0.9, cy + ry * 0.35, cx, cy + ry * 0.3); ctx.quadraticCurveTo(cx + rx * 0.9, cy + ry * 0.35, cx + rx * 1.1, h); ctx.fill();
    if (female) {
      // high lace collar + brooch
      ctx.fillStyle = '#e6dcc4'; ctx.fillRect(cx - hw * 0.45, headY + hh * 0.8, hw * 0.9, hh * 0.55);
      ctx.strokeStyle = 'rgba(80,60,40,0.5)'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(cx - hw * 0.45, headY + hh * (0.9 + i * 0.12)); ctx.lineTo(cx + hw * 0.45, headY + hh * (0.9 + i * 0.12)); ctx.stroke(); }
      ctx.fillStyle = '#8a6a3a'; ctx.beginPath(); ctx.arc(cx, headY + hh * 1.45, 4, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#efe6d2';
      ctx.beginPath(); ctx.moveTo(cx - hw * 0.5, headY + hh * 0.9); ctx.lineTo(cx, headY + hh * 1.5); ctx.lineTo(cx + hw * 0.5, headY + hh * 0.9); ctx.fill();
      ctx.fillStyle = '#1a1512'; ctx.beginPath(); ctx.moveTo(cx, headY + hh * 1.12); ctx.lineTo(cx - 6, headY + hh * 1.5); ctx.lineTo(cx + 6, headY + hh * 1.5); ctx.fill();
    }

    // neck + head
    ctx.fillStyle = skin;
    ctx.fillRect(cx - hw * 0.3, headY + hh * 0.5, hw * 0.6, hh * 0.5);
    ctx.beginPath(); ctx.ellipse(cx, headY, hw, hh, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = shade; ctx.beginPath(); ctx.ellipse(cx + hw * 0.45, headY + 4, hw * 0.5, hh * 0.9, 0, -Math.PI / 2, Math.PI / 2); ctx.fill();

    // hair
    ctx.fillStyle = r() < 0.5 ? dark : '#5a4a3a';
    if (female) {
      ctx.beginPath(); ctx.ellipse(cx, headY - hh * 0.45, hw * 1.08, hh * 0.65, 0, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, headY - hh * 1.05, hw * 0.45, 0, Math.PI * 2); ctx.fill(); // bun
      ctx.beginPath(); ctx.ellipse(cx - hw * 0.9, headY - hh * 0.15, hw * 0.25, hh * 0.45, 0, 0, Math.PI * 2); ctx.ellipse(cx + hw * 0.9, headY - hh * 0.15, hw * 0.25, hh * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      const style = Math.floor(r() * 3);
      if (style === 0) {
        // side parting
        ctx.beginPath(); ctx.ellipse(cx + hw * 0.05, headY - hh * 0.5, hw * 0.98, hh * 0.52, 0, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx - hw * 0.95, headY - hh * 0.45); ctx.quadraticCurveTo(cx - hw * 0.2, headY - hh * 0.95, cx + hw * 0.95, headY - hh * 0.5); ctx.lineTo(cx + hw * 0.95, headY - hh * 0.62); ctx.quadraticCurveTo(cx, headY - hh * 1.25, cx - hw * 0.95, headY - hh * 0.6); ctx.fill();
      }
      else if (style === 1) { ctx.beginPath(); ctx.ellipse(cx - hw * 0.75, headY - hh * 0.3, hw * 0.35, hh * 0.45, 0, 0, Math.PI * 2); ctx.ellipse(cx + hw * 0.75, headY - hh * 0.3, hw * 0.35, hh * 0.45, 0, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.beginPath(); ctx.ellipse(cx, headY - hh * 0.5, hw * 1.15, hh * 0.7, 0.1, Math.PI * 1.05, Math.PI * 2.05); ctx.fill(); }
    }

    // eyes, brows, nose, mouth
    ctx.fillStyle = dark;
    const ey = headY - hh * 0.05;
    ctx.beginPath(); ctx.ellipse(cx - hw * 0.38, ey, 3, 2.2, 0, 0, Math.PI * 2); ctx.ellipse(cx + hw * 0.38, ey, 3, 2.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = dark;
    ctx.beginPath(); ctx.moveTo(cx - hw * 0.6, ey - 7); ctx.lineTo(cx - hw * 0.18, ey - 8); ctx.moveTo(cx + hw * 0.18, ey - 8); ctx.lineTo(cx + hw * 0.6, ey - 7); ctx.stroke();
    ctx.strokeStyle = shade; ctx.beginPath(); ctx.moveTo(cx + 1, ey + 2); ctx.lineTo(cx + 4, ey + hh * 0.35); ctx.lineTo(cx - 2, ey + hh * 0.38); ctx.stroke();
    if (!female && r() < 0.35) { ctx.strokeStyle = '#7a6a50'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx - hw * 0.38, ey, 6, 0, Math.PI * 2); ctx.moveTo(cx + hw * 0.38 + 6, ey); ctx.arc(cx + hw * 0.38, ey, 6, 0, Math.PI * 2); ctx.stroke(); }

    if (!female) {
      const beard = Math.floor(r() * 4);
      ctx.fillStyle = r() < 0.5 ? dark : '#6b5a48';
      if (beard >= 1) { // moustache
        ctx.beginPath(); ctx.moveTo(cx, ey + hh * 0.48); ctx.quadraticCurveTo(cx - hw * 0.5, ey + hh * 0.4, cx - hw * 0.6, ey + hh * 0.62); ctx.quadraticCurveTo(cx - hw * 0.2, ey + hh * 0.55, cx, ey + hh * 0.58); ctx.quadraticCurveTo(cx + hw * 0.2, ey + hh * 0.55, cx + hw * 0.6, ey + hh * 0.62); ctx.quadraticCurveTo(cx + hw * 0.5, ey + hh * 0.4, cx, ey + hh * 0.48); ctx.fill();
      }
      if (beard >= 2) { // beard
        ctx.beginPath(); ctx.moveTo(cx - hw * 0.85, ey + hh * 0.2); ctx.quadraticCurveTo(cx - hw * 0.8, ey + hh * (beard === 3 ? 1.6 : 1.05), cx, ey + hh * (beard === 3 ? 1.75 : 1.15)); ctx.quadraticCurveTo(cx + hw * 0.8, ey + hh * (beard === 3 ? 1.6 : 1.05), cx + hw * 0.85, ey + hh * 0.2); ctx.lineTo(cx + hw * 0.6, ey + hh * 0.7); ctx.lineTo(cx - hw * 0.6, ey + hh * 0.7); ctx.fill();
      }
      if (beard <= 1) { ctx.strokeStyle = 'rgba(60,40,30,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx - 5, ey + hh * 0.72); ctx.lineTo(cx + 5, ey + hh * 0.72); ctx.stroke(); }
    } else {
      ctx.strokeStyle = 'rgba(90,50,40,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx - 5, ey + hh * 0.62); ctx.quadraticCurveTo(cx, ey + hh * 0.66, cx + 5, ey + hh * 0.62); ctx.stroke();
    }

    // photographic finish: vignette + grain + sepia wash
    const vg = ctx.createRadialGradient(cx, cy, ry * 0.5, cx, cy, ry * 1.05);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(40,25,10,0.55)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++) { ctx.fillStyle = `rgba(${r() < 0.5 ? '255,240,210' : '30,20,10'},0.06)`; ctx.fillRect(r() * w, r() * h, 1.2, 1.2); }
    ctx.fillStyle = 'rgba(150,110,60,0.18)'; ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // glass glare
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w * 0.55, 0); ctx.lineTo(0, h * 0.5); ctx.fill();
    ctx.restore();
  });
}
