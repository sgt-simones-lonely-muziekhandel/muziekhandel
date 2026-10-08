import type { MusicService } from '../audio/MusicService';
import type { InstrumentId } from '../audio/SynthRenderer';
import type { ShopData } from '../data/ShopData';

/**
 * Process-wide services, filled in by BootScene. Scenes import from here instead of
 * passing things around, so each teammate can work on a scene in isolation.
 */
export const services = {} as { data: ShopData; music: MusicService };

export interface TrailStep {
  kind: 'work' | 'person';
  id: string;
  label: string;
}

/** What the visitor is holding / has seen. Survives scene switches. */
export const visit = {
  /** The sheet music "in hand" — the piano and gramophone play this. */
  workId: null as string | null,
  instrument: 'piano' as InstrumentId,
  /** The path followed through the linked data: work → person → work ... */
  trail: [] as TrailStep[],
  /** Where the player stood when an overlay opened, so we can return there. */
  playerX: 0,
  enteredShop: false,
};

export function pushTrail(step: TrailStep) {
  const last = visit.trail[visit.trail.length - 1];
  if (last && last.kind === step.kind && last.id === step.id) return;
  visit.trail.push(step);
  if (visit.trail.length > 8) visit.trail.shift();
}
