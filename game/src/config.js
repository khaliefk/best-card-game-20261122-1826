// Every tuning number, colour and card in one place. The table is a fixed 1280x720 logical
// area; the renderer scales it to the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const START_LIFE = 30;
export const START_HAND = 4;
export const HAND_MAX = 7;
export const DECK_SIZE = 24;
export const EMBER_MAX = 8;

/** Elements: name, colour, and the shape the renderer draws for its sigil. */
export const ELEMENTS = {
  ember: { name: 'Ember', color: '#e2574c', dark: '#8f2f26', sigil: 'flame' },
  tide: { name: 'Tide', color: '#4f9fd8', dark: '#2a5a86', sigil: 'drop' },
  leaf: { name: 'Leaf', color: '#58b368', dark: '#2f6b3a', sigil: 'leaf' },
  stone: { name: 'Stone', color: '#c99a4b', dark: '#7a5a24', sigil: 'stone' },
};

/** Card kinds: strike hurts the other side, mend restores your life, insight draws cards,
 *  ward raises a shield that absorbs damage before life does. */
export const KINDS = {
  strike: { verb: 'Strike', label: 'DMG' },
  mend: { verb: 'Mend', label: 'HEAL' },
  insight: { verb: 'Insight', label: 'DRAW' },
  ward: { verb: 'Ward', label: 'SHIELD' },
};

/** The one 24-card deck. Each card: id, name, element, cost in embers, power, kind. */
export const CARDS = [
  { id: 'cinder-spark', name: 'Cinder Spark', element: 'ember', cost: 1, power: 2, kind: 'strike' },
  { id: 'flame-lash', name: 'Flame Lash', element: 'ember', cost: 2, power: 4, kind: 'strike' },
  { id: 'wildfire', name: 'Wildfire', element: 'ember', cost: 3, power: 6, kind: 'strike' },
  { id: 'ashen-guard', name: 'Ashen Guard', element: 'ember', cost: 2, power: 4, kind: 'ward' },
  { id: 'kindled-hope', name: 'Kindled Hope', element: 'ember', cost: 2, power: 4, kind: 'mend' },
  { id: 'pyre-song', name: 'Pyre Song', element: 'ember', cost: 3, power: 2, kind: 'insight' },
  { id: 'dewdrop', name: 'Dewdrop', element: 'tide', cost: 1, power: 3, kind: 'mend' },
  { id: 'riptide', name: 'Riptide', element: 'tide', cost: 2, power: 4, kind: 'strike' },
  { id: 'deep-current', name: 'Deep Current', element: 'tide', cost: 3, power: 5, kind: 'strike' },
  { id: 'still-pool', name: 'Still Pool', element: 'tide', cost: 1, power: 1, kind: 'insight' },
  { id: 'monsoon', name: 'Monsoon', element: 'tide', cost: 4, power: 7, kind: 'strike' },
  { id: 'tidecaller', name: 'Tidecaller', element: 'tide', cost: 2, power: 5, kind: 'mend' },
  { id: 'thorn-whip', name: 'Thorn Whip', element: 'leaf', cost: 1, power: 2, kind: 'strike' },
  { id: 'bramble-wall', name: 'Bramble Wall', element: 'leaf', cost: 2, power: 5, kind: 'ward' },
  { id: 'overgrowth', name: 'Overgrowth', element: 'leaf', cost: 3, power: 6, kind: 'strike' },
  { id: 'pollen-cloud', name: 'Pollen Cloud', element: 'leaf', cost: 2, power: 2, kind: 'insight' },
  { id: 'rootbound', name: 'Rootbound', element: 'leaf', cost: 1, power: 3, kind: 'ward' },
  { id: 'verdant-bloom', name: 'Verdant Bloom', element: 'leaf', cost: 3, power: 6, kind: 'mend' },
  { id: 'pebble-toss', name: 'Pebble Toss', element: 'stone', cost: 1, power: 1, kind: 'strike' },
  { id: 'boulder-fall', name: 'Boulder Fall', element: 'stone', cost: 3, power: 5, kind: 'strike' },
  { id: 'granite-aegis', name: 'Granite Aegis', element: 'stone', cost: 2, power: 4, kind: 'ward' },
  { id: 'quarry-song', name: 'Quarry Song', element: 'stone', cost: 2, power: 2, kind: 'insight' },
  { id: 'avalanche', name: 'Avalanche', element: 'stone', cost: 4, power: 8, kind: 'strike' },
  { id: 'bedrock-vow', name: 'Bedrock Vow', element: 'stone', cost: 3, power: 5, kind: 'mend' },
];

/** Card size on the table, and the gap between cards in a hand. */
export const CARD = { width: 148, height: 204, gap: 12 };

export const PALETTE = {
  felt: '#14301f',
  feltDark: '#0d1f13',
  feltLight: '#1d4530',
  trim: '#c9a24b',
  trimDim: '#7a6a35',
  panel: '#101d16',
  panelEdge: '#2c4a38',
  text: '#f2ead8',
  muted: '#9db3a4',
  life: '#d84a3a',
  lifeBack: '#3a1d18',
  ember: '#f2a93b',
  emberBack: '#3a2c14',
  back: '#274a35',
  backEdge: '#c9a24b',
  button: '#c9a24b',
  buttonText: '#241a08',
  buttonDim: '#5c5232',
  win: '#f2c94c',
  lose: '#8b93a3',
};

export const FONT = 'Georgia, "Times New Roman", serif';
export const FONT_UI = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the win count is kept between visits (this browser only). */
export const BEST_KEY = 'ember-court.wins';
