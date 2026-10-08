import type Phaser from 'phaser';
import type { Work } from '../../data/model';
import { C, F } from '../theme';
import { fitText, paint, seeded, text, wrapLines } from './canvas';

/**
 * The printed title page of a piece of sheet music, generated from the work record.
 * Three period layouts (framed, Nieuwe Kunst arch, lyre emblem). Later: replace with the
 * real scan from SOM by loading `cover-<id>` from Work.scanUrl.
 */
export const COVER = { w: 300, h: 400 };
export const coverKey = (w: Work) => `cover-${w.id}`;

export function paintCover(scene: Phaser.Scene, work: Work, byline: string) {
  const { w, h } = COVER;
  return paint(scene, coverKey(work), w, h, (ctx) => {
    const r = seeded(work.id);
    const ink = work.cover?.color ?? C.delft;
    const accent = work.cover?.accent ?? C.brassHi;
    const layout = Math.floor(r() * 3);
    const tinted = r() < 0.35;

    // paper
    ctx.fillStyle = tinted ? ink : '#ece2c7';
    ctx.fillRect(0, 0, w, h);
    const fg = tinted ? accent : ink;
    const sub = tinted ? 'rgba(255,245,220,0.8)' : C.inkSoft;
    // ageing
    for (let i = 0; i < 160; i++) { ctx.fillStyle = `rgba(110,80,30,${0.02 + r() * 0.05})`; ctx.beginPath(); ctx.arc(r() * w, r() * h, 1 + r() * 6, 0, Math.PI * 2); ctx.fill(); }
    const edge = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.75);
    edge.addColorStop(0, 'rgba(0,0,0,0)'); edge.addColorStop(1, 'rgba(90,60,20,0.28)');
    ctx.fillStyle = edge; ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = fg; ctx.fillStyle = fg;
    if (layout === 0) {
      ctx.lineWidth = 3; ctx.strokeRect(14, 14, w - 28, h - 28);
      ctx.lineWidth = 1; ctx.strokeRect(20, 20, w - 40, h - 40);
      for (const [x, y] of [[20, 20], [w - 20, 20], [20, h - 20], [w - 20, h - 20]]) {
        ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
      }
    } else if (layout === 1) {
      // Nieuwe Kunst: tall arch with whiplash stems
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(26, h - 24); ctx.lineTo(26, 120); ctx.quadraticCurveTo(26, 30, w / 2, 26); ctx.quadraticCurveTo(w - 26, 30, w - 26, 120); ctx.lineTo(w - 26, h - 24); ctx.closePath(); ctx.stroke();
      ctx.lineWidth = 1.5;
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(w / 2 + s * 40, h - 64); ctx.bezierCurveTo(w / 2 + s * 90, h - 50, w / 2 + s * 70, h - 110, w / 2 + s * 112, h - 112); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(w / 2 + s * 112, h - 118, 6, 11, s * 0.5, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      ctx.lineWidth = 2; ctx.strokeRect(18, 18, w - 36, h - 36);
      // lyre emblem
      const lx = w / 2, ly = 300;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(lx - 22, ly + 30); ctx.bezierCurveTo(lx - 46, ly, lx - 30, ly - 40, lx - 14, ly - 46); ctx.moveTo(lx + 22, ly + 30); ctx.bezierCurveTo(lx + 46, ly, lx + 30, ly - 40, lx + 14, ly - 46); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lx - 24, ly + 30); ctx.lineTo(lx + 24, ly + 30); ctx.moveTo(lx - 30, ly - 22); ctx.lineTo(lx + 30, ly - 22); ctx.stroke();
      ctx.lineWidth = 1; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(lx + i * 6, ly - 22); ctx.lineTo(lx + i * 6, ly + 30); ctx.stroke(); }
      for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(lx + s * (54 + i * 4), ly + 20 - i * 14, 4, 8, s * 0.6, 0, Math.PI * 2); ctx.fill(); }
    }

    // typography
    const top = layout === 1 ? 92 : 70;
    if (work.price) text(ctx, work.price, w - 32, 36, `italic 12px ${F.print}`, sub, 'right');
    ctx.font = fitText(ctx, work.title.toUpperCase(), F.sign, 34, w - 70);
    const titleLines = work.title.length > 18 ? wrapLines(ctx, work.title.toUpperCase(), w - 70) : [work.title.toUpperCase()];
    titleLines.slice(0, 3).forEach((line, i) => text(ctx, line, w / 2, top + i * 36, ctx.font, fg));
    let y = top + titleLines.length * 36 + 6;
    if (work.subtitle) {
      ctx.font = `italic 15px ${F.print}`;
      for (const line of wrapLines(ctx, work.subtitle, w - 80).slice(0, 2)) { text(ctx, line, w / 2, y, ctx.font, sub); y += 19; }
    }
    ctx.fillRect(w / 2 - 40, y + 6, 80, 1.5);
    text(ctx, `voor ${work.scoring}`, w / 2, y + 26, `13px ${F.print}`, sub);
    text(ctx, 'door', w / 2, y + 52, `italic 12px ${F.print}`, sub);
    text(ctx, byline.toUpperCase(), w / 2, y + 72, fitText(ctx, byline.toUpperCase(), F.sign, 18, w - 80), fg);
    if (work.publisher) text(ctx, work.publisher, w / 2, h - 40, fitText(ctx, work.publisher, F.print, 11, w - 70), sub);
    if (work.year) text(ctx, String(work.year), w / 2, h - 26, `10px ${F.print}`, sub);
  });
}

/** A coloured folio seen from the side in the cabinet close-up (spine + top edge). */
export function paintSpine(scene: Phaser.Scene, work: Work) {
  return paint(scene, `spine-${work.id}`, 40, 260, (ctx) => {
    const ink = work.cover?.color ?? C.delft;
    ctx.fillStyle = ink; ctx.fillRect(0, 0, 40, 260);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(0, 0, 4, 260);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(36, 0, 4, 260);
    ctx.save(); ctx.translate(22, 130); ctx.rotate(-Math.PI / 2);
    text(ctx, work.title.toUpperCase(), 0, 0, fitText(ctx, work.title.toUpperCase(), F.sign, 15, 220), work.cover?.accent ?? C.cream);
    ctx.restore();
  });
}
