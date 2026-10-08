import Phaser from 'phaser';
import type { Work } from '../data/model';
import { grain, panel, paint, seeded } from '../game/art/canvas';
import { coverKey } from '../game/art/sheet';
import { services } from '../game/services';
import { C, VIEW, hex } from '../game/theme';
import { makeHoverable, txt } from '../game/ui/widgets';
import { OverlayScene } from './OverlayScene';

interface CabinetData { genre?: string | null; featured?: boolean; page?: number }

const PER_PAGE = 5;

/** Scene 2 — the sheet-music cabinet up close: drawers per section, folios on the shelf. */
export class CabinetScene extends OverlayScene<CabinetData> {
  private shelf!: Phaser.GameObjects.Container;
  private drawerRow!: Phaser.GameObjects.Container;
  private caption!: Phaser.GameObjects.Text;

  constructor() { super('Cabinet'); }

  protected build() {
    this.add.image(VIEW.w / 2, VIEW.h / 2 + 10, this.paintBackdrop());
    this.drawerRow = this.add.container(0, 0);
    this.shelf = this.add.container(0, 0);
    this.caption = txt(this, VIEW.w / 2, 812, '', { size: 20, italic: true, color: C.cream, origin: [0.5, 0.5] });
    this.render();
  }

  private paintBackdrop() {
    return paint(this, 'cabinet-close', 1440, 760, (ctx, w, h) => {
      const r = seeded(5);
      panel(ctx, 0, 0, w, h, '#2e1c0f', 0);
      grain(ctx, 0, 0, w, h, r, 0.1, true);
      // sign board
      panel(ctx, 420, 18, 600, 60, '#14213a', 6);
      // drawer rail + shelf cavity
      panel(ctx, 30, 96, w - 60, 120, '#3a2414', 0);
      ctx.fillStyle = '#120a05'; ctx.fillRect(40, 236, w - 80, 440);
      const g = ctx.createLinearGradient(0, 236, 0, 676);
      g.addColorStop(0, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(60,40,20,0.1)');
      ctx.fillStyle = g; ctx.fillRect(40, 236, w - 80, 440);
      panel(ctx, 30, 676, w - 60, 26, '#4a2f1a', 0);
    });
  }

  private sectionTitle() {
    if (this.payload.featured) return 'Nieuw verschenen';
    return this.payload.genre ?? 'Alle bladmuziek';
  }

  private works(): Work[] {
    const d = services.data;
    if (this.payload.featured) return d.featuredWorks();
    return d.worksInGenre(this.payload.genre ?? null);
  }

  private render() {
    this.children.getByName('signText')?.destroy();
    txt(this, VIEW.w / 2, 128, this.sectionTitle().toUpperCase(), { font: 'sign', size: 30, color: C.brassHi, origin: [0.5, 0.5] }).setName('signText');
    this.renderDrawers();
    this.renderShelf();
  }

  private renderDrawers() {
    this.drawerRow.removeAll(true);
    const genres: (string | null)[] = [null, ...services.data.genres()];
    const w = Math.min(160, 1360 / genres.length);
    const x0 = VIEW.w / 2 - (genres.length * w) / 2 + w / 2;
    genres.forEach((g, i) => {
      const active = !this.payload.featured && (this.payload.genre ?? null) === g;
      const c = this.add.container(x0 + i * w, active ? 250 : 236);
      const front = this.add.rectangle(0, 0, w - 10, 92, hex(active ? '#5a3a22' : '#3f2814')).setStrokeStyle(2, hex('#1f140a'));
      const holder = this.add.rectangle(0, -14, w - 34, 30, hex(C.brass));
      const card = this.add.rectangle(0, -14, w - 42, 22, hex('#efe6cf'));
      const label = txt(this, 0, -14, g ?? 'Alle', { size: 15, color: C.ink, origin: [0.5, 0.5] });
      if (label.width > w - 48) label.setScale((w - 48) / label.width);
      const pull = this.add.ellipse(0, 22, 34, 12, hex(C.brassHi));
      const count = txt(this, 0, 38, `${services.data.worksInGenre(g).length} st.`, { size: 11, italic: true, color: '#c9b98e', origin: [0.5, 0.5] });
      c.add([front, holder, card, label, pull, count]);
      c.setSize(w - 10, 92);
      this.drawerRow.add(c);
      makeHoverable(this, c, () => {
        this.sound.play('sfx-drawer', { volume: 0.5 });
        this.payload = { genre: g, featured: false, page: 0 };
        this.render();
      }, { lift: -6, glow: false });
    });
  }

  private renderShelf() {
    this.shelf.removeAll(true);
    const all = this.works();
    const page = this.payload.page ?? 0;
    const pages = Math.max(1, Math.ceil(all.length / PER_PAGE));
    const items = all.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
    const spacing = 250;
    const x0 = VIEW.w / 2 - ((items.length - 1) * spacing) / 2;
    this.caption.setText(items.length ? 'Kies een stuk om het te bekijken' : 'Deze lade is leeg');

    items.forEach((w, i) => {
      const by = services.data.primaryPerson(w);
      const x = x0 + i * spacing;
      const cover = this.add.image(x, 752, coverKey(w)).setOrigin(0.5, 1).setScale(0.68).setAngle((i - 2) * 0.8);
      this.shelf.add(cover);
      // entrance: folios slide up out of the shelf
      cover.y += 40; cover.setAlpha(0);
      this.tweens.add({ targets: cover, y: 752, alpha: 1, duration: 280, delay: i * 60, ease: 'Back.easeOut', onComplete: () => {
        makeHoverable(this, cover, () => this.go('Work', { id: w.id }), {
          lift: 24,
          onOver: () => this.caption.setText(`${w.title}${by ? ` — ${by.name}` : ''}${w.year ? `, ${w.year}` : ''}`),
          onOut: () => this.caption.setText('Kies een stuk om het te bekijken'),
        });
      } });
    });

    if (pages > 1) {
      const mk = (x: number, label: string, delta: number, enabled: boolean) => {
        const t = txt(this, x, 530, label, { font: 'sign', size: 54, color: enabled ? C.brassHi : '#5a4a30', origin: [0.5, 0.5] });
        this.shelf.add(t);
        if (enabled) {
          t.setInteractive({ useHandCursor: true }).on('pointerup', () => {
            this.sound.play('sfx-page', { volume: 0.4 });
            this.payload = { ...this.payload, page: page + delta };
            this.renderShelf();
          });
        }
      };
      mk(130, '‹', -1, page > 0);
      mk(VIEW.w - 130, '›', 1, page < pages - 1);
      this.shelf.add(txt(this, VIEW.w / 2, 776, `${page + 1} / ${pages}`, { size: 14, color: '#c9b98e', origin: [0.5, 0.5] }));
    }
  }
}
