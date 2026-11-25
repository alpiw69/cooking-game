// config.js — every tunable fact of Sugar Rush Café lives here:
// the desserts, what each one needs, what it pays, and the pace of the day.
// One file, one job: numbers and names, no drawing, no input.

export const GAME_TITLE = 'SUGAR RUSH CAFÉ';
export const GAME_SUBTITLE = 'a warm dessert café — scoops, boba & cake, made to order';

export const VIEW_W = 1280;
export const VIEW_H = 720;

export const SHIFT_SECONDS = 150;
export const MAX_MISSED = 3;
export const RUSH_AT_SECONDS_LEFT = 30;

// An ingredient is either instant (a bin you tap) or made at a station
// (start it, wait seconds — that wait is the route-planning of the game).
// Internal ids stay short; only the display names changed for the café.
export const INGREDIENTS = {
  nasi:   { name: 'Vanilla',    kind: 'wok',   cookSecs: 2.5, color: '#fff3d6', dark: '#d9b98a' },
  mie:    { name: 'Strawberry', kind: 'wok',   cookSecs: 2.5, color: '#ffb3c8', dark: '#d96a8f' },
  ayam:   { name: 'Brownie',    kind: 'grill', cookSecs: 3.0, color: '#8a5a3b', dark: '#4e2e1a' },
  teh:    { name: 'Shake',      kind: 'pot',   cookSecs: 2.0, color: '#f2a0c0', dark: '#a84a72' },
  telur:  { name: 'Sprinkles',  kind: 'bin',   color: '#ff6fa5', dark: '#c22e72' },
  kecap:  { name: 'Choc Sauce', kind: 'bin',   color: '#6b3a1e', dark: '#3a1e0c' },
  cabai:  { name: 'Cherry',     kind: 'bin',   color: '#e5484d', dark: '#8f1d20' },
  bawang: { name: 'Wafer',      kind: 'bin',   color: '#e8c88a', dark: '#a87c3a' },
  es:     { name: 'Ice',        kind: 'bin',   color: '#bfe8ff', dark: '#5d9ec4' },
  gula:   { name: 'Sugar',      kind: 'bin',   color: '#ffffff', dark: '#b9b9b9' },
};

// Bins along the front counter, in the order the keys 1..6 tap them.
export const BIN_ORDER = ['telur', 'kecap', 'cabai', 'bawang', 'es', 'gula'];

// Dessert stations, down the left wall of the café. The kind ids
// (wok/grill/pot) are the same three the world rules use; only the names
// changed. x/y/w/h are the on-screen counter boxes.
export const STATIONS = [
  { id: 'wok',   name: 'SCOOP BAR',  kind: 'wok',   label: 'scoops', x: 540, y: 210, w: 180, h: 92 },
  { id: 'grill', name: 'BRASS OVEN', kind: 'grill', label: 'bakes',  x: 440, y: 300, w: 180, h: 92 },
  { id: 'pot',   name: 'SHAKE BAR',  kind: 'pot',   label: 'shakes', x: 340, y: 390, w: 180, h: 92 },
];

export const DISHES = {
  nasgor: {
    name: 'Cherry Sundae', short: 'CHERRY', needs: ['nasi', 'telur', 'kecap', 'cabai'],
    coins: 12, color: '#e5488f', patience: 40,
  },
  miegor: {
    name: 'Strawberry Sundae', short: 'STRAW', needs: ['mie', 'telur', 'kecap', 'bawang'],
    coins: 11, color: '#ff7fa5', patience: 40,
  },
  sate: {
    name: 'Fudge Brownie', short: 'FUDGE', needs: ['ayam', 'kecap', 'cabai'],
    coins: 9, color: '#b07a45', patience: 34,
  },
  esteh: {
    name: 'Boba Milkshake', short: 'BOBA', needs: ['teh', 'es', 'gula'],
    coins: 7, color: '#ff6fa5', patience: 30,
  },
  cupcake: {
    name: 'Vanilla Cupcake', short: 'CUPCAKE', needs: ['ayam', 'telur', 'gula'],
    coins: 10, color: '#d96a8f', patience: 36,
  },
  parfait: {
    name: 'Honey Parfait', short: 'HONEY', needs: ['mie', 'bawang', 'es', 'kecap'],
    coins: 13, color: '#c98f2e', patience: 42,
  },
};

// The day's menu, in the order new orders draw from it.
export const MENU_ORDER = ['nasgor', 'miegor', 'sate', 'esteh', 'cupcake', 'parfait'];

// Golden ticket: a rare order worth 3x coins, with shorter patience.
// At most one golden ticket sits on the board at a time.
export const GOLDEN_CHANCE = 0.12;
export const GOLDEN_AFTER_SECONDS = 25;
export const GOLDEN_COINS_MULT = 3;
export const GOLDEN_PATIENCE_MULT = 0.8;

// Perfect serve: serving while patience is still above this fraction
// pays a bonus on top of everything else. 0.85 keeps it a real reward
// for fast, focused play — at 0.7 nearly every serve was "perfect".
export const PERFECT_AT = 0.85;
export const PERFECT_BONUS_MULT = 1.5;

// Golden Hour: one named event mid-shift. A random dish pays double
// for thirty seconds while the dusk light turns to gold.
export const GOLDEN_HOUR_AT = 70;
export const GOLDEN_HOUR_DURATION = 30;
export const EVENT_COINS_MULT = 2;

// How fast new orders arrive: seconds between spawns, early vs rush.
export const SPAWN_EVERY_EARLY = 8;
export const SPAWN_EVERY_LATE = 5;
export const SPAWN_EVERY_RUSH = 3.5;

// Combo: each clean serve in a row raises the multiplier, capped here.
export const COMBO_STEP = 0.25;
export const COMBO_MAX = 2.0;

// Stars on the results screen, by coins earned in the shift.
// Retuned for the walking-chef economy (each serve costs walking time).
export const STAR_COINS = [150, 280, 450];

// The chef walks the floor at this speed, pixels per second.
export const CHEF_SPEED = 380;

// Palette: a warm dessert café at dusk — cream plaster, warm wood,
// marble counters, brass trim, amber lamps, green plants, and pink
// desserts as the colour accent. Panels are warm paper and wood, so the
// text ink is a deep roast brown that reads on top of them.
export const COLORS = {
  wall: '#f2dfc0',
  wallShade: '#e0c49a',
  wood: '#8a5a3b',
  woodDark: '#5f3d26',
  woodLight: '#a9744f',
  marble: '#f7f2e9',
  marbleVein: '#c9c2b4',
  brass: '#c9a25e',
  brassDark: '#8a6d2f',
  cream: '#fff8ec',
  paper: '#fdf3dd',
  ink: '#4a2c1a',
  pink: '#ff7fa5',
  pinkDeep: '#e5488f',
  leaf: '#5d8a5a',
  good: '#3e9e5f',
  warn: '#e8a13c',
  bad: '#d9534f',
  gold: '#e8a13c',
  steam: 'rgba(255,255,255,0.55)',
};
