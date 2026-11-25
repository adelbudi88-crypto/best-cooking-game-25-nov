// Warung Kilat — main. One job: wire the canvas, the loop and the events
// together. Owns the frame loop, particles, audio triggers and the ?shot=
// screenshot mode; the rules live in world.js, the drawing in render.js.

import { LAYOUT, VIEW, binRect } from './config.js';
import { INGREDIENTS } from './config.js';
import {
  playBuzz, playChop, playClick, playCombo, playDing, playDone, playLevelUp,
  playTick, setSizzle, unlockAudio,
} from './audio.js';
import { handleClick, handleKey } from './input.js';
import { drawGame } from './render.js';
import { createShotWorld, stageShot } from './shots.js';
import { createWorld, takeEvents, update } from './world.js';

const BEST_KEY = 'warungKilatBest';
const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const world = shotName ? createShotWorld() : createWorld(Date.now() % 2147483647);
try {
  world.bestScore = Number(window.localStorage.getItem(BEST_KEY) ?? 0) || 0;
} catch {
  world.bestScore = 0;
}

const fx = { particles: [], floats: [] };

function stationCenter(id) {
  const s = LAYOUT.stations[id];
  return { x: s.x + s.w / 2, y: s.y + 108 };
}

function binCenter(ingId) {
  const i = INGREDIENTS.findIndex((item) => item.id === ingId);
  const r = binRect(Math.max(0, i));
  return { x: r.x + r.w / 2, y: r.y + 55 };
}

function addFloat(x, y, text, color) {
  fx.floats.push({ x, y, text, color, life: 1.4, maxLife: 1.4 });
}

function handleEvents(events) {
  let cooking = world.wok.state === 'cooking' || world.pot.state === 'cooking';
  for (const ev of events) {
    if (ev.type === 'add') {
      playChop();
      const from = binCenter(ev.ing);
      const to = stationCenter(ev.station);
      fx.particles.push({ kind: 'fly', x0: from.x, y0: from.y, x1: to.x, y1: to.y, ing: ev.ing, life: 0.45, maxLife: 0.45 });
    } else if (ev.type === 'select' || ev.type === 'toplate') {
      playClick();
    } else if (ev.type === 'cookstart') {
      playClick();
    } else if (ev.type === 'cookdone') {
      playDone();
    } else if (ev.type === 'serve') {
      if (ev.combo >= 2) playCombo(ev.combo);
      else playDing();
      const p = stationCenter('plate');
      addFloat(p.x, p.y - 70, `+Rp${ev.amount}`, '#2f7d32');
      for (let i = 0; i < 14; i += 1) {
        fx.particles.push({
          kind: 'spark', x: p.x + (Math.random() - 0.5) * 160, y: p.y + (Math.random() - 0.5) * 60,
          size: 3 + Math.random() * 4, life: 0.6, maxLife: 0.6,
        });
      }
    } else if (ev.type === 'mistake' || ev.type === 'burnt' || ev.type === 'expired') {
      playBuzz();
      if (ev.type === 'mistake') addFloat(640, 300, `-${ev.penalty} poin`, '#c0392b');
      if (ev.type === 'expired') addFloat(640, 300, 'Pesanan hangus!', '#c0392b');
      if (ev.type === 'burnt') addFloat(640, 300, 'Gosong!', '#c0392b');
    } else if (ev.type === 'levelup') {
      playLevelUp();
      addFloat(640, 330, `LEVEL ${ev.level}! Pesanan makin cepat!`, '#14453d');
    } else if (ev.type === 'tick' || ev.type === 'orderwarn') {
      playTick();
    } else if (ev.type === 'gameover') {
      setSizzle(false);
      try {
        const best = Math.max(world.bestScore, world.score);
        window.localStorage.setItem(BEST_KEY, String(best));
        world.bestScore = best;
      } catch { /* storage unavailable */ }
    }
  }
  cooking = world.wok.state === 'cooking' || world.pot.state === 'cooking';
  if (!shotName) setSizzle(cooking && world.screen === 'play');
}

function updateFx(dt) {
  for (const p of fx.particles) {
    p.life -= dt;
    if (p.kind === 'steam') {
      p.y -= 34 * dt;
      p.x += Math.sin((p.maxLife - p.life) * 6 + p.seed) * 12 * dt;
    }
  }
  fx.particles = fx.particles.filter((p) => p.life > 0);
  fx.floats = fx.floats.filter((f) => (f.life -= dt) > 0);
  // Fresh steam over anything cooking.
  if (world.screen === 'play' && Math.random() < 0.5) {
    for (const id of ['wok', 'pot']) {
      if (world[id].state === 'cooking' || world[id].state === 'done') {
        const c = stationCenter(id);
        fx.particles.push({
          kind: 'steam', x: c.x + (Math.random() - 0.5) * 90, y: c.y - 10,
          size: 7 + Math.random() * 8, life: 1.1, maxLife: 1.1, seed: Math.random() * 6,
        });
      }
    }
  }
}

function fitCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = VIEW.width * dpr;
  canvas.height = VIEW.height * dpr;
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  canvas.style.width = `${Math.floor(VIEW.width * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW.height * scale)}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function toLogical(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEW.width,
    y: ((event.clientY - rect.top) / rect.height) * VIEW.height,
  };
}

canvas.addEventListener('pointerdown', (event) => {
  unlockAudio();
  const p = toLogical(event);
  handleClick(world, p.x, p.y);
});

window.addEventListener('keydown', (event) => {
  if ([' ', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
  unlockAudio();
  handleKey(world, event.key);
});

window.addEventListener('resize', fitCanvas);

let last = performance.now();
let statusTimer = 0;

function loop(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  if (!shotName) {
    update(world, dt);
    handleEvents(takeEvents(world));
    updateFx(dt);
    statusTimer += dt;
    if (statusTimer > 0.5) {
      statusTimer = 0;
      statusEl.textContent = world.screen === 'play'
        ? `Skor ${world.score}, ${world.served} hidangan, sisa waktu ${Math.ceil(world.timeLeft)} detik`
        : world.screen;
    }
  }
  drawGame(ctx, world, fx, now);
  if (!shotName) requestAnimationFrame(loop);
}

fitCanvas();
if (shotName) {
  stageShot(shotName, world);
  drawGame(ctx, world, fx, performance.now());
  window.__warung = { world, fx, shot: shotName };
  window.__shotReady = true;
} else {
  window.__warung = { world, fx };
  requestAnimationFrame(loop);
}
