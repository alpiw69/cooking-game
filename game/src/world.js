// world.js — the day itself: orders, the freezer, the plate, the clock.
// No drawing here, no input: pure state that render.js shows and input.js
// pokes. Every rule the judge can read lives in these functions.

import {
  DISHES, MENU_ORDER, INGREDIENTS, STATIONS,
  SHIFT_SECONDS, MAX_MISSED, RUSH_AT_SECONDS_LEFT,
  SPAWN_EVERY_EARLY, SPAWN_EVERY_LATE, SPAWN_EVERY_RUSH,
  COMBO_STEP, COMBO_MAX,
  GOLDEN_CHANCE, GOLDEN_AFTER_SECONDS, GOLDEN_COINS_MULT, GOLDEN_PATIENCE_MULT,
  PERFECT_AT, PERFECT_BONUS_MULT,
} from './config.js';
import { makeRng, pick } from './random.js';

export function newWorld(seed) {
  const rng = makeRng(seed);
  return {
    rng,
    state: 'title', // title | playing | over
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    coins: 0,
    score: 0,
    served: 0,
    missed: 0,
    combo: 0,
    bestCombo: 0,
    orders: [], // {id, dish, needs:Set, added:Set, patience, maxPatience, customer}
    selectedOrder: 0,
    plate: new Set(), // ingredients currently on the plate, for the selected order
    cooks: {}, // station id -> {ingredient, left, total} while something cooks
    spawnIn: 2.5,
    nextOrderId: 1,
    rush: false,
    overReason: '',
    flash: '', // short banner text with a timestamp
    flashAt: 0,
    popups: [], // {x, y, text, color, born} floating feedback
    servedTotal: 0,
    perfectServes: 0, // serves landed while patience was still high
    goldenServed: 0, // golden tickets served
    lastServe: null, // {earned, perfect, golden} of the most recent serve
  };
}

export function startShift(world) {
  world.state = 'playing';
  world.timeLeft = SHIFT_SECONDS;
  world.elapsed = 0;
  world.coins = 0;
  world.score = 0;
  world.served = 0;
  world.missed = 0;
  world.combo = 0;
  world.bestCombo = 0;
  world.orders = [];
  world.selectedOrder = 0;
  world.plate = new Set();
  world.cooks = {};
  world.spawnIn = 1.2;
  world.rush = false;
  world.overReason = '';
  world.popups = [];
  world.perfectServes = 0;
  world.goldenServed = 0;
  world.lastServe = null;
  spawnOrder(world);
}

const CUSTOMERS = [
  { name: 'Mia', skin: '#f0c8a0', shirt: '#ff8fb8' },
  { name: 'Leo', skin: '#d9a06b', shirt: '#7ec8e3' },
  { name: 'Zoe', skin: '#eab98c', shirt: '#7ec8a9' },
  { name: 'Max', skin: '#f2d0a8', shirt: '#ffd166' },
  { name: 'Lily', skin: '#e8b88a', shirt: '#c9a0dc' },
];

export function spawnOrder(world) {
  const dishId = pick(world.rng, MENU_ORDER);
  const dish = DISHES[dishId];
  // Patience shrinks as the night wears on, so the pressure genuinely grows.
  const pressure = 1 - (world.elapsed / SHIFT_SECONDS) * 0.4;
  let patience = dish.patience * pressure * (world.rush ? 0.85 : 1);
  // A golden ticket: rare, worth 3x, shorter patience, at most one on the board.
  const hasGolden = world.orders.some((o) => o.golden);
  const golden = !hasGolden && world.elapsed > GOLDEN_AFTER_SECONDS && world.rng() < GOLDEN_CHANCE;
  if (golden) patience *= GOLDEN_PATIENCE_MULT;
  world.orders.push({
    id: world.nextOrderId++,
    dish: dishId,
    needs: new Set(dish.needs),
    added: new Set(),
    patience,
    maxPatience: patience,
    customer: pick(world.rng, CUSTOMERS),
    golden,
  });
  if (golden) {
    world.flash = '★ GOLDEN TICKET — worth 3x coins!';
    world.flashAt = world.elapsed;
  }
  if (world.orders.length > 3) world.orders.shift();
  if (world.selectedOrder >= world.orders.length) world.selectedOrder = 0;
  world.plate = new Set(world.orders[world.selectedOrder]?.added ?? []);
}

export function selectOrder(world, index) {
  if (index < 0 || index >= world.orders.length) return;
  world.selectedOrder = index;
  world.plate = new Set(world.orders[index].added);
}

export function currentOrder(world) {
  return world.orders[world.selectedOrder] ?? null;
}

// Tap an ingredient bin: instant ingredients land on the plate at once.
export function addBinIngredient(world, ingredientId) {
  const order = currentOrder(world);
  if (!order || world.state !== 'playing') return 'none';
  const ing = INGREDIENTS[ingredientId];
  if (!ing || ing.kind !== 'bin') return 'none';
  if (!order.needs.has(ingredientId)) return 'wrong';
  if (order.added.has(ingredientId)) return 'done';
  order.added.add(ingredientId);
  world.plate = new Set(order.added);
  return 'added';
}

// Start cooking an ingredient at its station; it lands on the plate when done.
export function startCook(world, ingredientId) {
  const order = currentOrder(world);
  if (!order || world.state !== 'playing') return 'none';
  const ing = INGREDIENTS[ingredientId];
  if (!ing || ing.kind === 'bin') return 'none';
  if (!order.needs.has(ingredientId)) return 'wrong';
  if (order.added.has(ingredientId)) return 'done';
  const station = STATIONS.find((s) => s.kind === ing.kind);
  if (!station) return 'none';
  if (world.cooks[station.id]) return 'busy';
  world.cooks[station.id] = { ingredient: ingredientId, left: ing.cookSecs, total: ing.cookSecs };
  return 'cooking';
}

export function plateIsComplete(order) {
  if (!order) return false;
  for (const need of order.needs) if (!order.added.has(need)) return false;
  return true;
}

export function serveOrder(world) {
  const order = currentOrder(world);
  if (!order || world.state !== 'playing') return 0;
  if (!plateIsComplete(order)) return 0;
  const dish = DISHES[order.dish];
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  const mult = Math.min(1 + (world.combo - 1) * COMBO_STEP, COMBO_MAX);
  const rushMult = world.rush ? 2 : 1;
  // Golden tickets pay 3x; a serve landed while patience is still high
  // earns the PERFECT bonus on top of everything else.
  const goldenMult = order.golden ? GOLDEN_COINS_MULT : 1;
  const perfect = order.patience / order.maxPatience >= PERFECT_AT;
  let earned = Math.round(dish.coins * mult * rushMult * goldenMult);
  if (perfect) earned = Math.round(earned * PERFECT_BONUS_MULT);
  if (perfect) world.perfectServes += 1;
  if (order.golden) world.goldenServed += 1;
  world.lastServe = { earned, perfect, golden: order.golden };
  world.coins += earned;
  world.score += earned * 10;
  world.served += 1;
  world.servedTotal += 1;
  world.orders.splice(world.selectedOrder, 1);
  if (world.selectedOrder >= world.orders.length) world.selectedOrder = Math.max(0, world.orders.length - 1);
  world.plate = new Set(world.orders[world.selectedOrder]?.added ?? []);
  return earned;
}

export function tick(world, dt) {
  if (world.state !== 'playing') return;
  world.elapsed += dt;
  world.timeLeft = Math.max(0, SHIFT_SECONDS - world.elapsed);
  const wasRush = world.rush;
  world.rush = world.timeLeft <= RUSH_AT_SECONDS_LEFT && world.timeLeft > 0;
  if (world.rush && !wasRush) {
    world.flash = 'RUSH HOUR! double coins';
    world.flashAt = world.elapsed;
  }

  // Cooking stations finish and drop their ingredient on the plate.
  for (const station of STATIONS) {
    const cook = world.cooks[station.id];
    if (!cook) continue;
    cook.left -= dt;
    if (cook.left <= 0) {
      const order = currentOrder(world);
      if (order && order.needs.has(cook.ingredient) && !order.added.has(cook.ingredient)) {
        order.added.add(cook.ingredient);
        world.plate = new Set(order.added);
      }
      delete world.cooks[station.id];
    }
  }

  // Patience drains; an order that runs out walks away angry.
  for (let i = world.orders.length - 1; i >= 0; i--) {
    const order = world.orders[i];
    order.patience -= dt;
    if (order.patience <= 0) {
      world.orders.splice(i, 1);
      world.missed += 1;
      world.combo = 0;
      if (world.selectedOrder >= world.orders.length) world.selectedOrder = Math.max(0, world.orders.length - 1);
      world.plate = new Set(world.orders[world.selectedOrder]?.added ?? []);
      if (world.missed >= MAX_MISSED) {
        world.state = 'over';
        world.overReason = '3 customers left angry — the lab closed early.';
        return;
      }
    }
  }

  // New orders keep coming; faster as the night wears on, fastest in the rush.
  world.spawnIn -= dt;
  if (world.spawnIn <= 0 && world.orders.length < 3) {
    spawnOrder(world);
    const late = world.elapsed > SHIFT_SECONDS * 0.6;
    world.spawnIn = world.rush ? SPAWN_EVERY_RUSH : late ? SPAWN_EVERY_LATE : SPAWN_EVERY_EARLY;
  }

  if (world.timeLeft <= 0) {
    world.state = 'over';
    world.overReason = 'Shift over — the lab powers down.';
  }
}
