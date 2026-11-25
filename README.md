# Sugar Rush Parlor

![make.fun best-cooking-game-20261125-0137](https://img.shields.io/badge/make.fun-best--cooking--game--20261125--0137-pink)
![rank](https://img.shields.io/badge/rank-coming_soon-blue)
![reward](https://img.shields.io/badge/pool-%24250_USDC-green)

A pink dessert parlor game for the [Make the best cooking game](https://make.fun/bounty/best-cooking-game-20261125-0137) bounty on make.fun.

## The game

You run Sugar Rush Parlor — a pink dessert shop with a candy-striped awning, lollipops in the window, and a line of customers who all want something sweet. Orders land on the board with a patience bar. Each dessert is a little route through the parlor: scoop from the FREEZER, bake in the OVEN, blend in the BLENDER, while you tap the instant topping bins (sprinkles, choc sauce, cherry, wafer, ice, sugar). When the plate is complete, hit SERVE before the customer walks away. Three walkaways and the parlor closes early; the last 30 seconds are RUSH HOUR — double coins.

- 4 desserts: Rainbow Sundae, Berry Sundae, Choco Brownie, Strawberry Shake
- Orders, patience, combo multiplier, rush hour, win/lose shift of 150 seconds
- Mouse + keyboard (bins 1–6, stations F/O/B, Tab to switch ticket, Space to serve)
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
- `game/src/config.js` — desserts, ingredients, tuning, palette
- `game/src/random.js` — seeded random for deterministic screenshots
- `game/src/world.js` — orders, cooking, serving, scoring, the clock
- `game/src/layout.js` — every clickable rectangle on the stage
- `game/src/input.js` — mouse and keyboard
- `game/src/render.js` — all canvas drawing
- `game/src/audio.js` — synthesized sounds
- `game/src/shots.js` — deterministic screenshot scenes (`?shot=play|rush|start|end&seed=1`)
- `game/src/main.js` — boot and the game loop
- `screenshots/` — 4 real renders of the game's own code
