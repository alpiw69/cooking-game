// input.js — mouse and keyboard, translated into chef walks and world actions.
// One file, one job: where the pointer is and what key was pressed.
// Clicking a counter sends the chef over; the action fires on arrival.
// Clicking the open floor just walks. WASD / arrow keys nudge the chef.

import { INGREDIENTS, BIN_ORDER, STATIONS } from './config.js';
import {
  inRect, binByPoint, ticketByPoint, stationByPoint,
  serveRect, serveByPoint, finishByPoint, startButtonRect, againButtonRect,
  islandRect, chefSpotFor,
} from './layout.js';
import {
  startShift, selectOrder, plateIsServable, requestChef, setChefTarget,
} from './world.js';

export function attachInput(canvas, world, sfx) {
  function toStage(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (1280 / rect.width),
      y: (event.clientY - rect.top) * (720 / rect.height),
    };
  }

  canvas.addEventListener('click', (event) => {
    const { x, y } = toStage(event);
    if (world.state === 'title') {
      if (inRect(x, y, startButtonRect())) {
        startShift(world);
        sfx.start();
      }
      return;
    }
    if (world.state === 'over') {
      if (inRect(x, y, againButtonRect())) {
        startShift(world);
        sfx.start();
      }
      return;
    }

    const ticket = ticketByPoint(x, y);
    if (ticket >= 0 && ticket < world.orders.length) {
      selectOrder(world, ticket);
      sfx.click();
      return;
    }

    const station = stationByPoint(x, y);
    if (station) {
      requestChef(world, { kind: 'station', id: station.id }, 'to ' + station.name);
      sfx.click();
      return;
    }

    const bin = binByPoint(x, y);
    if (bin) {
      requestChef(world, { kind: 'bin', id: bin }, 'to ' + INGREDIENTS[bin].name);
      sfx.click();
      return;
    }

    if (finishByPoint(x, y)) {
      requestChef(world, { kind: 'finish' }, 'to the finishing counter');
      sfx.click();
      return;
    }

    if (serveByPoint(x, y)) {
      requestChef(world, { kind: 'serve' }, 'to the service bell');
      sfx.click();
      return;
    }

    // Clicking the plating island or the open floor: just walk over.
    const island = islandRect();
    if (inRect(x, y, island)) {
      requestChef(world, { kind: 'plate' }, 'to the plating counter');
      sfx.click();
      return;
    }
    setChefTarget(world, x, y, null, '');
    sfx.click();
  });

  window.addEventListener('keydown', (event) => {
    if (world.state !== 'playing') {
      if ((world.state === 'title' || world.state === 'over') && (event.key === 'Enter' || event.key === ' ')) {
        startShift(world);
        sfx.start();
      }
      return;
    }
    const keyIndex = ['1', '2', '3', '4', '5', '6'].indexOf(event.key);
    if (keyIndex >= 0) {
      requestChef(world, { kind: 'bin', id: BIN_ORDER[keyIndex] }, 'to ' + INGREDIENTS[BIN_ORDER[keyIndex]].name);
      return;
    }
    if (event.key === ' ') {
      event.preventDefault();
      requestChef(world, { kind: 'serve' }, 'to the service bell');
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      if (world.orders.length > 0) {
        selectOrder(world, (world.selectedOrder + 1) % world.orders.length);
        sfx.click();
      }
      return;
    }
    const stationKey = { f: 'wok', o: 'grill', b: 'pot' }[event.key.toLowerCase()];
    if (stationKey) {
      const station = STATIONS.find((s) => s.id === stationKey);
      if (station) requestChef(world, { kind: 'station', id: station.id }, 'to ' + station.name);
      return;
    }
    // WASD / arrow keys: nudge the chef across the floor.
    const dirs = {
      w: [0, -70], ArrowUp: [0, -70],
      s: [0, 70], ArrowDown: [0, 70],
      a: [-70, 0], ArrowLeft: [-70, 0],
      d: [70, 0], ArrowRight: [70, 0],
    };
    const dir = dirs[event.key];
    if (dir) {
      event.preventDefault();
      const chef = world.chef;
      const nx = Math.max(240, Math.min(1040, (chef.moving ? chef.tx : chef.x) + dir[0]));
      const ny = Math.max(240, Math.min(600, (chef.moving ? chef.ty : chef.y) + dir[1]));
      setChefTarget(world, nx, ny, null, '');
    }
  });
}
