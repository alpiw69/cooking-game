// layout.js — every clickable rectangle on the 1280x720 stage, in one place,
// so input.js and render.js can never disagree about where a button is.

import { STATIONS, BIN_ORDER } from './config.js';

export const STAGE = { w: 1280, h: 720 };

export function topBarRect() {
  return { x: 0, y: 0, w: 1280, h: 64 };
}

export function ticketRect(i) {
  return { x: 216 + i * 262, y: 76, w: 250, h: 122 };
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

export function plateRect() {
  return { x: 500, y: 262, w: 280, h: 280, cx: 640, cy: 402, r: 118 };
}

export function serveRect() {
  return { x: 1012, y: 300, w: 232, h: 96 };
}

export function serveReadyRect() {
  return { x: 1012, y: 412, w: 232, h: 128 };
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

export function startButtonRect() {
  return { x: 440, y: 540, w: 400, h: 76 };
}

export function againButtonRect() {
  return { x: 440, y: 560, w: 400, h: 72 };
}

export function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
