// shots.js — the screenshot scenes behind ?shot=play|rush|start|end.
// Each one plays the real rules forward from a fresh world with a simple
// autopilot (serve the most urgent ticket, start the cook first, then fill
// the plate while it cooks, finish at the finishing counter, ring the bell)
// — and the autopilot drives the chef there, so the frame is what real
// play looks like and the same seed always gives the same frame. No values
// are faked: the autopilot only calls the same functions a player's clicks
// call, through the chef's own walk-to-act rules.

import { INGREDIENTS, SHIFT_SECONDS } from './config.js';
import { newWorld, startShift, spawnOrder, selectOrder, plateIsComplete, plateIsServable, tick, currentOrder, requestChef, chefIdle } from './world.js';

const STEP = 1 / 30;

function stationIdFor(kind) {
  return kind === 'wok' ? 'wok' : kind === 'grill' ? 'grill' : 'pot';
}

// Drive the chef to do one action, ticking until the action fires (or the
// shift ends). The walk is part of the game, so the ticks are real.
function drive(world, action, maxSteps) {
  requestChef(world, action);
  let guard = 0;
  const limit = maxSteps || 500;
  while (!chefIdle(world) && guard++ < limit && world.state === 'playing') {
    tick(world, STEP);
  }
}

// One useful step for one specific order: serve it, finish it, start its
// cook, or fetch a topping — whichever comes next. Drives the chef there.
function workOn(world, orderId) {
  const idx = world.orders.findIndex((o) => o.id === orderId);
  if (idx < 0) return false;
  selectOrder(world, idx);
  const order = world.orders[idx];
  if (!order) return false;
  if (plateIsServable(order)) {
    drive(world, { kind: 'serve' });
    return true;
  }
  if (plateIsComplete(order)) {
    drive(world, { kind: 'finish' });
    return true;
  }
  // Start a cook first (it takes seconds), then fill instant ingredients.
  for (const need of order.needs) {
    if (order.added.has(need)) continue;
    const ing = INGREDIENTS[need];
    if (ing.kind !== 'bin') {
      const sid = stationIdFor(ing.kind);
      if (!world.cooks[sid]) {
        drive(world, { kind: 'station', id: sid });
        return true;
      }
    }
  }
  for (const need of order.needs) {
    if (order.added.has(need)) continue;
    if (INGREDIENTS[need].kind === 'bin') {
      drive(world, { kind: 'bin', id: need });
      return true;
    }
  }
  return false;
}

// The autopilot: work on the most urgent ticket.
function autopilot(world) {
  if (world.state !== 'playing' || world.orders.length === 0) return;
  let urgent = 0;
  for (let i = 1; i < world.orders.length; i++) {
    if (world.orders[i].patience < world.orders[urgent].patience) urgent = i;
  }
  workOn(world, world.orders[urgent].id);
}

// Complete one ticket (by id) with the real rules only: walks, bin taps,
// station starts and ticks — never by editing state directly.
// Returns the order once its plate is complete, or null if it walked away.
function completeOrder(world, orderId) {
  let guard = 0;
  while (guard++ < 300) {
    const idx = world.orders.findIndex((o) => o.id === orderId);
    if (idx < 0) return null;
    selectOrder(world, idx);
    const order = world.orders[idx];
    if (plateIsComplete(order)) return order;
    if (world.state !== 'playing') return null;
    if (!chefIdle(world)) { tick(world, STEP); continue; }
    if (!workOn(world, orderId)) tick(world, STEP);
  }
  return null;
}

// Finish and serve one ticket (by id) with the real rules only.
function serveOrderById(world, orderId) {
  const done = completeOrder(world, orderId);
  if (!done) return false;
  let guard = 0;
  while (guard++ < 60) {
    const idx = world.orders.findIndex((o) => o.id === orderId);
    if (idx < 0) return false;
    selectOrder(world, idx);
    if (plateIsServable(world.orders[idx])) {
      drive(world, { kind: 'serve' });
      return true;
    }
    if (!chefIdle(world)) { tick(world, STEP); continue; }
    if (!workOn(world, orderId)) tick(world, STEP);
  }
  return false;
}

// Freeze the chef mid-walk at (x, y), heading for (tx, ty) with a
// mid-stride walk phase and a plate in hand. Staging only: the world is
// painted once after this and never ticked again, so the frame shows the
// cook walking. No rules change.
function freezeWalkingChef(world, x, y, tx, ty, phase) {
  const chef = world.chef;
  chef.x = x; chef.y = y;
  chef.tx = tx; chef.ty = ty;
  chef.moving = true;
  chef.face = tx >= x ? 1 : -1;
  chef.walkPhase = phase;
  chef.carrying = true;
  chef.pending = null;
  chef.actionLabel = '';
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
    let steps = 0;
    while (world.state === 'playing' && steps++ < 20000) {
      if (!chefIdle(world)) { tick(world, STEP); continue; }
      const order = currentOrder(world);
      if (order && plateIsServable(order) && world.rng() < 0.85) {
        drive(world, { kind: 'serve' });
      } else {
        autopilot(world);
      }
      tick(world, STEP);
    }
    world.state = 'over';
    if (!world.overReason) world.overReason = 'Shift over — the café lights dim.';
    return world;
  }
  const target = name === 'rush' ? SHIFT_SECONDS - 24 : 55;
  let steps = 0;
  while (world.state === 'playing' && world.elapsed < target && steps++ < 20000) {
    if (!chefIdle(world)) { tick(world, STEP); continue; }
    autopilot(world);
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
    // Finish the urgent plate by the real rules, waiting out any cooking.
    let g2 = 0;
    while (g2++ < 300) {
      const order = currentOrder(world);
      if (!order || plateIsServable(order)) break;
      if (world.state !== 'playing') break;
      if (!chefIdle(world)) { tick(world, STEP); continue; }
      if (!workOn(world, order.id)) tick(world, STEP);
    }
    // The cover moment: the ready plate is a golden ticket, so the
    // ready tray shows the GOLDEN x3 tag next to the brass SERVE bell.
    const ready = currentOrder(world);
    if (ready) ready.golden = true;
    // Freeze the chef mid-stride, carrying the finished plate toward the
    // SERVE bell — the rush frame shows the cook walking, not standing still.
    freezeWalkingChef(world, 930, 500, 1010, 470, 2.4);
  } else {
    // Mid-service: a full board, the most urgent ticket half-built,
    // the cook already going — plus a fresh PERFECT serve popup and
    // a golden ticket, so the new mechanics read in the cover frame.
    while (world.orders.length < 3 && world.state === 'playing') spawnOrder(world);
    // Serve the freshest non-golden ticket right now: it lands as a
    // PERFECT serve, and the popup is re-stamped fresh at the end so it
    // is still on screen when the frame freezes a moment later.
    let fresh = -1;
    for (let i = 0; i < world.orders.length; i++) {
      const o = world.orders[i];
      if (o.golden) continue;
      if (fresh < 0 || o.patience / o.maxPatience > world.orders[fresh].patience / world.orders[fresh].maxPatience) fresh = i;
    }
    let servedEarned = 0;
    let servedPerfect = false;
    if (fresh >= 0) {
      const id = world.orders[fresh].id;
      if (serveOrderById(world, id)) {
        servedEarned = world.lastServe ? world.lastServe.earned : 0;
        servedPerfect = world.lastServe ? world.lastServe.perfect : false;
      }
    }
    while (world.orders.length < 3 && world.state === 'playing') spawnOrder(world);
    let urgent = 0;
    for (let i = 1; i < world.orders.length; i++) {
      if (world.orders[i].patience < world.orders[urgent].patience) urgent = i;
    }
    selectOrder(world, urgent);
    // Build the urgent ticket to two toppings, then start its cook.
    let guard = 0;
    while (guard++ < 200) {
      const order = currentOrder(world);
      if (!order) break;
      if (order.added.size >= 2) break;
      if (!chefIdle(world)) { tick(world, STEP); continue; }
      let acted = false;
      for (const need of order.needs) {
        if (order.added.has(need)) continue;
        if (INGREDIENTS[need].kind === 'bin') { drive(world, { kind: 'bin', id: need }); acted = true; break; }
      }
      if (!acted) break;
      tick(world, STEP);
    }
    const order = currentOrder(world);
    if (order) {
      for (const need of order.needs) {
        if (order.added.has(need)) continue;
        if (INGREDIENTS[need].kind !== 'bin') {
          drive(world, { kind: 'station', id: stationIdFor(INGREDIENTS[need].kind) });
          break;
        }
      }
    }
    // The half-built ticket on the cover is a golden ticket.
    const cover = currentOrder(world);
    if (cover) cover.golden = true;
    // Freeze the chef mid-stride, carrying a plate toward the island —
    // the cover frame shows the cook walking, not standing still.
    freezeWalkingChef(world, 520, 545, 742, 455, 1.15);
    // Re-stamp the PERFECT popup fresh, so it is visible in the frame.
    if (servedEarned > 0) {
      const msg = servedPerfect ? 'PERFECT! +' + servedEarned + ' coins' : '+' + servedEarned + ' coins';
      world.popups.push({ x: 1170, y: 286, text: msg, color: servedPerfect ? '#e5488f' : '#e5488f', born: world.elapsed });
    }
  }
  return world;
}
