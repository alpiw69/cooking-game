// render.js — every pixel of Dapur Kerajaan, drawn with canvas shapes.
// No images, no fonts from the network: flat vector food, a royal purple
// and gold palette, and labels big enough to read when the screenshot is
// shrunk. render(ctx, world, t) draws one frame; t is animation time in
// seconds.

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

// Elegant serif for royal headings and dish names.
function textSerif(ctx, s, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = (weight || '700') + ' ' + size + 'px Georgia, "Times New Roman", serif';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// A small gold crown, worn by every royal guest and over the title.
function drawCrown(ctx, x, y, w, h) {
  ctx.fillStyle = '#d4af37';
  ctx.strokeStyle = '#8a6d2f';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y + h / 2);
  ctx.lineTo(x - w / 2, y - h * 0.1);
  ctx.lineTo(x - w * 0.22, y + h * 0.18);
  ctx.lineTo(x, y - h / 2);
  ctx.lineTo(x + w * 0.22, y + h * 0.18);
  ctx.lineTo(x + w / 2, y - h * 0.1);
  ctx.lineTo(x + w / 2, y + h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e5484d';
  ctx.beginPath(); ctx.arc(x, y + h * 0.05, w * 0.07, 0, Math.PI * 2); ctx.fill();
}

// Shrink a label just enough to fit a max width, never below 10px.
function fitSize(ctx, s, maxW, startSize, weight, serif) {
  let size = startSize;
  const family = serif ? 'Georgia, "Times New Roman", serif' : 'system-ui, "Segoe UI", sans-serif';
  ctx.font = (weight || '700') + ' ' + size + 'px ' + family;
  while (size > 10 && ctx.measureText(s).width > maxW) {
    size -= 1;
    ctx.font = (weight || '700') + ' ' + size + 'px ' + family;
  }
  return size;
}

function fmtTime(secs) {
  const s = Math.max(0, Math.ceil(secs));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

// ---- food icons, drawn flat so they read at any size ----
export function drawIngredient(ctx, id, x, y, s) {
  const ing = INGREDIENTS[id];
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = Math.max(2, s * 0.06);
  ctx.strokeStyle = 'rgba(20,20,30,0.55)';
  switch (id) {
    case 'nasi':
      ctx.fillStyle = ing.color;
      ctx.beginPath(); ctx.ellipse(0, s * 0.08, s * 0.42, s * 0.3, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ing.dark;
      for (const [dx, dy] of [[-0.2, -0.05], [0.05, -0.14], [0.22, 0.02], [-0.02, 0.08]]) {
        ctx.beginPath(); ctx.ellipse(dx * s, dy * s, s * 0.07, s * 0.045, 0.4, 0, Math.PI * 2); ctx.fill();
      }
      break;
    case 'mie':
      ctx.strokeStyle = ing.dark; ctx.lineWidth = s * 0.09; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.4, (i - 1) * s * 0.22);
        ctx.bezierCurveTo(-s * 0.15, (i - 1) * s * 0.22 - s * 0.16, s * 0.15, (i - 1) * s * 0.22 + s * 0.16, s * 0.4, (i - 1) * s * 0.22);
        ctx.stroke();
      }
      break;
    case 'ayam':
      ctx.fillStyle = ing.color;
      ctx.beginPath(); ctx.arc(-s * 0.1, -s * 0.08, s * 0.36, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = ing.dark; ctx.lineWidth = s * 0.11; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(s * 0.16, s * 0.16); ctx.lineTo(s * 0.36, s * 0.36); ctx.stroke();
      ctx.fillStyle = '#f4f1e6';
      ctx.beginPath(); ctx.arc(s * 0.4, s * 0.4, s * 0.11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(20,20,30,0.55)'; ctx.lineWidth = Math.max(2, s * 0.05);
      ctx.beginPath(); ctx.arc(s * 0.4, s * 0.4, s * 0.11, 0, Math.PI * 2); ctx.stroke();
      break;
    case 'teh':
      ctx.fillStyle = '#f4f1e6';
      ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.2); ctx.lineTo(s * 0.3, -s * 0.2); ctx.lineTo(s * 0.22, s * 0.32); ctx.lineTo(-s * 0.22, s * 0.32); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ing.color;
      ctx.fillRect(-s * 0.26, -s * 0.16, s * 0.52, s * 0.1);
      break;
    case 'telur':
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.42, s * 0.32, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffb020';
      ctx.beginPath(); ctx.arc(s * 0.05, 0, s * 0.2, 0, Math.PI * 2); ctx.fill();
      break;
    case 'kecap':
      ctx.fillStyle = ing.color;
      rr(ctx, -s * 0.2, -s * 0.34, s * 0.4, s * 0.68, s * 0.1); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c9a25e';
      ctx.fillRect(-s * 0.2, -s * 0.08, s * 0.4, s * 0.16);
      break;
    case 'cabai':
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, -s * 0.1);
      ctx.quadraticCurveTo(0, s * 0.45, s * 0.38, -s * 0.28);
      ctx.quadraticCurveTo(s * 0.1, -s * 0.05, -s * 0.4, -s * 0.1);
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#3f7d5a'; ctx.lineWidth = s * 0.08;
      ctx.beginPath(); ctx.moveTo(s * 0.34, -s * 0.28); ctx.lineTo(s * 0.44, -s * 0.4); ctx.stroke();
      break;
    case 'bawang':
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.42);
      ctx.quadraticCurveTo(s * 0.36, -s * 0.05, s * 0.22, s * 0.3);
      ctx.quadraticCurveTo(0, s * 0.42, -s * 0.22, s * 0.3);
      ctx.quadraticCurveTo(-s * 0.36, -s * 0.05, 0, -s * 0.42);
      ctx.fill(); ctx.stroke();
      break;
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
  ctx.fillStyle = '#1d2333';
  ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.1, r * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.35, y - r * 0.1, r * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#1d2333'; ctx.lineWidth = Math.max(2, r * 0.1); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y + r * 0.15, r * 0.4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  // every guest of the palace wears a little gold crown
  drawCrown(ctx, x, y - r * 1.05, r * 1.1, r * 0.55);
  ctx.restore();
}

function drawPatienceBar(ctx, x, y, w, frac) {
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  rr(ctx, x, y, w, 10, 5); ctx.fill();
  const c = frac > 0.5 ? COLORS.good : frac > 0.25 ? COLORS.warn : COLORS.bad;
  ctx.fillStyle = c;
  if (frac > 0.02) { rr(ctx, x, y, Math.max(8, w * frac), 10, 5); ctx.fill(); }
}

// ---- the palace dining hall ----
function drawBackground(ctx, t) {
  ctx.fillStyle = COLORS.night;
  ctx.fillRect(0, 0, 1280, 720);
  const g = ctx.createLinearGradient(0, 0, 0, 720);
  g.addColorStop(0, '#150a28');
  g.addColorStop(0.55, COLORS.night);
  g.addColorStop(1, '#2b1226');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1280, 720);
  // tall arched windows with the night sky outside
  for (const wx of [300, 980]) {
    ctx.fillStyle = '#0e0820';
    ctx.beginPath();
    ctx.moveTo(wx - 70, 200); ctx.lineTo(wx - 70, 60);
    ctx.quadraticCurveTo(wx, -10, wx + 70, 60);
    ctx.lineTo(wx + 70, 200);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#a8853f'; ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(168,133,63,0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(wx, 30); ctx.lineTo(wx, 200); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(wx - 70, 120); ctx.lineTo(wx + 70, 120); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (const [sx, sy] of [[-38, 70], [26, 52], [8, 92], [-12, 150]]) {
      ctx.fillRect(wx + sx, sy, 2, 2);
    }
  }
  // crystal chandeliers hanging below the top bar, flanking the order board
  for (const [cx, cy] of [[170, 116], [1110, 116]]) {
    const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 100);
    glow.addColorStop(0, 'rgba(255,200,100,0.4)');
    glow.addColorStop(1, 'rgba(255,200,100,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, cy, 100, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, 64); ctx.lineTo(cx, cy - 18); ctx.stroke();
    ctx.fillStyle = '#d4af37';
    ctx.beginPath(); ctx.ellipse(cx, cy, 42, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, cy + 11, 27, 6, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = -2; i <= 2; i++) {
      const fx = cx + i * 16, fy = cy - 15 - Math.abs(i) * -4;
      const flick = 0.8 + 0.2 * Math.sin(t * 8 + i * 2.1 + cx);
      ctx.fillStyle = 'rgba(255,180,60,' + flick + ')';
      ctx.beginPath(); ctx.ellipse(fx, fy, 3.5, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f7ecd2';
      ctx.fillRect(fx - 2, fy + 4, 4, 8);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (const [dx, dy] of [[-27, 2], [27, 2], [-13, 13], [13, 13]]) {
      ctx.beginPath(); ctx.arc(cx + dx, cy + dy, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }
  // red velvet curtains at both sides, tied back with gold cord
  for (const side of [0, 1]) {
    const x0 = side === 0 ? 0 : 1280;
    const dir = side === 0 ? 1 : -1;
    ctx.fillStyle = '#5e1220';
    ctx.beginPath();
    ctx.moveTo(x0, 0);
    ctx.lineTo(x0 + dir * 92, 0);
    ctx.quadraticCurveTo(x0 + dir * 46, 300, x0 + dir * 74, 636);
    ctx.lineTo(x0, 636);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
    for (const fx of [18, 40, 62]) {
      ctx.beginPath();
      ctx.moveTo(x0 + dir * fx, 0);
      ctx.quadraticCurveTo(x0 + dir * (fx - 8), 300, x0 + dir * (fx + 4), 636);
      ctx.stroke();
    }
    ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x0 + dir * 8, 420);
    ctx.quadraticCurveTo(x0 + dir * 58, 452, x0 + dir * 84, 420);
    ctx.stroke();
  }
  // red carpet with gold borders along the bottom
  ctx.fillStyle = '#6e1423';
  ctx.fillRect(0, 636, 1280, 84);
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(0, 636, 1280, 4);
  ctx.fillRect(0, 674, 1280, 3);
  ctx.fillStyle = 'rgba(212,175,55,0.35)';
  for (let x = 40; x < 1280; x += 160) {
    ctx.save(); ctx.translate(x, 706); ctx.rotate(Math.PI / 4);
    ctx.fillRect(-7, -7, 14, 14); ctx.restore();
  }
}

function drawTopBar(ctx, world) {
  ctx.fillStyle = COLORS.board;
  ctx.fillRect(0, 0, 1280, 64);
  ctx.fillStyle = COLORS.boardEdge;
  ctx.fillRect(0, 62, 1280, 2);
  textSerif(ctx, GAME_TITLE, 24, 24, 26, COLORS.gold, '800');
  text(ctx, 'dapur istana • hidangan untuk raja', 24, 48, 13, COLORS.chalk, '400');
  // timer, big and central
  const frac = world.timeLeft / SHIFT_SECONDS;
  const tc = frac > 0.5 ? COLORS.chalk : frac > 0.2 ? COLORS.warn : COLORS.bad;
  text(ctx, '⏱ ' + fmtTime(world.timeLeft), 640, 26, 34, tc, '800', 'center');
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  rr(ctx, 480, 48, 320, 8, 4); ctx.fill();
  ctx.fillStyle = tc;
  rr(ctx, 480, 48, Math.max(8, 320 * frac), 8, 4); ctx.fill();
  // coins and combo (the multiplier caps at x2, same as the world rules)
  text(ctx, '🪙 ' + world.coins + ' koin', 1256, 22, 22, COLORS.gold, '800', 'right');
  const mult = Math.min(1 + (world.combo - 1) * 0.25, 2.0);
  const comboText = world.combo >= 2 ? 'COMBO x' + (Number.isInteger(mult) ? mult : mult.toFixed(2)) : 'skor ' + world.score;
  text(ctx, comboText, 1256, 48, 14, world.combo >= 2 ? '#ff9d45' : COLORS.chalk, '700', 'right');
  // missed customers as three small bowls
  for (let i = 0; i < MAX_MISSED; i++) {
    ctx.fillStyle = i < world.missed ? COLORS.bad : 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.arc(940 + i * 26, 26, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(940 + i * 26, 26, 9, 0, Math.PI * 2); ctx.stroke();
  }
  text(ctx, 'tamu pulang:', 930, 26, 12, COLORS.chalk, '400', 'right');
}

function drawOrderBoard(ctx, world, t) {
  world.orders.forEach((order, i) => {
    const r = ticketRect(i);
    const dish = DISHES[order.dish];
    const selected = i === world.selectedOrder;
    ctx.fillStyle = selected ? '#4a3410' : COLORS.board;
    rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
    ctx.strokeStyle = selected ? COLORS.gold : COLORS.boardEdge;
    ctx.lineWidth = selected ? 3 : 2;
    rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.stroke();
    // ornate inner gold hairline, like a framed royal decree
    ctx.strokeStyle = 'rgba(212,175,55,0.55)'; ctx.lineWidth = 1;
    rr(ctx, r.x + 5, r.y + 5, r.w - 10, r.h - 10, 8); ctx.stroke();
    drawFace(ctx, order.customer, r.x + 30, r.y + 30, 20);
    text(ctx, order.customer.name, r.x + 56, r.y + 22, 13, COLORS.chalk, '700');
    textSerif(ctx, dish.name, r.x + 56, r.y + 44, fitSize(ctx, dish.name, 186, 17, '800', true), dish.color, '800');
    // ingredient dots: filled = on the plate, outline = still missing
    let ix = r.x + 56;
    for (const need of dish.needs) {
      const done = order.added.has(need);
      ctx.fillStyle = done ? INGREDIENTS[need].color : 'rgba(255,255,255,0.12)';
      ctx.beginPath(); ctx.arc(ix, r.y + 72, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(ix, r.y + 72, 11, 0, Math.PI * 2); ctx.stroke();
      if (done) {
        ctx.strokeStyle = '#1d7a44'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(ix - 5, r.y + 72); ctx.lineTo(ix - 1, r.y + 76); ctx.lineTo(ix + 6, r.y + 66); ctx.stroke();
      }
      ix += 26;
    }
    drawPatienceBar(ctx, r.x + 14, r.y + 96, r.w - 28, Math.max(0, order.patience / order.maxPatience));
    if (selected) text(ctx, '▶ DIPILIH', r.x + r.w - 12, r.y + 22, 11, COLORS.gold, '800', 'right');
  });
  for (let i = world.orders.length; i < 3; i++) {
    const r = ticketRect(i);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
    text(ctx, 'meja kosong — pesanan berikutnya datang…', r.x + r.w / 2, r.y + r.h / 2, 13, 'rgba(242,234,216,0.45)', '400', 'center');
  }
}

function drawStations(ctx, world, t) {
  for (const station of STATIONS) {
    const r = stationRect(station);
    ctx.fillStyle = '#2e1a33';
    rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
    ctx.strokeStyle = '#a8853f'; ctx.lineWidth = 2;
    rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.stroke();
    ctx.strokeStyle = 'rgba(212,175,55,0.45)'; ctx.lineWidth = 1;
    rr(ctx, r.x + 5, r.y + 5, r.w - 10, r.h - 10, 8); ctx.stroke();
    const cook = world.cooks[station.id];
    text(ctx, station.name, r.x + r.w / 2, r.y + 16, 16, COLORS.chalk, '800', 'center');
    text(ctx, station.label, r.x + r.w / 2, r.y + 36, 11, 'rgba(242,234,216,0.6)', '400', 'center');
    if (station.kind === 'wok') {
      // wok: black pan over a flickering flame
      const flick = 0.75 + 0.25 * Math.sin(t * 9 + station.x);
      ctx.fillStyle = 'rgba(255,120,30,' + (0.55 * flick) + ')';
      ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + 96, 44, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#22242e';
      ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + 78, 54, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#4a4d5e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + 78, 54, 18, 0, 0, Math.PI * 2); ctx.stroke();
      if (cook) drawIngredient(ctx, cook.ingredient, r.x + r.w / 2, r.y + 72, 32);
    } else if (station.kind === 'grill') {
      // charcoal grill: glowing coals under steel bars
      ctx.strokeStyle = '#8a8f9e'; ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(r.x + 22, r.y + 52 + i * 12); ctx.lineTo(r.x + r.w - 22, r.y + 52 + i * 12); ctx.stroke();
      }
      ctx.fillStyle = '#1c1c22';
      ctx.fillRect(r.x + 18, r.y + 88, r.w - 36, 20);
      ctx.fillStyle = '#e5484d';
      for (let i = 0; i < 4; i++) {
        ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 6 + i * 1.7);
        ctx.beginPath(); ctx.arc(r.x + 34 + i * 28, r.y + 98, 6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (cook) drawIngredient(ctx, cook.ingredient, r.x + r.w / 2, r.y + 64, 34);
    } else {
      // pot: steaming pot of tea
      ctx.strokeStyle = COLORS.steam; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const sx = r.x + r.w / 2 - 24 + i * 24;
        const sway = Math.sin(t * 2 + i * 2) * 6;
        ctx.beginPath(); ctx.moveTo(sx, r.y + 66);
        ctx.quadraticCurveTo(sx + sway, r.y + 54, sx - sway, r.y + 42);
        ctx.stroke();
      }
      ctx.fillStyle = '#8a6a45';
      ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + 82, 50, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5d4630';
      ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + 96, 50, 14, 0, 0, Math.PI * 2); ctx.fill();
      if (cook) drawIngredient(ctx, cook.ingredient, r.x + r.w / 2, r.y + 76, 32);
    }
    if (cook) {
      const frac = 1 - cook.left / cook.total;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      rr(ctx, r.x + 14, r.y + r.h - 16, r.w - 28, 8, 4); ctx.fill();
      ctx.fillStyle = COLORS.gold;
      rr(ctx, r.x + 14, r.y + r.h - 16, Math.max(6, (r.w - 28) * frac), 8, 4); ctx.fill();
    } else {
      text(ctx, 'klik untuk masak', r.x + r.w / 2, r.y + r.h - 12, 11, 'rgba(242,234,216,0.55)', '400', 'center');
    }
  }
}

function drawPlate(ctx, world, t) {
  const p = plateRect();
  // wooden counter under the plate
  ctx.fillStyle = COLORS.counter;
  rr(ctx, p.x - 40, p.y + 150, p.w + 80, 96, 14); ctx.fill();
  ctx.fillStyle = COLORS.counterTop;
  rr(ctx, p.x - 40, p.y + 150, p.w + 80, 14, 7); ctx.fill();
  // the golden plate
  ctx.fillStyle = COLORS.plate;
  ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = COLORS.plateEdge; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(212,175,55,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r - 14, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.10)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r - 26, 0, Math.PI * 2); ctx.stroke();

  const order = world.orders[world.selectedOrder];
  if (order) {
    const dish = DISHES[order.dish];
    text(ctx, dish.name, p.cx, p.y - 22, 20, dish.color, '800', 'center');
    const added = [...order.added];
    if (added.length === 0) {
      text(ctx, 'piring kosong — klik bahan di bawah', p.cx, p.cy, 15, 'rgba(29,35,51,0.55)', '400', 'center');
    } else {
      // arrange the assembled ingredients on the plate like a real dish;
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
    // steam when the plate is getting full
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
      text(ctx, 'SIAP DISAJIKAN!', p.cx, p.cy + p.r + 26, 16, COLORS.good, '800', 'center');
    } else {
      const missing = [...order.needs].filter((n) => !order.added.has(n));
      text(ctx, 'kurang: ' + missing.map((m) => INGREDIENTS[m].name).join(', '), p.cx, p.cy + p.r + 26, 14, '#7a6a55', '700', 'center');
    }
  } else {
    text(ctx, 'tidak ada pesanan — tunggu sebentar', p.cx, p.cy, 15, 'rgba(29,35,51,0.55)', '400', 'center');
  }
}

function drawServe(ctx, world, t) {
  const r = serveRect();
  const order = world.orders[world.selectedOrder];
  const ready = plateIsComplete(order);
  const pulse = ready ? 0.85 + 0.15 * Math.sin(t * 6) : 1;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = ready ? COLORS.good : '#4a5468';
  rr(ctx, r.x, r.y, r.w, r.h, 14); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = ready ? '#2f8f57' : '#333c52'; ctx.lineWidth = 3;
  rr(ctx, r.x, r.y, r.w, r.h, 14); ctx.stroke();
  text(ctx, 'SAJIKAN', r.x + r.w / 2, r.y + 34, 30, '#ffffff', '800', 'center');
  text(ctx, ready ? 'piring lengkap — klik / spasi' : 'lengkapi piring dulu', r.x + r.w / 2, r.y + 68, 13, 'rgba(255,255,255,0.8)', '400', 'center');
  // the ready plate on the serving counter
  const s = serveReadyRect();
  ctx.fillStyle = '#2e1a33';
  rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.fill();
  ctx.strokeStyle = '#a8853f'; ctx.lineWidth = 2;
  rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.stroke();
  text(ctx, 'MEJA SAJI', s.x + s.w / 2, s.y + 18, 12, 'rgba(242,234,216,0.6)', '800', 'center');
  if (ready && order) {
    const dish = DISHES[order.dish];
    ctx.fillStyle = COLORS.plate;
    ctx.beginPath(); ctx.arc(s.x + 52, s.y + 74, 34, 0, Math.PI * 2); ctx.fill();
    drawIngredient(ctx, order.dish === 'esteh' ? 'teh' : order.dish === 'sate' ? 'ayam' : order.dish === 'miegor' ? 'mie' : 'nasi', s.x + 52, s.y + 74, 40);
    text(ctx, dish.name, s.x + 100, s.y + 62, fitSize(ctx, dish.name, 126, 15, '800'), dish.color, '800');
    text(ctx, dish.coins + ' koin' + (world.rush ? ' x2' : ''), s.x + 100, s.y + 86, 13, COLORS.gold, '700');
    if (world.rush) text(ctx, 'JAM RAMAI!', s.x + 100, s.y + 106, 12, '#ff9d45', '800');
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.arc(s.x + 52, s.y + 74, 34, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'belum ada', s.x + 100, s.y + 66, 13, 'rgba(242,234,216,0.55)', '400');
    text(ctx, 'piring siap', s.x + 100, s.y + 88, 13, 'rgba(242,234,216,0.55)', '400');
  }
}

function drawBins(ctx, world) {
  text(ctx, 'BAHAN — klik atau tekan 1-6', 36, 640, 13, COLORS.chalk, '800');
  BIN_ORDER.forEach((id, i) => {
    const r = binRect(i);
    const ing = INGREDIENTS[id];
    const order = world.orders[world.selectedOrder];
    const needed = order ? order.needs.has(id) : false;
    const added = order ? order.added.has(id) : false;
    ctx.fillStyle = needed ? '#5a451a' : '#2e2140';
    rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
    ctx.strokeStyle = added ? COLORS.good : needed ? COLORS.gold : COLORS.boardEdge;
    ctx.lineWidth = added || needed ? 3 : 2;
    rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.stroke();
    drawIngredient(ctx, id, r.x + 30, r.y + r.h / 2, 34);
    text(ctx, ing.name, r.x + 54, r.y + 20, 15, COLORS.chalk, '700');
    text(ctx, '[' + (i + 1) + ']', r.x + r.w - 10, r.y + 20, 12, 'rgba(242,234,216,0.55)', '400', 'right');
    text(ctx, added ? '✓ sudah' : needed ? 'dibutuhkan' : '—', r.x + 54, r.y + 40, 12, added ? COLORS.good : needed ? COLORS.gold : 'rgba(242,234,216,0.45)', '400');
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
  ctx.fillStyle = 'rgba(20,16,8,0.85)';
  rr(ctx, 390, 210, 500, 52, 12); ctx.fill();
  ctx.strokeStyle = COLORS.gold; ctx.lineWidth = 2;
  rr(ctx, 390, 210, 500, 52, 12); ctx.stroke();
  text(ctx, world.flash, 640, 237, 22, COLORS.gold, '800', 'center');
  ctx.globalAlpha = 1;
}

// ---- screens ----
function drawTitle(ctx, world, t) {
  drawBackground(ctx, t);
  ctx.fillStyle = 'rgba(10,14,28,0.55)';
  ctx.fillRect(0, 0, 1280, 720);
  drawCrown(ctx, 640, 92, 120, 44);
  textSerif(ctx, 'DAPUR', 640, 150, 84, COLORS.gold, '800', 'center');
  textSerif(ctx, 'KERAJAAN', 640, 232, 84, '#ff9d45', '800', 'center');
  text(ctx, GAME_SUBTITLE, 640, 292, 20, COLORS.chalk, '400', 'center');
  // a little preview plate of the four dishes
  const dishes = ['nasgor', 'miegor', 'sate', 'esteh'];
  dishes.forEach((d, i) => {
    const x = 400 + i * 160;
    ctx.fillStyle = COLORS.plate;
    ctx.beginPath(); ctx.arc(x, 380, 52, 0, Math.PI * 2); ctx.fill();
    const dish = DISHES[d];
    drawIngredient(ctx, dish.needs[0], x, 380, 56);
    textSerif(ctx, dish.name, x, 452, 15, dish.color, '800', 'center');
    text(ctx, dish.coins + ' koin', x, 474, 13, COLORS.gold, '400', 'center');
  });
  text(ctx, 'Pesanan datang di papan atas. Klik bahan untuk meracik, masak di wok / arang / pot,', 640, 496, 16, COLORS.chalk, '400', 'center');
  text(ctx, 'lalu SAJIKAN sebelum tamu kehabisan sabar. 3 tamu pulang = dapur tutup.', 640, 520, 16, COLORS.chalk, '400', 'center');
  const b = startButtonRect();
  const pulse = 0.9 + 0.1 * Math.sin(t * 4);
  ctx.save(); ctx.globalAlpha = pulse;
  ctx.fillStyle = COLORS.good;
  rr(ctx, b.x, b.y, b.w, b.h, 14); ctx.fill();
  ctx.restore();
  text(ctx, 'BUKA DAPUR', b.x + b.w / 2, b.y + b.h / 2, 30, '#ffffff', '800', 'center');
  text(ctx, 'klik tombol atau tekan Enter • mouse + keyboard (1-6, spasi, Tab)', 640, 640, 13, 'rgba(242,234,216,0.6)', '400', 'center');
}

function drawResults(ctx, world, t) {
  drawBackground(ctx, t);
  ctx.fillStyle = 'rgba(10,14,28,0.6)';
  ctx.fillRect(0, 0, 1280, 720);
  textSerif(ctx, 'DAPUR TUTUP', 640, 120, 64, COLORS.gold, '800', 'center');
  text(ctx, world.overReason, 640, 172, 18, COLORS.chalk, '400', 'center');
  // stars
  const stars = STAR_COINS.filter((c) => world.coins >= c).length;
  for (let i = 0; i < 3; i++) {
    const x = 560 + i * 80;
    ctx.fillStyle = i < stars ? COLORS.gold : 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const ang = -Math.PI / 2 + (k * Math.PI) / 5;
      const rad = k % 2 === 0 ? 34 : 15;
      const px = x + Math.cos(ang) * rad, py = 240 + Math.sin(ang) * rad;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
  }
  const rows = [
    ['Pesanan disajikan', String(world.served)],
    ['Tamu pulang marah', String(world.missed)],
    ['Combo terbaik', world.bestCombo + ' beruntun'],
    ['Koin malam ini', world.coins + ' koin'],
  ];
  rows.forEach(([label, value], i) => {
    const y = 320 + i * 44;
    text(ctx, label, 480, y, 20, COLORS.chalk, '400');
    text(ctx, value, 800, y, 22, COLORS.gold, '800', 'right');
  });
  const b = againButtonRect();
  ctx.fillStyle = COLORS.good;
  rr(ctx, b.x, b.y, b.w, b.h, 14); ctx.fill();
  text(ctx, 'BUKA LAGI BESOK', b.x + b.w / 2, b.y + b.h / 2, 26, '#ffffff', '800', 'center');
  text(ctx, 'klik tombol atau tekan Enter', 640, 660, 13, 'rgba(242,234,216,0.6)', '400', 'center');
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
