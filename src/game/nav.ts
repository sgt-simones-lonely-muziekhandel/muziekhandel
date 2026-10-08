import type Phaser from 'phaser';

/**
 * Navigation between the close-up scenes ("overlays") that sit on top of the shop.
 * Following a link pushes the current view, Back pops it, closing returns to the shop floor.
 */
export const OVERLAY_KEYS = ['Cabinet', 'Work', 'Person', 'Piano', 'Catalogue'] as const;
export type OverlayKey = (typeof OVERLAY_KEYS)[number];

interface Entry { key: OverlayKey; data: object }
const history: Entry[] = [];

export const EVENTS = { opened: 'overlay-opened', closed: 'overlay-closed' } as const;

function current(scene: Phaser.Scene): Phaser.Scene | undefined {
  return OVERLAY_KEYS.map((k) => scene.scene.get(k)).find((s) => s && s.scene.isActive());
}

/** Open an overlay. From the shop this starts a fresh history; from another overlay it pushes. */
export function open(from: Phaser.Scene, key: OverlayKey, data: object = {}) {
  const cur = current(from);
  if (cur) {
    history.push({ key: cur.scene.key as OverlayKey, data: (cur as unknown as { payload: object }).payload ?? {} });
    if (cur.scene.key === key) { cur.scene.restart(data); return; }
    cur.scene.stop();
  } else {
    history.length = 0;
    from.game.events.emit(EVENTS.opened);
  }
  from.scene.launch(key, data);
  from.scene.bringToTop(key);
}

export function back(from: Phaser.Scene) {
  const prev = history.pop();
  if (prev && prev.key === from.scene.key) { from.scene.restart(prev.data); return; }
  from.scene.stop();
  if (prev) {
    from.scene.launch(prev.key, prev.data);
    from.scene.bringToTop(prev.key);
  } else {
    from.game.events.emit(EVENTS.closed);
  }
}

export function closeAll(from: Phaser.Scene) {
  history.length = 0;
  for (const k of OVERLAY_KEYS) if (from.scene.isActive(k)) from.scene.stop(k);
  from.game.events.emit(EVENTS.closed);
}

export const canGoBack = () => history.length > 0;
