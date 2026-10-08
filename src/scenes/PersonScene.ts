import Phaser from 'phaser';
import { ROLE_LABEL_NL, type RelatedPerson } from '../data/model';
import { paint, panel } from '../game/art/canvas';
import { portraitKey } from '../game/art/portrait';
import { coverKey } from '../game/art/sheet';
import { pushTrail, services } from '../game/services';
import { C, VIEW, hex } from '../game/theme';
import { makeHoverable, paper, txt } from '../game/ui/widgets';
import { OverlayScene } from './OverlayScene';

const THREAD: Record<RelatedPerson['kind'], { color: string; legend: string }> = {
  link: { color: C.thread, legend: 'persoonlijke band (personendata)' },
  work: { color: '#d9d2c0', legend: 'samen op bladmuziek (catalogus)' },
  place: { color: C.brassHi, legend: 'zelfde geboorteplaats (gedeelde plaats-URI)' },
};

/**
 * Scenes 4 + 5 — a person on the wall: portrait, life card, threads to connected people,
 * and the sheet music in the shop that they are credited on.
 */
export class PersonScene extends OverlayScene<{ id: string }> {
  constructor() { super('Person'); }

  protected build() {
    this.add.image(VIEW.w / 2, VIEW.h / 2, this.paintWall());
    void this.populate();
  }

  private paintWall() {
    return paint(this, 'wall-close', VIEW.w, VIEW.h, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#1d3560'); g.addColorStop(1, '#16294a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(239,230,207,0.07)';
      for (let y = 20, row = 0; y < h; y += 90, row++) for (let x = (row % 2) * 60; x < w; x += 120) {
        ctx.save(); ctx.translate(x, y);
        for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.ellipse(0, -9, 4, 9, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
      // dado + a shelf ledge where the sheet music leans
      panel(ctx, 0, 560, w, 14, '#5a3b24', 0);
      ctx.fillStyle = '#2f1e12'; ctx.fillRect(0, 574, w, h - 574);
      for (let x = 10; x < w; x += 140) panel(ctx, x, 600, 126, 250, '#3a2516', 10);
      panel(ctx, 0, 820, w, 20, '#4a2f1a', 0);
    });
  }

  private async populate() {
    const data = services.data;
    const person = await data.getPerson(this.payload.id);
    if (!person) { txt(this, VIEW.w / 2, VIEW.h / 2, 'Onbekende persoon.', { size: 24, color: C.cream, origin: [0.5, 0.5] }); return; }
    pushTrail({ kind: 'person', id: person.id, label: person.name });
    this.drawTrail();

    // portrait + name plate
    const px = 230, py = 262;
    this.add.image(px, py, portraitKey(person)).setScale(1.5);
    this.add.rectangle(px, py + 186, 300, 54, hex(C.brass)).setStrokeStyle(2, hex('#5a3e14'));
    const plate = txt(this, px, py + 176, person.name, { font: 'sign', size: 20, color: '#2c1d08', origin: [0.5, 0.5] });
    if (plate.width > 280) plate.setScale(280 / plate.width);
    txt(this, px, py + 198, [person.birth?.year ?? '?', person.death?.year ?? '?'].join(' – '), { size: 14, color: '#2c1d08', origin: [0.5, 0.5] });

    // life card
    const card = paper(this, 630, 292, 400, 420, 'cream').setAngle(-0.6);
    card.add(txt(this, -176, -186, person.occupations.join(' · ').toUpperCase(), { font: 'sign', size: 13, color: C.red, width: 352 }));
    const life = await data.lifeLine(person);
    card.add(txt(this, -176, -148, life, { size: 17, italic: true, color: C.inkSoft, width: 352 }));
    card.add(txt(this, -176, -108, person.description ?? '', { size: 18, color: C.ink, width: 352, lineSpacing: 5 }));
    const ids = [person.iri, ...person.sameAs].map((u) => `↗ ${u.replace(/^https?:\/\//, '')}`).join('\n');
    card.add(txt(this, -176, 140, ids, { font: 'type', size: 11, color: C.delft, width: 352, lineSpacing: 4 }));

    // related people: threads fan out from a pinned medallion of this person
    const related = (await data.relatedPeople(person)).slice(0, 8);
    const hub = new Phaser.Math.Vector2(1220, 150);
    txt(this, hub.x, 64, 'Verbonden met', { font: 'hand', size: 30, color: C.cream, origin: [0.5, 0.5] });
    const threads = this.add.graphics();
    const perRow = Math.min(4, Math.max(1, Math.ceil(related.length / 2)));
    related.forEach((rel, i) => {
      const row = Math.floor(i / perRow), col = i % perRow;
      const inRow = Math.min(perRow, related.length - row * perRow);
      const p = new Phaser.Math.Vector2(hub.x + (col - (inRow - 1) / 2) * 172, 300 + row * 160);
      const style = THREAD[rel.kind];
      const curve = new Phaser.Curves.QuadraticBezier(hub, new Phaser.Math.Vector2((hub.x + p.x) / 2, (hub.y + p.y) / 2 + 50), new Phaser.Math.Vector2(p.x, p.y - 54));
      threads.lineStyle(2, hex(style.color), 0.95);
      curve.draw(threads, 40);
      threads.fillStyle(hex(C.brassHi)); threads.fillCircle(p.x, p.y - 54, 3.5);
      const img = this.add.image(p.x, p.y, portraitKey(rel.person)).setScale(0.55);
      const lbl = txt(this, p.x, p.y + 56, rel.label, { size: 13, italic: true, color: '#e8dcc0', origin: [0.5, 0] });
      if (lbl.width > 166) lbl.setScale(166 / lbl.width);
      const name = txt(this, p.x, p.y + 74, rel.person.name, { font: 'sign', size: 14, color: C.cream, origin: [0.5, 0] });
      if (name.width > 166) name.setScale(166 / name.width);
      makeHoverable(this, img, () => this.go('Person', { id: rel.person.id }), { lift: 8 });
    });
    this.add.image(hub.x, hub.y, portraitKey(person)).setScale(0.4);
    threads.fillStyle(hex(C.brass)); threads.fillCircle(hub.x, hub.y + 40, 6);
    if (!related.length) txt(this, hub.x, 300, 'Nog geen verbindingen in de data.', { font: 'hand', size: 22, color: C.cream, origin: [0.5, 0.5] });

    // legend
    [...new Set(related.map((r) => r.kind))].forEach((k, i) => {
      this.add.rectangle(100, 500 + i * 18, 26, 3, hex(THREAD[k].color));
      txt(this, 120, 500 + i * 18, THREAD[k].legend, { size: 12, italic: true, color: '#d8cfb8', origin: [0, 0.5] });
    });

    // works on the ledge
    const works = await data.worksForPerson(person);
    txt(this, 40, 576, 'Bladmuziek in de winkel', { font: 'hand', size: 28, color: C.cream });
    if (!works.length) {
      txt(this, 60, 680, 'Van deze persoon heeft de winkel (nog) geen bladmuziek.\nDe personendata kent hem of haar wél — volg de draden hierboven.', { font: 'hand', size: 22, color: C.cream, lineSpacing: 6 });
    }
    works.slice(0, 8).forEach(({ work, role }, i) => {
      const x = 120 + i * 180;
      const c = this.add.image(x, 820, coverKey(work)).setOrigin(0.5, 1).setScale(0.45).setAngle((i % 2 ? 1 : -1) * 2);
      txt(this, x, 842, ROLE_LABEL_NL[role], { font: 'sign', size: 12, color: C.brassHi, origin: [0.5, 0.5] });
      makeHoverable(this, c, () => this.go('Work', { id: work.id }), { lift: 18 });
    });
  }
}
