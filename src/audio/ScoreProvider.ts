import type { Work } from '../data/model';
import type { NoteEvent, Score } from './score';

export interface ScoreProvider {
  /** Return a Score for the work, or undefined if this provider can't. */
  getScore(work: Work): Promise<Score | undefined>;
}

/* ------------------------------------------------------------------------------------------------
 * MusicXmlScoreProvider — the real path. Point Work.scoreUrl at a MusicXML file (e.g. exported by
 * Audiveris from a SOM scan) and this turns it into a Score. Handles the common subset:
 * parts, measures, notes/rests, chords, <backup>/<forward>, ties are treated as separate notes.
 * ---------------------------------------------------------------------------------------------- */
const STEP: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export class MusicXmlScoreProvider implements ScoreProvider {
  async getScore(work: Work): Promise<Score | undefined> {
    if (!work.scoreUrl) return undefined;
    const res = await fetch(work.scoreUrl);
    if (!res.ok) return undefined;
    return parseMusicXml(await res.text(), work.title);
  }
}

export function parseMusicXml(xml: string, title: string): Score {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const notes: NoteEvent[] = [];
  let tempo = 96;
  let timeSignature: [number, number] = [4, 4];
  let length = 0;

  doc.querySelectorAll('part').forEach((part, partIndex) => {
    let divisions = 1;
    let cursor = 0; // in beats
    let lastStart = 0;
    part.querySelectorAll('measure').forEach((measure) => {
      for (const el of Array.from(measure.children)) {
        if (el.tagName === 'attributes') {
          const d = el.querySelector('divisions');
          if (d) divisions = Number(d.textContent) || 1;
          const beats = el.querySelector('time beats');
          const type = el.querySelector('time beat-type');
          if (beats && type) timeSignature = [Number(beats.textContent), Number(type.textContent)];
        } else if (el.tagName === 'direction') {
          const s = el.querySelector('sound[tempo]');
          if (s) tempo = Number(s.getAttribute('tempo')) || tempo;
        } else if (el.tagName === 'backup' || el.tagName === 'forward') {
          const dur = Number(el.querySelector('duration')?.textContent ?? 0) / divisions;
          cursor += el.tagName === 'backup' ? -dur : dur;
        } else if (el.tagName === 'note') {
          const dur = Number(el.querySelector('duration')?.textContent ?? 0) / divisions;
          const isChord = !!el.querySelector('chord');
          const start = isChord ? lastStart : cursor;
          const pitch = el.querySelector('pitch');
          if (pitch && !el.querySelector('rest')) {
            const step = pitch.querySelector('step')?.textContent ?? 'C';
            const alter = Number(pitch.querySelector('alter')?.textContent ?? 0);
            const octave = Number(pitch.querySelector('octave')?.textContent ?? 4);
            notes.push({
              midi: 12 * (octave + 1) + STEP[step] + alter, start, dur,
              voice: partIndex === 0 ? 'melody' : 'chord', velocity: 0.8,
            });
          }
          if (!isChord) { lastStart = cursor; cursor += dur; }
          length = Math.max(length, cursor);
        }
      }
    });
  });
  return { title, tempo, timeSignature, keyName: '', notes, lengthBeats: length, origin: 'musicxml' };
}

/* ------------------------------------------------------------------------------------------------
 * MockScoreProvider — a deterministic little composer so every work in the shop "plays".
 * Same work id → same tune. Genre shapes metre, tempo and accompaniment.
 * ---------------------------------------------------------------------------------------------- */

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 11];
const KEYS = [
  { name: 'C', root: 60 }, { name: 'F', root: 65 }, { name: 'G', root: 55 + 12 },
  { name: 'D', root: 62 }, { name: 'Bes', root: 58 + 12 }, { name: 'Es', root: 63 },
];

interface Style {
  meter: 3 | 4;
  tempo: [number, number];
  /** Rhythm cells for one bar, in beats. */
  cells: number[][];
  accompaniment: 'oompah' | 'waltz' | 'block' | 'arpeggio';
  minor?: boolean;
}

function styleFor(work: Work, r: () => number): Style {
  const g = work.genre.toLowerCase();
  if (g.includes('kerk')) return { meter: 4, tempo: [60, 72], cells: [[2, 2], [1, 1, 2], [3, 1], [4]], accompaniment: 'block' };
  if (g.includes('orkest') || g.includes('opera'))
    return { meter: 4, tempo: [104, 120], cells: [[1.5, 0.5, 1, 1], [1, 1, 1, 1], [1.5, 0.5, 2], [0.5, 0.5, 1, 2], [2, 1, 1]], accompaniment: 'oompah', minor: r() < 0.3 };
  if (g.includes('viool'))
    return { meter: 3, tempo: [88, 104], cells: [[1, 1, 1], [2, 1], [1.5, 0.5, 1], [0.5, 0.5, 1, 1]], accompaniment: 'arpeggio', minor: r() < 0.4 };
  if (g.includes('kinder'))
    return { meter: r() < 0.5 ? 3 : 4, tempo: [100, 116], cells: [[1, 1, 1, 1], [1, 1, 2], [2, 2], [1, 1, 1]], accompaniment: 'oompah' };
  // Liederen, Volksliederen, default: song
  const meter = r() < 0.55 ? 3 : 4;
  return {
    meter, tempo: [72, 92],
    cells: meter === 3 ? [[1, 1, 1], [2, 1], [1.5, 0.5, 1], [3]] : [[1, 1, 1, 1], [1.5, 0.5, 2], [2, 1, 1], [2, 2]],
    accompaniment: meter === 3 ? 'waltz' : 'arpeggio',
    minor: /nacht|night/i.test(work.title) || r() < 0.25,
  };
}

export class MockScoreProvider implements ScoreProvider {
  async getScore(work: Work): Promise<Score> {
    const r = rng(hash(work.id));
    const style = styleFor(work, r);
    const key = KEYS[Math.floor(r() * KEYS.length)];
    const scale = style.minor ? MINOR : MAJOR;
    const tempo = Math.round(style.tempo[0] + r() * (style.tempo[1] - style.tempo[0]));
    const bar = style.meter;
    // Scale degree → MIDI (degree may be negative or >6, wraps octaves).
    const deg = (d: number, base: number) => base + 12 * Math.floor(d / 7) + scale[((d % 7) + 7) % 7];

    // Two 8-bar phrases; chord = scale degree of the root (0 = I, 3 = IV, 4 = V, 5 = vi, 1 = ii).
    const phraseA = [0, 3, 4, 0, 5, 1, 4, 0];
    const phraseB = [0, 3, 0, 4, 5, 3, 4, 0];
    const chords = [...phraseA, ...phraseB, ...phraseA];
    const cellsA = chords.slice(0, 8).map(() => style.cells[Math.floor(r() * style.cells.length)]);

    const notes: NoteEvent[] = [];
    let mel = 2 + Math.floor(r() * 3); // start on 3rd/4th/5th degree
    chords.forEach((chord, b) => {
      const t0 = b * bar;
      const phraseEnd = b % 8 === 7;
      // Repeat the first phrase's rhythm for the reprise: makes it feel composed.
      let cell = b >= 16 ? cellsA[b - 16] : b < 8 ? cellsA[b] : style.cells[Math.floor(r() * style.cells.length)];
      if (phraseEnd) cell = [bar];
      if (cell.reduce((a, c) => a + c, 0) !== bar) cell = Array(bar).fill(1);

      let t = t0;
      cell.forEach((d, i) => {
        const chordTones = [chord, chord + 2, chord + 4, chord + 7, chord - 3, chord - 5];
        if (i === 0) {
          // strong beat: nearest chord tone
          mel = chordTones.reduce((best, c) => (Math.abs(c - mel) < Math.abs(best - mel) ? c : best), chordTones[0]);
          if (phraseEnd && b === chords.length - 1) mel = 0;
        } else {
          const step = [-2, -1, -1, 1, 1, 2][Math.floor(r() * 6)];
          mel = Math.max(-2, Math.min(9, mel + step));
        }
        notes.push({ midi: deg(mel, key.root), start: t, dur: d * 0.95, voice: 'melody', velocity: i === 0 ? 0.9 : 0.75 });
        t += d;
      });

      // Accompaniment, an octave+ below.
      const low = key.root - 24;
      const mid = key.root - 12;
      const root = deg(chord, low);
      const triad = [deg(chord, mid), deg(chord + 2, mid), deg(chord + 4, mid)];
      const push = (midi: number, s: number, d: number, voice: NoteEvent['voice'], v = 0.5) =>
        notes.push({ midi, start: t0 + s, dur: d, voice, velocity: v });
      if (style.accompaniment === 'block' || phraseEnd) {
        push(root, 0, bar * 0.98, 'bass', 0.6);
        triad.forEach((m) => push(m, 0, bar * 0.98, 'chord', 0.42));
      } else if (style.accompaniment === 'waltz') {
        push(root, 0, 0.9, 'bass', 0.6);
        for (const s of [1, 2]) triad.forEach((m) => push(m, s, 0.6, 'chord', 0.32));
      } else if (style.accompaniment === 'oompah') {
        for (let s = 0; s < bar; s++) {
          if (s % 2 === 0) push(s === 0 ? root : deg(chord + 4, low), s, 0.8, 'bass', 0.6);
          else triad.forEach((m) => push(m, s, 0.5, 'chord', 0.32));
        }
      } else {
        const arp = [root, ...triad, triad[1], triad[2]];
        for (let s = 0; s < bar * 2; s++) push(arp[s % arp.length], s * 0.5, 0.9, s === 0 ? 'bass' : 'chord', s === 0 ? 0.55 : 0.3);
      }
    });

    return {
      title: work.title, tempo, timeSignature: [bar, 4], keyName: `${key.name}-${style.minor ? 'mineur' : 'majeur'}`,
      notes, lengthBeats: chords.length * bar, origin: 'mock',
    };
  }
}
