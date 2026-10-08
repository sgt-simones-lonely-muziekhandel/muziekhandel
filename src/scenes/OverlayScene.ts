import Phaser from 'phaser';
import { back, canGoBack, closeAll, open, type OverlayKey } from '../game/nav';
import { visit } from '../game/services';
import { C, VIEW, hex } from '../game/theme';
import { plaque, txt } from '../game/ui/widgets';

/**
 * Base for every close-up view (cabinet, sheet music, portrait, piano, catalogue).
 * Provides: dimmed shop behind, Back / Shop plaques, Esc, the "route" ribbon of followed links.
 */
export abstract class OverlayScene<P extends object = object> extends Phaser.Scene {
  payload!: P;

  init(data: P) { this.payload = data; }

  create() {
    this.add.rectangle(0, 0, VIEW.w, VIEW.h, hex('#070b14'), 0.62).setOrigin(0).setInteractive(); // swallow clicks
    this.build();
    this.chrome();
    this.cameras.main.fadeIn(220, 7, 11, 20);
    this.input.keyboard?.on('keydown-ESC', () => this.goBack());
    this.input.keyboard?.on('keydown-BACKSPACE', () => this.goBack());
  }

  /** Subclasses draw their close-up here. */
  protected abstract build(): void;

  protected go(key: OverlayKey, data: object) {
    this.sound.play('sfx-page', { volume: 0.5 });
    open(this, key, data);
  }

  protected goBack() { this.sound.play('sfx-page', { volume: 0.35 }); back(this); }
  protected close() { closeAll(this); }

  private chrome() {
    plaque(this, 92, 44, canGoBack() ? '‹  Terug' : '‹  Winkel', () => this.goBack(), { w: 140 }).setDepth(1000);
    plaque(this, VIEW.w - 92, 44, 'Winkel  ✕', () => this.close(), { w: 140 }).setDepth(1000);
    this.drawTrail();
  }

  private trailObjs: Phaser.GameObjects.GameObject[] = [];

  /** The visitor's path through the linked data, as a paper ribbon at the bottom. Call again after pushTrail. */
  protected drawTrail() {
    this.trailObjs.forEach((o) => o.destroy());
    this.trailObjs = [];
    if (visit.trail.length < 2) return;
    const y = VIEW.h - 28;
    const steps = visit.trail.slice(-6);
    const parts = steps.map((s) => `${s.kind === 'work' ? '♪' : '☙'} ${s.label}`);
    const label = txt(this, 0, 0, `Uw route:  ${parts.join('   →   ')}`, { size: 14, italic: true, color: C.ink });
    const w = Math.min(VIEW.w - 80, label.width + 48);
    const strip = this.add.rectangle(VIEW.w / 2, y, w, 30, hex(C.paper), 0.95).setStrokeStyle(1, hex(C.brass));
    label.setPosition(VIEW.w / 2, y).setOrigin(0.5);
    if (label.width > w - 30) label.setScale((w - 30) / label.width);
    strip.setDepth(999); label.setDepth(1000);
    this.trailObjs = [strip, label];
  }
}
