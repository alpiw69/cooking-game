// render.js — every pixel of Sugar Rush 2099, drawn with canvas shapes.
// No images, no fonts from the network: a neon dessert lab in the year
// 2099, faked in 2.5D — a deep violet night sky with stars and a lit
// skyline, a glossy perspective floor, glass panels with neon edges,
// drop shadows, bevels and glossy highlights, so the flat canvas reads
// as a 3D space. Dishes are drawn with volume: radial-gradient scoops,
// a boba glass with depth, a brownie block in slight isometric.
// render(ctx, world, t) draws one frame; t is animation time in seconds.
// Neon glow is faked with layered translucent strokes, never shadowBlur,
// so screenshots stay deterministic.

import { COLORS, DISHES, MENU_ORDER, INGREDIENTS, STATIONS, BIN_ORDER, SHIFT_SECONDS, MAX_MISSED, STAR_COINS, GAME_TITLE, GAME_SUBTITLE } from './config.js';
import { ticketRect, stationRect, plateRect, serveRect, serveReadyRect, binRect, startButtonRect, againButtonRect } from './layout.js';
import { plateIsComplete } from './world.js';

const NEON_PINK = '#ff5ec4';
const NEON_CYAN = '#4de3ff';
const NEON_GOLD = '#ffd166';
const GLASS = '#2a1250';
const MUTED = 'rgba(255,233,246,0.62)';
const FAINT = 'rgba(255,233,246,0.38)';

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

// Neon text: a soft halo from two wide translucent strokes, then the
// crisp fill on top. Layered strokes stay deterministic, unlike
// shadowBlur, so the same frame always renders the same pixels.
function glowText(ctx, s, x, y, size, color, glow, weight, align) {
  ctx.save();
  ctx.font = (weight || '800') + ' ' + size + 'px system-ui, "Segoe UI", sans-serif';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = glow;
  ctx.lineWidth = size * 0.26;
  ctx.strokeText(s, x, y);
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = size * 0.12;
  ctx.strokeText(s, x, y);
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
  ctx.restore();
}

// A soft cast shadow: two stacked ellipses, darker in the middle.
function softShadow(ctx, x, y, rx, ry, alpha) {
  ctx.save();
  const a = alpha || 0.35;
  ctx.fillStyle = 'rgba(0,0,0,' + a + ')';
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,' + (a * 0.55) + ')';
  ctx.beginPath(); ctx.ellipse(x, y, rx * 0.72, ry * 0.7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// A floating glass panel: drop shadow, dark violet glass with a vertical
// gradient, a neon edge, a glossy strip along the top and a darker bevel
// along the bottom — it reads as a solid slab floating above the floor.
function glassPanel(ctx, x, y, w, h, r, edge) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  rr(ctx, x + 3, y + 7, w, h, r); ctx.fill();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#3a1c66');
  g.addColorStop(0.5, GLASS);
  g.addColorStop(1, '#1d0c40');
  ctx.fillStyle = g;
  rr(ctx, x, y, w, h, r); ctx.fill();
  ctx.strokeStyle = edge || NEON_PINK;
  ctx.lineWidth = 2;
  rr(ctx, x, y, w, h, r); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x + r, y + 3); ctx.lineTo(x + w - r, y + 3); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x + r, y + h - 3); ctx.lineTo(x + w - r, y + h - 3); ctx.stroke();
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

// A holographic lollipop: a translucent pink disc with a cyan rim and a
// white swirl, hung by a glowing string.
function drawHoloLollipop(ctx, x, y, r) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y + r * 0.9); ctx.lineTo(x, y + r + 26); ctx.stroke();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = '#ff8fd6';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = NEON_CYAN;
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0.6, 0.6 + Math.PI * 1.2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r * 0.25, 2.2, 2.2 + Math.PI * 1.2); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.18, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// A little antenna with a glowing orb — every guest wears one in 2099.
function drawAntenna(ctx, x, y, r, color) {
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 3, y - r - 4, x + 7, y - r - 6); ctx.stroke();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x + 7, y - r - 8, r, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x + 7, y - r - 8, r * 0.55, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.arc(x + 5, y - r - 10, r * 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
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

// ---- dessert icons, drawn with volume so they read as 3D objects ----
export function drawIngredient(ctx, id, x, y, s) {
  const ing = INGREDIENTS[id];
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = Math.max(2, s * 0.06);
  ctx.strokeStyle = 'rgba(20,6,38,0.55)';
  switch (id) {
    case 'nasi': {
      // vanilla scoop on a cone: gradient cone, then a round scoop with
      // a radial highlight — a sphere, not a flat disc
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
      // strawberry scoop on a cone, with seeds and a glossy top
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
      // a brownie block in slight isometric: a lighter top face, a dark
      // front face, gold drizzle and a cherry on top
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
      // a boba glass with depth: translucent walls, pink liquid, dark
      // pearls at the bottom, a whipped dome and a neon straw
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
      ctx.strokeStyle = NEON_PINK; ctx.lineWidth = s * 0.07; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(s * 0.08, -s * 0.3); ctx.lineTo(s * 0.24, -s * 0.46); ctx.stroke();
      break;
    }
    case 'telur': {
      // a pinch of sprinkles, each a glossy capsule
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
      // chocolate sauce bottle: a gradient body, a gold band, a gloss stripe
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
      // a cherry as a sphere: radial red, a green stem, a white glint
      const ball = ctx.createRadialGradient(-s * 0.12, -s * 0.08, s * 0.04, 0, s * 0.04, s * 0.34);
      ball.addColorStop(0, '#ff8a8e'); ball.addColorStop(0.55, '#e5484d'); ball.addColorStop(1, '#8f1d20');
      ctx.strokeStyle = '#2f9e6e'; ctx.lineWidth = s * 0.07; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, -s * 0.2); ctx.quadraticCurveTo(s * 0.08, -s * 0.36, s * 0.22, -s * 0.4); ctx.stroke();
      ctx.fillStyle = ball;
      ctx.beginPath(); ctx.arc(0, s * 0.04, s * 0.34, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(20,6,38,0.55)'; ctx.lineWidth = Math.max(2, s * 0.05);
      ctx.beginPath(); ctx.arc(0, s * 0.04, s * 0.34, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath(); ctx.arc(-s * 0.12, -s * 0.08, s * 0.08, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'bawang': {
      // a wafer stick with a gradient, cross-hatch and a gloss edge
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
      // ice cubes: pale blue gradients with facet lines and a glint
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
      // sugar cubes with a gold sparkle in the middle
      for (const [dx, dy] of [[-0.16, 0.05], [0.12, -0.12], [0.2, 0.14], [-0.05, -0.22]]) {
        ctx.save(); ctx.translate(dx * s, dy * s); ctx.rotate(0.4);
        const cube = ctx.createLinearGradient(-s * 0.12, -s * 0.12, s * 0.12, s * 0.12);
        cube.addColorStop(0, '#ffffff'); cube.addColorStop(1, '#d9d0e8');
        ctx.fillStyle = cube;
        ctx.fillRect(-s * 0.12, -s * 0.12, s * 0.24, s * 0.24);
        ctx.strokeStyle = 'rgba(20,6,38,0.4)'; ctx.lineWidth = Math.max(1.5, s * 0.03);
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

function drawFace(ctx, customer, x, y, r) {
  ctx.save();
  // soft shadow under the chin, so the head floats above the ticket
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, y + r * 0.85, r * 0.8, r * 0.25, 0, 0, Math.PI * 2); ctx.fill();
  const skin = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  skin.addColorStop(0, '#ffe0bd'); skin.addColorStop(0.6, customer.skin); skin.addColorStop(1, '#b97e4e');
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  // hair in the customer's shirt color
  ctx.fillStyle = customer.shirt;
  ctx.beginPath(); ctx.arc(x, y - r * 0.55, r * 0.9, Math.PI, 0); ctx.fill();
  // neon visor across the eyes, with a white glint
  const visor = ctx.createLinearGradient(x - r * 0.7, y, x + r * 0.7, y);
  visor.addColorStop(0, NEON_CYAN); visor.addColorStop(0.5, '#b8f4ff'); visor.addColorStop(1, NEON_CYAN);
  ctx.fillStyle = visor;
  rr(ctx, x - r * 0.72, y - r * 0.34, r * 1.44, r * 0.42, r * 0.21); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5;
  rr(ctx, x - r * 0.72, y - r * 0.34, r * 1.44, r * 0.42, r * 0.21); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillRect(x - r * 0.5, y - r * 0.28, r * 0.3, r * 0.08);
  // smile below the visor
  ctx.strokeStyle = '#4a2440'; ctx.lineWidth = Math.max(2, r * 0.1); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y + r * 0.25, r * 0.38, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  // antenna with a glowing orb on top
  drawAntenna(ctx, x, y - r * 1.02, r * 0.32, customer.shirt);
  ctx.restore();
}

function drawPatienceBar(ctx, x, y, w, frac) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
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

// ---- the neon dessert lab in 2099 ----
function drawBackground(ctx, t) {
  // deep violet night sky
  const g = ctx.createLinearGradient(0, 0, 0, 720);
  g.addColorStop(0, '#12051f');
  g.addColorStop(0.45, '#2b0f4d');
  g.addColorStop(0.75, '#571a63');
  g.addColorStop(1, '#1c0a38');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1280, 720);
  // stars — fixed spots so every frame matches, gently twinkling
  const stars = [[60, 90, 1.6], [150, 240, 1.2], [210, 120, 2], [330, 200, 1.4], [420, 90, 1.8], [520, 150, 1.2], [700, 100, 1.6], [820, 200, 1.4], [900, 90, 2], [1010, 150, 1.2], [1100, 240, 1.6], [1200, 110, 1.8], [1240, 300, 1.2], [40, 420, 1.4], [1240, 480, 1.6], [260, 300, 1.2], [1020, 300, 1.4]];
  stars.forEach(([sx, sy, sr], i) => {
    const tw = 0.55 + 0.45 * Math.sin(t * 1.5 + i * 1.7);
    ctx.globalAlpha = tw;
    ctx.fillStyle = i % 3 === 0 ? NEON_CYAN : '#ffffff';
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;
  // a neon skyline in two layers, with lit windows — the city of 2099
  ctx.fillStyle = '#2c1254';
  const far = [[0, 90], [90, 60], [150, 110], [260, 70], [330, 100], [430, 55], [520, 95], [610, 65], [700, 105], [790, 60], [880, 95], [970, 70], [1060, 110], [1150, 65], [1220, 95]];
  far.forEach(([bx, bh]) => { ctx.fillRect(bx, 636 - bh, 70, bh); });
  ctx.fillStyle = '#180832';
  const near = [[30, 60], [140, 85], [230, 50], [350, 80], [470, 55], [560, 90], [670, 60], [780, 85], [890, 55], [1000, 80], [1120, 60], [1210, 85]];
  near.forEach(([bx, bh]) => { ctx.fillRect(bx, 636 - bh, 80, bh); });
  const wins = [[50, 600, '#ffd166'], [170, 580, '#4de3ff'], [260, 610, '#ff5ec4'], [380, 590, '#ffd166'], [500, 605, '#4de3ff'], [600, 585, '#ff5ec4'], [700, 610, '#ffd166'], [820, 590, '#4de3ff'], [920, 605, '#ff5ec4'], [1030, 590, '#ffd166'], [1150, 610, '#4de3ff'], [1240, 590, '#ff5ec4']];
  wins.forEach(([wx, wy, wc]) => {
    ctx.fillStyle = wc;
    ctx.fillRect(wx, wy, 5, 7);
  });
  // holo lollipops hanging in the side gaps, swaying a little
  for (const [lx, phase] of [[170, 0], [1110, 1.4]]) {
    const sway = Math.sin(t * 1.2 + phase) * 5;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lx, 64); ctx.lineTo(lx + sway, 128); ctx.stroke();
    drawHoloLollipop(ctx, lx + sway, 148, 22);
  }
  // floating holo sprinkles, drifting slowly
  const sprinkleCols = ['#ff5ec4', '#4de3ff', '#ffd166', '#37e08b', '#c9a0dc'];
  const spots = [
    [240, 260, 0.4], [250, 560, 1.2], [420, 230, 2.0], [880, 240, 0.9], [1020, 560, 1.8],
    [460, 620, 0.2], [820, 620, 2.6], [60, 300, 1.0], [1220, 300, 2.2], [60, 600, 0.6], [1220, 600, 1.5],
  ];
  spots.forEach(([sx, sy, rot], i) => {
    ctx.save(); ctx.translate(sx, sy + Math.sin(t * 0.8 + i) * 4); ctx.rotate(rot);
    ctx.fillStyle = sprinkleCols[i % sprinkleCols.length];
    ctx.globalAlpha = 0.85;
    ctx.fillRect(-9, -3, 18, 6);
    ctx.restore();
  });
  ctx.globalAlpha = 1;
  // glossy perspective floor: dark, with neon grid lines converging
  // toward the middle of the stage, so the floor reads as a 3D plane
  const fg = ctx.createLinearGradient(0, 636, 0, 720);
  fg.addColorStop(0, '#22104a');
  fg.addColorStop(1, '#0a0318');
  ctx.fillStyle = fg;
  ctx.fillRect(0, 636, 1280, 84);
  ctx.strokeStyle = 'rgba(255,94,196,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 636); ctx.lineTo(1280, 636); ctx.stroke();
  ctx.strokeStyle = 'rgba(77,227,255,0.30)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 12; i++) {
    const tx = 80 + i * 100;
    const bx = 640 + (tx - 640) * 2.1;
    ctx.beginPath(); ctx.moveTo(tx, 636); ctx.lineTo(bx, 720); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,94,196,0.28)';
  for (const hy of [644, 656, 672, 694]) {
    ctx.beginPath(); ctx.moveTo(0, hy); ctx.lineTo(1280, hy); ctx.stroke();
  }
}

function drawTopBar(ctx, world) {
  const g = ctx.createLinearGradient(0, 0, 1280, 0);
  g.addColorStop(0, '#3d0a5e');
  g.addColorStop(0.5, '#8a1568');
  g.addColorStop(1, '#3d0a5e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1280, 64);
  ctx.fillStyle = NEON_PINK;
  ctx.fillRect(0, 62, 1280, 2);
  ctx.fillStyle = NEON_CYAN;
  ctx.fillRect(0, 64, 1280, 1);
  glowText(ctx, GAME_TITLE, 24, 26, 26, '#ffffff', NEON_PINK, '800');
  text(ctx, GAME_SUBTITLE, 24, 49, 13, '#ffd6ef', '400');
  // timer, big and central
  const frac = world.timeLeft / SHIFT_SECONDS;
  const tc = frac > 0.5 ? '#ffffff' : frac > 0.2 ? '#ffe9a8' : '#ffd166';
  glowText(ctx, '⏱ ' + fmtTime(world.timeLeft), 640, 26, 34, tc, tc === '#ffffff' ? NEON_CYAN : '#ff9d45', '800', 'center');
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  rr(ctx, 480, 48, 320, 8, 4); ctx.fill();
  ctx.fillStyle = tc;
  rr(ctx, 480, 48, Math.max(8, 320 * frac), 8, 4); ctx.fill();
  // coins and combo (the multiplier caps at x2, same as the world rules)
  text(ctx, '🪙 ' + world.coins + ' coins', 1256, 22, 22, '#ffffff', '800', 'right');
  const mult = Math.min(1 + (world.combo - 1) * 0.25, 2.0);
  const comboText = world.combo >= 2 ? 'COMBO x' + (Number.isInteger(mult) ? mult : mult.toFixed(2)) : 'score ' + world.score;
  text(ctx, comboText, 1256, 48, 14, world.combo >= 2 ? '#ffd166' : '#ffd6ef', '700', 'right');
  // customers who left, as three small neon scoops
  for (let i = 0; i < MAX_MISSED; i++) {
    ctx.fillStyle = i < world.missed ? '#ff5d73' : 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(940 + i * 26, 26, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(940 + i * 26, 26, 9, 0, Math.PI * 2); ctx.stroke();
  }
  text(ctx, 'customers left:', 930, 26, 12, '#ffd6ef', '400', 'right');
}

function drawOrderBoard(ctx, world, t) {
  world.orders.forEach((order, i) => {
    const r = ticketRect(i);
    const dish = DISHES[order.dish];
    const selected = i === world.selectedOrder;
    glassPanel(ctx, r.x, r.y, r.w, r.h, 12, selected ? NEON_CYAN : NEON_PINK);
    // a soft neon hairline inside, like a ticket stub
    ctx.strokeStyle = 'rgba(255,94,196,0.35)'; ctx.lineWidth = 1;
    rr(ctx, r.x + 5, r.y + 5, r.w - 10, r.h - 10, 8); ctx.stroke();
    drawFace(ctx, order.customer, r.x + 30, r.y + 30, 20);
    text(ctx, order.customer.name, r.x + 56, r.y + 22, 13, COLORS.ink, '700');
    text(ctx, dish.name, r.x + 56, r.y + 44, fitSize(ctx, dish.name, 186, 17, '800'), dish.color, '800');
    // ingredient dots: filled = on the plate, outline = still missing
    let ix = r.x + 56;
    for (const need of dish.needs) {
      const done = order.added.has(need);
      ctx.fillStyle = done ? INGREDIENTS[need].color : 'rgba(255,255,255,0.12)';
      ctx.beginPath(); ctx.arc(ix, r.y + 72, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(ix, r.y + 72, 11, 0, Math.PI * 2); ctx.stroke();
      if (done) {
        ctx.strokeStyle = '#37e08b'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(ix - 5, r.y + 72); ctx.lineTo(ix - 1, r.y + 76); ctx.lineTo(ix + 6, r.y + 66); ctx.stroke();
      }
      ix += 26;
    }
    drawPatienceBar(ctx, r.x + 14, r.y + 96, r.w - 28, Math.max(0, order.patience / order.maxPatience));
    if (selected) text(ctx, '▶ SELECTED', r.x + r.w - 12, r.y + 22, 11, NEON_CYAN, '800', 'right');
    if (order.golden) {
      // a golden ticket: a glowing gold frame around the whole ticket
      // plus a tag along the bottom, so it reads even when shrunk
      ctx.strokeStyle = 'rgba(255,209,102,0.35)'; ctx.lineWidth = 7;
      rr(ctx, r.x - 2, r.y - 2, r.w + 4, r.h + 4, 14); ctx.stroke();
      ctx.strokeStyle = '#f7b500'; ctx.lineWidth = 3;
      rr(ctx, r.x - 2, r.y - 2, r.w + 4, r.h + 4, 14); ctx.stroke();
      text(ctx, '★ GOLDEN x3', r.x + r.w / 2, r.y + 114, 11, '#ffd166', '800', 'center');
    }
  });
  for (let i = world.orders.length; i < 3; i++) {
    const r = ticketRect(i);
    glassPanel(ctx, r.x, r.y, r.w, r.h, 12, 'rgba(255,233,246,0.25)');
    text(ctx, 'empty table — next order coming…', r.x + r.w / 2, r.y + r.h / 2, 13, FAINT, '400', 'center');
  }
}

function drawStations(ctx, world, t) {
  for (const station of STATIONS) {
    const r = stationRect(station);
    glassPanel(ctx, r.x, r.y, r.w, r.h, 12, NEON_PINK);
    const cook = world.cooks[station.id];
    glowText(ctx, station.name, r.x + r.w / 2, r.y + 16, fitSize(ctx, station.name, 138, 16, '800'), '#ffffff', NEON_PINK, '800', 'center');
    text(ctx, station.label, r.x + r.w / 2, r.y + 36, 11, MUTED, '400', 'center');
    if (station.kind === 'wok') {
      // CRYO BAR: a frost chamber with three glowing tubs of scoops
      ctx.fillStyle = '#0a1a2e';
      rr(ctx, r.x + 20, r.y + 48, r.w - 40, 44, 8); ctx.fill();
      ctx.strokeStyle = NEON_CYAN; ctx.lineWidth = 2;
      rr(ctx, r.x + 20, r.y + 48, r.w - 40, 44, 8); ctx.stroke();
      const tubCols = ['#ff8fb8', '#fff3d6', '#7ec8a9'];
      tubCols.forEach((c, i) => {
        const tx = r.x + 40 + i * 35, ty = r.y + 70;
        const tub = ctx.createRadialGradient(tx - 4, ty - 5, 2, tx, ty, 13);
        tub.addColorStop(0, '#ffffff'); tub.addColorStop(0.5, c); tub.addColorStop(1, '#7a4a6e');
        ctx.fillStyle = tub;
        ctx.beginPath(); ctx.arc(tx, ty, 13, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(20,6,38,0.5)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(tx, ty, 13, 0, Math.PI * 2); ctx.stroke();
      });
      // a neon snowflake above the chamber
      ctx.strokeStyle = NEON_CYAN; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
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
      // HOLO OVEN: a dark box with a glowing window and a cake inside
      ctx.fillStyle = '#1c0a2e';
      rr(ctx, r.x + 20, r.y + 46, r.w - 40, 52, 8); ctx.fill();
      ctx.strokeStyle = NEON_PINK; ctx.lineWidth = 2;
      rr(ctx, r.x + 20, r.y + 46, r.w - 40, 52, 8); ctx.stroke();
      ctx.fillStyle = '#0d0518';
      rr(ctx, r.x + 32, r.y + 56, r.w - 64, 32, 5); ctx.fill();
      const glow = 0.6 + 0.4 * Math.sin(t * 3 + station.x);
      const og = ctx.createRadialGradient(r.x + r.w / 2, r.y + 80, 2, r.x + r.w / 2, r.y + 80, 30);
      og.addColorStop(0, 'rgba(255,157,69,' + glow + ')');
      og.addColorStop(1, 'rgba(255,157,69,0)');
      ctx.fillStyle = og;
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
      // TURBO BLENDER: a glass jar of pink shake with boba pearls
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.beginPath(); ctx.moveTo(r.x + 42, r.y + 46); ctx.lineTo(r.x + r.w - 42, r.y + 46); ctx.lineTo(r.x + r.w - 50, r.y + 96); ctx.lineTo(r.x + 50, r.y + 96); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = NEON_CYAN; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(r.x + 42, r.y + 46); ctx.lineTo(r.x + r.w - 42, r.y + 46); ctx.lineTo(r.x + r.w - 50, r.y + 96); ctx.lineTo(r.x + 50, r.y + 96); ctx.closePath(); ctx.stroke();
      const liq = ctx.createLinearGradient(0, r.y + 62, 0, r.y + 94);
      liq.addColorStop(0, '#ff9ecf'); liq.addColorStop(1, '#d1477f');
      ctx.fillStyle = liq;
      ctx.beginPath(); ctx.moveTo(r.x + 46, r.y + 62); ctx.lineTo(r.x + r.w - 46, r.y + 62); ctx.lineTo(r.x + r.w - 49, r.y + 94); ctx.lineTo(r.x + 49, r.y + 94); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2b0f1e';
      ctx.beginPath(); ctx.arc(r.x + r.w / 2 - 8, r.y + 88, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r.x + r.w / 2 + 8, r.y + 88, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(r.x + 48, r.y + 64, 4, 26);
      ctx.fillStyle = '#1c0a38';
      rr(ctx, r.x + 44, r.y + 96, r.w - 88, 12, 4); ctx.fill();
      ctx.fillStyle = NEON_CYAN;
      ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + 102, 3, 0, Math.PI * 2); ctx.fill();
      if (cook) drawIngredient(ctx, cook.ingredient, r.x + r.w / 2, r.y + 74, 30);
    }
    if (cook) {
      const frac = 1 - cook.left / cook.total;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      rr(ctx, r.x + 14, r.y + r.h - 16, r.w - 28, 8, 4); ctx.fill();
      const pg = ctx.createLinearGradient(r.x + 14, 0, r.x + r.w - 14, 0);
      pg.addColorStop(0, NEON_CYAN); pg.addColorStop(1, NEON_PINK);
      ctx.fillStyle = pg;
      rr(ctx, r.x + 14, r.y + r.h - 16, Math.max(6, (r.w - 28) * frac), 8, 4); ctx.fill();
    } else {
      text(ctx, 'tap to cook', r.x + r.w / 2, r.y + r.h - 12, 11, MUTED, '400', 'center');
    }
  }
}

function drawPlate(ctx, world, t) {
  const p = plateRect();
  // a chrome counter in perspective: wider at the front edge, so the
  // counter reads as a slab receding into the lab
  const cg = ctx.createLinearGradient(0, p.y + 150, 0, p.y + 246);
  cg.addColorStop(0, '#4a2a7a');
  cg.addColorStop(0.5, '#2a1250');
  cg.addColorStop(1, '#150826');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.moveTo(p.x - 40, p.y + 150);
  ctx.lineTo(p.x + p.w + 40, p.y + 150);
  ctx.lineTo(p.x + p.w + 70, p.y + 246);
  ctx.lineTo(p.x - 70, p.y + 246);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = NEON_PINK;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(p.x - 70, p.y + 246); ctx.lineTo(p.x + p.w + 70, p.y + 246); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(p.x - 40, p.y + 150); ctx.lineTo(p.x + p.w + 40, p.y + 150); ctx.stroke();
  // the plate's cast shadow on the counter, just below its rim
  softShadow(ctx, p.cx, p.cy + p.r + 6, p.r * 0.95, 12, 0.4);
  // the holo plate: a glass disc with a cyan neon rim and a gloss arc
  ctx.fillStyle = '#e9e4ff';
  ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2); ctx.fill();
  const pg = ctx.createRadialGradient(p.cx - 30, p.cy - 40, 10, p.cx, p.cy, p.r);
  pg.addColorStop(0, '#ffffff');
  pg.addColorStop(0.6, '#f4f0ff');
  pg.addColorStop(1, '#c9b8f2');
  ctx.fillStyle = pg;
  ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r - 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(77,227,255,0.25)';
  ctx.lineWidth = 9;
  ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = NEON_CYAN;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,94,196,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r - 14, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r - 22, Math.PI * 1.05, Math.PI * 1.45); ctx.stroke();

  const order = world.orders[world.selectedOrder];
  if (order) {
    const dish = DISHES[order.dish];
    text(ctx, dish.name, p.cx, p.y - 22, 20, dish.color, '800', 'center');
    const added = [...order.added];
    if (added.length === 0) {
      text(ctx, 'plate empty — tap ingredients below', p.cx, p.cy, 15, MUTED, '400', 'center');
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
    // holo bubbles rising when the plate is getting full
    if (added.length >= 2) {
      for (let i = 0; i < 3; i++) {
        const bx = p.cx - 40 + i * 40;
        const by = p.cy - 78 - Math.sin(t * 2 + i * 2.1) * 8;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(77,227,255,0.7)' : 'rgba(255,94,196,0.7)';
        ctx.beginPath(); ctx.arc(bx, by, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath(); ctx.arc(bx - 1.5, by - 1.5, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (plateIsComplete(order)) {
      ctx.strokeStyle = COLORS.good; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r + 8, 0, Math.PI * 2); ctx.stroke();
      glowText(ctx, 'READY TO SERVE!', p.cx, p.cy + p.r + 26, 16, COLORS.good, COLORS.good, '800', 'center');
    } else {
      const missing = [...order.needs].filter((n) => !order.added.has(n));
      text(ctx, 'missing: ' + missing.map((m) => INGREDIENTS[m].name).join(', '), p.cx, p.cy + p.r + 26, 14, '#ffb3d9', '700', 'center');
    }
  } else {
    text(ctx, 'no orders — wait a moment', p.cx, p.cy, 15, MUTED, '400', 'center');
  }
}

function drawServe(ctx, world, t) {
  const r = serveRect();
  const order = world.orders[world.selectedOrder];
  const ready = plateIsComplete(order);
  const pulse = ready ? 0.85 + 0.15 * Math.sin(t * 6) : 1;
  ctx.save();
  ctx.globalAlpha = pulse;
  bevelButton(ctx, r.x, r.y, r.w, r.h, 14, ready ? '#2fbf71' : '#5a4a68', ready ? '#1d7a48' : '#3a2f47');
  ctx.restore();
  glowText(ctx, 'SERVE', r.x + r.w / 2, r.y + 34, 30, '#ffffff', ready ? '#37e08b' : '#8a7a98', '800', 'center');
  text(ctx, ready ? 'plate complete — click / space' : 'finish the plate first', r.x + r.w / 2, r.y + 68, 13, 'rgba(255,255,255,0.85)', '400', 'center');
  // the ready dessert on the serving counter
  const s = serveReadyRect();
  glassPanel(ctx, s.x, s.y, s.w, s.h, 12, NEON_PINK);
  text(ctx, 'READY TRAY', s.x + s.w / 2, s.y + 18, 12, MUTED, '800', 'center');
  if (ready && order) {
    const dish = DISHES[order.dish];
    softShadow(ctx, s.x + 52, s.y + 106, 30, 7, 0.35);
    ctx.fillStyle = COLORS.plate;
    ctx.beginPath(); ctx.arc(s.x + 52, s.y + 74, 34, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = NEON_CYAN; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(s.x + 52, s.y + 74, 34, 0, Math.PI * 2); ctx.stroke();
    drawIngredient(ctx, order.dish === 'esteh' ? 'teh' : order.dish === 'sate' ? 'ayam' : order.dish === 'miegor' ? 'mie' : order.dish === 'cupcake' ? 'ayam' : order.dish === 'parfait' ? 'mie' : 'nasi', s.x + 52, s.y + 74, 40);
    text(ctx, dish.name, s.x + 100, s.y + 62, fitSize(ctx, dish.name, 126, 15, '800'), dish.color, '800');
    text(ctx, dish.coins + ' coins' + (world.rush ? ' x2' : ''), s.x + 100, s.y + (order.golden ? 82 : 86), 13, NEON_GOLD, '700');
    if (order.golden) text(ctx, '★ GOLDEN x3', s.x + 100, s.y + 102, 12, '#ffd166', '800');
    if (world.rush) text(ctx, 'RUSH HOUR!', s.x + 100, s.y + (order.golden ? 118 : 106), 12, '#ff9d45', '800');
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.arc(s.x + 52, s.y + 74, 34, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'no plate', s.x + 100, s.y + 66, 13, MUTED, '400');
    text(ctx, 'ready yet', s.x + 100, s.y + 88, 13, MUTED, '400');
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
    glassPanel(ctx, r.x, r.y, r.w, r.h, 10, added ? COLORS.good : needed ? NEON_PINK : 'rgba(255,233,246,0.25)');
    drawIngredient(ctx, id, r.x + 30, r.y + r.h / 2, 34);
    text(ctx, ing.name, r.x + 54, r.y + 20, 15, COLORS.ink, '700');
    text(ctx, '[' + (i + 1) + ']', r.x + r.w - 10, r.y + 20, 12, FAINT, '400', 'right');
    text(ctx, added ? '✓ added' : needed ? 'needed' : '—', r.x + 54, r.y + 40, 12, added ? COLORS.good : needed ? NEON_PINK : FAINT, '400');
  });
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
    ctx.strokeStyle = 'rgba(20,6,38,0.85)';
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
  glassPanel(ctx, 390, 210, 500, 52, 12, NEON_GOLD);
  glowText(ctx, world.flash, 640, 237, 22, '#ffe9a8', NEON_GOLD, '800', 'center');
  ctx.restore();
}

// ---- screens ----
function drawTitle(ctx, world, t) {
  drawBackground(ctx, t);
  ctx.fillStyle = 'rgba(10,4,24,0.5)';
  ctx.fillRect(0, 0, 1280, 720);
  drawHoloLollipop(ctx, 640, 96, 18);
  glowText(ctx, 'SUGAR RUSH', 640, 180, 76, '#ffffff', NEON_PINK, '800', 'center');
  glowText(ctx, '2099', 640, 258, 92, '#ffffff', NEON_CYAN, '800', 'center');
  text(ctx, GAME_SUBTITLE, 640, 318, 20, '#ffd6ef', '400', 'center');
  // a little preview plate of the six desserts, each on a glowing disc
  const dishes = MENU_ORDER;
  dishes.forEach((d, i) => {
    const x = 240 + i * 168;
    softShadow(ctx, x, 442, 46, 10, 0.4);
    const pg = ctx.createRadialGradient(x - 12, 383, 6, x, 395, 48);
    pg.addColorStop(0, '#ffffff');
    pg.addColorStop(0.6, '#f4f0ff');
    pg.addColorStop(1, '#c9b8f2');
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.arc(x, 395, 48, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(77,227,255,0.3)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(x, 395, 48, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = NEON_CYAN; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, 395, 48, 0, Math.PI * 2); ctx.stroke();
    const dish = DISHES[d];
    drawIngredient(ctx, dish.needs[0], x, 395, 52);
    text(ctx, dish.name, x, 463, fitSize(ctx, dish.name, 150, 15, '800'), dish.color, '800', 'center');
    text(ctx, dish.coins + ' coins', x, 485, 13, NEON_GOLD, '400', 'center');
  });
  text(ctx, 'Orders land on the top board. Tap ingredients to build, freeze / bake / blend,', 640, 508, 16, COLORS.ink, '400', 'center');
  text(ctx, 'then SERVE before customers run out of patience. Golden tickets pay 3x — fast serves earn PERFECT!', 640, 531, 16, COLORS.ink, '400', 'center');
  const b = startButtonRect();
  const pulse = 0.9 + 0.1 * Math.sin(t * 4);
  ctx.save(); ctx.globalAlpha = pulse;
  bevelButton(ctx, b.x, b.y, b.w, b.h, 14, '#2fbf71', '#1d7a48');
  ctx.restore();
  glowText(ctx, 'ENTER THE LAB', b.x + b.w / 2, b.y + b.h / 2, 30, '#ffffff', '#37e08b', '800', 'center');
  text(ctx, 'click the button or press Enter • mouse + keyboard (1-6, space, Tab)', 640, 628, 13, MUTED, '400', 'center');
}

function drawResults(ctx, world, t) {
  drawBackground(ctx, t);
  ctx.fillStyle = 'rgba(10,4,24,0.45)';
  ctx.fillRect(0, 0, 1280, 720);
  glowText(ctx, 'LAB CLOSED', 640, 180, 64, '#ffffff', NEON_PINK, '800', 'center');
  text(ctx, world.overReason, 640, 225, 18, COLORS.ink, '400', 'center');
  // stars
  const stars = STAR_COINS.filter((c) => world.coins >= c).length;
  for (let i = 0; i < 3; i++) {
    const x = 560 + i * 80;
    ctx.fillStyle = i < stars ? '#ff5ec4' : 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const ang = -Math.PI / 2 + (k * Math.PI) / 5;
      const rad = k % 2 === 0 ? 34 : 15;
      const px = x + Math.cos(ang) * rad, py = 260 + Math.sin(ang) * rad;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    if (i < stars) {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  glassPanel(ctx, 420, 300, 440, 250, 16, NEON_PINK);
  const rows = [
    ['Orders served', String(world.served)],
    ['Customers left angry', String(world.missed)],
    ['Best combo', world.bestCombo + ' in a row'],
    ['Perfect serves', String(world.perfectServes)],
    ['Golden tickets served', String(world.goldenServed)],
    ['Coins tonight', world.coins + ' coins'],
  ];
  rows.forEach(([label, value], i) => {
    const y = 320 + i * 40;
    text(ctx, label, 480, y, 20, COLORS.ink, '400');
    text(ctx, value, 800, y, 22, NEON_GOLD, '800', 'right');
  });
  const b = againButtonRect();
  bevelButton(ctx, b.x, b.y, b.w, b.h, 14, '#2fbf71', '#1d7a48');
  glowText(ctx, 'REBOOT THE LAB', b.x + b.w / 2, b.y + b.h / 2, 26, '#ffffff', '#37e08b', '800', 'center');
  text(ctx, 'click the button or press Enter', 640, 660, 13, MUTED, '400', 'center');
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
