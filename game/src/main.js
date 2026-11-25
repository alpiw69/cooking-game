// main.js — boot and the one loop: the world advances in fixed 1/60 s steps,
// input is wired once, and the renderer paints what is there.
// ?seed=N fixes the night's randomness. ?shot=start|play|rush|end (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.

import { VIEW_W, VIEW_H } from './config.js';
import { newWorld, tick } from './world.js';
import { render } from './render.js';
import { attachInput } from './input.js';
import { makeSfx } from './audio.js';
import { stageShot } from './shots.js';

const STEP = 1 / 60;
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const ctx = canvas.getContext('2d');

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.style.width = Math.floor(VIEW_W * scale) + 'px';
  canvas.style.height = Math.floor(VIEW_H * scale) + 'px';
}

function runShot(name) {
  const world = stageShot(name, seed);
  const t = name === 'rush' ? 3.2 : name === 'play' ? 1.6 : 1.0;
  let painted = 0;
  function paint() {
    fitCanvas();
    render(ctx, world, t);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const world = newWorld(seed);
  const sfx = makeSfx();
  attachInput(canvas, world, sfx);
  let accumulator = 0;
  let last = performance.now();
  let announced = '';

  function announce(message) {
    if (message !== announced) {
      announced = message;
      status.textContent = message;
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    while (accumulator >= STEP) {
      tick(world, STEP);
      accumulator -= STEP;
    }
    fitCanvas();
    render(ctx, world, now / 1000);
    if (world.state === 'title') announce('Sugar Rush Café. Click Open the Café or press Enter to start.');
    else if (world.state === 'playing') announce('Playing. ' + Math.ceil(world.timeLeft) + ' seconds left, ' + world.coins + ' coins.');
    else announce('Café closed. ' + world.coins + ' coins, ' + world.served + ' orders served.');
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) accumulator = 0;
  });
  canvas.addEventListener('pointerdown', () => sfx.unlock(), { once: true });
  announce('Sugar Rush Café. Click Open the Café or press Enter to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
