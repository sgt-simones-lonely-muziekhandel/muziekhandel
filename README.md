# Sgt. Simone's Lonely Muziekhandel

*Muziekhandel Van der Velde* — a walkable Dutch music shop from 1906, built on SOM sheet music and linked open data. Made for HackaLOD 2026.

You walk in from the canal, browse the sheet-music cabinet, open a piece and turn its title page to see the notes. From there you follow the people on it (composer, lyricist, performers) to their portraits, follow threads to the people they're connected to, and find their other works. Then you play the piece on the piano or the gramophone.

The whole interface is a 2D game built with **[Phaser 4](https://phaser.io)**: scenes, sprites, tweens, particles, camera and Web Audio. There are no DOM UI widgets.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # static build in dist/ (relative paths, host anywhere)
```

Dev shortcut: `http://localhost:5173/?scene=Shop` skips the street and starts inside.

**Controls:** use ← → (or A/D) to walk, and E, Enter or Space to use what you're standing at. You can also just click things. In close-ups, Esc goes back.

## The flow (vertical slice)

| # | Scene | File | What it shows |
|---|-------|------|---------------|
| 1 | Street → shop floor | `TitleScene.ts`, `ShopScene.ts` | Canal-house shopfront; walkable side-on interior with parallax canal, window light and a shopkeeper |
| 2 | Cabinet | `CabinetScene.ts` | Drawers per section (genre from the data), sheet music on the shelf |
| 3 | Work | `WorkScene.ts` | Title page (flip it to see the score), catalogue card with IRIs |
| 4 | Person | `PersonScene.ts` | Portrait, life card, threads to related people |
| 5 | Related works | `PersonScene.ts` | Their sheet music on the ledge → back to Work |
| 6 | Audio | `PianoScene.ts`, gramophone in `ShopScene.ts` | Score on the music desk with a playhead, moving keys, instrument choice |
| — | Card index | `CatalogueScene.ts` | Every person and work, A–Z |

A paper "route" ribbon at the bottom of each close-up shows the path you took through the data.

## Architecture

The challenge asks for the NDE split between a **data layer** and a **presentation layer**, and the code follows it.

```
src/data/        DATA LAYER: knows about RDF/JSON-LD, nothing about Phaser
  model.ts         Work, Person, Place, Contribution, PersonLink (all keep their IRI + sameAs)
  DataSource.ts    the interface any source implements
  MockDataSource   reads public/data/som-sample.jsonld (JSON-LD shaped sample)
  SparqlDataSource live SPARQL endpoint (schema.org starter queries; adjust to SOM's vocabulary)
  ShopData.ts      graph walks the UI needs: work→people, person→works, person→related people
                   (explicit links + co-credited on a work + same birthplace IRI)

src/audio/       SHEET MUSIC → SOUND
  score.ts         Score = notes with pitch/start/duration: the hand-off format
  ScoreProvider    MusicXmlScoreProvider (real: OMR output) and MockScoreProvider (placeholder)
  SynthRenderer    Score → AudioBuffer offline; piano, violin, flute, clarinet, harmonium, voice; room or gramophone finish
  MusicService     what scenes call: prepare(work, instrument) → a Phaser sound key

src/game/        PRESENTATION HELPERS
  art/             procedural painters (Canvas 2D → Phaser textures), one file per area
  ui/              in-world widgets (brass plaques, paper cards) + staff-notation engraver
  layout.ts        world coordinates of everything in the shop
  nav.ts           overlay navigation stack (open / back / close)
  services.ts      shared services + the visitor's state (piece in hand, instrument, route)

src/scenes/      one Phaser scene per view (see table above)
```

### Plugging in the real SOM data

1. **Quickest:** export SOM sheet music + people into the same shape as `public/data/som-sample.jsonld` and replace the file. Everything else keeps working.
2. **Live:** run with `VITE_DATA_SOURCE=sparql VITE_SOM_SPARQL=<endpoint> npm run dev`, then edit the queries and prefixes in `src/data/SparqlDataSource.ts` to match SOM's actual vocabulary.

Either way the scenes only see `model.ts` types. Genres become cabinet drawers, the most-credited people get a portrait on the wall, and `sameAs` links show up on the life card.

> ⚠️ The sample data is **illustrative**. The people are real historical figures, but shelfmarks, prices, editions and some credits are invented. Don't present it as SOM data.

### Plugging in real sheet-music → audio

```
SOM scan ──(OMR, e.g. Audiveris)──▶ MusicXML ──▶ MusicXmlScoreProvider ──▶ Score ──▶ SynthRenderer ──▶ 🔊
```

- Set `scoreUrl` on a work to a MusicXML file and it's used automatically. The notes on the music desk, the moving keys and the instrument choice all follow from it.
- Set `audioUrl` to a real recording and it plays instead of the synthesis.
- `MockScoreProvider` invents a deterministic tune per work (genre sets metre, tempo and accompaniment) so every piece can play today. The UI labels it as a placeholder ("proef-synthese").
- Better instrument sound later: swap the oscillator voices in `SynthRenderer.playNote` for SoundFont samples. `renderScore()` keeps the same signature.

### Replacing the procedural art

Every texture is painted at boot by `src/game/art/*` under a fixed key (`piano`, `cabinet`, `portrait-<personId>`, `cover-<workId>`, …). To use real artwork, load an image with the same key in `BootScene.preload()` and the painter skips it. Good candidates are real SOM scans for `cover-<id>` and Wikimedia portraits via the person's `sameAs`.

## Working on it together

Each area of the code lives in its own files, so four people can work in parallel with few conflicts:

- **Data / LOD** → `src/data/*` and `public/data/*`
- **Audio / OMR** → `src/audio/*`
- **Shop floor & art** → `src/scenes/ShopScene.ts`, `src/game/art/*`, `src/game/layout.ts`
- **Close-ups** → one scene file each in `src/scenes/`

Run `npm run typecheck` before pushing.

## Licence

MIT. See `LICENSE`.
