// random.js — one tiny seeded generator, so a screenshot URL with a seed
// always stages the exact same night. Normal play uses a time seed.

export function makeRng(seed) {
  let s = (seed >>> 0) || 1;
  return function next() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function pick(rng, list) {
  return list[Math.floor(rng() * list.length) % list.length];
}

export function range(rng, lo, hi) {
  return lo + rng() * (hi - lo);
}
