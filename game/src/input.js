// input.js — mouse and keyboard, translated into world actions.
// One file, one job: where the pointer is and what key was pressed.

import { INGREDIENTS, BIN_ORDER, STATIONS } from './config.js';
import {
  inRect, binByPoint, ticketByPoint, stationByPoint,
  serveRect, startButtonRect, againButtonRect,
} from './layout.js';
import {
  startShift, selectOrder, addBinIngredient, startCook, serveOrder, plateIsComplete,
} from './world.js';

export function attachInput(canvas, world, sfx) {
  function toStage(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (1280 / rect.width),
      y: (event.clientY - rect.top) * (720 / rect.height),
    };
  }

  function buzz(kind, x, y) {
    if (kind === 'added') sfx.pop();
    else if (kind === 'cooking') sfx.sizzle();
    else if (kind === 'wrong') sfx.thud();
    else if (kind === 'busy') sfx.thud();
  }

  function popup(world, x, y, text, color) {
    world.popups.push({ x, y, text, color, born: world.elapsed });
    if (world.popups.length > 8) world.popups.shift();
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
      // Start the ingredient this station cooks that the order needs.
      const order = world.orders[world.selectedOrder];
      if (order) {
        const wanted = [...order.needs].find((id) => INGREDIENTS[id].kind === station.kind);
        if (wanted) {
          const res = startCook(world, wanted);
          buzz(res, x, y);
          if (res === 'wrong') popup(world, x, y - 10, 'not for this order', '#e5484d');
          if (res === 'busy') popup(world, x, y - 10, 'still making it, wait!', '#ffb020');
        } else {
          popup(world, x, y - 10, 'this order does not need that', '#e5484d');
          sfx.thud();
        }
      }
      return;
    }

    const bin = binByPoint(x, y);
    if (bin) {
      const res = addBinIngredient(world, bin);
      buzz(res, x, y);
      if (res === 'wrong') popup(world, x, y - 10, 'not for this order', '#e5484d');
      return;
    }

    const serve = serveRect();
    if (inRect(x, y, serve)) {
      const order = world.orders[world.selectedOrder];
      if (order && plateIsComplete(order)) {
        const earned = serveOrder(world);
        const r = serve;
        const ls = world.lastServe;
        const msg = ls && ls.perfect ? 'PERFECT! +' + earned + ' coins'
          : ls && ls.golden ? 'GOLDEN! +' + earned + ' coins'
          : '+' + earned + ' coins';
        const col = ls && ls.perfect ? '#e5488f' : ls && ls.golden ? '#d4a017' : '#e5488f';
        popup(world, r.x + r.w / 2, r.y - 14, msg, col);
        sfx.serve();
      } else {
        popup(world, x, y - 10, 'plate not ready yet', '#ffb020');
        sfx.thud();
      }
    }
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
      const res = addBinIngredient(world, BIN_ORDER[keyIndex]);
      buzz(res, 640, 620);
      return;
    }
    if (event.key === ' ') {
      event.preventDefault();
      const order = world.orders[world.selectedOrder];
      if (order && plateIsComplete(order)) {
        const earned = serveOrder(world);
        const ls = world.lastServe;
        const msg = ls && ls.perfect ? 'PERFECT! +' + earned + ' coins'
          : ls && ls.golden ? 'GOLDEN! +' + earned + ' coins'
          : '+' + earned + ' coins';
        const col = ls && ls.perfect ? '#e5488f' : ls && ls.golden ? '#d4a017' : '#e5488f';
        popup(world, 1128, 286, msg, col);
        sfx.serve();
      }
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
      const order = world.orders[world.selectedOrder];
      if (station && order) {
        const wanted = [...order.needs].find((id) => INGREDIENTS[id].kind === station.kind);
        if (wanted) buzz(startCook(world, wanted), 110, station.y + 60);
      }
    }
  });
}
