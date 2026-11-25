// render.js — every pixel of Sugar Rush Parlor, drawn with canvas shapes.
// No images, no fonts from the network: flat vector desserts, a pastel
// pink + cream + mint palette, and labels big enough to read when the
// screenshot is shrunk. render(ctx, world, t) draws one frame; t is
// animation time in seconds.

import { COLORS, DISHES, INGREDIENTS, STATIONS, BIN_ORDER, SHIFT_SECONDS, MAX_MISSED, STAR_COINS, GAME_TITLE, GAME_SUBTITLE } from './config.js';
import { ticketRect, stationRect, plateRect, serveRect, serveReadyRect, binRect, startButtonRect, againButtonRect } from './layout.js';
import { plateIsComplete } from './world.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = (weight || '700') + ' ' + size + 'px system-ui, "Segoe UI", sans-serif';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// A swirly lollipop: the parlor's mascot shape, hung in the window and
// over the title.
function drawLollipop(ctx, x, y, r) {
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y + r * 0.9); ctx.lineTo(x, y + r + 26); ctx.stroke();
  ctx.fillStyle = '#ff6fa5';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0.6, 0.6 + Math.PI * 1.2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r * 0.25, 2.2, 2.2 + Math.PI * 1.2); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.18, 0, Math.PI * 2); ctx.fill();
}

// A little cherry on top — every guest of the parlor wears one.
function drawCherry(ctx, x, y, r) {
  ctx.strokeStyle = '#2f9e6e';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x + 3, y - r - 6, x + 7, y - r - 7); ctx.stroke();
  ctx.fillStyle = '#e5484d';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.25, 0, Math.PI * 2); ctx.fill();
}

// Shrink a label just enough to fit a max width, never below 10px.
function fitSize(ctx, s, maxW, startSize, weight) {
  let size = startSize;
  ctx.font = (weight || '700') + ' ' + size + 'px system-ui, "Segoe UI", sans-serif';
  while (size > 10 && ctx.measureText(s).width > maxW) {
    size -= 1;
    ctx.font = (weight || '700') + ' ' + size + 'px system-ui, "Segoe UI", sans-serif';
  }
  return size;
}

function fmtTime(secs) {
  const s = Math.max(0, Math.ceil(secs));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

// ---- dessert icons, drawn flat so they read at any size ----
export function drawIngredient(ctx, id, x, y, s) {
  const ing = INGREDIENTS[id];
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = Math.max(2, s * 0.06);
  ctx.strokeStyle = 'rgba(74,36,64,0.5)';
  switch (id) {
    case 'nasi': {
      // vanilla scoop on a cone
      ctx.fillStyle = '#e8c88a';
      ctx.beginPath(); ctx.moveTo(-s * 0.26, s * 0.05); ctx.lineTo(s * 0.26, s * 0.05); ctx.lineTo(0, s * 0.45); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ing.color;
      ctx.beginPath(); ctx.arc(0, -s * 0.08, s * 0.36, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff3d6';
      ctx.beginPath(); ctx.arc(-s * 0.12, -s * 0.2, s * 0.1, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'mie': {
      // strawberry scoop on a cone, with seeds
      ctx.fillStyle = '#e8c88a';
      ctx.beginPath(); ctx.moveTo(-s * 0.26, s * 0.05); ctx.lineTo(s * 0.26, s * 0.05); ctx.lineTo(0, s * 0.45); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ing.color;
      ctx.beginPath(); ctx.arc(0, -s * 0.08, s * 0.36, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ing.dark;
      for (const [dx, dy] of [[-0.16, -0.18], [0.12, -0.22], [0.02, -0.02], [-0.05, -0.3]]) {
        ctx.beginPath(); ctx.ellipse(dx * s, dy * s, s * 0.035, s * 0.055, 0, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'ayam': {
      // a brownie square with chocolate drizzle
      ctx.fillStyle = ing.color;
      rr(ctx, -s * 0.36, -s * 0.32, s * 0.72, s * 0.64, s * 0.08); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#f7cf6b'; ctx.lineWidth = s * 0.06; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-s * 0.28, -s * 0.1);
      ctx.quadraticCurveTo(-s * 0.1, s * 0.08, s * 0.28, -s * 0.12); ctx.stroke();
      ctx.fillStyle = '#e5484d';
      ctx.beginPath(); ctx.arc(s * 0.14, -s * 0.3, s * 0.09, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'teh': {
      // a strawberry shake: cup, straw, whipped top
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.2); ctx.lineTo(s * 0.3, -s * 0.2); ctx.lineTo(s * 0.22, s * 0.34); ctx.lineTo(-s * 0.22, s * 0.34); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ing.color;
      ctx.fillRect(-s * 0.26, -s * 0.14, s * 0.52, s * 0.12);
      ctx.fillStyle = '#fff3d6';
      ctx.beginPath(); ctx.arc(0, -s * 0.26, s * 0.16, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#e5488f'; ctx.lineWidth = s * 0.07; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(s * 0.1, -s * 0.34); ctx.lineTo(s * 0.26, -s * 0.46); ctx.stroke();
      break;
    }
    case 'telur': {
      // a pinch of sprinkles
      const cols = ['#ff6fa5', '#ffd166', '#7ec8e3', '#2f9e6e', '#c9a0dc'];
      cols.forEach((c, i) => {
        ctx.save();
        ctx.translate(([-0.22, 0.18, -0.02, 0.26, -0.1][i]) * s, ([-0.14, -0.2, 0.12, 0.05, -0.3][i]) * s);
        ctx.rotate((i * 0.9 - 1.2));
        ctx.fillStyle = c;
        ctx.fillRect(-s * 0.13, -s * 0.045, s * 0.26, s * 0.09);
        ctx.restore();
      });
      break;
    }
    case 'kecap': {
      // chocolate sauce bottle
      ctx.fillStyle = ing.color;
      rr(ctx, -s * 0.2, -s * 0.34, s * 0.4, s * 0.68, s * 0.1); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c9a25e';
      ctx.fillRect(-s * 0.2, -s * 0.08, s * 0.4, s * 0.16);
      break;
    }
    case 'cabai': {
      // a cherry with a stem
      ctx.strokeStyle = '#2f9e6e'; ctx.lineWidth = s * 0.07; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, -s * 0.2); ctx.quadraticCurveTo(s * 0.08, -s * 0.36, s * 0.22, -s * 0.4); ctx.stroke();
      ctx.fillStyle = ing.color;
      ctx.beginPath(); ctx.arc(0, s * 0.04, s * 0.34, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(74,36,64,0.5)'; ctx.lineWidth = Math.max(2, s * 0.05);
      ctx.beginPath(); ctx.arc(0, s * 0.04, s * 0.34, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.arc(-s * 0.12, -s * 0.08, s * 0.08, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'bawang': {
      // a wafer stick
      ctx.save(); ctx.rotate(0.5);
      ctx.fillStyle = ing.color;
      rr(ctx, -s * 0.14, -s * 0.4, s * 0.28, s * 0.8, s * 0.06); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = ing.dark; ctx.lineWidth = s * 0.05;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo(-s * 0.14, i * s * 0.16); ctx.lineTo(s * 0.14, i * s * 0.16 + s * 0.1); ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 'es':
      ctx.fillStyle = ing.color;
      ctx.strokeStyle = ing.dark;
      for (const [dx, dy, r] of [[-0.16, -0.1, 0.1], [0.16, 0.08, 0.12], [0.05, -0.22, 0.08]]) {
        ctx.save(); ctx.translate(dx * s, dy * s); ctx.rotate(r);
        ctx.fillRect(-s * 0.18, -s * 0.18, s * 0.36, s * 0.36);
        ctx.strokeRect(-s * 0.18, -s * 0.18, s * 0.36, s * 0.36);
        ctx.restore();
      }
      break;
    case 'gula':
      ctx.fillStyle = '#ffffff';
      for (const [dx, dy] of [[-0.16, 0.05], [0.12, -0.12], [0.2, 0.14], [-0.05, -0.22]]) {
        ctx.save(); ctx.translate(dx * s, dy * s); ctx.rotate(0.4);
        ctx.fillRect(-s * 0.12, -s * 0.12, s * 0.24, s * 0.24);
        ctx.restore();
      }
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.05, 0, Math.PI * 2); ctx.fill();
      break;
  }
  ctx.restore();
}

function drawFace(ctx, customer, x, y, r) {
  ctx.save();
  ctx.fillStyle = customer.skin;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = customer.shirt;
  ctx.beginPath(); ctx.arc(x, y - r * 0.55, r * 0.9, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#4a2440';
  ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.1, r * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.35, y - r * 0.1, r * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#4a2440'; ctx.lineWidth = Math.max(2, r * 0.1); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y + r * 0.15, r * 0.4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  // every guest of the parlor wears a little cherry on top
  drawCherry(ctx, x, y - r * 1.02, r * 0.3);
  ctx.restore();
}

function drawPatienceBar(ctx, x, y, w, frac) {
  ctx.fillStyle = 'rgba(74,36,64,0.15)';
  rr(ctx, x, y, w, 10, 5); ctx.fill();
  const c = frac > 0.5 ? COLORS.good : frac > 0.25 ? COLORS.warn : COLORS.bad;
  ctx.fillStyle = c;
  if (frac > 0.02) { rr(ctx, x, y, Math.max(8, w * frac), 10, 5); ctx.fill(); }
}

// ---- the dessert parlor ----
function drawBackground(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, 0, 720);
  g.addColorStop(0, '#ffe3ee');
  g.addColorStop(0.6, '#fff1f6');
  g.addColorStop(1, '#fff6ec');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1280, 720);
  // pastel windows with a blue sky, a sun and clouds
  for (const wx of [300, 980]) {
    ctx.fillStyle = '#bfe8ff';
    ctx.beginPath();
    ctx.moveTo(wx - 70, 210); ctx.lineTo(wx - 70, 60);
    ctx.quadraticCurveTo(wx, -10, wx + 70, 60);
    ctx.lineTo(wx + 70, 210);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(wx + 34, 62, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(wx - 30, 100, 26, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(wx + 6, 130, 20, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff8fb8'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(wx - 70, 210); ctx.lineTo(wx - 70, 60);
    ctx.quadraticCurveTo(wx, -10, wx + 70, 60);
    ctx.lineTo(wx + 70, 210);
    ctx.closePath(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,143,184,0.7)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(wx, 30); ctx.lineTo(wx, 210); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(wx - 70, 130); ctx.lineTo(wx + 70, 130); ctx.stroke();
  }
  // candy-striped awning under the top bar, scalloped at the edge
  const awY = 64, awH = 34;
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#ff8fb8' : '#ffffff';
    ctx.fillRect(i * 80, awY, 80, awH);
  }
  ctx.fillStyle = '#e5488f';
  ctx.fillRect(0, awY + awH, 1280, 3);
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#ff8fb8' : '#ffffff';
    ctx.beginPath(); ctx.arc(i * 80 + 40, awY + awH + 3, 40, 0, Math.PI); ctx.fill();
  }
  // lollipops hanging in the side gaps, swaying a little
  for (const [lx, phase] of [[170, 0], [1110, 1.4]]) {
    const sway = Math.sin(t * 1.2 + phase) * 5;
    ctx.strokeStyle = '#e5488f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lx, awY); ctx.lineTo(lx + sway, 128); ctx.stroke();
    drawLollipop(ctx, lx + sway, 148, 22);
  }
  // bunting flags strung across, in pink, mint and yellow
  const flagCols = ['#ff8fb8', '#7ec8a9', '#ffd166', '#ff6fa5', '#7ec8e3'];
  ctx.strokeStyle = '#e5488f'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 104); ctx.quadraticCurveTo(640, 124, 1280, 104); ctx.stroke();
  for (let i = 0; i < 16; i++) {
    const fx = 40 + i * 78;
    const fy = 104 + Math.sin((fx / 1280) * Math.PI) * 20;
    ctx.fillStyle = flagCols[i % flagCols.length];
    ctx.beginPath(); ctx.moveTo(fx - 12, fy); ctx.lineTo(fx + 12, fy); ctx.lineTo(fx, fy + 22); ctx.closePath(); ctx.fill();
  }
  // sprinkles scattered on the walls, fixed spots so every frame matches
  const sprinkleCols = ['#ff6fa5', '#ffd166', '#7ec8e3', '#2f9e6e', '#c9a0dc', '#e5488f'];
  const spots = [
    [240, 260, 0.4], [250, 560, 1.2], [420, 230, 2.0], [880, 240, 0.9], [1020, 560, 1.8],
    [460, 620, 0.2], [820, 620, 2.6], [60, 300, 1.0], [1220, 300, 2.2], [60, 600, 0.6], [1220, 600, 1.5],
  ];
  spots.forEach(([sx, sy, rot], i) => {
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(rot);
    ctx.fillStyle = sprinkleCols[i % sprinkleCols.length];
    ctx.fillRect(-9, -3, 18, 6);
    ctx.restore();
  });
  // mint and cream checkerboard floor along the bottom
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#bfe8d4' : '#fff6ec';
    ctx.fillRect(i * 32, 636, 32, 84);
  }
  ctx.fillStyle = '#ff8fb8';
  ctx.fillRect(0, 636, 1280, 4);
}

function drawTopBar(ctx, world) {
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(0, 0, 1280, 64);
  ctx.fillStyle = '#c22e72';
  ctx.fillRect(0, 62, 1280, 2);
  text(ctx, GAME_TITLE, 24, 24, 26, '#ffffff', '800');
  text(ctx, GAME_SUBTITLE, 24, 48, 13, '#ffe3ee', '400');
  // timer, big and central
  const frac = world.timeLeft / SHIFT_SECONDS;
  const tc = frac > 0.5 ? '#ffffff' : frac > 0.2 ? '#ffe9a8' : '#ffd166';
  text(ctx, '⏱ ' + fmtTime(world.timeLeft), 640, 26, 34, tc, '800', 'center');
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  rr(ctx, 480, 48, 320, 8, 4); ctx.fill();
  ctx.fillStyle = tc;
  rr(ctx, 480, 48, Math.max(8, 320 * frac), 8, 4); ctx.fill();
  // coins and combo (the multiplier caps at x2, same as the world rules)
  text(ctx, '🪙 ' + world.coins + ' coins', 1256, 22, 22, '#ffffff', '800', 'right');
  const mult = Math.min(1 + (world.combo - 1) * 0.25, 2.0);
  const comboText = world.combo >= 2 ? 'COMBO x' + (Number.isInteger(mult) ? mult : mult.toFixed(2)) : 'score ' + world.score;
  text(ctx, comboText, 1256, 48, 14, world.combo >= 2 ? '#ffd166' : '#ffe3ee', '700', 'right');
  // customers who left, as three small scoops
  for (let i = 0; i < MAX_MISSED; i++) {
    ctx.fillStyle = i < world.missed ? '#7a1030' : 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(940 + i * 26, 26, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(940 + i * 26, 26, 9, 0, Math.PI * 2); ctx.stroke();
  }
  text(ctx, 'customers left:', 930, 26, 12, '#ffe3ee', '400', 'right');
}

function drawOrderBoard(ctx, world, t) {
  world.orders.forEach((order, i) => {
    const r = ticketRect(i);
    const dish = DISHES[order.dish];
    const selected = i === world.selectedOrder;
    ctx.fillStyle = selected ? '#ffe3ee' : COLORS.board;
    rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
    ctx.strokeStyle = selected ? COLORS.gold : COLORS.boardEdge;
    ctx.lineWidth = selected ? 3 : 2;
    rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.stroke();
    // a soft pink hairline inside, like a ticket stub
    ctx.strokeStyle = 'rgba(229,72,143,0.4)'; ctx.lineWidth = 1;
    rr(ctx, r.x + 5, r.y + 5, r.w - 10, r.h - 10, 8); ctx.stroke();
    drawFace(ctx, order.customer, r.x + 30, r.y + 30, 20);
    text(ctx, order.customer.name, r.x + 56, r.y + 22, 13, COLORS.ink, '700');
    text(ctx, dish.name, r.x + 56, r.y + 44, fitSize(ctx, dish.name, 186, 17, '800'), dish.color, '800');
    // ingredient dots: filled = on the plate, outline = still missing
    let ix = r.x + 56;
    for (const need of dish.needs) {
      const done = order.added.has(need);
      ctx.fillStyle = done ? INGREDIENTS[need].color : 'rgba(74,36,64,0.12)';
      ctx.beginPath(); ctx.arc(ix, r.y + 72, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(74,36,64,0.4)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(ix, r.y + 72, 11, 0, Math.PI * 2); ctx.stroke();
      if (done) {
        ctx.strokeStyle = '#2f9e6e'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(ix - 5, r.y + 72); ctx.lineTo(ix - 1, r.y + 76); ctx.lineTo(ix + 6, r.y + 66); ctx.stroke();
      }
      ix += 26;
    }
    drawPatienceBar(ctx, r.x + 14, r.y + 96, r.w - 28, Math.max(0, order.patience / order.maxPatience));
    if (selected) text(ctx, '▶ SELECTED', r.x + r.w - 12, r.y + 22, 11, COLORS.gold, '800', 'right');
  });
  for (let i = world.orders.length; i < 3; i++) {
    const r = ticketRect(i);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
    text(ctx, 'empty table — next order coming…', r.x + r.w / 2, r.y + r.h / 2, 13, 'rgba(74,36,64,0.45)', '400', 'center');
  }
}

function drawStations(ctx, world, t) {
  for (const station of STATIONS) {
    const r = stationRect(station);
    ctx.fillStyle = '#fff6ec';
    rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
    ctx.strokeStyle = '#ff8fb8'; ctx.lineWidth = 2;
    rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.stroke();
    ctx.strokeStyle = 'rgba(229,72,143,0.4)'; ctx.lineWidth = 1;
    rr(ctx, r.x + 5, r.y + 5, r.w - 10, r.h - 10, 8); ctx.stroke();
    const cook = world.cooks[station.id];
    text(ctx, station.name, r.x + r.w / 2, r.y + 16, 16, COLORS.ink, '800', 'center');
    text(ctx, station.label, r.x + r.w / 2, r.y + 36, 11, 'rgba(74,36,64,0.6)', '400', 'center');
    if (station.kind === 'wok') {
      // freezer: a mint chest with three tubs of scoops
      ctx.fillStyle = '#bfe8d4';
      rr(ctx, r.x + 20, r.y + 48, r.w - 40, 44, 8); ctx.fill();
      ctx.strokeStyle = '#7ec8a9'; ctx.lineWidth = 2;
      rr(ctx, r.x + 20, r.y + 48, r.w - 40, 44, 8); ctx.stroke();
      const tubCols = ['#ff8fb8', '#fff3d6', '#7ec8a9'];
      tubCols.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(r.x + 40 + i * 35, r.y + 70, 13, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(74,36,64,0.35)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(r.x + 40 + i * 35, r.y + 70, 13, 0, Math.PI * 2); ctx.stroke();
      });
      // a snowflake above the chest
      ctx.strokeStyle = '#7ec8e3'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      const sx = r.x + r.w / 2, sy = r.y + 98;
      for (let a = 0; a < 3; a++) {
        const ang = (a * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(sx - Math.cos(ang) * 8, sy - Math.sin(ang) * 8);
        ctx.lineTo(sx + Math.cos(ang) * 8, sy + Math.sin(ang) * 8);
        ctx.stroke();
      }
      if (cook) drawIngredient(ctx, cook.ingredient, r.x + r.w / 2, r.y + 70, 30);
    } else if (station.kind === 'grill') {
      // oven: a cream box with a glowing window and a cake inside
      ctx.fillStyle = '#fff6ec';
      rr(ctx, r.x + 20, r.y + 46, r.w - 40, 52, 8); ctx.fill();
      ctx.strokeStyle = '#ff8fb8'; ctx.lineWidth = 2;
      rr(ctx, r.x + 20, r.y + 46, r.w - 40, 52, 8); ctx.stroke();
      ctx.fillStyle = '#4a2440';
      rr(ctx, r.x + 32, r.y + 56, r.w - 64, 32, 5); ctx.fill();
      const glow = 0.6 + 0.4 * Math.sin(t * 3 + station.x);
      ctx.fillStyle = 'rgba(255,157,69,' + glow + ')';
      ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + 80, 24, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a5a3b';
      rr(ctx, r.x + r.w / 2 - 18, r.y + 66, 36, 16, 4); ctx.fill();
      ctx.fillStyle = '#ff6fa5';
      ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + 62, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4a2440';
      ctx.beginPath(); ctx.arc(r.x + 36, r.y + 110, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r.x + r.w - 36, r.y + 110, 5, 0, Math.PI * 2); ctx.fill();
      if (cook) drawIngredient(ctx, cook.ingredient, r.x + r.w / 2, r.y + 72, 30);
    } else {
      // blender: a jar of pink shake on its base
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.moveTo(r.x + 42, r.y + 46); ctx.lineTo(r.x + r.w - 42, r.y + 46); ctx.lineTo(r.x + r.w - 50, r.y + 96); ctx.lineTo(r.x + 50, r.y + 96); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ff8fb8'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(r.x + 42, r.y + 46); ctx.lineTo(r.x + r.w - 42, r.y + 46); ctx.lineTo(r.x + r.w - 50, r.y + 96); ctx.lineTo(r.x + 50, r.y + 96); ctx.closePath(); ctx.stroke();
      ctx.fillStyle = '#ff8fb8';
      ctx.beginPath(); ctx.moveTo(r.x + 46, r.y + 62); ctx.lineTo(r.x + r.w - 46, r.y + 62); ctx.lineTo(r.x + r.w - 49, r.y + 94); ctx.lineTo(r.x + 49, r.y + 94); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#4a2440';
      rr(ctx, r.x + 44, r.y + 96, r.w - 88, 12, 4); ctx.fill();
      ctx.fillStyle = '#e5488f';
      ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + 102, 3, 0, Math.PI * 2); ctx.fill();
      if (cook) drawIngredient(ctx, cook.ingredient, r.x + r.w / 2, r.y + 74, 30);
    }
    if (cook) {
      const frac = 1 - cook.left / cook.total;
      ctx.fillStyle = 'rgba(74,36,64,0.15)';
      rr(ctx, r.x + 14, r.y + r.h - 16, r.w - 28, 8, 4); ctx.fill();
      ctx.fillStyle = COLORS.gold;
      rr(ctx, r.x + 14, r.y + r.h - 16, Math.max(6, (r.w - 28) * frac), 8, 4); ctx.fill();
    } else {
      text(ctx, 'tap to cook', r.x + r.w / 2, r.y + r.h - 12, 11, 'rgba(74,36,64,0.55)', '400', 'center');
    }
  }
}

function drawPlate(ctx, world, t) {
  const p = plateRect();
  // a pink counter under the plate
  ctx.fillStyle = COLORS.counter;
  rr(ctx, p.x - 40, p.y + 150, p.w + 80, 96, 14); ctx.fill();
  ctx.fillStyle = COLORS.counterTop;
  rr(ctx, p.x - 40, p.y + 150, p.w + 80, 14, 7); ctx.fill();
  // the white plate with a pink rim
  ctx.fillStyle = COLORS.plate;
  ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = COLORS.plateEdge; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(229,72,143,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r - 14, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(74,36,64,0.10)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r - 26, 0, Math.PI * 2); ctx.stroke();

  const order = world.orders[world.selectedOrder];
  if (order) {
    const dish = DISHES[order.dish];
    text(ctx, dish.name, p.cx, p.y - 22, 20, dish.color, '800', 'center');
    const added = [...order.added];
    if (added.length === 0) {
      text(ctx, 'plate empty — tap ingredients below', p.cx, p.cy, 15, 'rgba(74,36,64,0.55)', '400', 'center');
    } else {
      // arrange the assembled dessert on the plate like a real treat;
      // each sits on a tinted disc so even white food reads on the plate
      const spots = [[-52, -28], [48, -34], [-8, 38], [58, 34], [-58, 34], [8, -52]];
      added.forEach((id, i) => {
        const [dx, dy] = spots[i % spots.length];
        const ing = INGREDIENTS[id];
        ctx.fillStyle = ing.dark + '2e';
        ctx.beginPath(); ctx.arc(p.cx + dx, p.cy + dy, 36, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = ing.dark + '80'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p.cx + dx, p.cy + dy, 36, 0, Math.PI * 2); ctx.stroke();
        drawIngredient(ctx, id, p.cx + dx, p.cy + dy, 62);
      });
    }
    // sparkles when the plate is getting full
    if (added.length >= 2) {
      ctx.strokeStyle = COLORS.steam; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = 0; i < 2; i++) {
        const sx = p.cx - 30 + i * 60;
        const sway = Math.sin(t * 2.2 + i * 2.4) * 7;
        ctx.beginPath(); ctx.moveTo(sx, p.cy - 70);
        ctx.quadraticCurveTo(sx + sway, p.cy - 92, sx - sway, p.cy - 108);
        ctx.stroke();
      }
    }
    if (plateIsComplete(order)) {
      ctx.strokeStyle = COLORS.good; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r + 8, 0, Math.PI * 2); ctx.stroke();
      text(ctx, 'READY TO SERVE!', p.cx, p.cy + p.r + 26, 16, COLORS.good, '800', 'center');
    } else {
      const missing = [...order.needs].filter((n) => !order.added.has(n));
      text(ctx, 'missing: ' + missing.map((m) => INGREDIENTS[m].name).join(', '), p.cx, p.cy + p.r + 26, 14, '#8a5a70', '700', 'center');
    }
  } else {
    text(ctx, 'no orders — wait a moment', p.cx, p.cy, 15, 'rgba(74,36,64,0.55)', '400', 'center');
  }
}

function drawServe(ctx, world, t) {
  const r = serveRect();
  const order = world.orders[world.selectedOrder];
  const ready = plateIsComplete(order);
  const pulse = ready ? 0.85 + 0.15 * Math.sin(t * 6) : 1;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = ready ? COLORS.good : '#c9b3bf';
  rr(ctx, r.x, r.y, r.w, r.h, 14); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = ready ? '#2f8f57' : '#b09aa8'; ctx.lineWidth = 3;
  rr(ctx, r.x, r.y, r.w, r.h, 14); ctx.stroke();
  text(ctx, 'SERVE', r.x + r.w / 2, r.y + 34, 30, '#ffffff', '800', 'center');
  text(ctx, ready ? 'plate complete — click / space' : 'finish the plate first', r.x + r.w / 2, r.y + 68, 13, 'rgba(255,255,255,0.85)', '400', 'center');
  // the ready dessert on the serving counter
  const s = serveReadyRect();
  ctx.fillStyle = '#fff6ec';
  rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.fill();
  ctx.strokeStyle = '#ff8fb8'; ctx.lineWidth = 2;
  rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.stroke();
  text(ctx, 'READY TRAY', s.x + s.w / 2, s.y + 18, 12, 'rgba(74,36,64,0.6)', '800', 'center');
  if (ready && order) {
    const dish = DISHES[order.dish];
    ctx.fillStyle = COLORS.plate;
    ctx.beginPath(); ctx.arc(s.x + 52, s.y + 74, 34, 0, Math.PI * 2); ctx.fill();
    drawIngredient(ctx, order.dish === 'esteh' ? 'teh' : order.dish === 'sate' ? 'ayam' : order.dish === 'miegor' ? 'mie' : 'nasi', s.x + 52, s.y + 74, 40);
    text(ctx, dish.name, s.x + 100, s.y + 62, fitSize(ctx, dish.name, 126, 15, '800'), dish.color, '800');
    text(ctx, dish.coins + ' coins' + (world.rush ? ' x2' : ''), s.x + 100, s.y + 86, 13, COLORS.gold, '700');
    if (world.rush) text(ctx, 'RUSH HOUR!', s.x + 100, s.y + 106, 12, '#ff9d45', '800');
  } else {
    ctx.strokeStyle = 'rgba(74,36,64,0.25)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.arc(s.x + 52, s.y + 74, 34, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'no plate', s.x + 100, s.y + 66, 13, 'rgba(74,36,64,0.55)', '400');
    text(ctx, 'ready yet', s.x + 100, s.y + 88, 13, 'rgba(74,36,64,0.55)', '400');
  }
}

function drawBins(ctx, world) {
  text(ctx, 'INGREDIENTS — tap or press 1-6', 36, 630, 13, COLORS.ink, '800');
  BIN_ORDER.forEach((id, i) => {
    const r = binRect(i);
    const ing = INGREDIENTS[id];
    const order = world.orders[world.selectedOrder];
    const needed = order ? order.needs.has(id) : false;
    const added = order ? order.added.has(id) : false;
    ctx.fillStyle = needed ? '#ffe3ee' : '#fffafc';
    rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
    ctx.strokeStyle = added ? COLORS.good : needed ? COLORS.gold : COLORS.boardEdge;
    ctx.lineWidth = added || needed ? 3 : 2;
    rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.stroke();
    drawIngredient(ctx, id, r.x + 30, r.y + r.h / 2, 34);
    text(ctx, ing.name, r.x + 54, r.y + 20, 15, COLORS.ink, '700');
    text(ctx, '[' + (i + 1) + ']', r.x + r.w - 10, r.y + 20, 12, 'rgba(74,36,64,0.55)', '400', 'right');
    text(ctx, added ? '✓ added' : needed ? 'needed' : '—', r.x + 54, r.y + 40, 12, added ? COLORS.good : needed ? COLORS.gold : 'rgba(74,36,64,0.45)', '400');
  });
}

function drawPopups(ctx, world) {
  for (const p of world.popups) {
    const age = world.elapsed - p.born;
    if (age > 1.4) continue;
    ctx.globalAlpha = Math.max(0, 1 - age / 1.4);
    text(ctx, p.text, p.x, p.y - age * 26, 18, p.color, '800', 'center');
    ctx.globalAlpha = 1;
  }
}

function drawFlash(ctx, world) {
  if (!world.flash) return;
  const age = world.elapsed - world.flashAt;
  if (age > 2.5) return;
  ctx.globalAlpha = Math.max(0, 1 - age / 2.5);
  ctx.fillStyle = 'rgba(74,36,64,0.9)';
  rr(ctx, 390, 210, 500, 52, 12); ctx.fill();
  ctx.strokeStyle = COLORS.boardEdge; ctx.lineWidth = 2;
  rr(ctx, 390, 210, 500, 52, 12); ctx.stroke();
  text(ctx, world.flash, 640, 237, 22, '#ffd6e7', '800', 'center');
  ctx.globalAlpha = 1;
}

// ---- screens ----
function drawTitle(ctx, world, t) {
  drawBackground(ctx, t);
  ctx.fillStyle = 'rgba(255,255,255,0.30)';
  ctx.fillRect(0, 0, 1280, 720);
  drawLollipop(ctx, 640, 96, 18);
  text(ctx, 'SUGAR RUSH', 640, 185, 80, '#e5488f', '800', 'center');
  text(ctx, 'PARLOR', 640, 262, 80, '#ff6fa5', '800', 'center');
  text(ctx, GAME_SUBTITLE, 640, 318, 20, COLORS.ink, '400', 'center');
  // a little preview plate of the four desserts
  const dishes = ['nasgor', 'miegor', 'sate', 'esteh'];
  dishes.forEach((d, i) => {
    const x = 400 + i * 160;
    ctx.fillStyle = COLORS.plate;
    ctx.beginPath(); ctx.arc(x, 395, 52, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = COLORS.plateEdge; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, 395, 52, 0, Math.PI * 2); ctx.stroke();
    const dish = DISHES[d];
    drawIngredient(ctx, dish.needs[0], x, 395, 56);
    text(ctx, dish.name, x, 465, 15, dish.color, '800', 'center');
    text(ctx, dish.coins + ' coins', x, 487, 13, COLORS.gold, '400', 'center');
  });
  text(ctx, 'Orders land on the top board. Tap ingredients to build, freeze / bake / blend,', 640, 508, 16, COLORS.ink, '400', 'center');
  text(ctx, 'then SERVE before customers run out of patience. 3 walk away = parlor closes.', 640, 531, 16, COLORS.ink, '400', 'center');
  const b = startButtonRect();
  const pulse = 0.9 + 0.1 * Math.sin(t * 4);
  ctx.save(); ctx.globalAlpha = pulse;
  ctx.fillStyle = COLORS.good;
  rr(ctx, b.x, b.y, b.w, b.h, 14); ctx.fill();
  ctx.restore();
  text(ctx, 'OPEN THE PARLOR', b.x + b.w / 2, b.y + b.h / 2, 30, '#ffffff', '800', 'center');
  text(ctx, 'click the button or press Enter • mouse + keyboard (1-6, space, Tab)', 640, 628, 13, 'rgba(74,36,64,0.6)', '400', 'center');
}

function drawResults(ctx, world, t) {
  drawBackground(ctx, t);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(0, 0, 1280, 720);
  text(ctx, 'PARLOR CLOSED', 640, 180, 64, '#e5488f', '800', 'center');
  text(ctx, world.overReason, 640, 225, 18, COLORS.ink, '400', 'center');
  // stars
  const stars = STAR_COINS.filter((c) => world.coins >= c).length;
  for (let i = 0; i < 3; i++) {
    const x = 560 + i * 80;
    ctx.fillStyle = i < stars ? '#ff6fa5' : 'rgba(74,36,64,0.15)';
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const ang = -Math.PI / 2 + (k * Math.PI) / 5;
      const rad = k % 2 === 0 ? 34 : 15;
      const px = x + Math.cos(ang) * rad, py = 260 + Math.sin(ang) * rad;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
  }
  const rows = [
    ['Orders served', String(world.served)],
    ['Customers left angry', String(world.missed)],
    ['Best combo', world.bestCombo + ' in a row'],
    ['Coins tonight', world.coins + ' coins'],
  ];
  rows.forEach(([label, value], i) => {
    const y = 332 + i * 44;
    text(ctx, label, 480, y, 20, COLORS.ink, '400');
    text(ctx, value, 800, y, 22, COLORS.gold, '800', 'right');
  });
  const b = againButtonRect();
  ctx.fillStyle = COLORS.good;
  rr(ctx, b.x, b.y, b.w, b.h, 14); ctx.fill();
  text(ctx, 'OPEN AGAIN TOMORROW', b.x + b.w / 2, b.y + b.h / 2, 26, '#ffffff', '800', 'center');
  text(ctx, 'click the button or press Enter', 640, 660, 13, 'rgba(74,36,64,0.6)', '400', 'center');
}

export function render(ctx, world, t) {
  ctx.clearRect(0, 0, 1280, 720);
  if (world.state === 'title') { drawTitle(ctx, world, t); return; }
  if (world.state === 'over') { drawResults(ctx, world, t); return; }
  drawBackground(ctx, t);
  drawTopBar(ctx, world);
  drawOrderBoard(ctx, world, t);
  drawStations(ctx, world, t);
  drawPlate(ctx, world, t);
  drawServe(ctx, world, t);
  drawBins(ctx, world);
  drawFlash(ctx, world);
  drawPopups(ctx, world);
}
