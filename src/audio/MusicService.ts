import type Phaser from 'phaser';
import type { Work } from '../data/model';
import { MockScoreProvider, MusicXmlScoreProvider, type ScoreProvider } from './ScoreProvider';
import { scoreSeconds, type Score } from './score';
import { renderScore, type Finish, type InstrumentId } from './SynthRenderer';

/**
 * The one door the scenes use for music: "give me something playable for this work".
 *
 * Resolution order:
 *   1. work.audioUrl  — a real recording (no score → no notes on the music desk)
 *   2. providers      — MusicXML from OMR, then the mock composer
 *
 * The result is placed in Phaser's audio cache under `key`, so scenes play it with
 * `this.sound.add(key)` like any other game sound.
 */
export interface Playable {
  key: string;
  score?: Score;
  seconds: number;
  origin: Score['origin'];
}

export class MusicService {
  private providers: ScoreProvider[] = [new MusicXmlScoreProvider(), new MockScoreProvider()];
  private scores = new Map<string, Score>();
  private pending = new Map<string, Promise<Playable>>();

  constructor(private game: Phaser.Game) {}

  async getScore(work: Work): Promise<Score> {
    const cached = this.scores.get(work.id);
    if (cached) return cached;
    for (const p of this.providers) {
      const s = await p.getScore(work).catch(() => undefined);
      if (s) { this.scores.set(work.id, s); return s; }
    }
    throw new Error(`No score for ${work.id}`);
  }

  prepare(work: Work, instrument: InstrumentId, finish: Finish = 'room'): Promise<Playable> {
    const key = `music:${work.id}:${work.audioUrl ? 'rec' : instrument}:${finish}`;
    const existing = this.pending.get(key);
    if (existing) return existing;
    const job = this.build(work, instrument, finish, key);
    this.pending.set(key, job);
    job.catch(() => this.pending.delete(key));
    return job;
  }

  private async build(work: Work, instrument: InstrumentId, finish: Finish, key: string): Promise<Playable> {
    const cache = this.game.cache.audio;
    if (work.audioUrl) {
      const res = await fetch(work.audioUrl);
      const ctx = (this.game.sound as Phaser.Sound.WebAudioSoundManager).context;
      const buf = await ctx.decodeAudioData(await res.arrayBuffer());
      if (!cache.exists(key)) cache.add(key, buf);
      return { key, seconds: buf.duration, origin: 'recording' };
    }
    const score = await this.getScore(work);
    if (!cache.exists(key)) cache.add(key, await renderScore(score, instrument, finish));
    return { key, score, seconds: scoreSeconds(score), origin: score.origin };
  }
}
