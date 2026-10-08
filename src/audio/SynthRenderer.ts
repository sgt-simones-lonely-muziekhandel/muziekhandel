import { beatsToSeconds, midiToFreq, scoreSeconds, type NoteEvent, type Score } from './score';

/**
 * Renders a Score to an AudioBuffer offline (fast, glitch-free), with a choice of period
 * instruments for the melody. Small additive/subtractive synths — no sample downloads.
 * A future version can swap in SoundFont samples behind the same `render()` signature.
 */

export type InstrumentId = 'piano' | 'violin' | 'flute' | 'clarinet' | 'harmonium' | 'voice';

export const INSTRUMENTS: { id: InstrumentId; nl: string }[] = [
  { id: 'piano', nl: 'Piano' },
  { id: 'violin', nl: 'Viool' },
  { id: 'flute', nl: 'Fluit' },
  { id: 'clarinet', nl: 'Klarinet' },
  { id: 'harmonium', nl: 'Harmonium' },
  { id: 'voice', nl: 'Zangstem' },
];

export type Finish = 'room' | 'gramophone';

type Ctx = OfflineAudioContext;

function envelope(ctx: Ctx, gain: GainNode, t: number, dur: number, a: number, peak: number, release: number, sustain = 0.8) {
  const g = gain.gain;
  g.setValueAtTime(0, t);
  g.linearRampToValueAtTime(peak, t + a);
  g.setTargetAtTime(peak * sustain, t + a, 0.15);
  g.setValueAtTime(peak * sustain, t + Math.max(a, dur));
  g.linearRampToValueAtTime(0, t + Math.max(a, dur) + release);
  void ctx;
}

function vibrato(ctx: Ctx, osc: OscillatorNode, t: number, end: number, cents = 12, rate = 5.4) {
  const lfo = ctx.createOscillator();
  const depth = ctx.createGain();
  lfo.frequency.value = rate;
  depth.gain.setValueAtTime(0, t);
  depth.gain.linearRampToValueAtTime(cents, t + 0.35); // vibrato blooms after the attack
  lfo.connect(depth).connect(osc.detune);
  lfo.start(t);
  lfo.stop(end);
}

function playNote(ctx: Ctx, out: AudioNode, inst: InstrumentId, n: NoteEvent, t: number, dur: number) {
  const f = midiToFreq(n.midi);
  const v = n.velocity;
  const g = ctx.createGain();
  g.connect(out);
  const end = t + dur + 1.6;

  const osc = (type: OscillatorType, freq: number, level: number, dest: AudioNode = g) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const og = ctx.createGain();
    og.gain.value = level;
    o.connect(og).connect(dest);
    o.start(t);
    o.stop(end);
    return o;
  };

  switch (inst) {
    case 'piano': {
      // Hammered string: bright attack, long exponential decay, slight inharmonic partial.
      osc('triangle', f, 0.55);
      osc('sine', f * 2.003, 0.18);
      osc('sine', f * 3.01, 0.06);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.5 * v, t + 0.006);
      g.gain.setTargetAtTime(0.0001, t + 0.006, 0.35 + 60 / n.midi / 6);
      g.gain.setTargetAtTime(0, t + dur, 0.08);
      break;
    }
    case 'violin': {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = Math.min(5200, f * 6); lp.Q.value = 0.7;
      lp.connect(g);
      vibrato(ctx, osc('sawtooth', f, 0.32, lp), t, end, 14);
      vibrato(ctx, osc('sawtooth', f * 1.002, 0.18, lp), t, end, 11, 5.1);
      envelope(ctx, g, t, dur, 0.09, 0.42 * v, 0.18, 0.85);
      break;
    }
    case 'flute': {
      vibrato(ctx, osc('sine', f, 0.6), t, end, 9, 5);
      osc('triangle', f * 2, 0.06);
      envelope(ctx, g, t, dur, 0.06, 0.5 * v, 0.12, 0.9);
      break;
    }
    case 'clarinet': {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = Math.min(3600, f * 5);
      lp.connect(g);
      osc('square', f, 0.28, lp);
      osc('sine', f, 0.2);
      envelope(ctx, g, t, dur, 0.035, 0.42 * v, 0.1, 0.9);
      break;
    }
    case 'harmonium': {
      [1, 2, 3, 4].forEach((h, i) => osc('sine', f * h, [0.5, 0.28, 0.16, 0.08][i]));
      osc('sawtooth', f, 0.05);
      envelope(ctx, g, t, dur, 0.07, 0.38 * v, 0.12, 1);
      break;
    }
    case 'voice': {
      // A sung "aa": sawtooth through two formant filters.
      const src = ctx.createGain();
      const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 760; f1.Q.value = 6;
      const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1180; f2.Q.value = 7;
      const body = ctx.createGain(); body.gain.value = 0.25;
      src.connect(f1).connect(g); src.connect(f2).connect(g); src.connect(body).connect(g);
      vibrato(ctx, osc('sawtooth', f, 0.9, src), t, end, 22, 5.6);
      envelope(ctx, g, t, dur, 0.08, 0.6 * v, 0.15, 0.85);
      break;
    }
  }
}

function impulse(ctx: Ctx, seconds: number, decay: number) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** decay;
  }
  return buf;
}

export async function renderScore(
  score: Score,
  melodyInstrument: InstrumentId,
  finish: Finish = 'room',
  // 24 kHz is plenty for these synth voices and renders ~2x faster than 44.1 kHz.
  sampleRate = 24000,
): Promise<AudioBuffer> {
  const seconds = scoreSeconds(score) + 2.5;
  const ctx = new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate);

  const master = ctx.createGain();
  master.gain.value = 0.7;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16; comp.ratio.value = 3;
  master.connect(comp);

  // Small shop with wooden panelling: short warm reverb.
  const dry = ctx.createGain(); dry.gain.value = 0.82;
  const wet = ctx.createGain(); wet.gain.value = 0.22;
  const verb = ctx.createConvolver();
  verb.buffer = impulse(ctx, 1.4, 3);
  comp.connect(dry); comp.connect(verb).connect(wet);

  let out: AudioNode = ctx.destination;
  if (finish === 'gramophone') {
    // Acoustic recording horn: narrow band, a bit of crackle.
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 320;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2800;
    const peak = ctx.createBiquadFilter(); peak.type = 'peaking'; peak.frequency.value = 1200; peak.gain.value = 6;
    hp.connect(lp).connect(peak).connect(ctx.destination);
    out = hp;
    const crackle = ctx.createBufferSource();
    const cb = ctx.createBuffer(1, ctx.length, sampleRate);
    const d = cb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() < 0.0009 ? (Math.random() * 2 - 1) * 0.5 : 0) + (Math.random() * 2 - 1) * 0.012;
    crackle.buffer = cb;
    crackle.connect(ctx.destination);
    crackle.start();
  }
  dry.connect(out); wet.connect(out);

  const accompaniment: InstrumentId = melodyInstrument === 'harmonium' ? 'harmonium' : 'piano';
  for (const n of score.notes) {
    const t = beatsToSeconds(score, n.start) + 0.15;
    const dur = beatsToSeconds(score, n.dur);
    playNote(ctx, master, n.voice === 'melody' ? melodyInstrument : accompaniment, n, t, dur);
  }
  return ctx.startRendering();
}

/** Short sound effects, rendered once at boot. */
export async function renderSfx(kind: 'bell' | 'page' | 'drawer', sampleRate = 44100): Promise<AudioBuffer> {
  const len = kind === 'bell' ? 2.2 : 0.5;
  const ctx = new OfflineAudioContext(1, Math.ceil(len * sampleRate), sampleRate);
  if (kind === 'bell') {
    // Shop-door bell: two small brass bells, inharmonic partials.
    [[2093, 0], [2637, 0.09]].forEach(([f, dt]) => {
      [1, 2.76, 5.4].forEach((p, i) => {
        const o = ctx.createOscillator(); o.frequency.value = f * p;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, dt);
        g.gain.exponentialRampToValueAtTime([0.25, 0.08, 0.03][i], dt + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, dt + 1.8 / (i + 1));
        o.connect(g).connect(ctx.destination); o.start(dt); o.stop(len);
      });
    });
  } else {
    const src = ctx.createBufferSource();
    const b = ctx.createBuffer(1, ctx.length, sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    src.buffer = b;
    const bp = ctx.createBiquadFilter();
    bp.type = kind === 'page' ? 'highpass' : 'lowpass';
    bp.frequency.value = kind === 'page' ? 1800 : 500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, 0);
    g.gain.linearRampToValueAtTime(kind === 'page' ? 0.35 : 0.5, 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, kind === 'page' ? 0.28 : 0.4);
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start();
  }
  return ctx.startRendering();
}
