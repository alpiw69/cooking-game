# Dapur Kerajaan

![make.fun best-cooking-game-20261125-0137](https://img.shields.io/badge/make.fun-best--cooking--game--20261125--0137-pink)
![rank](https://img.shields.io/badge/rank-coming_soon-blue)
![reward](https://img.shields.io/badge/pool-%24250_USDC-green)

Game dapur istana untuk bounty [Make the best cooking game](https://make.fun/bounty/best-cooking-game-20261125-0137) di make.fun.

## Gamenya

Kamu yang menjalankan dapur istana — Dapur Kerajaan — memasak untuk raja dan tamu kerajaannya di bawah lampu gantung kristal. Pesanan masuk ke papan atas lengkap dengan bar kesabaran. Setiap hidangan itu rute kecil keliling dapur: nyalakan wok untuk nasi atau mie, arang untuk ayam, pot untuk teh, sambil mengetuk bin bahan instan (telur, kecap, cabai, bawang, es, gula). Kalau piring sudah lengkap, tekan SAJIKAN sebelum tamu pergi. Tiga tamu pulang marah dan dapur tutup lebih awal; 30 detik terakhir adalah JAM RAMAI — jam sibuk, koin dobel.

- 4 hidangan: Nasi Goreng Istana, Mie Goreng Bangsawan, Sate Ayam Kerajaan, Es Teh Permaisuri
- Pesanan, kesabaran, pengali combo, jam ramai, shift menang/kalah 150 detik
- Mouse + keyboard (bin 1–6, stasiun W/G/T, Tab untuk ganti tiket, Spasi untuk menyajikan)
- Semua gambar digambar dengan kode di canvas, semua suara dibuat dengan WebAudio — tidak ada file yang dimuat dari internet

## Cara main

```sh
node serve.ts
# buka http://localhost:8080 di desktop Chrome
```

## Penyerahan

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` menyalin `game/` dan `screenshots/` ke direktori output dan menulis `dossier.json` dengan `vendor/makefun-game.ts` yang disertakan.

## Susunan file

- `main.ts` — program penyerahan (Node 22)
- `vendor/makefun-game.ts` — library dossier dari kit, tidak diubah
- `game/index.html` — dibuka di desktop Chrome, langsung main
- `game/src/config.js` — hidangan, bahan, pengaturan, palet
- `game/src/random.js` — angka acak berbibit untuk screenshot yang deterministik
- `game/src/world.js` — pesanan, masak, sajikan, skor, jam
- `game/src/layout.js` — semua kotak yang bisa diklik di panggung
- `game/src/input.js` — mouse dan keyboard
- `game/src/render.js` — semua gambar canvas
- `game/src/audio.js` — suara sintetis
- `game/src/shots.js` — adegan screenshot deterministik (`?shot=play|rush|start|end&seed=1`)
- `game/src/main.js` — boot dan game loop
- `screenshots/` — 4 render asli dari kode game sendiri
