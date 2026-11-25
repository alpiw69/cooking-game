// config.js — every tunable fact of Sugar Rush 2099 lives here:
// the desserts, what each one needs, what it pays, and the pace of the day.
// One file, one job: numbers and names, no drawing, no input.

export const GAME_TITLE = 'SUGAR RUSH 2099';
export const GAME_SUBTITLE = 'a neon dessert lab — scoops, boba & cake from the future';

export const VIEW_W = 1280;
export const VIEW_H = 720;

export const SHIFT_SECONDS = 150;
export const MAX_MISSED = 3;
export const RUSH_AT_SECONDS_LEFT = 30;

// An ingredient is either instant (a bin you tap) or made at a station
// (start it, wait seconds — that wait is the route-planning of the game).
// Internal ids stay short; only the display names changed for the re-skin.
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

// Bins along the bottom counter, in the order the keys 1..6 tap them.
export const BIN_ORDER = ['telur', 'kecap', 'cabai', 'bawang', 'es', 'gula'];

// Dessert stations, left side of the lab. The kind ids (wok/grill/pot)
// are the same three the world rules use; only the names changed.
export const STATIONS = [
  { id: 'wok',   name: 'CRYO BAR', kind: 'wok',   label: 'scoops',  x: 36,  y: 218, w: 150, h: 128 },
  { id: 'grill', name: 'HOLO OVEN', kind: 'grill', label: 'cake',    x: 36,  y: 358, w: 150, h: 128 },
  { id: 'pot',   name: 'TURBO BLENDER', kind: 'pot',   label: 'shakes',  x: 36,  y: 498, w: 150, h: 128 },
];

export const DISHES = {
  nasgor: {
    name: 'Galaxy Sundae', short: 'GALAXY', needs: ['nasi', 'telur', 'kecap', 'cabai'],
    coins: 12, color: '#ff7ad9', patience: 40,
  },
  miegor: {
    name: 'Neon Berry Sundae', short: 'NEON', needs: ['mie', 'telur', 'kecap', 'bawang'],
    coins: 11, color: '#ff9ecf', patience: 40,
  },
  sate: {
    name: 'Cosmo Brownie', short: 'COSMO', needs: ['ayam', 'kecap', 'cabai'],
    coins: 9, color: '#e8a06c', patience: 34,
  },
  esteh: {
    name: 'Boba Milkshake', short: 'BOBA', needs: ['teh', 'es', 'gula'],
    coins: 7, color: '#ff6fa5', patience: 30,
  },
  cupcake: {
    name: 'Neon Cupcake', short: 'CUPCAKE', needs: ['ayam', 'telur', 'gula'],
    coins: 10, color: '#ffb3d9', patience: 36,
  },
  parfait: {
    name: 'Holo Parfait', short: 'HOLO', needs: ['mie', 'bawang', 'es', 'kecap'],
    coins: 13, color: '#7ef0c8', patience: 42,
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

// How fast new orders arrive: seconds between spawns, early vs rush.
export const SPAWN_EVERY_EARLY = 8;
export const SPAWN_EVERY_LATE = 5;
export const SPAWN_EVERY_RUSH = 3.5;

// Combo: each clean serve in a row raises the multiplier, capped here.
export const COMBO_STEP = 0.25;
export const COMBO_MAX = 2.0;

// Stars on the results screen, by coins earned in the shift.
// Retuned for the new economy (golden tickets + perfect bonuses pay more).
export const STAR_COINS = [300, 550, 850];

// Palette: a neon dessert lab in 2099 — deep violet night, hot pink neon,
// cyan holograms, chrome. Panels are dark glass, so the text ink is a
// pale pink-white that glows on top of them.
export const COLORS = {
  night: '#150826',
  night2: '#3d1157',
  board: '#2a1250',
  boardEdge: '#ff5ec4',
  chalk: '#ffe9f6',
  counter: '#1c0a38',
  counterTop: '#ff5ec4',
  plate: '#f4f0ff',
  plateEdge: '#4de3ff',
  ink: '#ffe9f6',
  good: '#37e08b',
  warn: '#ffb020',
  bad: '#ff5d73',
  gold: '#ffd166',
  steam: 'rgba(255,255,255,0.5)',
};
