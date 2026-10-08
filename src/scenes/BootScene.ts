import Phaser from 'phaser';
import { MusicService } from '../audio/MusicService';
import { renderSfx } from '../audio/SynthRenderer';
import { createShopData } from '../data';
import { DOOR } from '../game/layout';
import { services } from '../game/services';
import { C, F, VIEW } from '../game/theme';
import { paintOutside, paintRoom } from '../game/art/room';
import * as P from '../game/art/props';
import { paintPortrait } from '../game/art/portrait';
import { paintCover, paintSpine } from '../game/art/sheet';
import { paintFacade } from '../game/art/facade';

/**
 * Loads fonts + linked data, paints every procedural texture, renders sound effects,
 * then opens the shop front. Real PNG/audio assets can be added in preload() under the same
 * keys and the painters will leave them alone.
 */
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // e.g. this.load.image('piano', 'assets/piano.png');
  }

  async create() {
    const status = this.add.text(VIEW.w / 2, VIEW.h / 2, 'De winkel gaat open…', {
      fontFamily: F.print, fontSize: '22px', color: C.cream,
    }).setOrigin(0.5);
    document.getElementById('boot')?.remove();

    try {
      const tFonts = performance.now();
      // Wait for the web fonts, but never let a slow network hold the shop door shut.
      await Promise.race([
        Promise.all([
          document.fonts.load(`20px ${F.sign}`), document.fonts.load(`20px ${F.print}`),
          document.fonts.load(`italic 20px ${F.print}`), document.fonts.load(`bold 20px ${F.print}`),
          document.fonts.load(`20px ${F.hand}`), document.fonts.load(`20px ${F.type}`),
        ]).catch(() => undefined),
        new Promise((r) => setTimeout(r, 4000)),
      ]);
      if (import.meta.env.DEV) console.debug(`[boot] fonts: ${Math.round(performance.now() - tFonts)} ms`);

      const t0 = performance.now();
      const mark = (what: string) => import.meta.env.DEV && console.debug(`[boot] ${what}: ${Math.round(performance.now() - t0)} ms`);
      status.setText('De catalogus wordt opgehaald…');
      services.data = await createShopData();
      services.music = new MusicService(this.game);

      status.setText('De etalage wordt ingericht…');
      await new Promise((r) => setTimeout(r, 0));
      this.paintAll();

      const ctx = (this.sound as Phaser.Sound.WebAudioSoundManager).context;
      const rate = ctx?.sampleRate ?? 44100;
      for (const k of ['bell', 'page', 'drawer'] as const) {
        this.cache.audio.add(`sfx-${k}`, await renderSfx(k, rate));
      }
      mark('ready');
    } catch (err) {
      console.error(err);
      status.setText(`Er ging iets mis bij het openen:\n${(err as Error).message}`).setAlign('center');
      return;
    }

    // Dev shortcut: ?scene=Shop skips the street.
    const start = new URLSearchParams(location.search).get('scene');
    this.scene.start(start && ['Title', 'Shop'].includes(start) ? start : 'Title');
  }

  private paintAll() {
    const data = services.data;
    paintOutside(this);
    paintRoom(this);
    paintFacade(this);
    P.paintDoor(this, DOOR.w, DOOR.bottom - DOOR.top);
    P.paintDoorBell(this);
    P.paintPiano(this);
    P.paintStool(this);
    P.paintCabinet(this, [...data.genres(), 'Piano 2 ms', 'Piano 4 ms', 'Mandoline', 'Fluit', 'Cello', 'Harmonium', 'Gemengd koor', 'Mannenkoor', 'Dansmuziek', 'Marschen', 'Operette', 'Etudes', 'Methoden', 'Psalmen', 'Salonmuziek', 'Strijkkwartet', 'Fanfare', 'Harmonie', 'Orgel', 'Guitaar', 'Zang & Piano', 'Kamermuziek']);
    P.paintLadder(this);
    P.paintCounter(this);
    P.paintRegister(this);
    P.paintCardIndex(this);
    P.paintLedger(this);
    P.paintShopkeeper(this);
    P.paintClock(this);
    P.paintPendulum(this);
    P.paintWallShelf(this);
    P.paintGramophone(this);
    P.paintSideTable(this);
    P.paintPoster(this);
    P.paintLamp(this);
    P.paintGlow(this);
    P.paintPalm(this);
    P.paintChair(this);
    P.paintEasel(this);
    P.paintNote(this);
    P.paintMote(this);
    P.paintBoat(this);
    P.paintPasserby(this);
    P.paintPlayer(this);
    P.paintShadow(this);

    for (const p of data.allPeople()) paintPortrait(this, p);
    for (const w of data.allWorks()) {
      const by = data.primaryPerson(w);
      paintCover(this, w, by?.name ?? 'Onbekend');
      paintSpine(this, w);
    }
  }
}
