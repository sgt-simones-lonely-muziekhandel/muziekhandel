import Phaser from 'phaser';
import { grain, panel, paint, seeded } from '../game/art/canvas';
import { portraitKey } from '../game/art/portrait';
import { coverKey } from '../game/art/sheet';
import { services } from '../game/services';
import { C, VIEW, hex } from '../game/theme';
import { makeHoverable, paperKey, plaque, txt, type Plaque } from '../game/ui/widgets';
import { OverlayScene } from './OverlayScene';

interface CatalogueData { tab?: 'people' | 'works'; page?: number }

const COLS = 4, ROWS = 3, PER = COLS * ROWS;

/** The card index on the counter: every person and every work, alphabetically. */
export class CatalogueScene extends OverlayScene<CatalogueData> {
  private cards!: Phaser.GameObjects.Container;
  private tabs: Record<'people' | 'works', Plaque> = {} as never;

  constructor() { super('Catalogue'); }

  protected build() {
    this.add.image(VIEW.w / 2, VIEW.h / 2 + 20, this.paintDrawer());
    txt(this, VIEW.w / 2, 122, 'KAARTENBAK', { font: 'sign', size: 28, color: C.brassHi, origin: [0.5, 0.5] });
    this.tabs.people = plaque(this, VIEW.w / 2 - 110, 176, 'Personen', () => this.show('people', 0), { w: 200 });
    this.tabs.works = plaque(this, VIEW.w / 2 + 110, 176, 'Werken', () => this.show('works', 0), { w: 200 });
    this.cards = this.add.container(0, 0);
    this.show(this.payload.tab ?? 'people', this.payload.page ?? 0);
  }

  private paintDrawer() {
    return paint(this, 'drawer-close', 1480, 780, (ctx, w, h) => {
      const r = seeded(23);
      panel(ctx, 0, 0, w, h, '#4a2f1a', 0);
      grain(ctx, 0, 0, w, h, r, 0.1);
      ctx.fillStyle = '#1a0f08'; ctx.fillRect(30, 200, w - 60, h - 230);
      // brass rod running through the cards
      ctx.fillStyle = '#b8893a'; ctx.fillRect(30, h - 70, w - 60, 6);
      panel(ctx, 520, 70, 440, 64, '#3a2414', 6);
    });
  }

  private show(tab: 'people' | 'works', page: number) {
    this.payload = { tab, page };
    this.tabs.people.setAlpha(tab === 'people' ? 1 : 0.55);
    this.tabs.works.setAlpha(tab === 'works' ? 1 : 0.55);
    this.cards.removeAll(true);
    const data = services.data;
    const items = tab === 'people'
      ? [...data.allPeople()].sort((a, b) => a.sortName.localeCompare(b.sortName, 'nl')).map((p) => ({
        key: portraitKey(p), title: p.sortName, sub: [p.birth?.year ?? '?', p.death?.year ?? '?'].join(' – '),
        note: p.occupations.slice(0, 3).join(', '), open: () => this.go('Person', { id: p.id }),
      }))
      : [...data.allWorks()].sort((a, b) => a.title.localeCompare(b.title, 'nl')).map((w) => ({
        key: coverKey(w), title: w.title, sub: [data.primaryPerson(w)?.name, w.year].filter(Boolean).join(', '),
        note: `${w.genre} · ${w.scoring}`, open: () => this.go('Work', { id: w.id }),
      }));
    const pages = Math.max(1, Math.ceil(items.length / PER));
    const cw = 320, ch = 160;
    const x0 = VIEW.w / 2 - ((COLS - 1) * (cw + 24)) / 2;
    items.slice(page * PER, page * PER + PER).forEach((it, i) => {
      const col = i % COLS, row = Math.floor(i / COLS);
      const c = this.add.container(x0 + col * (cw + 24), 330 + row * (ch + 18));
      c.add(this.add.rectangle(4, 6, cw, ch, 0x000000, 0.4));
      c.add(this.add.image(0, 0, paperKey(this, cw, ch, 'card')));
      c.add(this.add.rectangle(-cw / 2 + 40, -ch / 2, 50, 10, hex(tab === 'people' ? C.delft : C.red)));
      const thumb = this.add.image(-cw / 2 + 44, 14, it.key);
      thumb.setScale(tab === 'people' ? 0.42 : 0.2);
      c.add(thumb);
      const title = txt(this, -cw / 2 + 92, -ch / 2 + 16, it.title, { font: 'type', size: 15, color: C.ink, width: cw - 104 });
      c.add(title);
      c.add(txt(this, -cw / 2 + 92, -ch / 2 + 62, it.sub, { size: 14, italic: true, color: C.inkSoft, width: cw - 104 }));
      c.add(txt(this, -cw / 2 + 92, -ch / 2 + 96, it.note, { size: 13, color: C.ink, width: cw - 104 }));
      c.setSize(cw, ch);
      c.setAngle((i % 3 - 1) * 0.6);
      this.cards.add(c);
      c.setAlpha(0); c.y += 20;
      this.tweens.add({ targets: c, alpha: 1, y: c.y - 20, duration: 220, delay: i * 30, onComplete: () => makeHoverable(this, c, it.open, { lift: 12 }) });
    });
    if (pages > 1) {
      const mk = (x: number, s: string, d: number, on: boolean) => {
        const t = txt(this, x, 500, s, { font: 'sign', size: 54, color: on ? C.brassHi : '#5a4a30', origin: [0.5, 0.5] });
        this.cards.add(t);
        if (on) t.setInteractive({ useHandCursor: true }).on('pointerup', () => { this.sound.play('sfx-page', { volume: 0.4 }); this.show(tab, page + d); });
      };
      mk(60, '‹', -1, page > 0);
      mk(VIEW.w - 60, '›', 1, page < pages - 1);
    }
  }
}
