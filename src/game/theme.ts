/** Palette and type for the whole shop. Delft blue + cream + dark wood + restrained brass. */
export const C = {
  navy: '#1b2a44',
  delft: '#22406e',
  delftLight: '#4d6fa3',
  delftPale: '#c9d6ea',
  cream: '#efe6cf',
  paper: '#ebe1c6',
  paperShade: '#d8caa6',
  ink: '#22201c',
  inkSoft: '#5b5246',
  wood: '#3a2618',
  woodDark: '#22160d',
  woodLight: '#5e3f27',
  woodHi: '#7a5434',
  brass: '#b8893a',
  brassHi: '#e2bd6a',
  orange: '#c46a35',
  red: '#8c2f24',
  thread: '#a3352a',
  marbleW: '#e6e0d1',
  marbleB: '#1c1d22',
  glass: '#9fb4c8',
} as const;

/** Phaser wants numbers for tints/fills. */
export const hex = (c: string) => Number.parseInt(c.slice(1), 16);

export const F = {
  sign: 'Federo, Didot, Georgia, serif',
  print: '"Old Standard TT", "Times New Roman", Georgia, serif',
  hand: '"Cedarville Cursive", "Snell Roundhand", cursive',
  type: '"Special Elite", "Courier New", monospace',
} as const;

export const VIEW = { w: 1600, h: 900 } as const;
