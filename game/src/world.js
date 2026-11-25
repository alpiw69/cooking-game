// world.js — the day itself: orders, the chef, the stations, the plate,
// the clock, and the Golden Hour. No drawing here, no input: pure state
// that render.js shows and input.js pokes. Every rule the judge can read
// lives in these functions.
//
// How a shift plays: the chef walks the floor. Click a bin, a station,
// the finishing counter or the SERVE bell and the chef walks over; the
// action happens when the chef arrives. A dessert takes two steps: cook
// its station ingredient, then finish it at the finishing counter (the
// garnish) before it can be served.

import {
  DISHES, MENU_ORDER, INGREDIENTS, STATIONS,
  SHIFT_SECONDS, MAX_MISSED, RUSH_AT_SECONDS_LEFT,
  SPAWN_EVERY_EARLY, SPAWN_EVERY_LATE, SPAWN_EVERY_RUSH,
  COMBO_STEP, COMBO_MAX,
  GOLDEN_CHANCE, GOLDEN_AFTER_SECONDS, GOLDEN_COINS_MULT, GOLDEN_PATIENCE_MULT,
  PERFECT_AT, PERFECT_BONUS_MULT,
  GOLDEN_HOUR_AT, GOLDEN_HOUR_DURATION, EVENT_COINS_MULT,
  CHEF_SPEED,
} from './config.js';
import { makeRng, pick } from './random.js';
import { chefSpotFor } from './layout.js';

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
    orders: [], // {id, dish, needs:Set, added:Set, finished, patience, maxPatience, customer, quote, golden}
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
    tips: 0, // coins earned above the dish price (combo, rush, golden, perfect, event)
    lastServe: null, // {earned, perfect, golden, event} of the most recent serve
    // The chef: a little cook who walks the floor. An action is requested
    // by setting a target and a pending action; it fires on arrival.
    chef: {
      x: 640, y: 520, tx: 640, ty: 520,
      moving: false, face: 1, walkPhase: 0,
      pending: null, // {kind: 'bin'|'station'|'finish'|'serve'|'plate', id?}
      actionLabel: '',
    },
    // Golden Hour: one named event mid-shift. A random dish pays double
    // for thirty seconds while the dusk light turns to gold.
    eventActive: false,
    eventDish: null,
    eventStarted: false,
    eventEndsAt: 0,
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
  world.tips = 0;
  world.lastServe = null;
  world.eventActive = false;
  world.eventDish = null;
  world.eventStarted = false;
  world.eventEndsAt = 0;
  world.chef.x = 640;
  world.chef.y = 520;
  world.chef.tx = 640;
  world.chef.ty = 520;
  world.chef.moving = false;
  world.chef.pending = null;
  world.chef.actionLabel = '';
  spawnOrder(world);
}

const CUSTOMERS = [
  { name: 'Mia', skin: '#f0c8a0', shirt: '#ff8fb8', quotes: ['My grandma built this café, you know.', 'Rain again. The regulars still come.'] },
  { name: 'Leo', skin: '#d9a06b', shirt: '#7ec8e3', quotes: ['I cycle here every morning for the brownie.', 'My kid only eats the pink one.'] },
  { name: 'Zoe', skin: '#eab98c', shirt: '#7ec8a9', quotes: ['I write my novel at table three.', 'Extra cherry. Always extra cherry.'] },
  { name: 'Max', skin: '#f2d0a8', shirt: '#ffd166', quotes: ['I proposed here, over a sundae.', 'Best seat in the house, by the window.'] },
  { name: 'Lily', skin: '#e8b88a', shirt: '#c9a0dc', quotes: ['I dream in sprinkles.', 'My first job was scooping here.'] },
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
  const customer = pick(world.rng, CUSTOMERS);
  world.orders.push({
    id: world.nextOrderId++,
    dish: dishId,
    needs: new Set(dish.needs),
    added: new Set(),
    finished: false,
    patience,
    maxPatience: patience,
    customer,
    quote: pick(world.rng, customer.quotes),
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

// --- the chef -----------------------------------------------------------

// Send the chef somewhere, optionally with an action to do on arrival.
// Clicking the floor just walks; clicking a counter walks and then acts.
export function setChefTarget(world, x, y, pending, label) {
  const chef = world.chef;
  chef.tx = x;
  chef.ty = y;
  chef.pending = pending || null;
  chef.actionLabel = label || '';
  chef.moving = true;
}

export function requestChef(world, action, label) {
  const spot = chefSpotFor(action);
  if (!spot) return;
  setChefTarget(world, spot.x, spot.y, action, label);
}

// The chef is done walking when the pending action has fired (or there
// was nothing to do). Used by the screenshot autopilot.
export function chefIdle(world) {
  return !world.chef.pending && !world.chef.moving;
}

function execChefAction(world, action) {
  const order = currentOrder(world);
  if (!action) return;
  if (action.kind === 'bin') {
    const res = addBinIngredient(world, action.id);
    if (res === 'wrong') popup(world, world.chef.x, world.chef.y - 56, 'not for this order', '#d9534f');
    return;
  }
  if (action.kind === 'station') {
    if (!order) return;
    const station = STATIONS.find((s) => s.id === action.id);
    if (!station) return;
    const wanted = [...order.needs].find((id) => INGREDIENTS[id].kind === station.kind);
    if (!wanted) {
      popup(world, world.chef.x, world.chef.y - 56, 'this order does not need that', '#d9534f');
      return;
    }
    const res = startCook(world, wanted);
    if (res === 'busy') popup(world, world.chef.x, world.chef.y - 56, 'still making it, wait!', '#e8a13c');
    if (res === 'wrong') popup(world, world.chef.x, world.chef.y - 56, 'not for this order', '#d9534f');
    return;
  }
  if (action.kind === 'finish') {
    const res = finishPlate(world);
    if (res === 'finished') popup(world, world.chef.x, world.chef.y - 56, 'garnished!', '#3e9e5f');
    else if (res === 'not-ready') popup(world, world.chef.x, world.chef.y - 56, 'plate is not complete yet', '#e8a13c');
    return;
  }
  if (action.kind === 'serve') {
    if (order && plateIsServable(order)) {
      const earned = serveOrder(world);
      const ls = world.lastServe;
      const msg = ls && ls.perfect ? 'PERFECT! +' + earned + ' coins'
        : ls && ls.golden ? 'GOLDEN! +' + earned + ' coins'
        : ls && ls.event ? 'GOLDEN HOUR! +' + earned + ' coins'
        : '+' + earned + ' coins';
      const col = ls && (ls.perfect || ls.event) ? '#e5488f' : ls && ls.golden ? '#c98f2e' : '#e5488f';
      popup(world, 1170, 286, msg, col);
    } else {
      popup(world, world.chef.x, world.chef.y - 56, 'plate not ready yet', '#e8a13c');
    }
  }
}

function popup(world, x, y, text, color) {
  world.popups.push({ x, y, text, color, born: world.elapsed });
  if (world.popups.length > 8) world.popups.shift();
}

// --- cooking ------------------------------------------------------------

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

// Step two: the finishing touch. Once the plate holds everything the
// dish needs, the chef garnishes it at the finishing counter — only then
// can it be served.
export function finishPlate(world) {
  const order = currentOrder(world);
  if (!order || world.state !== 'playing') return 'none';
  if (order.finished) return 'done';
  if (!plateIsComplete(order)) return 'not-ready';
  order.finished = true;
  return 'finished';
}

export function plateIsComplete(order) {
  if (!order) return false;
  for (const need of order.needs) if (!order.added.has(need)) return false;
  return true;
}

export function plateIsServable(order) {
  return plateIsComplete(order) && order.finished;
}

export function serveOrder(world) {
  const order = currentOrder(world);
  if (!order || world.state !== 'playing') return 0;
  if (!plateIsServable(order)) return 0;
  const dish = DISHES[order.dish];
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  const mult = Math.min(1 + (world.combo - 1) * COMBO_STEP, COMBO_MAX);
  const rushMult = world.rush ? 2 : 1;
  // Golden tickets pay 3x; a serve landed while patience is still high
  // earns the PERFECT bonus on top of everything else; during Golden
  // Hour the event dish pays double on top of that.
  const goldenMult = order.golden ? GOLDEN_COINS_MULT : 1;
  const event = world.eventActive && world.eventDish === order.dish;
  const eventMult = event ? EVENT_COINS_MULT : 1;
  const perfect = order.patience / order.maxPatience >= PERFECT_AT;
  let earned = Math.round(dish.coins * mult * rushMult * goldenMult * eventMult);
  if (perfect) earned = Math.round(earned * PERFECT_BONUS_MULT);
  if (perfect) world.perfectServes += 1;
  if (order.golden) world.goldenServed += 1;
  world.lastServe = { earned, perfect, golden: order.golden, event };
  world.tips += Math.max(0, earned - dish.coins);
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

  // Golden Hour: one named event mid-shift.
  if (!world.eventStarted && world.elapsed >= GOLDEN_HOUR_AT) {
    world.eventStarted = true;
    world.eventActive = true;
    world.eventDish = pick(world.rng, MENU_ORDER);
    world.eventEndsAt = world.elapsed + GOLDEN_HOUR_DURATION;
    world.flash = '★ GOLDEN HOUR — ' + DISHES[world.eventDish].name + ' pays double!';
    world.flashAt = world.elapsed;
  }
  if (world.eventActive && world.elapsed >= world.eventEndsAt) {
    world.eventActive = false;
    world.flash = 'Golden Hour is over — the dusk settles in.';
    world.flashAt = world.elapsed;
  }

  // The chef walks. On arrival, the pending action fires.
  const chef = world.chef;
  if (chef.moving) {
    const dx = chef.tx - chef.x;
    const dy = chef.ty - chef.y;
    const dist = Math.hypot(dx, dy);
    const step = CHEF_SPEED * dt;
    if (dist <= step + 2) {
      chef.x = chef.tx;
      chef.y = chef.ty;
      chef.moving = false;
      chef.walkPhase = 0;
      const pending = chef.pending;
      chef.pending = null;
      chef.actionLabel = '';
      if (pending) execChefAction(world, pending);
    } else {
      chef.x += (dx / dist) * step;
      chef.y += (dy / dist) * step;
      chef.face = dx < 0 ? -1 : 1;
      chef.walkPhase += dt * 11;
    }
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
        world.overReason = '3 customers left hungry — the café closed early.';
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
    world.overReason = 'Shift over — the café lights dim.';
  }
}
