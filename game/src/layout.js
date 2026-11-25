// layout.js — every clickable rectangle on the 1280x720 stage, in one place,
// so input.js and render.js can never disagree about where a button is.
// The café floor is an isometric diamond (top corner 640,204; left 220,414;
// right 1060,414; bottom 640,624). Stations hug the left wall, the marble
// plating island sits in the middle, the finishing counter and the service
// hatch sit on the right, and the six ingredient bins run along the front
// counter at the bottom. Chef walk spots sit on the floor just beside each
// counter, so the chef never has to cross a counter to reach one.

import { STATIONS, BIN_ORDER } from './config.js';

export const STAGE = { w: 1280, h: 720 };

// The isometric floor diamond, for reference by the renderer.
export const FLOOR = { top: { x: 640, y: 204 }, left: { x: 220, y: 414 }, right: { x: 1060, y: 414 }, bottom: { x: 640, y: 624 } };

export function topBarRect() {
  return { x: 0, y: 0, w: 1280, h: 56 };
}

export function ticketRect(i) {
  return { x: 216 + i * 262, y: 64, w: 250, h: 108 };
}

export function storyRect() {
  return { x: 216, y: 178, w: 848, h: 22 };
}

export function stationRect(station) {
  return { x: station.x, y: station.y, w: station.w, h: station.h };
}

export function stationByPoint(x, y) {
  for (const s of STATIONS) {
    const r = stationRect(s);
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return s;
  }
  return null;
}

// The marble plating island in the middle of the room.
export function islandRect() {
  return { x: 550, y: 379, w: 210, h: 72, cx: 655, cy: 415, r: 48 };
}

export function plateRect() {
  return islandRect();
}

// The finishing counter: garnish and a cloche, on the right wall.
export function finishRect() {
  return { x: 762, y: 410, w: 160, h: 90 };
}

export function finishByPoint(x, y) {
  const r = finishRect();
  if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return true;
  return false;
}

// The big brass SERVE button and the ready tray, on the right wall.
export function serveRect() {
  return { x: 1080, y: 300, w: 180, h: 88 };
}

export function serveReadyRect() {
  return { x: 1080, y: 400, w: 180, h: 120 };
}

export function serveByPoint(x, y) {
  const r = serveRect();
  if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return true;
  return false;
}

export function binRect(i) {
  return { x: 36 + i * 200, y: 648, w: 186, h: 56 };
}

export function binByPoint(x, y) {
  for (let i = 0; i < BIN_ORDER.length; i++) {
    const r = binRect(i);
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return BIN_ORDER[i];
  }
  return null;
}

export function ticketByPoint(x, y) {
  for (let i = 0; i < 3; i++) {
    const r = ticketRect(i);
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}

// Where the chef stands to use something: just beside the counter, on
// the open floor. Bin spots sit on the floor's front edges.
const BIN_SPOTS = [
  { x: 300, y: 453 }, { x: 410, y: 505 }, { x: 520, y: 562 },
  { x: 760, y: 562 }, { x: 870, y: 505 }, { x: 980, y: 453 },
];

export function chefSpotFor(action) {
  if (!action) return null;
  if (action.kind === 'bin') {
    const i = BIN_ORDER.indexOf(action.id);
    return i >= 0 ? BIN_SPOTS[i] : { x: 640, y: 520 };
  }
  if (action.kind === 'station') {
    const s = STATIONS.find((st) => st.id === action.id);
    if (!s) return { x: 640, y: 520 };
    return { x: s.x + s.w + 38, y: s.y + s.h / 2 + 8 };
  }
  if (action.kind === 'finish') return { x: 742, y: 455 };
  if (action.kind === 'serve') return { x: 930, y: 470 };
  if (action.kind === 'plate') return { x: 655, y: 500 };
  return { x: 640, y: 520 };
}

export function startButtonRect() {
  return { x: 440, y: 506, w: 400, h: 64 };
}

export function againButtonRect() {
  return { x: 440, y: 560, w: 400, h: 72 };
}

export function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
