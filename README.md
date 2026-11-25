# Sugar Rush Café

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/alpiw69/cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/alpiw69/cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A warm dessert-café game for the [Make the best cooking game](https://make.fun/bounty/best-cooking-game-20261125-0137) bounty on make.fun.

## The game

You run Sugar Rush Café, a small dessert café that smells of wood, brass and warm sugar — a real place, not a neon stage. Dusk glows through the window, jam jars line the shelves, plants lean over the counter, and the marble-topped plating table sits in the middle of a tiled isometric floor. Customers with names and little stories — Mia, Leo, Zoe, Max, Lily — order Cherry Sundaes and Boba Milkshakes from the ticket board, and you walk the floor to make them before their patience runs out.

You play one small chef in a pink cap. Click the floor or a station to walk there (or nudge with WASD / arrow keys), and the chef does the job on arrival — scoop at the SCOOP BAR, bake in the BRASS OVEN, blend at the SHAKE BAR, grab toppings from the front counter. Every dessert is two steps: cook it at a station, then take it to the FINISHING counter for its garnish before it can be served. When the plate is ready, ring the brass SERVE bell. Three walkaways and the café closes early; the last 30 seconds are RUSH HOUR — double coins. At 70 seconds the sun dips lower and GOLDEN HOUR begins: for 30 seconds one dish pays double.

- 6 desserts: Cherry Sundae, Strawberry Sundae, Fudge Brownie, Boba Milkshake, Vanilla Cupcake, Honey Parfait
- A real isometric kitchen: perspective tile floor, counters around the room, a moving chef you walk by hand (click-to-walk or WASD/arrows) — or click a station directly and the chef walks over for you
- Named customers with a line of story each ("Mia: 'My grandma built this café, you know.'")
- Two-step cooking: cook at a station, then garnish at the FINISHING counter before serving
- Golden tickets: a rare order (gold frame, ★ GOLDEN x3) worth 3x coins — and it can stack with the PERFECT bonus
- PERFECT serve: serving while patience is still at or above 85% pays +50% coins
- GOLDEN HOUR at 70 seconds: one dish pays double for 30 seconds, with the whole room glowing amber
- Orders, patience, combo multiplier, rush hour, win/lose shift of 150 seconds
- Mouse + keyboard (click to walk, bins 1–6, stations F/O/B, Tab to switch ticket, Space to serve, Enter to open)
- All art drawn in code on canvas in an isometric style — warm wood, marble, brass, a dusk window, steam and floating sprinkles — all sounds synthesized with WebAudio — no files loaded from the network

## Play it

```sh
node serve.ts
# open http://localhost:8080/index.html in desktop Chrome
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
- `game/src/world.js` — orders, cooking, serving, scoring, the chef, the clock
- `game/src/layout.js` — every clickable rectangle on the stage
- `game/src/input.js` — mouse + keyboard (click-to-walk included)
- `game/src/render.js` — all canvas drawing
- `game/src/audio.js` — synthesized sounds
- `game/src/shots.js` — deterministic screenshot scenes (`?shot=play|rush|start|end&seed=1`)
- `game/src/main.js` — boot and the game loop
- `screenshots/` — 4 real renders of the game's own code
