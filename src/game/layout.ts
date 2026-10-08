/** Where things are in the shop (world coordinates). Shared by the painters and ShopScene. */
export const WORLD = {
  w: 4096, // keep ≤ 4096: max texture size on many GPUs
  h: 900,
  ceiling: 70,
  wallTop: 92,
  dado: 600,
  plint: 712,
  floor: 742,
  /** y of the player's feet. */
  walkY: 838,
} as const;

export interface Opening { x: number; w: number; top: number; bottom: number }

export const DOOR: Opening = { x: 100, w: 176, top: 168, bottom: WORLD.floor };

export const WINDOWS: Opening[] = [
  { x: 370, w: 310, top: 140, bottom: 590 },
  { x: 1180, w: 230, top: 140, bottom: 590 },
  { x: 3820, w: 200, top: 140, bottom: 590 },
];

/** Hotspot anchors: x = where the player stands to use it. */
export const SPOT_X = {
  window: 525,
  piano: 930,
  cabinet: 1830,
  catalogue: 2420,
  shopkeeper: 2640,
  portraits: 3270,
  gramophone: 3640,
} as const;

/** Pendant lamps (x positions). */
export const LAMPS = [940, 1420, 2440, 3560];
