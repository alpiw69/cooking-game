// config.js — every tunable fact of Warung Tengah Malam lives here:
// the dishes, what each one needs, what it pays, and the pace of the night.
// One file, one job: numbers and names, no drawing, no input.

export const GAME_TITLE = 'WARUNG TENGAH MALAM';
export const GAME_SUBTITLE = 'fry rice, grill satay, pour es teh — one night, no customer left hungry';

export const VIEW_W = 1280;
export const VIEW_H = 720;

export const SHIFT_SECONDS = 150;
export const MAX_MISSED = 3;
export const RUSH_AT_SECONDS_LEFT = 30;

// An ingredient is either instant (a bin you tap) or cooked (a station you
// start, which takes seconds — that wait is the route-planning of the game).
export const INGREDIENTS = {
  nasi:   { name: 'Nasi',   kind: 'wok',   cookSecs: 2.5, color: '#f5ecd7', dark: '#cbb98f' },
  mie:    { name: 'Mie',    kind: 'wok',   cookSecs: 2.5, color: '#f7cf6b', dark: '#c98f2e' },
  ayam:   { name: 'Ayam',   kind: 'grill', cookSecs: 3.0, color: '#e8a06a', dark: '#a35c28' },
  teh:    { name: 'Teh',    kind: 'pot',   cookSecs: 2.0, color: '#b4762e', dark: '#6e4212' },
  telur:  { name: 'Telur',  kind: 'bin',   color: '#ffe9a8', dark: '#d9a441' },
  kecap:  { name: 'Kecap',  kind: 'bin',   color: '#5b3a1e', dark: '#2e1c0c' },
  cabai:  { name: 'Cabai',  kind: 'bin',   color: '#e5484d', dark: '#8f1d20' },
  bawang: { name: 'Bawang', kind: 'bin',   color: '#e8b7d4', dark: '#a86a92' },
  es:     { name: 'Es',     kind: 'bin',   color: '#bfe8ff', dark: '#5d9ec4' },
  gula:   { name: 'Gula',   kind: 'bin',   color: '#ffffff', dark: '#b9b9b9' },
};

// Bins along the bottom counter, in the order the keys 1..0 tap them.
export const BIN_ORDER = ['telur', 'kecap', 'cabai', 'bawang', 'es', 'gula'];

// Cooking stations, left side of the kitchen.
export const STATIONS = [
  { id: 'wok',   name: 'WOK',    kind: 'wok',   label: 'nasi / mie', x: 36,  y: 218, w: 150, h: 128 },
  { id: 'grill', name: 'ARANG',  kind: 'grill', label: 'ayam',      x: 36,  y: 358, w: 150, h: 128 },
  { id: 'pot',   name: 'POT TEH', kind: 'pot',   label: 'teh',       x: 36,  y: 498, w: 150, h: 128 },
];

export const DISHES = {
  nasgor: {
    name: 'Nasi Goreng', short: 'NASGOR', needs: ['nasi', 'telur', 'kecap', 'cabai'],
    coins: 12, color: '#f7cf6b', patience: 40,
  },
  miegor: {
    name: 'Mie Goreng', short: 'MIEGOR', needs: ['mie', 'telur', 'kecap', 'bawang'],
    coins: 11, color: '#f7a94f', patience: 40,
  },
  sate: {
    name: 'Sate Ayam', short: 'SATE', needs: ['ayam', 'kecap', 'cabai'],
    coins: 9, color: '#e8a06a', patience: 34,
  },
  esteh: {
    name: 'Es Teh Manis', short: 'ES TEH', needs: ['teh', 'es', 'gula'],
    coins: 7, color: '#b4762e', patience: 30,
  },
};

// The night's menu, in the order new orders draw from it.
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

// Palette: a night market — deep indigo night, warm lantern amber.
export const COLORS = {
  night: '#141b33',
  night2: '#1c2547',
  board: '#232c4d',
  boardEdge: '#3a4a7d',
  chalk: '#f2ead8',
  counter: '#7a4e2d',
  counterTop: '#9c6a3e',
  plate: '#f4f1e6',
  plateEdge: '#c9c2ab',
  ink: '#1d2333',
  good: '#57c785',
  warn: '#ffb020',
  bad: '#e5484d',
  gold: '#ffd166',
  steam: 'rgba(255,255,255,0.55)',
};
