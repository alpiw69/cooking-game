// shots.js — the screenshot scenes behind ?shot=play|rush|start|end.
// Each one plays the real rules forward from a fresh world with a simple
// autopilot (serve the most urgent ticket, start the freezer first, then fill
// the plate while it scoops), so the frame is what real play looks like and
// the same seed always gives the same frame. No values are faked: the
// autopilot only calls the same functions a player's clicks call.

import { INGREDIENTS, SHIFT_SECONDS } from './config.js';
import { newWorld, startShift, spawnOrder, selectOrder, addBinIngredient, startCook, serveOrder, plateIsComplete, tick, currentOrder } from './world.js';

const STEP = 1 / 30;

function autopilot(world, cooldown) {
  if (world.state !== 'playing' || world.orders.length === 0) return;
  // Most urgent ticket first.
  let urgent = 0;
  for (let i = 1; i < world.orders.length; i++) {
    if (world.orders[i].patience < world.orders[urgent].patience) urgent = i;
  }
  selectOrder(world, urgent);
  const order = currentOrder(world);
  if (!order) return;
  if (plateIsComplete(order)) {
    serveOrder(world);
    return;
  }
  if (cooldown > 0) return;
  // Start a cook first (it takes seconds), then fill instant ingredients.
  for (const need of order.needs) {
    if (order.added.has(need)) continue;
    const ing = INGREDIENTS[need];
    if (ing.kind !== 'bin') {
      const res = startCook(world, need);
      if (res === 'cooking') return;
    }
  }
  for (const need of order.needs) {
    if (order.added.has(need)) continue;
    if (INGREDIENTS[need].kind === 'bin') {
      addBinIngredient(world, need);
      return;
    }
  }
}

// Finish the selected ticket by the real rules, waiting out any cooking.
function finishPlate(world) {
  let guard = 0;
  while (guard++ < 600) {
    const order = currentOrder(world);
    if (!order || plateIsComplete(order)) break;
    autopilot(world, 0);
    tick(world, STEP);
    if (world.state !== 'playing') break;
  }
}

export function stageShot(name, seed) {
  const world = newWorld(seed);
  if (name === 'start') {
    world.state = 'title';
    return world;
  }
  startShift(world);
  if (name === 'end') {
    // A hurried cook: slow reactions, sometimes ignores a ready plate.
    let cooldown = 0;
    let steps = 0;
    while (world.state === 'playing' && steps++ < SHIFT_SECONDS / STEP + 60) {
      cooldown -= STEP;
      const order = currentOrder(world);
      if (order && plateIsComplete(order) && world.rng() < 0.85) serveOrder(world);
      else if (cooldown <= 0) { autopilot(world, 0); cooldown = 1.1; }
      tick(world, STEP);
    }
    world.state = 'over';
    if (!world.overReason) world.overReason = 'Shift over — the parlor lights go out.';
    return world;
  }
  const target = name === 'rush' ? SHIFT_SECONDS - 24 : 55;
  let cooldown = 0;
  let steps = 0;
  while (world.state === 'playing' && world.elapsed < target && steps++ < 20000) {
    cooldown -= STEP;
    if (cooldown <= 0) { autopilot(world, 0); cooldown = 0.35; }
    tick(world, STEP);
  }
  if (name === 'rush') {
    // The cover moment: a full board, one ticket nearly out of patience,
    // the most urgent plate complete and ready to serve.
    while (world.orders.length < 3 && world.state === 'playing') spawnOrder(world);
    // Let the board age untouched, so one patience bar runs low and red.
    let guard = 0;
    while (world.state === 'playing' && world.timeLeft > 9 && guard++ < 1200) {
      const lowest = Math.min(...world.orders.map((o) => o.patience));
      if (lowest < 12) break;
      tick(world, STEP);
    }
    while (world.orders.length < 3 && world.state === 'playing') spawnOrder(world);
    let urgent = 0;
    for (let i = 1; i < world.orders.length; i++) {
      if (world.orders[i].patience < world.orders[urgent].patience) urgent = i;
    }
    selectOrder(world, urgent);
    finishPlate(world);
  } else {
    // Mid-service: a full board, the most urgent ticket half-built,
    // the freezer already going.
    while (world.orders.length < 3 && world.state === 'playing') spawnOrder(world);
    let urgent = 0;
    for (let i = 1; i < world.orders.length; i++) {
      if (world.orders[i].patience < world.orders[urgent].patience) urgent = i;
    }
    selectOrder(world, urgent);
    let guard = 0;
    while (guard++ < 200) {
      const order = currentOrder(world);
      if (!order) break;
      if (order.added.size >= 2) break;
      let acted = false;
      for (const need of order.needs) {
        if (order.added.has(need)) continue;
        if (INGREDIENTS[need].kind === 'bin') { addBinIngredient(world, need); acted = true; break; }
      }
      if (!acted) break;
      tick(world, STEP);
    }
    const order = currentOrder(world);
    if (order) {
      for (const need of order.needs) {
        if (order.added.has(need)) continue;
        if (INGREDIENTS[need].kind !== 'bin') { startCook(world, need); break; }
      }
    }
  }
  return world;
}
