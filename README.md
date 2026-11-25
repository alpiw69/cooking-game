# Sugar Rush 2099

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/alpiw69/cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/alpiw69/cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A neon dessert lab game for the [Make the best cooking game](https://make.fun/bounty/best-cooking-game-20261125-0137) bounty on make.fun.

## The game

It is the year 2099. You run Sugar Rush 2099, a neon dessert lab above a glowing city — pink neon, cyan holograms, chrome counters, and a glossy floor that reflects the lights. Customers in neon visors order Galaxy Sundaes and Boba Milkshakes from a holo board, and you build them before their patience runs out. Orders land on the board with a patience bar. Each dessert is a little route through the lab: scoop at the CRYO BAR, bake in the HOLO OVEN, blend in the TURBO BLENDER, while you tap the instant topping bins (sprinkles, choc sauce, cherry, wafer, ice, sugar). When the plate is complete, hit SERVE before the customer walks away. Three walkaways and the lab closes early; the last 30 seconds are RUSH HOUR — double coins.

- 6 desserts: Galaxy Sundae, Neon Berry Sundae, Cosmo Brownie, Boba Milkshake, Neon Cupcake, Holo Parfait
- Orders, patience, combo multiplier, rush hour, win/lose shift of 150 seconds
- Golden tickets: a rare order (gold frame, ★ GOLDEN x3) worth 3x coins — and it can stack with the PERFECT bonus
- PERFECT serve: serving while patience is still at or above 85% pays +50% coins
- Mouse + keyboard (bins 1–6, stations F/O/B, Tab to switch ticket, Space to serve)
- All art drawn in code on canvas in a fake-3D style — neon glow, drop shadows, beveled buttons, a perspective floor — all sounds synthesized with WebAudio — no files loaded from the network

## Play it

```sh
node serve.ts
# open http://localhost:8080 in desktop Chrome
```

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored `vendor/makefun-game.ts`.

## Layout

- `main.ts` — the hand-in program (Node 22)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `game/index.html` — opens in desktop Chrome and plays
- `game/src/config.js` — desserts, ingredients, tuning, palette
- `game/src/random.js` — seeded random for deterministic screenshots
- `game/src/world.js` — orders, cooking, serving, scoring, the clock
- `game/src/layout.js` — every clickable rectangle on the stage
- `game/src/input.js` — mouse + keyboard
- `game/src/render.js` — all canvas drawing
- `game/src/audio.js` — synthesized sounds
- `game/src/shots.js` — deterministic screenshot scenes (`?shot=play|rush|start|end&seed=1`)
- `game/src/main.js` — boot and the game loop
- `screenshots/` — 4 real renders of the game's own code
