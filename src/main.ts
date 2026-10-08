import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CabinetScene } from './scenes/CabinetScene';
import { CatalogueScene } from './scenes/CatalogueScene';
import { PersonScene } from './scenes/PersonScene';
import { PianoScene } from './scenes/PianoScene';
import { ShopScene } from './scenes/ShopScene';
import { TitleScene } from './scenes/TitleScene';
import { WorkScene } from './scenes/WorkScene';
import { VIEW } from './game/theme';

const game = new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'game',
  width: VIEW.w,
  height: VIEW.h,
  backgroundColor: '#0d1422',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true, roundPixels: false },
  scene: [BootScene, TitleScene, ShopScene, CabinetScene, WorkScene, PersonScene, PianoScene, CatalogueScene],
});

// Handy while developing: inspect state from the console.
if (import.meta.env.DEV) (window as unknown as { game: Phaser.Game }).game = game;
