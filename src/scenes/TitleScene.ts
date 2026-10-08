import Phaser from 'phaser';
import { coverKey } from '../game/art/sheet';
import { FACADE, paintShopGlow } from '../game/art/facade';
import { services } from '../game/services';
import { C, VIEW, hex } from '../game/theme';
import { txt } from '../game/ui/widgets';

/** Scene 1a — the street. The shop front, its display windows (filled from the data), and the door in. */
export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    const cam = this.cameras.main;
    cam.setBackgroundColor('#0d1422');
    paintShopGlow(this);

    // interior behind the glass, with the featured sheet music on easels
    const [wy0, wy1] = FACADE.windowsY;
    this.add.image(FACADE.leftWin[0], wy0, 'shopglow').setOrigin(0).setDisplaySize(FACADE.rightWin[1] - FACADE.leftWin[0], wy1 - wy0);
    const featured = services.data.featuredWorks();
    const slots = [FACADE.leftWin, FACADE.rightWin].flatMap(([a, b]) => [a + (b - a) * 0.3, a + (b - a) * 0.72]);
    featured.slice(0, 4).forEach((w, i) => {
      const x = slots[i];
      this.add.image(x, wy1 - 8, 'easel').setOrigin(0.5, 1).setScale(1.1);
      const cover = this.add.image(x, wy1 - 50, coverKey(w)).setOrigin(0.5, 1).setScale(0.36).setAngle(i % 2 ? 2 : -2);
      this.tweens.add({ targets: cover, angle: cover.angle * -1, duration: 4000 + i * 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });

    this.add.image(0, 0, 'facade').setOrigin(0);
    const door = this.add.image(FACADE.door.x, FACADE.door.bottom, 'door').setOrigin(0.5, 1).setScale(0.62).setFlipX(true);

    // a passer-by and the evening light
    const walker = this.add.sprite(-40, 830, 'passerby-0').setOrigin(0.5, 1).setScale(1.3);
    if (!this.anims.exists('passerby')) this.anims.create({ key: 'passerby', frames: [{ key: 'passerby-0' }, { key: 'passerby-1' }], frameRate: 4, repeat: -1 });
    walker.play('passerby');
    this.tweens.add({ targets: walker, x: VIEW.w + 60, duration: 26000, repeat: -1, delay: 1500 });
    for (const lx of [300, 1300]) this.add.image(lx, 812 - 184, 'glow').setScale(0.7).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.6);

    // title card
    const card = this.add.container(VIEW.w / 2, 120);
    const bg = this.add.rectangle(0, 0, 640, 150, hex(C.paper), 0.94).setStrokeStyle(2, hex(C.brass));
    const t1 = txt(this, 0, -44, 'Een muziekwinkel, 1906', { font: 'sign', size: 34, color: C.navy, origin: [0.5, 0.5] });
    const t2 = txt(this, 0, -2, 'Ontdek bladmuziek uit de collectie van Stichting Omroep Muziek,\nde mensen erachter, en hoe het klonk.', { size: 17, italic: true, color: C.inkSoft, align: 'center', origin: [0.5, 0.5] });
    const t3 = txt(this, 0, 50, 'Klik op de deur om binnen te gaan', { font: 'hand', size: 24, color: C.red, origin: [0.5, 0.5] });
    card.add([bg, t1, t2, t3]);
    this.tweens.add({ targets: t3, alpha: 0.45, duration: 900, yoyo: true, repeat: -1 });

    const enter = () => {
      if (this.data.get('entering')) return;
      this.data.set('entering', true);
      this.sound.play('sfx-bell', { volume: 0.6 });
      this.tweens.add({ targets: door, scaleX: 0.12, duration: 520, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: card, alpha: 0, duration: 300 });
      cam.pan(FACADE.door.x, 620, 900, 'Sine.easeIn');
      cam.zoomTo(3.2, 1000, 'Sine.easeIn');
      cam.fadeOut(900, 7, 11, 20);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Shop'));
    };
    door.setInteractive({ useHandCursor: true }).on('pointerup', enter);
    door.enableFilters();
    const glow = door.filters!.internal.addGlow(hex(C.brassHi), 5, 0, 1, false, 10, 10);
    glow.active = false;
    door.on('pointerover', () => { glow.active = true; });
    door.on('pointerout', () => { glow.active = false; });
    this.input.keyboard?.on('keydown-ENTER', enter);
    this.input.keyboard?.on('keydown-SPACE', enter);
    this.input.keyboard?.on('keydown-E', enter);

    txt(this, VIEW.w - 20, VIEW.h - 14, `Bron: ${services.data.sourceLabel}`, { size: 12, italic: true, color: '#c9c2b0', origin: [1, 1], font: 'print' });
    cam.fadeIn(600, 7, 11, 20);
  }
}
