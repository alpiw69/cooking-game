// render.js — every pixel of Sugar Rush Café, drawn with canvas shapes.
// No images, no fonts from the network: a warm dessert café at dusk —
// cream plaster walls, a dusk window, warm wood floors in true isometric
// perspective, marble counters with brass trim, pendant lamps, plants, and
// pink desserts as the colour accent. The chef is a little cook who walks
// the floor; the room is drawn as a real isometric space, not flat panels.
// render(ctx, world, t) draws one frame; t is animation time in seconds.
// All animation uses fixed spots and sin(t), never Math.random, so the
// same frame always renders the same pixels (deterministic screenshots).

import { COLORS, DISHES, MENU_ORDER, INGREDIENTS, STATIONS, BIN_ORDER, SHIFT_SECONDS, MAX_MISSED, STAR_COINS, GAME_TITLE, GAME_SUBTITLE } from './config.js';
import { FLOOR, ticketRect, stationRect, islandRect, finishRect, serveRect, serveReadyRect, binRect, storyRect, startButtonRect, againButtonRect } from './layout.js';
import { plateIsComplete, plateIsServable } from './world.js';

const PINK = '#ff7fa5';
const PINK_DEEP = '#e5488f';
const BRASS = '#c9a25e';
const BRASS_DARK = '#8a6d2f';
const WOOD = '#8a5a3b';
const WOOD_DARK = '#5f3d26';
const WOOD_LIGHT = '#a9744f';
const CREAM = '#fff8ec';
const PAPER = '#fdf3dd';
const INK = '#4a2c1a';
const MUTED = 'rgba(74,44,26,0.62)';
const FAINT = 'rgba(74,44,26,0.38)';
const LEAF = '#5d8a5a';

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

// A soft cast shadow: two stacked ellipses, darker in the middle.
function softShadow(ctx, x, y, rx, ry, alpha) {
  ctx.save();
  const a = alpha || 0.3;
  ctx.fillStyle = 'rgba(40,20,8,' + a + ')';
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(40,20,8,' + (a * 0.55) + ')';
  ctx.beginPath(); ctx.ellipse(x, y, rx * 0.72, ry * 0.7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// Isometric projection for the café floor: room (x, y) in tiles to screen.
// Tile 60x30, room 14x14, top corner at (640, 204).
function iso(x, y) {
  return { x: 640 + (x - y) * 30, y: 204 + (x + y) * 15 };
}

// A 3D counter box: front face in wood, top face as a parallelogram
// (the iso top), right side face in darker wood, brass trim along the
// top edge. Reads as a solid counter standing on the floor.
function counterBox(ctx, x, y, w, h, dx, dy, front, frontDark, top) {
  ctx.save();
  // right side face
  ctx.fillStyle = frontDark;
  ctx.beginPath();
  ctx.moveTo(x + w, y); ctx.lineTo(x + w + dx, y + dy);
  ctx.lineTo(x + w + dx, y + dy + h); ctx.lineTo(x + w, y + h);
  ctx.closePath(); ctx.fill();
  // front face, with soft light falling on it: brighter at the top,
  // deeper toward the floor
  ctx.fillStyle = front;
  ctx.fillRect(x, y, w, h);
  const fg = ctx.createLinearGradient(0, y, 0, y + h);
  fg.addColorStop(0, 'rgba(255,255,255,0.16)');
  fg.addColorStop(0.45, 'rgba(255,255,255,0)');
  fg.addColorStop(1, 'rgba(40,20,8,0.14)');
  ctx.fillStyle = fg;
  ctx.fillRect(x, y, w, h);
  // top face
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy);
  ctx.lineTo(x + w + dx, y + dy); ctx.lineTo(x + w, y);
  ctx.closePath(); ctx.fill();
  // gloss strip along the front edge of the top face
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.moveTo(x + 5, y - 2); ctx.lineTo(x + w - 5, y - 2);
  ctx.lineTo(x + w + dx - 5, y + dy + 8); ctx.lineTo(x + dx + 5, y + dy + 8);
  ctx.closePath(); ctx.fill();
  // brass trim along the top edge of the front face, with a light line under it
  ctx.strokeStyle = BRASS; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, y + 1); ctx.lineTo(x + w, y + 1); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x + w, y + 4); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.restore();
}

// A chunky 3D button: a darker slab underneath (the side), the bright
// face on top, and a glossy strip — it reads as a physical button.
function bevelButton(ctx, x, y, w, h, r, face, side) {
  ctx.save();
  ctx.fillStyle = side;
  rr(ctx, x, y + 6, w, h, r); ctx.fill();
  ctx.fillStyle = face;
  rr(ctx, x, y, w, h, r); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  rr(ctx, x + 2, y + 2, w - 4, h - 4, r - 2); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  rr(ctx, x + 6, y + 4, w - 12, Math.max(6, h * 0.22), r); ctx.fill();
  ctx.restore();
}

// ---- dessert icons, drawn with volume so they read as 3D objects ----
export function drawIngredient(ctx, id, x, y, s) {
  const ing = INGREDIENTS[id];
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = Math.max(2, s * 0.06);
  ctx.strokeStyle = 'rgba(60,30,10,0.55)';
  switch (id) {
    case 'nasi': {
      const cone = ctx.createLinearGradient(-s * 0.26, 0, s * 0.26, 0);
      cone.addColorStop(0, '#c98f4e'); cone.addColorStop(0.5, '#e8c88a'); cone.addColorStop(1, '#a87c3a');
      ctx.fillStyle = cone;
      ctx.beginPath(); ctx.moveTo(-s * 0.26, s * 0.05); ctx.lineTo(s * 0.26, s * 0.05); ctx.lineTo(0, s * 0.45); ctx.closePath(); ctx.fill(); ctx.stroke();
      const ball = ctx.createRadialGradient(-s * 0.12, -s * 0.22, s * 0.05, 0, -s * 0.08, s * 0.36);
      ball.addColorStop(0, '#ffffff'); ball.addColorStop(0.55, '#fff3d6'); ball.addColorStop(1, '#d9b98a');
      ctx.fillStyle = ball;
      ctx.beginPath(); ctx.arc(0, -s * 0.08, s * 0.36, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.arc(-s * 0.13, -s * 0.22, s * 0.09, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'mie': {
      const cone = ctx.createLinearGradient(-s * 0.26, 0, s * 0.26, 0);
      cone.addColorStop(0, '#c98f4e'); cone.addColorStop(0.5, '#e8c88a'); cone.addColorStop(1, '#a87c3a');
      ctx.fillStyle = cone;
      ctx.beginPath(); ctx.moveTo(-s * 0.26, s * 0.05); ctx.lineTo(s * 0.26, s * 0.05); ctx.lineTo(0, s * 0.45); ctx.closePath(); ctx.fill(); ctx.stroke();
      const ball = ctx.createRadialGradient(-s * 0.12, -s * 0.22, s * 0.05, 0, -s * 0.08, s * 0.36);
      ball.addColorStop(0, '#ffd6e2'); ball.addColorStop(0.55, '#ffb3c8'); ball.addColorStop(1, '#d96a8f');
      ctx.fillStyle = ball;
      ctx.beginPath(); ctx.arc(0, -s * 0.08, s * 0.36, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ing.dark;
      for (const [dx, dy] of [[-0.16, -0.18], [0.12, -0.22], [0.02, -0.02], [-0.05, -0.3]]) {
        ctx.beginPath(); ctx.ellipse(dx * s, dy * s, s * 0.035, s * 0.055, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath(); ctx.arc(-s * 0.13, -s * 0.22, s * 0.09, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'ayam': {
      ctx.fillStyle = '#a06a42';
      ctx.beginPath(); ctx.moveTo(-s * 0.36, -s * 0.18); ctx.lineTo(-s * 0.2, -s * 0.36); ctx.lineTo(s * 0.36, -s * 0.36); ctx.lineTo(s * 0.36, -s * 0.18); ctx.closePath(); ctx.fill(); ctx.stroke();
      const front = ctx.createLinearGradient(0, -s * 0.18, 0, s * 0.34);
      front.addColorStop(0, '#8a5a3b'); front.addColorStop(1, '#4e2e1a');
      ctx.fillStyle = front;
      rr(ctx, -s * 0.36, -s * 0.18, s * 0.72, s * 0.52, s * 0.06); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#f7cf6b'; ctx.lineWidth = s * 0.06; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-s * 0.28, -s * 0.28);
      ctx.quadraticCurveTo(-s * 0.05, -s * 0.2, s * 0.28, -s * 0.3); ctx.stroke();
      ctx.fillStyle = '#e5484d';
      ctx.beginPath(); ctx.arc(s * 0.14, -s * 0.34, s * 0.09, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath(); ctx.arc(s * 0.11, -s * 0.37, s * 0.035, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'teh': {
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.2); ctx.lineTo(s * 0.3, -s * 0.2); ctx.lineTo(s * 0.22, s * 0.34); ctx.lineTo(-s * 0.22, s * 0.34); ctx.closePath(); ctx.fill(); ctx.stroke();
      const liq = ctx.createLinearGradient(0, -s * 0.14, 0, s * 0.34);
      liq.addColorStop(0, '#ff9ecf'); liq.addColorStop(1, '#d1477f');
      ctx.fillStyle = liq;
      ctx.beginPath(); ctx.moveTo(-s * 0.27, -s * 0.12); ctx.lineTo(s * 0.27, -s * 0.12); ctx.lineTo(s * 0.21, s * 0.32); ctx.lineTo(-s * 0.21, s * 0.32); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2b0f1e';
      for (const [dx, dy] of [[-0.12, 0.22], [0.1, 0.24], [0, 0.12]]) {
        ctx.beginPath(); ctx.arc(dx * s, dy * s, s * 0.07, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath(); ctx.arc(-s * 0.14, s * 0.2, s * 0.025, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(-s * 0.22, -s * 0.14, s * 0.06, s * 0.42);
      const whip = ctx.createRadialGradient(-s * 0.04, -s * 0.3, s * 0.03, 0, -s * 0.24, s * 0.17);
      whip.addColorStop(0, '#ffffff'); whip.addColorStop(1, '#f2c9dd');
      ctx.fillStyle = whip;
      ctx.beginPath(); ctx.arc(0, -s * 0.24, s * 0.16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = PINK; ctx.lineWidth = s * 0.07; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(s * 0.08, -s * 0.3); ctx.lineTo(s * 0.24, -s * 0.46); ctx.stroke();
      break;
    }
    case 'telur': {
      const cols = ['#ff6fa5', '#ffd166', '#7ec8e3', '#37e08b', '#c9a0dc'];
      cols.forEach((c, i) => {
        ctx.save();
        ctx.translate(([-0.22, 0.18, -0.02, 0.26, -0.1][i]) * s, ([-0.14, -0.2, 0.12, 0.05, -0.3][i]) * s);
        ctx.rotate((i * 0.9 - 1.2));
        ctx.fillStyle = c;
        ctx.fillRect(-s * 0.13, -s * 0.045, s * 0.26, s * 0.09);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(-s * 0.13, -s * 0.045, s * 0.26, s * 0.03);
        ctx.restore();
      });
      break;
    }
    case 'kecap': {
      const body = ctx.createLinearGradient(-s * 0.2, 0, s * 0.2, 0);
      body.addColorStop(0, '#3a1e0c'); body.addColorStop(0.5, '#7a4526'); body.addColorStop(1, '#2a1408');
      ctx.fillStyle = body;
      rr(ctx, -s * 0.2, -s * 0.34, s * 0.4, s * 0.68, s * 0.1); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c9a25e';
      ctx.fillRect(-s * 0.2, -s * 0.08, s * 0.4, s * 0.16);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(-s * 0.14, -s * 0.3, s * 0.05, s * 0.6);
      break;
    }
    case 'cabai': {
      const ball = ctx.createRadialGradient(-s * 0.12, -s * 0.08, s * 0.04, 0, s * 0.04, s * 0.34);
      ball.addColorStop(0, '#ff8a8e'); ball.addColorStop(0.55, '#e5484d'); ball.addColorStop(1, '#8f1d20');
      ctx.strokeStyle = '#2f9e6e'; ctx.lineWidth = s * 0.07; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, -s * 0.2); ctx.quadraticCurveTo(s * 0.08, -s * 0.36, s * 0.22, -s * 0.4); ctx.stroke();
      ctx.fillStyle = ball;
      ctx.beginPath(); ctx.arc(0, s * 0.04, s * 0.34, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(60,30,10,0.55)'; ctx.lineWidth = Math.max(2, s * 0.05);
      ctx.beginPath(); ctx.arc(0, s * 0.04, s * 0.34, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath(); ctx.arc(-s * 0.12, -s * 0.08, s * 0.08, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'bawang': {
      ctx.save(); ctx.rotate(0.5);
      const stick = ctx.createLinearGradient(-s * 0.14, 0, s * 0.14, 0);
      stick.addColorStop(0, '#c99a5e'); stick.addColorStop(0.5, '#f2d9a0'); stick.addColorStop(1, '#a87c3a');
      ctx.fillStyle = stick;
      rr(ctx, -s * 0.14, -s * 0.4, s * 0.28, s * 0.8, s * 0.06); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = ing.dark; ctx.lineWidth = s * 0.05;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo(-s * 0.14, i * s * 0.16); ctx.lineTo(s * 0.14, i * s * 0.16 + s * 0.1); ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 'es': {
      ctx.fillStyle = '#bfe8ff';
      ctx.strokeStyle = '#5d9ec4';
      for (const [dx, dy, r] of [[-0.16, -0.1, 0.1], [0.16, 0.08, 0.12], [0.05, -0.22, 0.08]]) {
        ctx.save(); ctx.translate(dx * s, dy * s); ctx.rotate(r);
        const cube = ctx.createLinearGradient(-s * 0.18, -s * 0.18, s * 0.18, s * 0.18);
        cube.addColorStop(0, '#ffffff'); cube.addColorStop(1, '#7fc4e8');
        ctx.fillStyle = cube;
        ctx.fillRect(-s * 0.18, -s * 0.18, s * 0.36, s * 0.36);
        ctx.strokeRect(-s * 0.18, -s * 0.18, s * 0.36, s * 0.36);
        ctx.restore();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.arc(-s * 0.2, -s * 0.14, s * 0.05, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'gula': {
      for (const [dx, dy] of [[-0.16, 0.05], [0.12, -0.12], [0.2, 0.14], [-0.05, -0.22]]) {
        ctx.save(); ctx.translate(dx * s, dy * s); ctx.rotate(0.4);
        const cube = ctx.createLinearGradient(-s * 0.12, -s * 0.12, s * 0.12, s * 0.12);
        cube.addColorStop(0, '#ffffff'); cube.addColorStop(1, '#d9d0e8');
        ctx.fillStyle = cube;
        ctx.fillRect(-s * 0.12, -s * 0.12, s * 0.24, s * 0.24);
        ctx.strokeStyle = 'rgba(60,30,10,0.4)'; ctx.lineWidth = Math.max(1.5, s * 0.03);
        ctx.strokeRect(-s * 0.12, -s * 0.12, s * 0.24, s * 0.24);
        ctx.restore();
      }
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.05, 0, Math.PI * 2); ctx.fill();
      break;
    }
  }
  ctx.restore();
}

// ---- faces, the chef, and the room itself ----

function drawFace(ctx, customer, x, y, r) {
  ctx.save();
  ctx.fillStyle = 'rgba(40,20,8,0.22)';
  ctx.beginPath(); ctx.ellipse(x, y + r * 0.85, r * 0.8, r * 0.25, 0, 0, Math.PI * 2); ctx.fill();
  const skin = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  skin.addColorStop(0, '#ffe0bd'); skin.addColorStop(0.6, customer.skin); skin.addColorStop(1, '#b97e4e');
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  // hair in the customer's shirt color, with a little bun on top
  ctx.fillStyle = customer.shirt;
  ctx.beginPath(); ctx.arc(x, y - r * 0.5, r * 0.85, Math.PI, 0); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y - r * 1.15, r * 0.32, 0, Math.PI * 2); ctx.fill();
  // eyes and a smile
  ctx.fillStyle = '#3a2415';
  ctx.beginPath(); ctx.arc(x - r * 0.32, y - r * 0.05, r * 0.09, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.32, y - r * 0.05, r * 0.09, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#4a2440'; ctx.lineWidth = Math.max(2, r * 0.1); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y + r * 0.28, r * 0.36, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  // rosy cheeks
  ctx.fillStyle = 'rgba(255,127,165,0.5)';
  ctx.beginPath(); ctx.arc(x - r * 0.55, y + r * 0.28, r * 0.14, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.55, y + r * 0.28, r * 0.14, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawPatienceBar(ctx, x, y, w, frac) {
  ctx.fillStyle = 'rgba(60,30,10,0.35)';
  rr(ctx, x, y, w, 10, 5); ctx.fill();
  const c = frac > 0.5 ? COLORS.good : frac > 0.25 ? COLORS.warn : COLORS.bad;
  if (frac > 0.02) {
    const g = ctx.createLinearGradient(x, y, x, y + 10);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, c);
    g.addColorStop(1, c);
    ctx.fillStyle = g;
    rr(ctx, x, y, Math.max(8, w * frac), 10, 5); ctx.fill();
  }
}

// The chef: a little cook in a pink apron and a tall white toque, walking
// the floor — big enough to be the star of the frame (about 2.2x the old
// size, ~150px tall). Legs alternate in a real walk cycle, the body leans
// into the direction of travel, and when the chef carries a plate it rides
// in the front hand. Idle, the chef breathes and looks around.
function drawChef(ctx, chef, t) {
  const x = chef.x;
  const y = chef.y;
  // soft cast shadow on the floor, tightening a little mid-step
  const stepLift = chef.moving ? Math.abs(Math.sin(chef.walkPhase)) : 0;
  softShadow(ctx, x, y + 5, 34 - stepLift * 4, 9, 0.32);
  const bob = chef.moving ? Math.abs(Math.sin(chef.walkPhase)) * 4 : Math.sin(t * 1.8) * 1.5;
  const lean = chef.moving ? chef.face * 0.05 : 0;
  const swing = chef.moving ? Math.sin(chef.walkPhase) : 0;
  ctx.save();
  ctx.translate(x, y - bob);
  ctx.rotate(lean);
  // ---- legs: dark trousers, alternating steps, shoes lifting off the floor
  const liftL = chef.moving ? Math.max(0, Math.cos(chef.walkPhase)) * 7 : 0;
  const liftR = chef.moving ? Math.max(0, -Math.cos(chef.walkPhase)) * 7 : 0;
  ctx.strokeStyle = '#4e2e1a';
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-11, -48); ctx.lineTo(-11 + swing * 12, -4 - liftL); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(11, -48); ctx.lineTo(11 - swing * 12, -4 - liftR); ctx.stroke();
  ctx.fillStyle = '#2f1a0c';
  ctx.beginPath(); ctx.ellipse(-11 + swing * 12, -2 - liftL, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(11 - swing * 12, -2 - liftR, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
  // ---- body: cream shirt, pink apron with a pocket
  const shirt = ctx.createLinearGradient(0, -92, 0, -42);
  shirt.addColorStop(0, '#ffffff');
  shirt.addColorStop(1, '#f2e2c8');
  ctx.fillStyle = shirt;
  rr(ctx, -26, -92, 52, 50, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(60,30,10,0.35)'; ctx.lineWidth = 1.5;
  rr(ctx, -26, -92, 52, 50, 14); ctx.stroke();
  const apron = ctx.createLinearGradient(0, -82, 0, -36);
  apron.addColorStop(0, '#ff9ebb');
  apron.addColorStop(1, '#e5488f');
  ctx.fillStyle = apron;
  rr(ctx, -20, -82, 40, 46, 9); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-14, -92); ctx.lineTo(-10, -82); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(14, -92); ctx.lineTo(10, -82); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  rr(ctx, -9, -54, 18, 12, 4); ctx.fill();
  // ---- arms: the front arm carries the plate, the back arm swings
  const f = chef.face;
  ctx.strokeStyle = '#f0c8a0'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-f * 24, -84); ctx.lineTo(-f * 29, -70 + swing * 3); ctx.lineTo(-f * 31, -54 + swing * 6); ctx.stroke();
  if (chef.carrying) {
    // front arm bent forward, holding the plate at chest height
    ctx.beginPath(); ctx.moveTo(f * 24, -84); ctx.lineTo(f * 30, -72); ctx.lineTo(f * 37, -64); ctx.stroke();
    // the plate: white disc with a brass rim, a pink scoop and a cherry
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(f * 40, -68, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = BRASS; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(f * 40, -68, 20, 7, 0, 0, Math.PI * 2); ctx.stroke();
    const scoop = ctx.createRadialGradient(f * 36, -78, 2, f * 40, -74, 10);
    scoop.addColorStop(0, '#ffffff'); scoop.addColorStop(0.55, '#ffb3c8'); scoop.addColorStop(1, '#d96a8f');
    ctx.fillStyle = scoop;
    ctx.beginPath(); ctx.arc(f * 40, -74, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e5484d';
    ctx.beginPath(); ctx.arc(f * 44, -82, 3.5, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.beginPath(); ctx.moveTo(f * 24, -84); ctx.lineTo(f * 29, -70 - swing * 3); ctx.lineTo(f * 31, -54 - swing * 6); ctx.stroke();
  }
  // ---- head: rosy cheeks, eyes looking where the chef walks
  const skin = ctx.createRadialGradient(-6, -118, 3, 0, -110, 24);
  skin.addColorStop(0, '#ffe0bd'); skin.addColorStop(1, '#f0c8a0');
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(0, -110, 22, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(60,30,10,0.3)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, -110, 22, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#3a2415';
  ctx.beginPath(); ctx.arc(-8 + f * 3, -112, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8 + f * 3, -112, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#4a2440'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(f * 3, -102, 7, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  ctx.fillStyle = 'rgba(255,127,165,0.5)';
  ctx.beginPath(); ctx.arc(-13, -101, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(13, -101, 4, 0, Math.PI * 2); ctx.fill();
  // ---- the toque: a tall white chef's hat, tilted toward the walk direction
  ctx.save();
  ctx.translate(f * 3, -128);
  ctx.rotate(f * 0.07);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-13, -12, 11, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -18, 13, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(13, -12, 11, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 0, 24, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(60,30,10,0.25)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(0, 0, 24, 10, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = PINK_DEEP;
  rr(ctx, -24, -5, 48, 6, 3); ctx.fill();
  ctx.restore();
  // where the chef is headed, as a little floating label
  if (chef.moving && chef.actionLabel) {
    ctx.font = '700 12px system-ui, "Segoe UI", sans-serif';
    const w = ctx.measureText(chef.actionLabel).width + 16;
    ctx.fillStyle = 'rgba(255,248,236,0.95)';
    rr(ctx, -w / 2, -196, w, 20, 10); ctx.fill();
    ctx.strokeStyle = BRASS; ctx.lineWidth = 1.5;
    rr(ctx, -w / 2, -196, w, 20, 10); ctx.stroke();
    ctx.fillStyle = INK;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(chef.actionLabel, 0, -185);
  }
  ctx.restore();
}

// ---- the room: wall, dusk window, shelves, lamps, floor ----

function drawWall(ctx, t) {
  // cream plaster wall, warm at the bottom
  const g = ctx.createLinearGradient(0, 56, 0, 210);
  g.addColorStop(0, '#f7e8c8');
  g.addColorStop(1, '#ecd3a8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 56, 1280, 154);
  // wainscot: a warm wood strip where wall meets floor
  ctx.fillStyle = WOOD;
  ctx.fillRect(0, 198, 1280, 12);
  ctx.fillStyle = BRASS;
  ctx.fillRect(0, 198, 1280, 2);
  // dusk window, right side: arched, amber sky, low sun, warm city.
  // The sky is filled as the arch path itself (no clip), so the edge
  // rasterises the same way every run; the sun and city sit inside the
  // arch and need no clipping either.
  const wx = 1080, wy = 70, ww = 170, wh = 128;
  const sky = ctx.createLinearGradient(0, wy, 0, wy + wh);
  sky.addColorStop(0, '#f7b267');
  sky.addColorStop(0.55, '#e07856');
  sky.addColorStop(1, '#8a5578');
  ctx.fillStyle = sky;
  ctx.beginPath();
  ctx.moveTo(wx, wy + wh + 0.5);
  ctx.lineTo(wx, wy + 30);
  ctx.quadraticCurveTo(wx + ww / 2, wy - 18, wx + ww, wy + 30);
  ctx.lineTo(wx + ww, wy + wh + 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd9a0';
  ctx.beginPath(); ctx.arc(wx + ww - 42, wy + 52, 20, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,217,160,0.35)';
  ctx.beginPath(); ctx.arc(wx + ww - 42, wy + 52, 30, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5d3a52';
  const city = [[0, 26], [26, 40], [52, 30], [80, 46], [108, 34], [134, 44]];
  city.forEach(([bx, bh]) => { ctx.fillRect(wx + bx, wy + wh - bh, 24, bh); });
  // window frame: wood arch + mullions
  ctx.strokeStyle = WOOD_DARK; ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(wx, wy + wh);
  ctx.lineTo(wx, wy + 30);
  ctx.quadraticCurveTo(wx + ww / 2, wy - 18, wx + ww, wy + 30);
  ctx.lineTo(wx + ww, wy + wh);
  ctx.stroke();
  ctx.strokeStyle = WOOD_DARK; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy + 4); ctx.lineTo(wx + ww / 2, wy + wh); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(wx, wy + 70); ctx.lineTo(wx + ww, wy + 70); ctx.stroke();
  // shelves with jam jars, left wall
  for (const sy of [92, 140]) {
    ctx.fillStyle = WOOD;
    ctx.fillRect(28, sy, 168, 8);
    ctx.fillStyle = BRASS;
    ctx.fillRect(28, sy + 8, 168, 2);
  }
  const jarCols = ['#e5488f', '#ffd166', '#7ec8a9', '#c9a0dc', '#ff8fb8', '#f2a65a'];
  jarCols.forEach((c, i) => {
    const jx = 40 + i * 28, jy = i < 3 ? 92 : 140;
    ctx.fillStyle = c;
    rr(ctx, jx, jy - 22, 20, 22, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(60,30,10,0.4)'; ctx.lineWidth = 1.5;
    rr(ctx, jx, jy - 22, 20, 22, 4); ctx.stroke();
    ctx.fillStyle = BRASS_DARK;
    ctx.fillRect(jx + 3, jy - 26, 14, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(jx + 3, jy - 18, 4, 14);
  });
  // a framed picture of the café's first day, between the shelves
  ctx.fillStyle = WOOD_DARK;
  rr(ctx, 226, 84, 64, 48, 4); ctx.fill();
  ctx.fillStyle = '#f7e8c8';
  rr(ctx, 230, 88, 56, 40, 3); ctx.fill();
  ctx.fillStyle = PINK;
  ctx.beginPath(); ctx.arc(258, 108, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = LEAF;
  ctx.fillRect(256, 116, 4, 10);
  // pendant lamps in the two side gaps, swaying almost imperceptibly
  for (const [lx, phase] of [[168, 0], [1048, 1.3]]) {
    const sway = Math.sin(t * 0.7 + phase) * 2;
    ctx.strokeStyle = WOOD_DARK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lx, 56); ctx.lineTo(lx + sway, 108); ctx.stroke();
    const glow = ctx.createRadialGradient(lx + sway, 122, 2, lx + sway, 122, 34);
    glow.addColorStop(0, 'rgba(255,214,140,0.55)');
    glow.addColorStop(1, 'rgba(255,214,140,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(lx + sway, 122, 34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = BRASS;
    ctx.beginPath(); ctx.moveTo(lx + sway - 16, 112); ctx.lineTo(lx + sway + 16, 112); ctx.lineTo(lx + sway + 9, 96); ctx.lineTo(lx + sway - 9, 96); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath(); ctx.arc(lx + sway, 116, 6, 0, Math.PI * 2); ctx.fill();
  }
  // potted plants on the floor at the sides
  for (const px of [56, 1224]) {
    ctx.fillStyle = '#b5653a';
    ctx.beginPath(); ctx.moveTo(px - 14, 596); ctx.lineTo(px + 14, 596); ctx.lineTo(px + 10, 624); ctx.lineTo(px - 10, 624); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = LEAF; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (const [dx, dy, len] of [[-8, -14, 18], [0, -18, 24], [8, -14, 18], [-4, -8, 14], [5, -8, 14]]) {
      ctx.beginPath(); ctx.moveTo(px, 596); ctx.lineTo(px + dx, 596 - len); ctx.stroke();
    }
  }
}

// The isometric floor: warm wood tiles in a diamond, two tones, with
// plank seams. A pink round rug sits under the plating table.
function drawFloor(ctx, t) {
  // soft shadow of the whole room on the wall base
  ctx.fillStyle = 'rgba(60,30,10,0.12)';
  ctx.beginPath();
  ctx.moveTo(FLOOR.top.x, FLOOR.top.y);
  ctx.lineTo(FLOOR.right.x, FLOOR.right.y);
  ctx.lineTo(FLOOR.bottom.x, FLOOR.bottom.y);
  ctx.lineTo(FLOOR.left.x, FLOOR.left.y);
  ctx.closePath(); ctx.fill();
  for (let x = 0; x < 14; x++) {
    for (let y = 0; y < 14; y++) {
      const a = iso(x, y), b = iso(x + 1, y), c = iso(x + 1, y + 1), d = iso(x, y + 1);
      ctx.fillStyle = (x + y) % 2 === 0 ? '#b98a5e' : '#a87a4e';
      ctx.beginPath();
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(90,55,25,0.35)'; ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  // brass edge around the floor diamond
  ctx.strokeStyle = BRASS; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(FLOOR.top.x, FLOOR.top.y);
  ctx.lineTo(FLOOR.right.x, FLOOR.right.y);
  ctx.lineTo(FLOOR.bottom.x, FLOOR.bottom.y);
  ctx.lineTo(FLOOR.left.x, FLOOR.left.y);
  ctx.closePath(); ctx.stroke();
  // pink round rug under the plating table
  ctx.fillStyle = '#f2b8c6';
  ctx.beginPath(); ctx.ellipse(655, 512, 200, 40, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#e58aa5'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(655, 512, 200, 40, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(655, 512, 178, 32, 0, 0, Math.PI * 2); ctx.stroke();
  // warm light pooling on the floor under the dusk window
  const pool = ctx.createRadialGradient(980, 470, 20, 980, 470, 280);
  pool.addColorStop(0, 'rgba(255,214,140,0.22)');
  pool.addColorStop(1, 'rgba(255,214,140,0)');
  ctx.fillStyle = pool;
  ctx.beginPath(); ctx.ellipse(980, 470, 280, 95, 0, 0, Math.PI * 2); ctx.fill();
  // dust motes drifting in the dusk light, fixed spots
  const motes = [[300, 300], [420, 260], [900, 280], [1000, 360], [500, 560], [820, 560]];
  motes.forEach(([mx, my], i) => {
    ctx.fillStyle = 'rgba(255,220,150,' + (0.35 + 0.2 * Math.sin(t * 0.9 + i * 2)) + ')';
    ctx.beginPath(); ctx.arc(mx + Math.sin(t * 0.5 + i) * 6, my + Math.cos(t * 0.4 + i) * 4, 2.5, 0, Math.PI * 2); ctx.fill();
  });
}

// ---- the counters: stations, bins, plating table, finishing, serve ----

function drawStations(ctx, world, t) {
  for (const station of STATIONS) {
    const r = stationRect(station);
    softShadow(ctx, r.x + r.w / 2 + 9, r.y + r.h + 4, r.w / 2, 8, 0.28);
    // the counter box: wood front, iso top
    const topCol = station.kind === 'wok' ? '#dceef5' : station.kind === 'grill' ? '#e8c98a' : '#f6d7e4';
    counterBox(ctx, r.x, r.y + 18, r.w, r.h - 18, 18, -18, WOOD, WOOD_DARK, topCol);
    const cook = world.cooks[station.id];
    if (station.kind === 'wok') {
      // SCOOP BAR: three frosty tubs of scoops on the counter
      const tubCols = ['#ff8fb8', '#fff3d6', '#7ec8a9'];
      tubCols.forEach((c, i) => {
        const tx = r.x + 40 + i * 50, ty = r.y + 9;
        const tub = ctx.createRadialGradient(tx - 4, ty - 5, 2, tx, ty, 13);
        tub.addColorStop(0, '#ffffff'); tub.addColorStop(0.5, c); tub.addColorStop(1, '#7a4a6e');
        ctx.fillStyle = tub;
        ctx.beginPath(); ctx.arc(tx, ty, 13, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(60,30,10,0.5)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(tx, ty, 13, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.strokeStyle = '#7fc4e8'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      const sx = r.x + r.w / 2, sy = r.y + 9;
      for (let a = 0; a < 3; a++) {
        const ang = (a * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(sx - Math.cos(ang) * 7, sy - Math.sin(ang) * 7);
        ctx.lineTo(sx + Math.cos(ang) * 7, sy + Math.sin(ang) * 7);
        ctx.stroke();
      }
      if (cook) drawIngredient(ctx, cook.ingredient, r.x + r.w / 2, r.y + 9, 26);
    } else if (station.kind === 'grill') {
      // BRASS OVEN: a dark oven box with a warm glowing window
      ctx.fillStyle = '#3a2a1a';
      rr(ctx, r.x + 42, r.y - 12, 96, 36, 6); ctx.fill();
      ctx.strokeStyle = BRASS; ctx.lineWidth = 2;
      rr(ctx, r.x + 42, r.y - 12, 96, 36, 6); ctx.stroke();
      const glow = 0.55 + 0.45 * Math.sin(t * 3 + station.x);
      const og = ctx.createRadialGradient(r.x + r.w / 2, r.y + 8, 2, r.x + r.w / 2, r.y + 8, 30);
      og.addColorStop(0, 'rgba(255,157,69,' + glow + ')');
      og.addColorStop(1, 'rgba(255,157,69,0)');
      ctx.fillStyle = og;
      ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + 8, 26, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a5a3b';
      rr(ctx, r.x + r.w / 2 - 18, r.y - 2, 36, 14, 4); ctx.fill();
      ctx.fillStyle = PINK;
      ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y - 6, 5, 0, Math.PI * 2); ctx.fill();
      if (cook) drawIngredient(ctx, cook.ingredient, r.x + r.w / 2, r.y + 9, 26);
    } else {
      // SHAKE BAR: a glass jar of pink shake with boba pearls
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.moveTo(r.x + 62, r.y - 8); ctx.lineTo(r.x + r.w - 62, r.y - 8); ctx.lineTo(r.x + r.w - 70, r.y + 18); ctx.lineTo(r.x + 70, r.y + 18); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = BRASS; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(r.x + 62, r.y - 8); ctx.lineTo(r.x + r.w - 62, r.y - 8); ctx.lineTo(r.x + r.w - 70, r.y + 18); ctx.lineTo(r.x + 70, r.y + 18); ctx.closePath(); ctx.stroke();
      const liq = ctx.createLinearGradient(0, r.y - 2, 0, r.y + 16);
      liq.addColorStop(0, '#ff9ecf'); liq.addColorStop(1, '#d1477f');
      ctx.fillStyle = liq;
      ctx.beginPath(); ctx.moveTo(r.x + 66, r.y - 2); ctx.lineTo(r.x + r.w - 66, r.y - 2); ctx.lineTo(r.x + r.w - 69, r.y + 16); ctx.lineTo(r.x + 69, r.y + 16); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2b0f1e';
      ctx.beginPath(); ctx.arc(r.x + r.w / 2 - 8, r.y + 10, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r.x + r.w / 2 + 8, r.y + 10, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a2a1a';
      rr(ctx, r.x + 64, r.y + 18, r.w - 128, 8, 3); ctx.fill();
      if (cook) drawIngredient(ctx, cook.ingredient, r.x + r.w / 2, r.y + 9, 26);
    }
    // station name and label on the front face
    text(ctx, station.name, r.x + r.w / 2, r.y + 46, fitSize(ctx, station.name, 164, 17, '800'), CREAM, '800', 'center');
    text(ctx, station.label + '  •  tap or press ' + (station.id === 'wok' ? 'F' : station.id === 'grill' ? 'O' : 'B'), r.x + r.w / 2, r.y + 66, 11, 'rgba(255,248,236,0.7)', '400', 'center');
    if (cook) {
      const frac = 1 - cook.left / cook.total;
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      rr(ctx, r.x + 14, r.y + r.h - 14, r.w - 28, 8, 4); ctx.fill();
      const pg = ctx.createLinearGradient(r.x + 14, 0, r.x + r.w - 14, 0);
      pg.addColorStop(0, '#ffd166'); pg.addColorStop(1, PINK_DEEP);
      ctx.fillStyle = pg;
      rr(ctx, r.x + 14, r.y + r.h - 14, Math.max(6, (r.w - 28) * frac), 8, 4); ctx.fill();
      // steam rising while something cooks
      for (let i = 0; i < 2; i++) {
        const ph = (t * 0.7 + i * 0.5 + station.x) % 1;
        ctx.fillStyle = 'rgba(255,255,255,' + (0.5 * (1 - ph)) + ')';
        ctx.beginPath(); ctx.arc(r.x + r.w / 2 - 12 + i * 24, r.y - 18 - ph * 26, 5 + ph * 4, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      text(ctx, 'tap to cook', r.x + r.w / 2, r.y + r.h - 10, 11, 'rgba(255,248,236,0.7)', '400', 'center');
    }
  }
}

function drawBins(ctx, world) {
  // the long front counter the bins sit on
  ctx.fillStyle = WOOD;
  ctx.fillRect(24, 640, 1232, 14);
  ctx.fillStyle = WOOD_DARK;
  ctx.fillRect(24, 654, 1232, 50);
  ctx.fillStyle = BRASS;
  ctx.fillRect(24, 640, 1232, 3);
  text(ctx, 'INGREDIENTS — tap or press 1-6', 36, 630, 13, INK, '800');
  BIN_ORDER.forEach((id, i) => {
    const r = binRect(i);
    const ing = INGREDIENTS[id];
    const order = world.orders[world.selectedOrder];
    const needed = order ? order.needs.has(id) : false;
    const added = order ? order.added.has(id) : false;
    // a wooden bowl on the counter
    ctx.fillStyle = added ? '#e8f5e9' : needed ? '#fff3d6' : '#f7f2e9';
    rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
    ctx.strokeStyle = added ? COLORS.good : needed ? PINK_DEEP : 'rgba(74,44,26,0.4)';
    ctx.lineWidth = 2;
    rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.stroke();
    drawIngredient(ctx, id, r.x + 30, r.y + r.h / 2, 34);
    text(ctx, ing.name, r.x + 54, r.y + 20, 15, INK, '700');
    text(ctx, '[' + (i + 1) + ']', r.x + r.w - 10, r.y + 20, 12, FAINT, '400', 'right');
    text(ctx, added ? '✓ added' : needed ? 'needed' : '—', r.x + 54, r.y + 40, 12, added ? COLORS.good : needed ? PINK_DEEP : FAINT, '400');
  });
}

function drawIsland(ctx, world, t) {
  const p = islandRect();
  // the round marble table: pedestal, then the round top
  ctx.fillStyle = WOOD_DARK;
  ctx.beginPath();
  ctx.moveTo(p.cx - 46, p.cy + 46); ctx.lineTo(p.cx + 46, p.cy + 46);
  ctx.lineTo(p.cx + 34, p.cy + 96); ctx.lineTo(p.cx - 34, p.cy + 96);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = WOOD;
  ctx.beginPath(); ctx.ellipse(p.cx, p.cy + 96, 52, 10, 0, 0, Math.PI * 2); ctx.fill();
  softShadow(ctx, p.cx, p.cy + 96, 60, 10, 0.3);
  // marble top, an ellipse with veins
  ctx.fillStyle = '#e8dfd2';
  ctx.beginPath(); ctx.ellipse(p.cx, p.cy + 7, 105, 36, 0, 0, Math.PI * 2); ctx.fill();
  const mg = ctx.createLinearGradient(p.cx - 105, 0, p.cx + 105, 0);
  mg.addColorStop(0, '#fdfaf3'); mg.addColorStop(0.5, '#f7f2e9'); mg.addColorStop(1, '#e8dfd2');
  ctx.fillStyle = mg;
  ctx.beginPath(); ctx.ellipse(p.cx, p.cy, 105, 36, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = BRASS; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(p.cx, p.cy, 105, 36, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = COLORS.marbleVein; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(p.cx - 70, p.cy - 10); ctx.quadraticCurveTo(p.cx - 15, p.cy + 5, p.cx + 50, p.cy - 7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(p.cx - 30, p.cy + 14); ctx.quadraticCurveTo(p.cx + 25, p.cy + 24, p.cx + 80, p.cy + 11); ctx.stroke();

  // the plate: a white disc with a brass rim, on the table — drawn as a
  // flattened ellipse, the way a round plate looks in isometric view
  softShadow(ctx, p.cx, p.cy + 6, p.r * 0.95, 10, 0.3);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(p.cx, p.cy, p.r, p.r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
  const pg = ctx.createRadialGradient(p.cx - 18, p.cy - 12, 6, p.cx, p.cy, p.r);
  pg.addColorStop(0, '#ffffff');
  pg.addColorStop(0.7, '#f7f2e9');
  pg.addColorStop(1, '#e0d5c2');
  ctx.fillStyle = pg;
  ctx.beginPath(); ctx.ellipse(p.cx, p.cy, p.r - 3, (p.r - 3) * 0.55, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = BRASS; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(p.cx, p.cy, p.r, p.r * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(201,162,94,0.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(p.cx, p.cy, p.r - 12, (p.r - 12) * 0.55, 0, 0, Math.PI * 2); ctx.stroke();

  const order = world.orders[world.selectedOrder];
  // dish name on a little paper label just above the table, clear of the
  // oven's right edge
  if (order) {
    const dish = DISHES[order.dish];
    ctx.fillStyle = PAPER;
    rr(ctx, 625, 346, 150, 28, 9); ctx.fill();
    ctx.strokeStyle = BRASS; ctx.lineWidth = 1.5;
    rr(ctx, 625, 346, 150, 28, 9); ctx.stroke();
    text(ctx, dish.name, 700, 361, fitSize(ctx, dish.name, 140, 17, '800'), dish.color, '800', 'center');
    const added = [...order.added];
    if (added.length === 0) {
      text(ctx, 'plate empty — tap ingredients below', p.cx, p.cy, 14, MUTED, '400', 'center');
    } else {
      const spots = [[-26, -8], [24, -10], [-5, 11], [29, 9], [-29, 9], [5, -15]];
      added.forEach((id, i) => {
        const [dx, dy] = spots[i % spots.length];
        const ing = INGREDIENTS[id];
        ctx.fillStyle = ing.dark + '2e';
        ctx.beginPath(); ctx.arc(p.cx + dx, p.cy + dy, 15, 0, Math.PI * 2); ctx.fill();
        drawIngredient(ctx, id, p.cx + dx, p.cy + dy, 28);
      });
    }
    // rising sparkles when the plate is getting full
    if (added.length >= 2) {
      for (let i = 0; i < 3; i++) {
        const bx = p.cx - 30 + i * 30;
        const by = p.cy - 52 - Math.sin(t * 2 + i * 2.1) * 5;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(201,162,94,0.9)' : 'rgba(255,127,165,0.9)';
        ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (plateIsServable(order)) {
      ctx.strokeStyle = COLORS.good; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(p.cx, p.cy, p.r + 7, (p.r + 7) * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
      text(ctx, 'READY TO SERVE!', p.cx, 568, 16, COLORS.good, '800', 'center');
    } else if (plateIsComplete(order)) {
      text(ctx, 'needs garnish — take it to the FINISHING counter', p.cx, 568, 14, '#b07a45', '700', 'center');
    } else {
      const missing = [...order.needs].filter((n) => !order.added.has(n));
      text(ctx, 'missing: ' + missing.map((m) => INGREDIENTS[m].name).join(', '), p.cx, 568, 14, '#b07a45', '700', 'center');
    }
  } else {
    text(ctx, 'no orders — wait a moment', p.cx, p.cy, 14, MUTED, '400', 'center');
  }
}

function drawFinishing(ctx, world, t) {
  const r = finishRect();
  softShadow(ctx, r.x + r.w / 2 + 8, r.y + r.h + 4, r.w / 2, 8, 0.28);
  counterBox(ctx, r.x, r.y + 16, r.w, r.h - 16, 16, -16, WOOD, WOOD_DARK, COLORS.marble);
  // the cloche: a glass dome over the garnish
  const cx = r.x + r.w / 2, cy = r.y + 8;
  const dome = ctx.createRadialGradient(cx - 8, cy - 14, 4, cx, cy, 30);
  dome.addColorStop(0, 'rgba(255,255,255,0.85)');
  dome.addColorStop(0.6, 'rgba(255,248,236,0.45)');
  dome.addColorStop(1, 'rgba(255,248,236,0.15)');
  ctx.fillStyle = dome;
  ctx.beginPath(); ctx.arc(cx, cy, 26, Math.PI, 0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = BRASS; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, 26, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = BRASS;
  ctx.beginPath(); ctx.arc(cx, cy - 26, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8dfd2';
  ctx.fillRect(cx - 30, cy - 2, 60, 5);
  // a cherry and sprinkles waiting under the dome
  ctx.fillStyle = '#e5484d';
  ctx.beginPath(); ctx.arc(cx - 8, cy - 8, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PINK;
  ctx.beginPath(); ctx.arc(cx + 10, cy - 6, 4, 0, Math.PI * 2); ctx.fill();
  text(ctx, 'FINISHING', cx, r.y + 44, fitSize(ctx, 'FINISHING', 140, 15, '800'), CREAM, '800', 'center');
  text(ctx, 'garnish & serve', cx, r.y + 64, 11, 'rgba(255,248,236,0.7)', '400', 'center');
  const order = world.orders[world.selectedOrder];
  if (order && plateIsComplete(order) && !order.finished) {
    // the counter calls for attention: a pulsing gold ring + a label
    const pulse = 0.6 + 0.4 * Math.sin(t * 5);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = '#e8a13c'; ctx.lineWidth = 4;
    rr(ctx, r.x - 4, r.y - 4, r.w + 8, r.h + 8, 12); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = PAPER;
    rr(ctx, cx - 62, r.y - 34, 124, 22, 8); ctx.fill();
    ctx.strokeStyle = BRASS; ctx.lineWidth = 1.5;
    rr(ctx, cx - 62, r.y - 34, 124, 22, 8); ctx.stroke();
    text(ctx, 'FINISH HERE!', cx, r.y - 22, 13, '#b07a45', '800', 'center');
  }
  if (order && order.finished) {
    for (let i = 0; i < 3; i++) {
      const sx = cx - 24 + i * 24;
      const sy = cy - 30 - Math.sin(t * 2 + i * 2) * 4;
      ctx.fillStyle = 'rgba(232,161,60,0.9)';
      ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function drawServe(ctx, world, t) {
  const r = serveRect();
  const order = world.orders[world.selectedOrder];
  const ready = plateIsServable(order);
  const pulse = ready ? 0.9 + 0.1 * Math.sin(t * 6) : 1;
  ctx.save();
  ctx.globalAlpha = pulse;
  bevelButton(ctx, r.x, r.y, r.w, r.h, 14, ready ? '#d9a94f' : '#a98f68', ready ? '#8a6d2f' : '#6b5636');
  ctx.restore();
  // a little service bell on the button
  const bx = r.x + r.w / 2, by = r.y + 26;
  ctx.fillStyle = '#fff3d6';
  ctx.beginPath(); ctx.arc(bx, by, 12, Math.PI, 0); ctx.closePath(); ctx.fill();
  ctx.fillRect(bx - 14, by - 2, 28, 4);
  ctx.fillStyle = '#8a6d2f';
  ctx.beginPath(); ctx.arc(bx, by - 14, 3, 0, Math.PI * 2); ctx.fill();
  text(ctx, 'SERVE', bx, r.y + 56, 26, '#fff8ec', '800', 'center');
  text(ctx, ready ? 'plate ready — click / space' : 'finish the plate first', bx, r.y + 76, 12, 'rgba(255,248,236,0.85)', '400', 'center');
  // the ready tray below the bell
  const s = serveReadyRect();
  ctx.fillStyle = PAPER;
  rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.fill();
  ctx.strokeStyle = BRASS; ctx.lineWidth = 2;
  rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.stroke();
  text(ctx, 'READY TRAY', s.x + s.w / 2, s.y + 18, 12, MUTED, '800', 'center');
  if (ready && order) {
    const dish = DISHES[order.dish];
    softShadow(ctx, s.x + 46, s.y + 102, 26, 6, 0.3);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(s.x + 46, s.y + 70, 30, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = BRASS; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(s.x + 46, s.y + 70, 30, 0, Math.PI * 2); ctx.stroke();
    drawIngredient(ctx, dish.needs[0], s.x + 46, s.y + 70, 36);
    text(ctx, dish.name, s.x + 92, s.y + 58, fitSize(ctx, dish.name, 84, 14, '800'), dish.color, '800');
    text(ctx, dish.coins + ' coins' + (world.rush ? ' x2' : ''), s.x + 92, s.y + (order.golden ? 78 : 82), 13, '#c98f2e', '700');
    if (order.golden) text(ctx, '★ GOLDEN x3', s.x + 92, s.y + 98, 12, '#c98f2e', '800');
    if (world.rush) text(ctx, 'RUSH HOUR!', s.x + 92, s.y + (order.golden ? 112 : 100), 12, '#e07856', '800');
  } else {
    ctx.strokeStyle = 'rgba(74,44,26,0.3)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.arc(s.x + 46, s.y + 70, 30, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'no plate', s.x + 92, s.y + 62, 13, MUTED, '400');
    text(ctx, 'ready yet', s.x + 92, s.y + 84, 13, MUTED, '400');
  }
}

// ---- order board, story strip, top bar, overlays ----

function drawOrderBoard(ctx, world, t) {
  world.orders.forEach((order, i) => {
    const r = ticketRect(i);
    const dish = DISHES[order.dish];
    const selected = i === world.selectedOrder;
    // a warm paper ticket with a brass pin
    ctx.fillStyle = 'rgba(60,30,10,0.25)';
    rr(ctx, r.x + 3, r.y + 5, r.w, r.h, 10); ctx.fill();
    ctx.fillStyle = PAPER;
    rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
    ctx.strokeStyle = selected ? PINK_DEEP : 'rgba(74,44,26,0.45)';
    ctx.lineWidth = selected ? 3 : 2;
    rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.stroke();
    ctx.fillStyle = BRASS;
    ctx.beginPath(); ctx.arc(r.x + 14, r.y + 14, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.arc(r.x + 12, r.y + 12, 2, 0, Math.PI * 2); ctx.fill();
    drawFace(ctx, order.customer, r.x + 30, r.y + 34, 18);
    text(ctx, order.customer.name, r.x + 54, r.y + 22, 13, INK, '700');
    text(ctx, dish.name, r.x + 54, r.y + 44, fitSize(ctx, dish.name, 180, 17, '800'), dish.color, '800');
    // ingredient dots: filled = on the plate, outline = still missing
    let ix = r.x + 54;
    for (const need of dish.needs) {
      const done = order.added.has(need);
      ctx.fillStyle = done ? INGREDIENTS[need].color : 'rgba(74,44,26,0.1)';
      ctx.beginPath(); ctx.arc(ix, r.y + 70, 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(74,44,26,0.4)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(ix, r.y + 70, 10, 0, Math.PI * 2); ctx.stroke();
      if (done) {
        ctx.strokeStyle = COLORS.good; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(ix - 4, r.y + 70); ctx.lineTo(ix - 1, r.y + 74); ctx.lineTo(ix + 5, r.y + 65); ctx.stroke();
      }
      ix += 25;
    }
    drawPatienceBar(ctx, r.x + 14, r.y + 88, r.w - 28, Math.max(0, order.patience / order.maxPatience));
    if (order.finished) {
      text(ctx, '✓ garnished', r.x + r.w - 12, r.y + 70, 11, COLORS.good, '800', 'right');
    } else if (order.golden) {
      text(ctx, '★ GOLDEN x3', r.x + r.w - 12, r.y + 22, 11, '#c98f2e', '800', 'right');
    } else if (selected) {
      text(ctx, '▶ SELECTED', r.x + r.w - 12, r.y + 22, 11, PINK_DEEP, '800', 'right');
    }
    if (order.golden) {
      ctx.strokeStyle = 'rgba(232,161,60,0.4)'; ctx.lineWidth = 7;
      rr(ctx, r.x - 2, r.y - 2, r.w + 4, r.h + 4, 12); ctx.stroke();
      ctx.strokeStyle = '#e8a13c'; ctx.lineWidth = 3;
      rr(ctx, r.x - 2, r.y - 2, r.w + 4, r.h + 4, 12); ctx.stroke();
    }
  });
  for (let i = world.orders.length; i < 3; i++) {
    const r = ticketRect(i);
    ctx.fillStyle = 'rgba(253,243,221,0.5)';
    rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(74,44,26,0.3)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
    rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'empty table — next order coming…', r.x + r.w / 2, r.y + r.h / 2, 13, FAINT, '400', 'center');
  }
}

function drawStory(ctx, world) {
  const order = world.orders[world.selectedOrder];
  const r = storyRect();
  ctx.fillStyle = 'rgba(253,243,221,0.85)';
  rr(ctx, r.x, r.y, r.w, r.h, 11); ctx.fill();
  ctx.strokeStyle = 'rgba(201,162,94,0.6)'; ctx.lineWidth = 1.5;
  rr(ctx, r.x, r.y, r.w, r.h, 11); ctx.stroke();
  if (order) {
    ctx.fillStyle = INK;
    ctx.font = 'italic 400 14px system-ui, "Segoe UI", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(order.customer.name + ': "' + order.quote + '"', r.x + r.w / 2, r.y + r.h / 2 + 1);
  } else {
    ctx.fillStyle = FAINT;
    ctx.font = 'italic 400 14px system-ui, "Segoe UI", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('The café is quiet for a moment…', r.x + r.w / 2, r.y + r.h / 2 + 1);
  }
}

function drawTopBar(ctx, world) {
  const g = ctx.createLinearGradient(0, 0, 0, 56);
  g.addColorStop(0, '#7a4a2e');
  g.addColorStop(1, '#5f3d26');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1280, 56);
  ctx.fillStyle = BRASS;
  ctx.fillRect(0, 54, 1280, 2);
  text(ctx, GAME_TITLE, 24, 20, 24, '#fff8ec', '800');
  text(ctx, GAME_SUBTITLE, 24, 42, 12, '#f2d9b0', '400');
  // timer, big and central
  const frac = world.timeLeft / SHIFT_SECONDS;
  const tc = frac > 0.5 ? '#fff8ec' : frac > 0.2 ? '#ffe9a8' : '#ffd166';
  text(ctx, '⏱ ' + fmtTime(world.timeLeft), 640, 20, 30, tc, '800', 'center');
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  rr(ctx, 480, 40, 320, 7, 3); ctx.fill();
  ctx.fillStyle = tc;
  rr(ctx, 480, 40, Math.max(8, 320 * frac), 7, 3); ctx.fill();
  // coins and combo (the multiplier caps at x2, same as the world rules)
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(1150, 20, 10, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a6d2f'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(1150, 20, 10, 0, Math.PI * 2); ctx.stroke();
  text(ctx, '¢', 1150, 20, 13, '#8a6d2f', '800', 'center');
  text(ctx, world.coins + ' coins', 1256, 20, 20, '#fff8ec', '800', 'right');
  if (world.eventActive && world.eventDish) {
    const dish = DISHES[world.eventDish];
    text(ctx, '★ GOLDEN HOUR: ' + dish.name + ' x2', 1256, 44, 13, '#ffd166', '800', 'right');
  } else {
    const mult = Math.min(1 + (world.combo - 1) * 0.25, 2.0);
    const comboText = world.combo >= 2 ? 'COMBO x' + (Number.isInteger(mult) ? mult : mult.toFixed(2)) : 'score ' + world.score;
    text(ctx, comboText, 1256, 44, 13, world.combo >= 2 ? '#ffd166' : '#f2d9b0', '700', 'right');
  }
  // customers who left, as three small cups
  for (let i = 0; i < MAX_MISSED; i++) {
    ctx.fillStyle = i < world.missed ? '#d9534f' : 'rgba(255,248,236,0.3)';
    ctx.beginPath(); ctx.arc(940 + i * 26, 20, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,248,236,0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(940 + i * 26, 20, 9, 0, Math.PI * 2); ctx.stroke();
  }
  text(ctx, 'customers left:', 930, 20, 12, '#f2d9b0', '400', 'right');
}

function drawPopups(ctx, world) {
  for (const p of world.popups) {
    const age = world.elapsed - p.born;
    if (age > 1.4) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - age / 1.4);
    ctx.font = '800 18px system-ui, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255,248,236,0.95)';
    ctx.lineWidth = 5;
    ctx.strokeText(p.text, p.x, p.y - age * 26);
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y - age * 26);
    ctx.restore();
  }
}

function drawFlash(ctx, world) {
  if (!world.flash) return;
  const age = world.elapsed - world.flashAt;
  if (age > 2.5) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - age / 2.5);
  ctx.fillStyle = PAPER;
  rr(ctx, 390, 210, 500, 52, 12); ctx.fill();
  ctx.strokeStyle = BRASS; ctx.lineWidth = 2.5;
  rr(ctx, 390, 210, 500, 52, 12); ctx.stroke();
  text(ctx, world.flash, 640, 237, 21, '#8a6d2f', '800', 'center');
  ctx.restore();
}

// Golden Hour light: a warm amber wash over the whole room, sun rays
// from the dusk window, and golden motes in the air.
function drawGoldenHour(ctx, world, t) {
  if (!world.eventActive) return;
  ctx.save();
  ctx.fillStyle = 'rgba(255,190,90,0.10)';
  ctx.fillRect(0, 56, 1280, 664);
  ctx.fillStyle = 'rgba(255,210,130,0.10)';
  for (let i = 0; i < 3; i++) {
    const x0 = 1080 + i * 40;
    ctx.beginPath();
    ctx.moveTo(x0, 70); ctx.lineTo(x0 + 26, 70);
    ctx.lineTo(x0 - 120 + i * 60, 620); ctx.lineTo(x0 - 200 + i * 60, 620);
    ctx.closePath(); ctx.fill();
  }
  const motes = [[340, 320], [520, 280], [760, 340], [940, 300], [600, 560], [880, 560]];
  motes.forEach(([mx, my], i) => {
    ctx.fillStyle = 'rgba(255,200,90,' + (0.5 + 0.3 * Math.sin(t * 1.1 + i * 2)) + ')';
    ctx.beginPath(); ctx.arc(mx + Math.sin(t * 0.5 + i) * 8, my + Math.cos(t * 0.4 + i) * 5, 3, 0, Math.PI * 2); ctx.fill();
  });
  ctx.restore();
}

// ---- screens ----

function drawTitle(ctx, world, t) {
  // dusk sky over the street
  const sky = ctx.createLinearGradient(0, 0, 0, 720);
  sky.addColorStop(0, '#f7b267');
  sky.addColorStop(0.55, '#e07856');
  sky.addColorStop(1, '#8a5578');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath(); ctx.arc(1020, 130, 34, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,233,168,0.35)';
  ctx.beginPath(); ctx.arc(1020, 130, 52, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5d3a52';
  const city = [[0, 90], [110, 60], [200, 100], [980, 70], [1080, 110], [1180, 70]];
  city.forEach(([bx, bh]) => { ctx.fillRect(bx, 620 - bh, 100, bh); });
  // the café building
  ctx.fillStyle = '#f7e8c8';
  rr(ctx, 340, 140, 600, 290, 10); ctx.fill();
  ctx.strokeStyle = WOOD_DARK; ctx.lineWidth = 4;
  rr(ctx, 340, 140, 600, 290, 10); ctx.stroke();
  // pink-striped awning
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = i % 2 === 0 ? PINK : '#fff8ec';
    ctx.fillRect(330 + i * 62, 196, 62, 44);
  }
  ctx.fillStyle = WOOD_DARK;
  ctx.fillRect(330, 196, 620, 6);
  // big window, warm inside
  ctx.fillStyle = '#ffe9a8';
  rr(ctx, 380, 250, 260, 130, 8); ctx.fill();
  ctx.strokeStyle = WOOD_DARK; ctx.lineWidth = 5;
  rr(ctx, 380, 250, 260, 130, 8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(510, 250); ctx.lineTo(510, 380); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(380, 315); ctx.lineTo(640, 315); ctx.stroke();
  ctx.fillStyle = '#8a5a3b';
  ctx.fillRect(420, 330, 60, 40);
  ctx.fillStyle = PINK;
  ctx.beginPath(); ctx.arc(450, 320, 16, 0, Math.PI * 2); ctx.fill();
  // the door
  ctx.fillStyle = WOOD;
  rr(ctx, 700, 270, 110, 160, 8); ctx.fill();
  ctx.strokeStyle = WOOD_DARK; ctx.lineWidth = 4;
  rr(ctx, 700, 270, 110, 160, 8); ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath(); ctx.arc(700, 300, 16, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(810, 300, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = BRASS;
  ctx.beginPath(); ctx.arc(790, 400, 7, 0, Math.PI * 2); ctx.fill();
  // the sign
  ctx.fillStyle = PAPER;
  rr(ctx, 400, 96, 480, 58, 10); ctx.fill();
  ctx.strokeStyle = BRASS; ctx.lineWidth = 3;
  rr(ctx, 400, 96, 480, 58, 10); ctx.stroke();
  text(ctx, 'SUGAR RUSH CAFÉ', 640, 126, 34, PINK_DEEP, '800', 'center');
  text(ctx, GAME_SUBTITLE, 640, 176, 15, '#6b4a2e', '400', 'center');
  // how to play, in dark ink on the dusk sky below the building
  text(ctx, 'Walk the floor, take orders, scoop / bake / blend, garnish at the finishing counter,', 640, 452, 15, INK, '400', 'center');
  text(ctx, 'then ring the bell before customers run out of patience. Golden tickets pay 3x — fast serves earn PERFECT!', 640, 472, 15, INK, '400', 'center');
  text(ctx, 'mouse + keyboard: click to walk • 1-6 bins • F/O/B stations • WASD • space to serve • Tab to switch', 640, 492, 12, '#6b4a2e', '400', 'center');
  const b = startButtonRect();
  const pulse = 0.9 + 0.1 * Math.sin(t * 4);
  ctx.save(); ctx.globalAlpha = pulse;
  bevelButton(ctx, b.x, b.y, b.w, b.h, 14, '#d9a94f', '#8a6d2f');
  ctx.restore();
  text(ctx, 'OPEN THE CAFÉ', b.x + b.w / 2, b.y + b.h / 2, 30, '#fff8ec', '800', 'center');
  // a wooden counter with the six desserts, as a taster of the menu
  ctx.fillStyle = WOOD;
  ctx.fillRect(180, 622, 920, 14);
  ctx.fillStyle = WOOD_DARK;
  ctx.fillRect(180, 636, 920, 26);
  MENU_ORDER.forEach((d, i) => {
    const x = 280 + i * 152;
    softShadow(ctx, x, 596, 26, 6, 0.35);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(x, 598, 26, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = BRASS; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, 598, 26, 0, Math.PI * 2); ctx.stroke();
    const dish = DISHES[d];
    drawIngredient(ctx, dish.needs[0], x, 598, 30);
  });
}

function drawResults(ctx, world, t) {
  drawWall(ctx, t);
  drawFloor(ctx, t);
  ctx.fillStyle = 'rgba(40,20,8,0.5)';
  ctx.fillRect(0, 0, 1280, 720);
  text(ctx, 'NIGHTLY LEDGER', 640, 120, 54, '#fff8ec', '800', 'center');
  text(ctx, world.overReason, 640, 162, 18, '#f2d9b0', '400', 'center');
  // stars
  const stars = STAR_COINS.filter((c) => world.coins >= c).length;
  for (let i = 0; i < 3; i++) {
    const x = 560 + i * 80;
    ctx.fillStyle = i < stars ? '#e8a13c' : 'rgba(255,248,236,0.25)';
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const ang = -Math.PI / 2 + (k * Math.PI) / 5;
      const rad = k % 2 === 0 ? 30 : 13;
      const px = x + Math.cos(ang) * rad, py = 196 + Math.sin(ang) * rad;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    if (i < stars) {
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  // the ledger book: cream paper, ruled lines, brass binding
  ctx.fillStyle = 'rgba(60,30,10,0.3)';
  rr(ctx, 404, 234, 472, 300, 14); ctx.fill();
  ctx.fillStyle = PAPER;
  rr(ctx, 400, 230, 472, 300, 14); ctx.fill();
  ctx.strokeStyle = BRASS; ctx.lineWidth = 3;
  rr(ctx, 400, 230, 472, 300, 14); ctx.stroke();
  ctx.fillStyle = BRASS;
  ctx.fillRect(400, 230, 14, 300);
  ctx.strokeStyle = 'rgba(74,44,26,0.25)'; ctx.lineWidth = 1.5;
  for (let i = 1; i < 7; i++) {
    ctx.beginPath(); ctx.moveTo(436, 230 + i * 42); ctx.lineTo(856, 230 + i * 42); ctx.stroke();
  }
  const rows = [
    ['Orders served', String(world.served)],
    ['Customers left hungry', String(world.missed)],
    ['Best combo', world.bestCombo + ' in a row'],
    ['Perfect serves', String(world.perfectServes)],
    ['Golden tickets served', String(world.goldenServed)],
    ['Tips', world.tips + ' coins'],
    ['Coins tonight', world.coins + ' coins'],
  ];
  rows.forEach(([label, value], i) => {
    const y = 252 + i * 38;
    text(ctx, label, 448, y, 19, INK, '400');
    text(ctx, value, 848, y, 21, '#8a6d2f', '800', 'right');
  });
  const b = againButtonRect();
  bevelButton(ctx, b.x, b.y, b.w, b.h, 14, '#d9a94f', '#8a6d2f');
  text(ctx, 'OPEN AGAIN', b.x + b.w / 2, b.y + b.h / 2, 26, '#fff8ec', '800', 'center');
  text(ctx, 'click the button or press Enter', 640, 660, 13, 'rgba(255,248,236,0.85)', '400', 'center');
}

// A soft vignette over the room: the corners fall gently darker so the
// centre of the café reads as lit, like a warm photograph.
function drawVignette(ctx) {
  const v = ctx.createRadialGradient(640, 380, 300, 640, 380, 720);
  v.addColorStop(0, 'rgba(40,20,8,0)');
  v.addColorStop(1, 'rgba(40,20,8,0.10)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, 1280, 720);
}

export function render(ctx, world, t) {
  ctx.clearRect(0, 0, 1280, 720);
  if (world.state === 'title') { drawTitle(ctx, world, t); return; }
  if (world.state === 'over') { drawResults(ctx, world, t); return; }
  drawWall(ctx, t);
  drawFloor(ctx, t);
  drawStations(ctx, world, t);
  drawIsland(ctx, world, t);
  drawFinishing(ctx, world, t);
  drawServe(ctx, world, t);
  drawBins(ctx, world);
  drawChef(ctx, world.chef, t);
  drawOrderBoard(ctx, world, t);
  drawStory(ctx, world);
  drawVignette(ctx);
  drawTopBar(ctx, world);
  drawGoldenHour(ctx, world, t);
  drawFlash(ctx, world);
  drawPopups(ctx, world);
}
