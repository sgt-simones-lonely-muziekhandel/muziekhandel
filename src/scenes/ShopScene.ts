import Phaser from 'phaser';
import type { Work } from '../data/model';
import { DOOR, LAMPS, SPOT_X, WINDOWS, WORLD } from '../game/layout';
import { EVENTS, open, type OverlayKey } from '../game/nav';
import { services, visit } from '../game/services';
import { C, VIEW, hex } from '../game/theme';
import { paintLightBeam, paintVignette } from '../game/art/props';
import { portraitKey } from '../game/art/portrait';
import { coverKey } from '../game/art/sheet';
import { paperKey, txt } from '../game/ui/widgets';

interface Hotspot {
  id: string;
  /** Where the player walks to before using it. */
  standX: number;
  target: Phaser.GameObjects.Image;
  prompt: string;
  use: () => void;
  glow?: Phaser.Filters.Controller;
}

/**
 * Scene 1 — the shop floor. Side-on, walkable, with interactable furniture.
 *
 * Controls: ← → / A D to walk, E / Enter / Space to use what you stand at,
 * or click anything (you walk there first). Close-ups open as overlay scenes.
 */
export class ShopScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private shadow!: Phaser.GameObjects.Image;
  private keys!: Record<'left' | 'right' | 'a' | 'd' | 'e' | 'enter' | 'space', Phaser.Input.Keyboard.Key>;
  private hotspots: Hotspot[] = [];
  private nearest: Hotspot | null = null;
  private walkTarget: { x: number; then?: () => void } | null = null;
  private locked = false;
  private prompt!: Phaser.GameObjects.Container;
  private promptText!: Phaser.GameObjects.Text;
  private bubble!: Phaser.GameObjects.Container;
  private bubbleText!: Phaser.GameObjects.Text;
  private bubbleTimer?: Phaser.Time.TimerEvent;
  private standCover?: Phaser.GameObjects.Image;
  private heldSlip!: Phaser.GameObjects.Container;
  private blur?: Phaser.Filters.Controller;
  private gramophone!: Phaser.GameObjects.Image;
  private gramoSound?: Phaser.Sound.BaseSound;
  private gramoNotes?: Phaser.GameObjects.Particles.ParticleEmitter;
  private tipIndex = 0;

  constructor() { super('Shop'); }

  create() {
    this.hotspots = [];
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD.w, WORLD.h);
    cam.setBackgroundColor('#0d1422');

    this.buildOutside();
    this.add.image(0, 0, 'room').setOrigin(0).setDepth(10);
    this.buildLight();
    this.buildFurniture();
    this.buildPlayer();
    this.buildHud();
    this.buildInput();

    cam.startFollow(this.player, true, 0.09, 0.09, 0, 120);
    cam.setDeadzone(220, 200);
    this.add.image(0, 0, paintVignette(this)).setOrigin(0).setScrollFactor(0).setDepth(250);
    this.blur = cam.filters.internal.addBlur(1, 2, 2, 1.2);
    this.blur.active = false;

    this.game.events.on(EVENTS.opened, this.onOverlayOpened, this);
    this.game.events.on(EVENTS.closed, this.onOverlayClosed, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(EVENTS.opened, this.onOverlayOpened, this);
      this.game.events.off(EVENTS.closed, this.onOverlayClosed, this);
    });

    cam.fadeIn(700, 7, 11, 20);
    this.enterShop();
  }

  /* ------------------------------------------------------------------ world */

  private buildOutside() {
    // Parallax: the canal moves slower than the room → depth through the windows.
    const pf = 0.82;
    this.add.image(0, 0, 'outside').setOrigin(0).setScrollFactor(pf, 1).setDepth(0);
    const boat = this.add.image(-200, 528, 'boat').setOrigin(0.5, 1).setScrollFactor(pf, 1).setDepth(1).setScale(0.8);
    this.tweens.add({ targets: boat, x: WORLD.w + 200, duration: 90000, repeat: -1, delay: 3000 });
    this.tweens.add({ targets: boat, y: 531, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    if (!this.anims.exists('passerby')) {
      this.anims.create({ key: 'passerby', frames: [{ key: 'passerby-0' }, { key: 'passerby-1' }], frameRate: 4, repeat: -1 });
    }
    for (let i = 0; i < 3; i++) {
      const p = this.add.sprite(WORLD.w * (i / 3), 668, 'passerby-0').setOrigin(0.5, 1).setScrollFactor(pf, 1).setDepth(1).setScale(1.25);
      p.play('passerby');
      const dir = i % 2 ? -1 : 1;
      p.setFlipX(dir < 0);
      this.tweens.add({ targets: p, x: dir > 0 ? WORLD.w : 0, duration: 70000 + i * 9000, repeat: -1, yoyo: true, onYoyo: () => p.toggleFlipX(), onRepeat: () => p.toggleFlipX() });
    }
  }

  private buildLight() {
    // daylight falling through the windows onto the floor, with dust motes
    for (const w of WINDOWS) {
      const key = paintLightBeam(this, w.w, WORLD.h - w.top);
      this.add.image(w.x, w.top, key).setOrigin(0).setDepth(55).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.55);
      this.add.particles(0, 0, 'mote', {
        x: { min: w.x + 40, max: w.x + w.w + 260 }, y: { min: w.top + 60, max: WORLD.floor },
        lifespan: 7000, speedX: { min: -6, max: 6 }, speedY: { min: -4, max: 3 },
        scale: { min: 0.25, max: 0.6 }, alpha: { start: 0, end: 0, ease: (t: number) => Math.sin(t * Math.PI) * 0.6 },
        frequency: 380, blendMode: Phaser.BlendModes.ADD,
      }).setDepth(56);
    }
  }

  private buildFurniture() {
    const data = services.data;
    const floor = WORLD.floor;

    // entrance
    const door = this.add.image(DOOR.x, DOOR.top, 'door').setOrigin(0).setDepth(20);
    this.data.set('door', door);
    this.data.set('bell', this.add.image(DOOR.x + DOOR.w + 26, DOOR.top - 6, 'doorbell').setOrigin(0.5, 0).setDepth(21));

    // window display: featured music on easels on the sill
    const featured = data.featuredWorks();
    const win = WINDOWS[0];
    featured.slice(0, 3).forEach((w, i) => {
      const x = win.x + 60 + i * ((win.w - 120) / 2);
      this.add.image(x, win.bottom + 2, 'easel').setOrigin(0.5, 1).setScale(0.75).setDepth(22);
      this.add.image(x, win.bottom - 26, coverKey(w)).setOrigin(0.5, 1).setScale(0.24).setAngle((i - 1) * 3).setDepth(23);
    });
    const windowZone = this.add.image(win.x + win.w / 2, win.top + (win.bottom - win.top) / 2, paperKey(this, 8, 8)).setDisplaySize(win.w, win.bottom - win.top).setAlpha(0.001).setDepth(24);
    this.addHotspot('window', SPOT_X.window, windowZone, 'Etalage: nieuw verschenen', () => this.openOverlay('Cabinet', { featured: true }), false);

    // piano + stool + whatever sheet music is on its desk
    const piano = this.add.image(SPOT_X.piano, floor + 18, 'piano').setOrigin(0.5, 1).setDepth(30);
    this.add.image(SPOT_X.piano - 40, floor + 70, 'stool').setOrigin(0.5, 1).setDepth(70);
    this.addHotspot('piano', SPOT_X.piano, piano, 'Proefspelen aan de piano', () => this.openOverlay('Piano', {}));
    this.refreshPianoStand();

    // window 2, palm in front of it (foreground parallax)
    const palm = this.add.image(1395, WORLD.h + 30, 'palm').setOrigin(0.5, 1).setDepth(90).setScrollFactor(1.18, 1);
    this.tweens.add({ targets: palm, angle: 1.2, duration: 3800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // the big cabinet + library ladder
    const cabinet = this.add.image(SPOT_X.cabinet, floor + 10, 'cabinet').setOrigin(0.5, 1).setDepth(30);
    this.add.image(SPOT_X.cabinet + 330, floor + 12, 'ladder').setOrigin(0.5, 1).setAngle(-6).setDepth(31);
    this.addHotspot('cabinet', SPOT_X.cabinet, cabinet, 'Bladmuziekkast doorzoeken', () => this.openOverlay('Cabinet', {}));

    // behind the counter: shelves, Frisian clock with swinging pendulum, the shopkeeper
    this.add.image(2560, 420, 'wallshelf').setOrigin(0.5, 1).setDepth(25);
    this.add.image(2880, 150, 'clock').setOrigin(0.5, 0).setDepth(25);
    const pend = this.add.image(2880, 150 + 118, 'pendulum').setOrigin(0.5, 0).setDepth(24).setAngle(-9);
    this.tweens.add({ targets: pend, angle: 9, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const keeper = this.add.image(SPOT_X.shopkeeper, floor - 128, 'shopkeeper').setOrigin(0.5, 1).setDepth(32);
    this.tweens.add({ targets: keeper, y: keeper.y - 3, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.add.image(2570, floor + 30, 'counter').setOrigin(0.5, 1).setDepth(40);
    const counterTop = floor + 30 - 230 + 4;
    const index = this.add.image(2390, counterTop, 'cardindex').setOrigin(0.5, 1).setDepth(41);
    this.add.image(2545, counterTop + 2, 'ledger').setOrigin(0.5, 1).setDepth(41);
    this.add.image(2775, counterTop, 'register').setOrigin(0.5, 1).setDepth(41);
    this.addHotspot('catalogue', SPOT_X.catalogue, index, 'Kaartenbak: personen & werken', () => this.openOverlay('Catalogue', {}));
    this.addHotspot('shopkeeper', SPOT_X.shopkeeper, keeper, 'Praten met mijnheer Van der Velde', () => this.talk());

    // portrait wall: the most-connected people in the data, salon-hung
    const people = data.notablePeople(6);
    const slots = [[3090, 250], [3270, 225], [3450, 250], [3120, 470], [3290, 455], [3460, 470]];
    this.add.rectangle(3270, 128, 520, 4, hex(C.brass)).setDepth(24); // picture rail
    txt(this, 3270, 108, 'COMPONISTEN  &  KUNSTENAARS', { font: 'sign', size: 20, color: C.brassHi, origin: [0.5, 0.5] }).setDepth(24);
    people.forEach((p, i) => {
      const [x, y] = slots[i];
      const g = this.add.graphics().setDepth(24);
      g.lineStyle(1.5, hex('#8a6a32'), 0.9);
      g.lineBetween(x, 130, x - 30, y - 95); g.lineBetween(x, 130, x + 30, y - 95);
      const img = this.add.image(x, y, portraitKey(p)).setDepth(26).setScale(i < 3 ? 1 : 0.9);
      this.add.rectangle(x, y + 104, 120, 20, hex(C.brass)).setDepth(26).setStrokeStyle(1, hex('#5a3e14'));
      txt(this, x, y + 104, p.name, { font: 'sign', size: 11, color: '#2c1d08', origin: [0.5, 0.5] }).setDepth(27).setScale(Math.min(1, 110 / (p.name.length * 6.6)));
      this.addHotspot(`person-${p.id}`, x, img, `Portret: ${p.name}`, () => this.openOverlay('Person', { id: p.id }));
    });
    this.add.image(2990, floor + 60, 'chair').setOrigin(0.5, 1).setDepth(88).setScrollFactor(1.1, 1);

    // poster + gramophone
    this.add.image(3700, 170, 'poster').setOrigin(0.5, 0).setDepth(25).setAngle(1.5);
    // the table stands against the wall (behind the visitor), who winds it from the left
    this.add.image(SPOT_X.gramophone, floor + 10, 'sidetable').setOrigin(0.5, 1).setDepth(44);
    this.gramophone = this.add.image(SPOT_X.gramophone + 10, floor + 10 - 218, 'gramophone').setOrigin(0.5, 1).setDepth(45);
    this.addHotspot('gramophone', SPOT_X.gramophone - 120, this.gramophone, 'Grammofoon: laat het klinken', () => this.toggleGramophone());

    // pendant lamps with warm additive glow, gently swaying
    for (const lx of LAMPS) {
      const lamp = this.add.image(lx, 0, 'lamp').setOrigin(0.5, 0).setDepth(80);
      const glow = this.add.image(lx, 236, 'glow').setScale(2.2).setDepth(81).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.55);
      const pool = this.add.image(lx, floor + 70, 'glow').setScale(3.2, 0.5).setDepth(15).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.35);
      this.tweens.add({ targets: lamp, angle: { from: -0.8, to: 0.8 }, duration: 3000 + lx % 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: [glow, pool], alpha: '-=0.06', duration: 160 + (lx % 7) * 40, yoyo: true, repeat: -1 });
    }
  }

  private addHotspot(id: string, standX: number, target: Phaser.GameObjects.Image, prompt: string, use: () => void, glow = true) {
    const h: Hotspot = { id, standX, target, prompt, use };
    if (glow) {
      target.enableFilters();
      h.glow = target.filters!.internal.addGlow(hex(C.brassHi), 4, 0, 1, false, 10, 8);
      h.glow.active = false;
    }
    target.setInteractive({ useHandCursor: true });
    target.on('pointerover', () => { if (!this.locked && h.glow) h.glow.active = true; });
    target.on('pointerout', () => { if (h !== this.nearest && h.glow) h.glow.active = false; });
    target.on('pointerup', (_p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
      if (this.locked) return;
      ev.stopPropagation();
      this.walkTo(standX, () => use());
    });
    this.hotspots.push(h);
  }

  private buildPlayer() {
    if (!this.anims.exists('walk')) {
      this.anims.create({ key: 'walk', frames: [0, 1, 2, 3, 4, 5].map((f) => ({ key: `player-${f}` })), frameRate: 11, repeat: -1 });
    }
    const startX = visit.enteredShop ? visit.playerX || 420 : DOOR.x + DOOR.w / 2;
    this.shadow = this.add.image(startX, WORLD.walkY - 2, 'shadow').setDepth(49).setScale(1.5, 1.6);
    this.player = this.add.sprite(startX, WORLD.walkY, 'player-6').setOrigin(0.5, 1).setDepth(50);
  }

  /* ------------------------------------------------------------------ HUD */

  private buildHud() {
    // floating prompt above the nearest hotspot (world space)
    this.prompt = this.add.container(0, 0).setDepth(200).setVisible(false);
    const bobber = this.add.container(0, 0);
    this.prompt.add(bobber);
    const pbg = this.add.rectangle(0, 0, 10, 34, hex(C.paper), 0.95).setStrokeStyle(1.5, hex(C.brass));
    const key = this.add.rectangle(0, 0, 26, 24, hex(C.navy)).setStrokeStyle(1, hex(C.brassHi));
    const keyT = txt(this, 0, 0, 'E', { font: 'sign', size: 15, color: C.cream, origin: [0.5, 0.5] });
    this.promptText = txt(this, 0, 0, '', { size: 16, color: C.ink, origin: [0, 0.5] });
    bobber.add([pbg, key, keyT, this.promptText]);
    this.prompt.setData('layout', () => {
      const w = this.promptText.width + 60;
      pbg.setSize(w, 34); pbg.setOrigin(0.5);
      key.setPosition(-w / 2 + 20, 0); keyT.setPosition(-w / 2 + 20, 0);
      this.promptText.setPosition(-w / 2 + 40, 0);
    });
    this.tweens.add({ targets: bobber, y: -6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // shopkeeper's speech bubble (world space, above him)
    this.bubble = this.add.container(SPOT_X.shopkeeper - 40, 330).setDepth(210).setVisible(false);
    const tail = this.add.triangle(60, -2, 0, 0, 30, 0, 40, 26, hex('#efe8d8')).setOrigin(0, 0);
    this.bubbleText = txt(this, -200, 0, '', { font: 'hand', size: 20, color: C.navy, width: 400, lineSpacing: 4 });
    this.bubble.add([tail, this.bubbleText]);

    // fixed HUD: controls hint and the "in hand" slip
    const hint = txt(this, 22, VIEW.h - 18, '←  →  lopen     E  bekijken     of klik op wat je ziet', { size: 14, italic: true, color: '#d8cfb8', origin: [0, 1] });
    hint.setScrollFactor(0).setDepth(300);
    this.heldSlip = this.add.container(VIEW.w - 20, 20).setScrollFactor(0).setDepth(300);
    this.refreshHeldSlip();
  }

  private refreshHeldSlip() {
    this.heldSlip.removeAll(true);
    const work = visit.workId ? services.data.allWorks().find((w) => w.id === visit.workId) : undefined;
    if (!work) return;
    const bg = this.add.image(0, 0, paperKey(this, 330, 74, 'cream')).setOrigin(1, 0);
    const thumb = this.add.image(-308, 8, coverKey(work)).setOrigin(0, 0).setScale(0.145);
    const a = txt(this, -246, 12, 'In de hand', { size: 12, italic: true, color: C.inkSoft });
    const b = txt(this, -246, 30, work.title, { font: 'sign', size: 19, color: C.navy });
    if (b.width > 230) b.setScale(230 / b.width);
    this.heldSlip.add([this.add.rectangle(4, 5, 330, 74, 0, 0.3).setOrigin(1, 0), bg, thumb, a, b]);
    bg.setInteractive({ useHandCursor: true }).on('pointerup', () => !this.locked && this.openOverlay('Work', { id: work.id }));
  }

  private refreshPianoStand() {
    this.standCover?.destroy();
    const work = visit.workId ? services.data.allWorks().find((w) => w.id === visit.workId) : undefined;
    if (!work) return;
    this.standCover = this.add.image(SPOT_X.piano, WORLD.floor + 18 - 400 + 150, coverKey(work)).setOrigin(0.5, 1).setScale(0.3).setDepth(31);
  }

  /* ------------------------------------------------------------------ input & movement */

  private buildInput() {
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys({ left: 'LEFT', right: 'RIGHT', a: 'A', d: 'D', e: 'E', enter: 'ENTER', space: 'SPACE' }) as ShopScene['keys'];
    const useNearest = () => { if (!this.locked && this.nearest) this.nearest.use(); };
    kb.on('keydown-E', useNearest);
    kb.on('keydown-ENTER', useNearest);
    kb.on('keydown-SPACE', useNearest);
    this.input.on('pointerup', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (this.locked || over.length) return;
      this.walkTo(p.worldX);
    });
  }

  private walkTo(x: number, then?: () => void) {
    this.walkTarget = { x: Phaser.Math.Clamp(x, 160, WORLD.w - 140), then };
  }

  update(_t: number, dtMs: number) {
    if (this.locked) { this.player.anims.stop(); this.player.setTexture('player-6'); return; }
    const dt = dtMs / 1000;
    const speed = 340;
    let dir = 0;
    if (this.keys.left.isDown || this.keys.a.isDown) dir = -1;
    else if (this.keys.right.isDown || this.keys.d.isDown) dir = 1;
    if (dir) this.walkTarget = null;
    else if (this.walkTarget) {
      const dx = this.walkTarget.x - this.player.x;
      if (Math.abs(dx) < 6) {
        const then = this.walkTarget.then;
        this.walkTarget = null;
        then?.();
      } else dir = Math.sign(dx);
    }

    if (dir) {
      this.player.x = Phaser.Math.Clamp(this.player.x + dir * speed * dt, 160, WORLD.w - 140);
      this.player.setFlipX(dir < 0);
      if (!this.player.anims.isPlaying) this.player.play('walk');
    } else if (this.player.anims.isPlaying) {
      this.player.anims.stop();
      this.player.setTexture('player-6');
    }
    this.shadow.x = this.player.x;
    visit.playerX = this.player.x;

    // nearest hotspot within reach gets the glow + prompt
    let best: Hotspot | null = null;
    let bestD = 150;
    for (const h of this.hotspots) {
      const d = Math.abs(h.standX - this.player.x);
      if (d < bestD) { bestD = d; best = h; }
    }
    if (this.bubble.visible) this.bubble.x = Phaser.Math.Clamp(SPOT_X.shopkeeper - 40, this.cameras.main.scrollX + 250, this.cameras.main.scrollX + VIEW.w - 250);
    if (best !== this.nearest) {
      if (this.nearest?.glow) this.nearest.glow.active = false;
      this.nearest = best;
      if (best) {
        if (best.glow) best.glow.active = true;
        this.promptText.setText(best.prompt);
        (this.prompt.getData('layout') as () => void)();
        const b = best.target.getBounds();
        this.prompt.setPosition(Phaser.Math.Clamp(b.centerX, 200, WORLD.w - 200), Math.max(150, b.top - 30)).setVisible(true);
      } else this.prompt.setVisible(false);
    }
  }

  /* ------------------------------------------------------------------ actions */

  private openOverlay(key: OverlayKey, data: object) {
    this.stopGramophone();
    open(this, key, data);
  }

  private onOverlayOpened() {
    this.locked = true;
    this.walkTarget = null;
    if (this.blur) this.blur.active = true;
    this.prompt.setVisible(false);
    this.bubble.setVisible(false);
  }

  private onOverlayClosed() {
    this.locked = false;
    if (this.blur) this.blur.active = false;
    this.nearest = null;
    this.refreshHeldSlip();
    this.refreshPianoStand();
  }

  private say(lines: string, ms = 6000) {
    // keep the bubble on screen even when the shopkeeper is not
    const cam = this.cameras.main;
    this.bubble.x = Phaser.Math.Clamp(this.bubble.x, cam.scrollX + 250, cam.scrollX + VIEW.w - 250);
    this.bubbleText.setText(lines);
    // size the paper to the text
    const h = Math.ceil(this.bubbleText.height + 36);
    this.bubble.getByName('paper')?.destroy();
    const bg = this.add.image(0, 0, paperKey(this, 440, h, 'cream')).setOrigin(0.5, 1).setName('paper');
    this.bubble.addAt(bg, 1);
    this.bubbleText.setPosition(-200, -h + 16);
    this.bubble.setVisible(true).setAlpha(0).setScale(0.9);
    this.tweens.add({ targets: this.bubble, alpha: 1, scale: 1, duration: 200, ease: 'Back.easeOut' });
    this.bubbleTimer?.remove();
    this.bubbleTimer = this.time.delayedCall(ms, () => this.tweens.add({ targets: this.bubble, alpha: 0, duration: 300, onComplete: () => this.bubble.setVisible(false) }));
  }

  private talk() {
    const held = visit.workId ? services.data.allWorks().find((w) => w.id === visit.workId) : undefined;
    const tips = [
      'In de grote kast staat alle bladmuziek, per rubriek. Kies maar iets uit!',
      'Wie de muziek maakte? Kijk naar de portretten aan de wand: elk portret vertelt over leermeesters, vrienden en collega\'s.',
      'In de kaartenbak op de toonbank vindt u iedere persoon en ieder werk dat wij kennen.',
      'Wilt u het horen? Leg de muziek op de piano, of zet de grammofoon aan.',
    ];
    if (held && this.tipIndex % 2 === 0) {
      const by = services.data.primaryPerson(held);
      this.say(`Ah, „${held.title}"${by ? ` van ${by.name}` : ''}. Een uitstekende keus! Probeer het eens aan de piano, of op de grammofoon.`);
    } else {
      this.say(tips[this.tipIndex % tips.length]);
    }
    this.tipIndex++;
  }

  private heldWork(): Work | undefined {
    return visit.workId ? services.data.allWorks().find((w) => w.id === visit.workId) : undefined;
  }

  private async toggleGramophone() {
    if (this.gramoSound?.isPlaying) { this.stopGramophone(); return; }
    let work = this.heldWork();
    if (!work) {
      work = services.data.featuredWorks()[0];
      this.say(`U heeft nog geen muziek gekozen. Ik zet „${work.title}" voor u op.`, 4500);
    }
    const label = txt(this, SPOT_X.gramophone, WORLD.floor - 480, 'De naald zakt…', { font: 'hand', size: 20, color: C.cream, origin: [0.5, 0.5] }).setDepth(220);
    const playable = await services.music.prepare(work, visit.instrument, 'gramophone');
    label.setText(`♪ ${work.title}`);
    this.time.delayedCall(4000, () => label.destroy());
    this.gramoSound = this.sound.add(playable.key, { volume: 0.8 });
    this.gramoSound.play();
    this.gramoSound.once('complete', () => this.stopGramophone());
    this.gramoNotes = this.add.particles(SPOT_X.gramophone + 80, WORLD.floor - 420, 'note', {
      speedX: { min: 10, max: 50 }, speedY: { min: -60, max: -30 }, lifespan: 2600,
      alpha: { start: 0.9, end: 0 }, scale: { start: 0.7, end: 1.1 }, rotate: { min: -20, max: 20 }, frequency: 420,
    }).setDepth(220);
    this.tweens.add({ targets: this.gramophone, scaleY: 1.015, duration: 300, yoyo: true, repeat: -1 });
  }

  private stopGramophone() {
    this.gramoSound?.stop();
    this.gramoSound?.destroy();
    this.gramoSound = undefined;
    this.gramoNotes?.stop();
    const notes = this.gramoNotes;
    this.time.delayedCall(2600, () => notes?.destroy());
    this.gramoNotes = undefined;
    this.tweens.killTweensOf(this.gramophone);
    this.gramophone?.setScale(1);
  }

  private enterShop() {
    if (visit.enteredShop) return;
    visit.enteredShop = true;
    this.locked = true;
    const door = this.data.get('door') as Phaser.GameObjects.Image;
    const bell = this.data.get('bell') as Phaser.GameObjects.Image;
    this.sound.play('sfx-bell', { volume: 0.5 });
    this.tweens.add({ targets: bell, angle: { from: -16, to: 16 }, duration: 120, yoyo: true, repeat: 5, onComplete: () => bell.setAngle(0) });
    this.tweens.add({ targets: door, scaleX: 0.15, duration: 400, yoyo: true, hold: 900, ease: 'Sine.easeInOut' });
    this.time.delayedCall(500, () => {
      this.locked = false;
      // called from behind the counter; the bubble is clamped into view
      this.walkTo(460, () => this.say('(van achter de toonbank) Goedemiddag, welkom in de muziekhandel! Kijk gerust rond: de bladmuziek staat in de grote kast, de componisten hangen aan de wand. Loop met ← → of klik waar u heen wilt.', 8000));
    });
  }
}
