# Warung Tengah Malam

![make.fun best-cooking-game-20261125-0137](https://img.shields.io/badge/make.fun-best--cooking--game--20261125--0137-pink)
![rank](https://img.shields.io/badge/rank-coming_soon-blue)
![reward](https://img.shields.io/badge/pool-%24250_USDC-green)

A midnight street-food stall game for the [Make the best cooking game](https://make.fun/bounty/best-cooking-game-20261125-0137) bounty on make.fun.

## The game

You run a warung kaki lima — an Indonesian street-food stall — open at midnight. Orders land on the board with a patience bar. Each dish is a little route through the kitchen: start the wok for rice or noodles, the charcoal grill for chicken, the pot for tea, while you tap the instant ingredient bins (egg, sweet soy, chilli, shallot, ice, sugar). When the plate is complete, hit SAJIKAN before the customer walks away. Three walkaways and the stall closes early; the last 30 seconds are JAM RAMAI — rush hour, double coins.

- 4 dishes: Nasi Goreng, Mie Goreng, Sate Ayam, Es Teh Manis
- Orders, patience, combo multiplier, rush hour, win/lose shift of 150 seconds
- Mouse + keyboard (bins 1–6, W/G/T stations, Tab to switch ticket, Space to serve)
- All art drawn in code on canvas, all sounds synthesized with WebAudio — no files loaded from the network

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
- `game/src/config.js` — dishes, ingredients, tuning, palette
- `game/src/random.js` — seeded random for deterministic screenshots
- `game/src/world.js` — orders, cooking, serving, scoring, the clock
- `game/src/layout.js` — every clickable rectangle on the stage
- `game/src/input.js` — mouse and keyboard
- `game/src/render.js` — all canvas drawing
- `game/src/audio.js` — synthesized sounds
- `game/src/shots.js` — deterministic screenshot scenes (`?shot=play|rush|start|end&seed=1`)
- `game/src/main.js` — boot and the game loop
- `screenshots/` — 4 real renders of the game's own code
