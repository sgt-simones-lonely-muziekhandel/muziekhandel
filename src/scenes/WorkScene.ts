import { ROLE_LABEL_NL, type Person, type Work } from '../data/model';
import { grain, paint, seeded } from '../game/art/canvas';
import { portraitKey } from '../game/art/portrait';
import { COVER, coverKey } from '../game/art/sheet';
import { pushTrail, services, visit } from '../game/services';
import { C, VIEW } from '../game/theme';
import { engrave } from '../game/ui/notation';
import { makeHoverable, paper, paperKey, plaque, txt } from '../game/ui/widgets';
import { OverlayScene } from './OverlayScene';

/**
 * Scenes 3 + 4 — a work laid out on the counter: the title page (flip it open to see the
 * notes), the people credited on it as calling cards (→ Person), and its catalogue card with
 * the linked-data identifiers.
 */
export class WorkScene extends OverlayScene<{ id: string }> {
  constructor() { super('Work'); }

  protected build() {
    this.add.image(VIEW.w / 2, VIEW.h / 2, this.paintCounterTop());
    void this.populate();
  }

  private paintCounterTop() {
    return paint(this, 'countertop', VIEW.w, VIEW.h, (ctx, w, h) => {
      const r = seeded(17);
      for (let y = 0; y < h; y += 60) {
        ctx.fillStyle = ['#4a2f1a', '#452c18', '#4e321c'][(y / 60) % 3];
        ctx.fillRect(0, y, w, 60);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, y + 58, w, 2);
      }
      grain(ctx, 0, 0, w, h, r, 0.08);
      // navy baize writing mat with brass corners
      ctx.fillStyle = '#1b2a44'; ctx.fillRect(100, 110, 520, 720);
      ctx.strokeStyle = '#3a4e70'; ctx.lineWidth = 2; ctx.strokeRect(110, 120, 500, 700);
      ctx.fillStyle = '#b8893a';
      for (const [x, y] of [[100, 110], [580, 110], [100, 790], [580, 790]]) ctx.fillRect(x, y, 40, 40);
      const g = ctx.createRadialGradient(w * 0.45, h * 0.4, 100, w * 0.5, h * 0.5, w * 0.75);
      g.addColorStop(0, 'rgba(255,220,160,0.10)'); g.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    });
  }

  private async populate() {
    const data = services.data;
    const work = await data.getWork(this.payload.id);
    if (!work) { txt(this, VIEW.w / 2, VIEW.h / 2, 'Dit stuk is niet (meer) in de winkel.', { size: 24, color: C.cream, origin: [0.5, 0.5] }); return; }
    visit.workId = work.id;
    pushTrail({ kind: 'work', id: work.id, label: work.title });
    this.drawTrail();

    this.buildSheet(work);

    // title label
    const head = paper(this, 1080, 190, 820, 170, 'cream').setAngle(-0.4);
    head.add(txt(this, -380, -64, work.title, { font: 'sign', size: 44, color: C.navy }));
    if (work.subtitle) head.add(txt(this, -380, -12, work.subtitle, { size: 20, italic: true, color: C.inkSoft }));
    const meta = [`voor ${work.scoring}`, work.year && String(work.year), work.publisher, work.price].filter(Boolean).join('   ·   ');
    head.add(txt(this, -380, 28, meta, { size: 16, color: C.ink, width: 760 }));

    // people on this work → calling cards
    const people = await data.peopleForWork(work);
    txt(this, 680, 300, 'Betrokken personen', { font: 'hand', size: 30, color: C.cream });
    const cardW = 250, gap = 20;
    people.slice(0, 3).forEach(({ person, contribution }, i) => {
      const x = 680 + cardW / 2 + i * (cardW + gap), y = 432;
      const card = this.callingCard(person, ROLE_LABEL_NL[contribution.role] + (contribution.note ? ` (${contribution.note})` : ''), cardW);
      card.setPosition(x, y).setAngle((i - 1) * 1.6);
      makeHoverable(this, card, () => this.go('Person', { id: person.id }), { lift: 14 });
    });
    if (people.length > 3) txt(this, 1520, 520, `+${people.length - 3}`, { size: 18, color: C.cream, origin: [1, 0.5] });

    // catalogue card with identifiers — where the linked data shows its seams
    const card = paper(this, 930, 680, 500, 240, 'card').setAngle(0.8);
    card.add(txt(this, -230, -110, (work.shelfmark ?? 'z.s.').toUpperCase(), { font: 'type', size: 18, color: C.red }));
    card.add(txt(this, 230, -110, work.genre, { font: 'type', size: 16, color: C.inkSoft, origin: [1, 0] }));
    const lines = [
      `Titel     ${work.title}`,
      `Bron      ${data.sourceLabel}`,
      `URI       ${work.iri}`,
      ...people.map(({ person, contribution }) => `${ROLE_LABEL_NL[contribution.role].padEnd(10).slice(0, 10)}${person.name}`),
    ];
    card.add(txt(this, -230, -66, lines.join('\n'), { font: 'type', size: 13, color: C.ink, width: 460, lineSpacing: 7 }));

    // actions
    plaque(this, 1350, 640, '♪  Speel aan de piano', () => this.go('Piano', { id: work.id }), { w: 290, h: 46, size: 18 });
    plaque(this, 1350, 706, 'Meer in deze rubriek', () => this.go('Cabinet', { genre: work.genre }), { w: 290, h: 46, size: 18 });
    txt(this, 1350, 760, 'Dit stuk ligt nu in uw hand.', { font: 'hand', size: 20, color: C.cream, origin: [0.5, 0.5] });
  }

  private callingCard(person: Person, role: string, w: number) {
    const h = 150;
    const c = this.add.container(0, 0);
    c.add(this.add.rectangle(5, 7, w, h, 0x000000, 0.35));
    c.add(this.add.image(0, 0, paperKey(this, w, h, 'card')));
    c.add(this.add.image(-w / 2 + 50, 4, portraitKey(person)).setScale(0.5));
    c.add(txt(this, -w / 2 + 96, -h / 2 + 14, role.toUpperCase(), { font: 'sign', size: 12, color: C.red }));
    c.add(txt(this, -w / 2 + 96, -h / 2 + 34, person.name, { font: 'print', size: 19, bold: true, color: C.ink, width: w - 108 }));
    const years = [person.birth?.year ?? '?', person.death?.year ?? '?'].join(' – ');
    c.add(txt(this, -w / 2 + 96, h / 2 - 40, years, { size: 14, italic: true, color: C.inkSoft }));
    c.add(txt(this, w / 2 - 12, h / 2 - 22, 'bekijk ›', { font: 'hand', size: 18, color: C.delft, origin: [1, 0.5] }));
    c.setSize(w, h);
    return c;
  }

  /** The title page lies on the mat; click to turn it and see the notes. */
  private buildSheet(work: Work) {
    const x = 360, y = 470, s = 1.25;
    const pw = COVER.w * s, ph = COVER.h * s;
    this.add.rectangle(x + 8, y + 10, pw, ph, 0x000000, 0.4);
    const inside = this.add.container(x, y).setVisible(false);
    inside.add(this.add.image(0, 0, paperKey(this, pw, ph, 'aged')));
    const cover = this.add.image(x, y, coverKey(work)).setScale(s);
    const hint = txt(this, x, y + ph / 2 + 30, 'Klik op het titelblad om de muziek te openen', { font: 'hand', size: 20, color: C.cream, origin: [0.5, 0.5] });

    let built = false;
    const buildInside = async () => {
      if (built) return;
      built = true;
      const score = await services.music.getScore(work);
      inside.add(txt(this, 0, -ph / 2 + 30, work.title, { font: 'sign', size: 22, color: C.ink, origin: [0.5, 0.5] }));
      inside.add(txt(this, pw / 2 - 24, -ph / 2 + 58, services.data.primaryPerson(work)?.name ?? '', { size: 13, italic: true, color: C.inkSoft, origin: [1, 0.5] }));
      for (let sys = 0; sys < 3; sys++) {
        const st = engrave(this, -pw / 2 + 20, -ph / 2 + 100 + sys * 132, pw - 40, score, sys * 4 * score.timeSignature[0], 4, 6.5);
        inside.add(st.container);
      }
      inside.add(txt(this, 0, ph / 2 - 26, score.origin === 'mock' ? 'voorlopige partituur — wordt vervangen door OMR van de scan' : 'partituur uit MusicXML', { size: 11, italic: true, color: C.inkSoft, origin: [0.5, 0.5] }));
    };

    let open = false;
    const flip = () => {
      this.sound.play('sfx-page', { volume: 0.6 });
      const from = open ? inside : cover;
      const to = open ? cover : inside;
      if (!open) void buildInside();
      this.tweens.add({
        targets: from, scaleX: 0, duration: 160, ease: 'Sine.easeIn',
        onComplete: () => {
          from.setVisible(false);
          to.setVisible(true).setScale(to === cover ? 0 : 0, to === cover ? s : 1);
          this.tweens.add({ targets: to, scaleX: to === cover ? s : 1, duration: 180, ease: 'Sine.easeOut' });
          open = !open;
          hint.setText(open ? 'Klik om het titelblad terug te slaan' : 'Klik op het titelblad om de muziek te openen');
        },
      });
    };
    cover.setInteractive({ useHandCursor: true }).on('pointerup', flip);
    inside.setSize(pw, ph).setInteractive({ useHandCursor: true }).on('pointerup', flip);
  }
}
