/**
 * A Score is the hand-off point between "reading sheet music" and "making sound".
 *
 *   scan ──(OMR, e.g. Audiveris)──▶ MusicXML ──(MusicXmlScoreProvider)──▶ Score ──(SynthRenderer)──▶ audio
 *
 * Until the OMR pipeline exists, MockScoreProvider invents a plausible, deterministic Score per work.
 * Everything downstream (piano keys, notes on the music desk, instrument choice) already works off
 * this type, so swapping the provider is the only change needed.
 */

export type Voice = 'melody' | 'bass' | 'chord';

export interface NoteEvent {
  /** MIDI pitch, 60 = middle C. */
  midi: number;
  /** In beats (quarter notes) from the start. */
  start: number;
  /** In beats. */
  dur: number;
  voice: Voice;
  /** 0..1 */
  velocity: number;
}

export interface Score {
  title: string;
  /** Quarter notes per minute. */
  tempo: number;
  timeSignature: [number, number];
  keyName: string;
  notes: NoteEvent[];
  lengthBeats: number;
  /** Where this score came from — shown honestly in the UI. */
  origin: 'mock' | 'musicxml' | 'recording';
}

export const beatsToSeconds = (score: Score, beats: number) => (beats * 60) / score.tempo;
export const scoreSeconds = (score: Score) => beatsToSeconds(score, score.lengthBeats);
export const midiToFreq = (m: number) => 440 * 2 ** ((m - 69) / 12);
