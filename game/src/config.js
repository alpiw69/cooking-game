// config.js — every tunable fact of Sugar Rush Parlor lives here:
// the desserts, what each one needs, what it pays, and the pace of the day.
// One file, one job: numbers and names, no drawing, no input.

export const GAME_TITLE = 'SUGAR RUSH PARLOR';
export const GAME_SUBTITLE = 'ice cream, candy & cake — served with a smile';

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

// Dessert stations, left side of the parlor. The kind ids (wok/grill/pot)
// are the same three the world rules use; only the names changed.
export const STATIONS = [
  { id: 'wok',   name: 'FREEZER', kind: 'wok',   label: 'scoops',  x: 36,  y: 218, w: 150, h: 128 },
  { id: 'grill', name: 'OVEN',    kind: 'grill', label: 'cake',    x: 36,  y: 358, w: 150, h: 128 },
  { id: 'pot',   name: 'BLENDER', kind: 'pot',   label: 'shakes',  x: 36,  y: 498, w: 150, h: 128 },
];

export const DISHES = {
  nasgor: {
    name: 'Rainbow Sundae', short: 'SUNDAE', needs: ['nasi', 'telur', 'kecap', 'cabai'],
    coins: 12, color: '#ff6fa5', patience: 40,
  },
  miegor: {
    name: 'Berry Sundae', short: 'BERRY', needs: ['mie', 'telur', 'kecap', 'bawang'],
    coins: 11, color: '#d96a8f', patience: 40,
  },
  sate: {
    name: 'Choco Brownie', short: 'BROWNIE', needs: ['ayam', 'kecap', 'cabai'],
    coins: 9, color: '#8a5a3b', patience: 34,
  },
  esteh: {
    name: 'Strawberry Shake', short: 'SHAKE', needs: ['teh', 'es', 'gula'],
    coins: 7, color: '#e5488f', patience: 30,
  },
};

// The day's menu, in the order new orders draw from it.
export const MENU_ORDER = ['nasgor', 'miegor', 'sate', 'esteh'];

// How fast new orders arrive: seconds between spawns, early vs rush.
export const SPAWN_EVERY_EARLY = 8;
export const SPAWN_EVERY_LATE = 5;
export const SPAWN_EVERY_RUSH = 3.5;

// Combo: each clean serve in a row raises the multiplier, capped here.
export const COMBO_STEP = 0.25;
export const COMBO_MAX = 2.0;

// Stars on the results screen, by coins earned in the shift.
export const STAR_COINS = [120, 220, 320];

// Palette: a pink dessert parlor — pastel pink, cream, mint, strawberry red.
// Panels are light, so the text ink is a deep plum that reads on white.
export const COLORS = {
  night: '#ffe3ee',
  night2: '#fff6ec',
  board: '#fffafc',
  boardEdge: '#ff8fb8',
  chalk: '#4a2440',
  counter: '#f7c9d9',
  counterTop: '#ff8fb8',
  plate: '#ffffff',
  plateEdge: '#ff8fb8',
  ink: '#4a2440',
  good: '#2f9e6e',
  warn: '#ff9d45',
  bad: '#e5484d',
  gold: '#e5488f',
  steam: 'rgba(255,255,255,0.55)',
};
