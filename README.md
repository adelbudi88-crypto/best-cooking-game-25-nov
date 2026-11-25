# Warung Kilat

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/adelbudi88-crypto/best-cooking-game-25-nov/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/adelbudi88-crypto/best-cooking-game-25-nov/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Warung Kilat** — dapur paling sibuk di kampung. Pesanan berdatangan ke papan order, kamu meracik bahan di wok dan panci, memasak sampai matang (jangan sampai gosong!), lalu mengantar hidangan sebelum kesabaran pelanggan habis. Enam resep Indonesia — Nasi Goreng, Mie Goreng, Gado-Gado, Soto Ayam, Ayam Geprek, Mie Kuah — kombo beruntun melipatgandakan cuan, dan tiap 5 hidangan level naik: pesanan makin cepat, resep baru terbuka. Satu shift 3 menit. Berapa banyak yang bisa kamu sajikan?

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no dependencies, no network: vanilla JavaScript + Canvas 2D, all art drawn in code, all sound synthesized live with WebAudio.

## How to play

1. Klik stasiun (**WOK** / **POT** / **PIRING**), lalu klik bahan di bawah (atau tekan **1-8**).
2. Kalau resep sudah lengkap, klik **MASAK** — angkat sebelum gosong, lalu **KE PIRING**.
3. Klik pesanan yang cocok di papan order (atau tekan **Spasi**) untuk mengantar.
4. Sajikan sebelum bar kesabaran habis. Kombo beruntun = bayaran berlipat.

Controls: **mouse** to cook and serve · **1-8** ingredients · **Space** serve · **P / Esc** pause · **M** mute · **R** restart.

## Structure

- `game/src/config.js` — ingredients, recipes, tuning, layout
- `game/src/world.js` — orders, cooking, scoring, combos, levels (pure logic)
- `game/src/render.js` — all canvas drawing: kitchen, tickets, stations, food
- `game/src/input.js` — mouse + keyboard to world actions
- `game/src/audio.js` — WebAudio synth sound effects
- `game/src/shots.js` — deterministic screenshot scenes (`?shot=start|play|rush|end`)
- `game/src/random.js` — seeded RNG
- `game/src/main.js` — frame loop, particles, event wiring

---

<sub>Entered on [make.fun](https://make.fun/?ref=hynfsjfx&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
