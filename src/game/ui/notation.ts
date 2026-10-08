import Phaser from 'phaser';
import type { NoteEvent, Score } from '../../audio/score';
import { C, F, hex } from '../theme';

/**
 * Engraves a few bars of a Score onto a two-stave system with Phaser Graphics.
 * Not a full engraver — just enough that what plays is what you see, with a playhead.
 */

// Diatonic step of each pitch class in C (accidentals drawn as ♯ on the lower step).
const STEP = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
const SHARP = [false, true, false, true, false, false, true, false, true, false, true, false];

/** Diatonic position relative to a reference pitch (E4 for treble bottom line, G2 for bass). */
function diatonic(midi: number) { return Math.floor(midi / 12) * 7 + STEP[midi % 12]; }
const E4 = diatonic(64);
const G2 = diatonic(43);

export interface StaffSystem {
  container: Phaser.GameObjects.Container;
  /** Highlight notes sounding at `beat`. */
  setPlayhead(beat: number): void;
  fromBeat: number;
  toBeat: number;
}

export function engrave(
  scene: Phaser.Scene, x: number, y: number, width: number, score: Score,
  fromBeat: number, bars: number, gap = 9,
): StaffSystem {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  c.add(g);
  const barBeats = score.timeSignature[0];
  const toBeat = fromBeat + bars * barBeats;
  const ink = hex(C.ink);
  const trebleY = 0, bassY = gap * 9;
  const left = 54;
  const span = width - left - 10;
  const bx = (beat: number) => left + ((beat - fromBeat) / (toBeat - fromBeat)) * span;

  g.lineStyle(1, ink, 0.85);
  for (const sy of [trebleY, bassY]) for (let i = 0; i < 5; i++) g.lineBetween(0, sy + i * gap, width, sy + i * gap);
  g.lineStyle(2, ink, 1);
  g.lineBetween(0, trebleY, 0, bassY + 4 * gap);
  for (let b = 0; b <= bars; b++) { const xx = b === 0 ? left - 6 : bx(fromBeat + b * barBeats); g.lineStyle(1.2, ink, 0.9); g.lineBetween(xx, trebleY, xx, bassY + 4 * gap); }

  c.add(scene.add.text(4, trebleY - gap * 2.6, '𝄞', { fontFamily: 'serif', fontSize: `${gap * 6.4}px`, color: C.ink }).setResolution(2));
  c.add(scene.add.text(6, bassY - gap * 0.6, '𝄢', { fontFamily: 'serif', fontSize: `${gap * 3.6}px`, color: C.ink }).setResolution(2));
  if (fromBeat === 0) {
    c.add(scene.add.text(34, trebleY + gap * 0.1, `${score.timeSignature[0]}\n4`, { fontFamily: F.sign, fontSize: `${gap * 1.9}px`, color: C.ink, lineSpacing: -gap * 0.55 }).setResolution(2));
  }

  const notes = score.notes.filter((n) => n.start >= fromBeat && n.start < toBeat);
  const heads: { n: NoteEvent; gfx: Phaser.GameObjects.Ellipse }[] = [];
  for (const n of notes) {
    const treble = n.voice === 'melody';
    const pos = treble ? diatonic(n.midi) - E4 : diatonic(n.midi) - G2;
    const staffTop = treble ? trebleY : bassY;
    const ny = staffTop + 4 * gap - (pos * gap) / 2;
    const nx = bx(n.start) + 8;
    // ledger lines
    g.lineStyle(1, ink, 0.85);
    for (let p = -2; p >= pos; p -= 2) g.lineBetween(nx - 9, staffTop + 4 * gap - (p * gap) / 2, nx + 9, staffTop + 4 * gap - (p * gap) / 2);
    for (let p = 10; p <= pos; p += 2) g.lineBetween(nx - 9, staffTop + 4 * gap - (p * gap) / 2, nx + 9, staffTop + 4 * gap - (p * gap) / 2);
    const hollow = n.dur >= 1.9;
    const head = scene.add.ellipse(nx, ny, gap * 1.35, gap * 0.95, hollow ? hex(C.paper) : ink).setStrokeStyle(1.6, ink).setAngle(-20);
    c.add(head);
    heads.push({ n, gfx: head });
    if (n.dur < 3.8) {
      const up = pos < 4;
      const sx = up ? nx + gap * 0.62 : nx - gap * 0.62;
      g.lineStyle(1.3, ink, 1);
      g.lineBetween(sx, ny, sx, ny + (up ? -gap * 3.3 : gap * 3.3));
      if (n.dur <= 0.6) g.lineBetween(sx, ny + (up ? -gap * 3.3 : gap * 3.3), sx + 7, ny + (up ? -gap * 2.4 : gap * 2.4));
    }
    if (n.dur % 1 === 0.5 && n.dur > 1) c.add(scene.add.circle(nx + gap, ny, 1.8, ink));
    if (SHARP[n.midi % 12]) c.add(scene.add.text(nx - gap * 2, ny - gap * 1.1, '♯', { fontFamily: 'serif', fontSize: `${gap * 1.8}px`, color: C.ink }).setResolution(2));
  }

  const playhead = scene.add.rectangle(bx(fromBeat), trebleY - gap, 3, bassY + 6 * gap, hex(C.orange), 0.0).setOrigin(0.5, 0);
  c.add(playhead);

  return {
    container: c, fromBeat, toBeat,
    setPlayhead(beat: number) {
      const inside = beat >= fromBeat && beat < toBeat;
      playhead.setAlpha(inside ? 0.55 : 0);
      if (inside) playhead.x = bx(beat) + 8;
      for (const h of heads) {
        const on = inside && beat >= h.n.start && beat < h.n.start + h.n.dur;
        h.gfx.setFillStyle(on ? hex(C.orange) : h.n.dur >= 1.9 ? hex(C.paper) : ink);
        h.gfx.setScale(on ? 1.25 : 1);
      }
    },
  };
}
