import Phaser from 'phaser';
import type { Playable } from '../audio/MusicService';
import { INSTRUMENTS, type InstrumentId } from '../audio/SynthRenderer';
import type { Score } from '../audio/score';
import type { Work } from '../data/model';
import { grain, panel, paint, seeded } from '../game/art/canvas';
import { coverKey } from '../game/art/sheet';
import { pushTrail, services, visit } from '../game/services';
import { C, VIEW, hex } from '../game/theme';
import { engrave, type StaffSystem } from '../game/ui/notation';
import { paperKey, plaque, txt, type Plaque } from '../game/ui/widgets';
import { OverlayScene } from './OverlayScene';

const LOW = 36, HIGH = 96; // C2..C7 shown on the keyboard
const LEAD_IN = 0.15; // SynthRenderer starts notes 150 ms in
const BARS_PER_PAGE = 4;

/** Scene 6 — at the piano: the score on the music desk, keys that move, instrument choice. */
export class PianoScene extends OverlayScene<{ id?: string }> {
  private work!: Work;
  private score?: Score;
  private sound_?: Phaser.Sound.WebAudioSound;
  private playable?: Playable;
  private system?: StaffSystem;
  private desk!: Phaser.GameObjects.Container;
  private keys = new Map<number, Phaser.GameObjects.Rectangle>();
  private status!: Phaser.GameObjects.Text;
  private playBtn!: Plaque;
  private instrumentBtns = new Map<InstrumentId, Plaque>();
  private page = -1;
  private flames: Phaser.GameObjects.Ellipse[] = [];

  constructor() { super('Piano'); }

  protected build() {
    const data = services.data;
    const id = this.payload.id ?? visit.workId ?? data.featuredWorks()[0]?.id;
    this.work = data.allWorks().find((w) => w.id === id)!;
    visit.workId = this.work.id;
    pushTrail({ kind: 'work', id: this.work.id, label: this.work.title });
    this.drawTrail();

    this.add.image(VIEW.w / 2, VIEW.h / 2, this.paintPianoFront());
    this.buildCandles();
    this.desk = this.add.container(VIEW.w / 2, 330);
    this.desk.add(this.add.rectangle(6, 8, 1000, 330, 0x000000, 0.4));
    this.desk.add(this.add.image(0, 0, paperKey(this, 1000, 330, 'aged')));
    this.desk.add(txt(this, 0, -140, this.work.title, { font: 'sign', size: 26, color: C.ink, origin: [0.5, 0.5] }));
    this.desk.add(this.add.image(-470, -150, coverKey(this.work)).setOrigin(0, 0).setScale(0.16).setAngle(-4));
    this.buildKeyboard();
    this.buildControls();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.stop());
    void this.prepare();
  }

  private paintPianoFront() {
    return paint(this, 'piano-close', VIEW.w, VIEW.h, (ctx, w, h) => {
      const r = seeded(13);
      ctx.fillStyle = '#1a0f09'; ctx.fillRect(0, 0, w, h);
      grain(ctx, 0, 0, w, h, r, 0.12);
      panel(ctx, 40, 80, w - 80, 420, '#21140c', 14);
      // fretwork with faded red silk
      ctx.fillStyle = '#4a221e'; ctx.fillRect(80, 110, w - 160, 70);
      ctx.strokeStyle = '#21140c'; ctx.lineWidth = 6;
      for (let x = 100; x < w - 100; x += 60) { ctx.beginPath(); ctx.arc(x, 145, 22, 0, Math.PI * 2); ctx.stroke(); }
      ctx.strokeStyle = '#b8893a'; ctx.lineWidth = 2; ctx.strokeRect(80, 110, w - 160, 70);
      // music desk ledge
      panel(ctx, 260, 498, w - 520, 22, '#3a2414', 0);
      // fallboard + key slip
      panel(ctx, 0, 560, w, 70, '#24160e', 0);
      ctx.font = '22px Federo, serif'; ctx.fillStyle = '#c9a65a'; ctx.textAlign = 'center';
      ctx.fillText('VAN DER VELDE · AMSTERDAM', w / 2, 604);
      panel(ctx, 0, 836, w, 64, '#1f120a', 0);
    });
  }

  private buildCandles() {
    for (const x of [58, VIEW.w - 58]) {
      this.add.rectangle(x, 470, 60, 8, hex(C.brass));
      this.add.rectangle(x, 420, 16, 90, hex('#efe8d6'));
      const flame = this.add.ellipse(x, 364, 12, 26, hex('#f6cf72'));
      this.add.image(x, 364, 'glow').setScale(1.2).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.7);
      this.tweens.add({ targets: flame, scaleY: 0.85, scaleX: 1.1, duration: 120 + Math.random() * 80, yoyo: true, repeat: -1 });
      this.flames.push(flame);
    }
  }

  private buildKeyboard() {
    const x0 = 40, x1 = VIEW.w - 40, y = 640, hW = 190;
    const whites: number[] = [];
    for (let m = LOW; m <= HIGH; m++) if (![1, 3, 6, 8, 10].includes(m % 12)) whites.push(m);
    const kw = (x1 - x0) / whites.length;
    whites.forEach((m, i) => {
      const k = this.add.rectangle(x0 + i * kw + kw / 2, y, kw - 2, hW, hex('#efe9da')).setOrigin(0.5, 0).setStrokeStyle(1, hex('#8a8170'));
      this.keys.set(m, k);
      k.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.tap(m));
    });
    whites.forEach((m, i) => {
      if ([0, 2, 5, 7, 9].includes(m % 12) && m + 1 <= HIGH) {
        const k = this.add.rectangle(x0 + (i + 1) * kw, y, kw * 0.6, hW * 0.62, hex('#16110d')).setOrigin(0.5, 0);
        this.keys.set(m + 1, k);
        k.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.tap(m + 1));
      }
    });
    this.add.rectangle(VIEW.w / 2, y, x1 - x0 + 10, 8, hex('#2a190f')).setOrigin(0.5, 1);
  }

  private buildControls() {
    this.playBtn = plaque(this, VIEW.w / 2, 532, '▶  Spelen', () => this.togglePlay(), { w: 220, h: 46, size: 20 });
    this.status = txt(this, VIEW.w / 2, 120, '', { font: 'hand', size: 22, color: C.cream, origin: [0.5, 0.5] });
    txt(this, 110, 236, 'Bespeel als', { font: 'hand', size: 24, color: C.cream });
    INSTRUMENTS.forEach((ins, i) => {
      const b = plaque(this, 180, 290 + i * 46, ins.nl, () => this.choose(ins.id), { w: 140, h: 38, size: 15 });
      if (i >= 3) b.setPosition(VIEW.w - 180, 290 + (i - 3) * 46);
      this.instrumentBtns.set(ins.id, b);
    });
    txt(this, VIEW.w - 110, 236, 'Klank', { font: 'hand', size: 24, color: C.cream, origin: [1, 0] });
    this.markInstrument();
  }

  private markInstrument() {
    for (const [id, b] of this.instrumentBtns) b.setAlpha(id === visit.instrument ? 1 : 0.78).setScale(id === visit.instrument ? 1.06 : 1);
  }

  private async prepare(autoplay = false) {
    this.playBtn.setEnabled(false);
    this.status.setText('De pianist studeert het stuk in…');
    try {
      this.playable = await services.music.prepare(this.work, visit.instrument);
      if (!this.scene.isActive()) return;
      this.score = this.playable.score;
      this.page = -1;
      this.showPage(0);
      const origin = this.playable.origin === 'mock'
        ? 'Proef-synthese uit een voorlopige partituur. Straks: noten uit de gescande SOM-bladmuziek.'
        : this.playable.origin === 'musicxml' ? 'Gespeeld uit de partituur (MusicXML)' : 'Opname';
      this.status.setText(origin);
      this.playBtn.setEnabled(true);
      if (autoplay) this.togglePlay();
    } catch (e) {
      this.status.setText(`Dit stuk kan (nog) niet klinken: ${(e as Error).message}`);
    }
  }

  private showPage(p: number) {
    if (!this.score || p === this.page) return;
    this.page = p;
    this.system?.container.destroy();
    const beats = BARS_PER_PAGE * this.score.timeSignature[0];
    if (p * beats >= this.score.lengthBeats) return;
    this.system = engrave(this, -460, -84, 920, this.score, p * beats, BARS_PER_PAGE, 11);
    this.desk.add(this.system.container);
    if (p > 0) {
      this.sound.play('sfx-page', { volume: 0.3 });
      this.system.container.setAlpha(0);
      this.tweens.add({ targets: this.system.container, alpha: 1, duration: 200 });
    }
  }

  private choose(id: InstrumentId) {
    if (id === visit.instrument) return;
    const wasPlaying = !!this.sound_?.isPlaying;
    this.stop();
    visit.instrument = id;
    this.markInstrument();
    void this.prepare(wasPlaying);
  }

  private togglePlay() {
    if (this.sound_?.isPlaying) { this.stop(); return; }
    if (!this.playable) return;
    this.sound_ = this.sound.add(this.playable.key, { volume: 0.9 }) as Phaser.Sound.WebAudioSound;
    this.sound_.once('complete', () => this.stop());
    this.sound_.play();
    this.showPage(0);
    this.playBtn.list.forEach((o) => o instanceof Phaser.GameObjects.Text && o.setText('■  Stoppen'));
  }

  private stop() {
    this.sound_?.stop();
    this.sound_?.destroy();
    this.sound_ = undefined;
    this.playBtn?.list.forEach((o) => o instanceof Phaser.GameObjects.Text && o.setText('▶  Spelen'));
    this.system?.setPlayhead(-1);
    for (const [m, k] of this.keys) this.paintKey(m, k, false);
  }

  /** Clicking a key plays a single note — a little toy, and a sound check. */
  private tap(midi: number) {
    const ctx = (this.sound as Phaser.Sound.WebAudioSoundManager).context;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
    o.connect(g).connect((this.sound as Phaser.Sound.WebAudioSoundManager).destination);
    o.start(); o.stop(ctx.currentTime + 1.3);
    const k = this.keys.get(midi);
    if (k) { this.paintKey(midi, k, true); this.time.delayedCall(180, () => this.paintKey(midi, k, false)); }
  }

  private paintKey(midi: number, k: Phaser.GameObjects.Rectangle, on: boolean) {
    const black = [1, 3, 6, 8, 10].includes(midi % 12);
    k.setFillStyle(on ? hex(black ? '#8a3a1c' : '#e7b07a') : hex(black ? '#16110d' : '#efe9da'));
    k.y = on ? 643 : 640;
  }

  update() {
    if (!this.sound_?.isPlaying || !this.score) return;
    const beat = ((this.sound_.seek - LEAD_IN) * this.score.tempo) / 60;
    const beatsPerPage = BARS_PER_PAGE * this.score.timeSignature[0];
    this.showPage(Math.max(0, Math.floor(beat / beatsPerPage)));
    this.system?.setPlayhead(beat);
    const sounding = new Set(this.score.notes.filter((n) => beat >= n.start && beat < n.start + n.dur).map((n) => n.midi));
    for (const [m, k] of this.keys) this.paintKey(m, k, sounding.has(m));
  }
}
