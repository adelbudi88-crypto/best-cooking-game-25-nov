// Warung Kilat — render. One job: draw everything on the canvas from the
// world state. No logic, no sound, no DOM — the same draw calls paint real
// play and the deterministic screenshot scenes.

import {
  BUTTONS, ING_BY_ID, INGREDIENTS, LAYOUT, RECIPE_BY_ID, RECIPES,
  binRect, pointInRect, stationButtonRect, ticketRect,
} from './config.js';
import { comboMultiplier } from './world.js';

const CREAM = '#f7ead2';
const PAPER = '#fff8e7';
const WOOD = '#9c6b3f';
const WOOD_DARK = '#7a4e2a';
const TEAL = '#14453d';
const TEAL_LIGHT = '#1f6b5c';
const RED = '#c0392b';
const AMBER = '#f2a541';

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function fmtCoins(n) {
  return n.toLocaleString('en-US');
}

// ---- ingredient icons (drawn at centre x,y, size s = diameter) ----
export function drawIngredient(ctx, id, x, y, s) {
  const r = s / 2;
  ctx.save();
  ctx.translate(x, y);
  if (id === 'nasi') {
    ctx.fillStyle = '#fff7e0';
    ctx.beginPath(); ctx.ellipse(0, r * 0.25, r * 0.95, r * 0.6, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#e8d9a8';
    for (const [dx, dy] of [[-0.4, 0.1], [0.1, -0.1], [0.45, 0.15], [-0.05, 0.25]]) {
      ctx.beginPath(); ctx.arc(dx * r, dy * r, r * 0.09, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'mie') {
    ctx.strokeStyle = '#f2b705'; ctx.lineWidth = r * 0.22; ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.arc(0, i * r * 0.35, r * 0.55, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
  } else if (id === 'telur') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.95, r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2a541';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d98a1d';
    ctx.beginPath(); ctx.arc(r * 0.12, -r * 0.1, r * 0.14, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'ayam') {
    ctx.strokeStyle = '#f5e6c8'; ctx.lineWidth = r * 0.22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(r * 0.45, r * 0.45); ctx.lineTo(r * 0.8, r * 0.8); ctx.stroke();
    ctx.fillStyle = '#f5e6c8';
    ctx.beginPath(); ctx.arc(r * 0.86, r * 0.7, r * 0.16, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.7, r * 0.88, r * 0.16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c96f3f';
    ctx.beginPath(); ctx.ellipse(-r * 0.1, -r * 0.1, r * 0.62, r * 0.5, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a34d28';
    ctx.beginPath(); ctx.ellipse(-r * 0.15, -r * 0.18, r * 0.3, r * 0.2, -0.5, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'sayur') {
    ctx.fillStyle = '#4e9b4e';
    for (const [dx, dy, rot] of [[-0.35, 0.1, -0.6], [0, -0.25, 0], [0.35, 0.15, 0.6]]) {
      ctx.save(); ctx.translate(dx * r, dy * r); ctx.rotate(rot);
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.42, r * 0.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#7dc383';
    ctx.beginPath(); ctx.arc(0, -r * 0.3, r * 0.14, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'kecap') {
    ctx.fillStyle = '#3a2318';
    rr(ctx, -r * 0.32, -r * 0.55, r * 0.64, r * 1.05, r * 0.16); ctx.fill();
    ctx.fillStyle = '#5a3a28';
    rr(ctx, -r * 0.2, -r * 0.85, r * 0.4, r * 0.35, r * 0.08); ctx.fill();
    ctx.fillStyle = '#e8452c';
    rr(ctx, -r * 0.32, -r * 0.1, r * 0.64, r * 0.4, r * 0.06); ctx.fill();
    ctx.fillStyle = '#fff';
    text(ctx, 'K', 0, r * 0.1, r * 0.4, '#fff');
  } else if (id === 'cabai') {
    ctx.strokeStyle = '#e8452c'; ctx.lineWidth = r * 0.34; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(r * 0.1, -r * 0.1, r * 0.6, Math.PI * 0.15, Math.PI * 1.05); ctx.stroke();
    ctx.strokeStyle = '#3e7d44'; ctx.lineWidth = r * 0.16;
    ctx.beginPath(); ctx.moveTo(r * 0.62, -r * 0.62); ctx.lineTo(r * 0.85, -r * 0.85); ctx.stroke();
  } else if (id === 'kuah') {
    ctx.fillStyle = '#d98a1d';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.8, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#f2b25c';
    ctx.beginPath(); ctx.ellipse(0, -r * 0.05, r * 0.8, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b97a1e'; ctx.lineWidth = r * 0.08;
    ctx.beginPath(); ctx.arc(0, -r * 0.05, r * 0.45, 0.3, Math.PI - 0.3); ctx.stroke();
  }
  ctx.restore();
}

// ---- finished dishes (drawn at centre x,y, size s = width) ----
export function drawDish(ctx, recipeId, x, y, s) {
  const r = s / 2;
  ctx.save();
  ctx.translate(x, y);
  // plate or bowl under the food
  if (recipeId === 'soto' || recipeId === 'miekuah') {
    ctx.fillStyle = '#2f5d8a';
    ctx.beginPath(); ctx.arc(0, r * 0.15, r * 0.9, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#f2b25c';
    ctx.beginPath(); ctx.ellipse(0, r * 0.1, r * 0.82, r * 0.34, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(0, r * 0.2, r * 0.95, r * 0.42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d9c48a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, r * 0.2, r * 0.95, r * 0.42, 0, 0, Math.PI * 2); ctx.stroke();
  }
  if (recipeId === 'nasgor') {
    ctx.fillStyle = '#e08a3c';
    ctx.beginPath(); ctx.ellipse(0, -r * 0.1, r * 0.62, r * 0.42, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#c96f3f';
    for (const [dx, dy] of [[-0.3, -0.2], [0.2, -0.3], [0.35, -0.05]]) {
      ctx.beginPath(); ctx.arc(dx * r, dy * r, r * 0.08, 0, Math.PI * 2); ctx.fill();
    }
    drawIngredient(ctx, 'telur', r * 0.15, -r * 0.35, r * 0.55);
    drawIngredient(ctx, 'sayur', -r * 0.35, -r * 0.3, r * 0.4);
  } else if (recipeId === 'miegor') {
    ctx.strokeStyle = '#f2b705'; ctx.lineWidth = r * 0.16; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath(); ctx.arc(0, -r * 0.1, r * (0.55 - i * 0.14), Math.PI * 0.15, Math.PI * 1.7); ctx.stroke();
    }
    drawIngredient(ctx, 'telur', r * 0.2, -r * 0.3, r * 0.5);
    drawIngredient(ctx, 'sayur', -r * 0.35, -r * 0.25, r * 0.4);
  } else if (recipeId === 'gado') {
    ctx.fillStyle = '#7dc383';
    ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.1, r * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8a06a';
    ctx.beginPath(); ctx.arc(r * 0.25, -r * 0.15, r * 0.24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath(); ctx.arc(0, -r * 0.3, r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a5a33'; ctx.lineWidth = r * 0.1; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-r * 0.5, r * 0.05); ctx.lineTo(-r * 0.15, -r * 0.05); ctx.lineTo(r * 0.2, r * 0.08); ctx.lineTo(r * 0.5, -r * 0.02); ctx.stroke();
  } else if (recipeId === 'soto') {
    ctx.fillStyle = '#e8a06a';
    for (const [dx, dy] of [[-0.3, 0], [0.1, 0.08], [0.35, -0.02]]) {
      ctx.beginPath(); ctx.ellipse(dx * r, dy * r, r * 0.2, r * 0.09, 0.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#fff7e0';
    ctx.beginPath(); ctx.ellipse(-r * 0.1, r * 0.12, r * 0.3, r * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    drawIngredient(ctx, 'sayur', r * 0.45, -r * 0.2, r * 0.36);
  } else if (recipeId === 'geprek') {
    ctx.fillStyle = '#fff7e0';
    ctx.beginPath(); ctx.ellipse(-r * 0.25, -r * 0.05, r * 0.5, r * 0.36, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#c96f3f';
    ctx.beginPath(); ctx.ellipse(r * 0.3, -r * 0.15, r * 0.42, r * 0.32, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8452c';
    for (const [dx, dy] of [[0.15, -0.35], [0.4, -0.3], [0.3, -0.42]]) {
      ctx.beginPath(); ctx.arc(dx * r, dy * r, r * 0.1, 0, Math.PI * 2); ctx.fill();
    }
  } else if (recipeId === 'miekuah') {
    ctx.strokeStyle = '#f2b705'; ctx.lineWidth = r * 0.13; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath(); ctx.arc(-r * 0.1, r * 0.05, r * (0.5 - i * 0.12), Math.PI * 0.2, Math.PI * 1.6); ctx.stroke();
    }
    ctx.fillStyle = '#e8a06a';
    ctx.beginPath(); ctx.ellipse(r * 0.3, -r * 0.05, r * 0.22, r * 0.1, 0.4, 0, Math.PI * 2); ctx.fill();
    drawIngredient(ctx, 'sayur', -r * 0.4, -r * 0.2, r * 0.36);
  }
  ctx.restore();
}

function drawPatienceBar(ctx, x, y, w, frac) {
  ctx.fillStyle = '#e5d5b3';
  rr(ctx, x, y, w, 10, 5); ctx.fill();
  const color = frac > 0.5 ? '#3e9b4f' : frac > 0.25 ? AMBER : RED;
  ctx.fillStyle = color;
  if (frac > 0.01) { rr(ctx, x, y, Math.max(10, w * frac), 10, 5); ctx.fill(); }
}

function drawHud(ctx, world, now) {
  const h = LAYOUT.hud;
  ctx.fillStyle = TEAL;
  ctx.fillRect(h.x, h.y, h.w, h.h);
  ctx.fillStyle = TEAL_LIGHT;
  ctx.fillRect(h.x, h.y + h.h - 4, h.w, 4);
  text(ctx, 'WARUNG KILAT', 20, 30, 24, '#ffe9a8');
  // coins
  ctx.fillStyle = '#f2b705';
  ctx.beginPath(); ctx.arc(268, 28, 12, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#a87c00'; ctx.lineWidth = 2; ctx.stroke();
  text(ctx, 'Rp', 268, 28, 11, '#7a5200', 'bold', 'center');
  text(ctx, fmtCoins(world.score), 286, 29, 22, '#ffffff');
  // combo badge
  if (world.combo >= 2) {
    const pulse = 1 + Math.sin(now / 130) * 0.04;
    ctx.save();
    ctx.translate(430, 28);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#e8452c';
    rr(ctx, -52, -17, 104, 34, 17); ctx.fill();
    text(ctx, `KOMBO x${comboMultiplier(world.combo).toFixed(2).replace(/\.?0+$/, '')}`, 0, 1, 16, '#fff', 'bold', 'center');
    ctx.restore();
  }
  // shift timer, centre
  const low = world.timeLeft <= 30 && world.screen === 'play';
  const timerColor = low ? (Math.sin(now / 120) > 0 ? '#ff6b5e' : '#ffffff') : '#ffffff';
  text(ctx, 'SHIFT', 640, 16, 12, '#9fd8c9', 'bold', 'center');
  text(ctx, fmtTime(world.timeLeft), 640, 38, 28, timerColor, 'bold', 'center');
  // level
  text(ctx, `LEVEL ${world.level}`, 800, 29, 20, '#ffe9a8');
  text(ctx, `Saji: ${world.served}`, 920, 29, 16, '#cfe8dd');
  // pause + mute buttons (drawn shapes, no font glyphs)
  const pb = BUTTONS.pause;
  ctx.fillStyle = '#0d332c';
  rr(ctx, pb.x, pb.y, pb.w, pb.h, 8); ctx.fill();
  ctx.strokeStyle = '#3f8a76'; ctx.lineWidth = 1.5; rr(ctx, pb.x, pb.y, pb.w, pb.h, 8); ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  ctx.fillRect(pb.x + 19, pb.y + 12, 6, 16);
  ctx.fillRect(pb.x + 31, pb.y + 12, 6, 16);
  const mb = BUTTONS.mute;
  ctx.fillStyle = '#0d332c';
  rr(ctx, mb.x, mb.y, mb.w, mb.h, 8); ctx.fill();
  ctx.strokeStyle = '#3f8a76'; ctx.lineWidth = 1.5; rr(ctx, mb.x, mb.y, mb.w, mb.h, 8); ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.moveTo(mb.x + 14, mb.y + 16); ctx.lineTo(mb.x + 22, mb.y + 16); ctx.lineTo(mb.x + 30, mb.y + 10);
  ctx.lineTo(mb.x + 30, mb.y + 30); ctx.lineTo(mb.x + 22, mb.y + 24); ctx.lineTo(mb.x + 14, mb.y + 24);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(mb.x + 32, mb.y + 20, 6, -0.9, 0.9); ctx.stroke();
  ctx.beginPath(); ctx.arc(mb.x + 32, mb.y + 20, 10, -0.9, 0.9); ctx.stroke();
  if (world.bestScore > 0) text(ctx, `Rekor: ${fmtCoins(world.bestScore)}`, 1080, 29, 14, '#9fd8c9', 'bold', 'right');
}

function drawOrders(ctx, world, now) {
  world.orders.forEach((order, i) => {
    const r = ticketRect(i);
    const recipe = RECIPE_BY_ID[order.recipeId];
    const frac = Math.max(0, order.patience / order.maxPatience);
    const urgent = frac <= 0.25;
    ctx.fillStyle = PAPER;
    rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
    ctx.strokeStyle = urgent ? (Math.sin(now / 120) > 0 ? RED : '#e8a06a') : '#d9c48a';
    ctx.lineWidth = urgent ? 3 : 2;
    rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.stroke();
    drawDish(ctx, recipe.id, r.x + 42, r.y + 44, 62);
    text(ctx, recipe.name, r.x + 82, r.y + 26, 18, '#3a2318');
    text(ctx, `Rp${recipe.price}`, r.x + 82, r.y + 50, 14, '#7a4e2a');
    recipe.needs.forEach((ing, j) => drawIngredient(ctx, ing, r.x + 96 + j * 30, r.y + 76, 24));
    if (recipe.extra) {
      const ex = r.x + 96 + recipe.needs.length * 30;
      text(ctx, '+', ex + 2, r.y + 76, 16, '#3e7d44', 'bold', 'center');
      drawIngredient(ctx, recipe.extra, ex + 20, r.y + 76, 24);
    }
    drawPatienceBar(ctx, r.x + 14, r.y + r.h - 20, r.w - 28, frac);
    text(ctx, `${Math.ceil(order.patience)} dtk`, r.x + r.w - 14, r.y + r.h - 34, 12, urgent ? RED : '#7a4e2a', 'bold', 'right');
  });
  for (let i = world.orders.length; i < 4; i += 1) {
    const r = ticketRect(i);
    ctx.fillStyle = 'rgba(122, 78, 42, 0.12)';
    rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(122, 78, 42, 0.35)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1.5;
    rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'Menunggu pesanan…', r.x + r.w / 2, r.y + r.h / 2, 14, '#8a6a45', 'bold', 'center');
  }
}

function stationStatus(station, id) {
  if (station.state === 'empty') return id === 'plate' ? 'Piring kosong' : 'Pilih bahan di bawah';
  if (station.state === 'ruined') return 'Campuran salah! Buang!';
  if (station.state === 'burnt') return 'GOSONG! Buang!';
  if (station.state === 'filling') {
    const dish = station.dish;
    return dish ? 'Siap dimasak' : `${station.contents.length} bahan — lengkapi resep`;
  }
  if (station.state === 'cooking') return `Memasak… ${Math.round(station.progress * 100)}%`;
  if (station.state === 'done') return id === 'plate' ? 'SIAP DIANTAR!' : 'Matang! Pindah ke piring';
  return '';
}

function drawStationButton(ctx, rect, label, enabled, accent) {
  ctx.fillStyle = enabled ? accent : '#cbb896';
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 8); ctx.fill();
  ctx.fillStyle = enabled ? '#fff' : '#8a7a5a';
  text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, 14, enabled ? '#fff' : '#8a7a5a', 'bold', 'center');
}

function drawStation(ctx, world, id, now) {
  const s = LAYOUT.stations[id];
  const station = world[id];
  const selected = world.selected === id;
  ctx.fillStyle = WOOD;
  rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.fill();
  ctx.fillStyle = WOOD_DARK;
  rr(ctx, s.x, s.y + s.h - 52, s.w, 52, 12); ctx.fill();
  ctx.strokeStyle = selected ? '#ffd94d' : '#6b4423';
  ctx.lineWidth = selected ? 4 : 2;
  rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.stroke();
  const titles = { wok: 'WOK — Tumis', pot: 'POT — Rebus', plate: 'PIRING SAJI' };
  text(ctx, titles[id], s.x + 16, s.y + 22, 18, '#ffe9a8');
  if (selected) text(ctx, '● DIPILIH', s.x + s.w - 16, s.y + 22, 12, '#ffd94d', 'bold', 'right');

  const cx = s.x + s.w / 2;
  const cy = s.y + 108;
  if (id === 'wok') {
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath(); ctx.ellipse(cx, cy, 118, 52, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3d3d3d';
    ctx.beginPath(); ctx.ellipse(cx, cy - 6, 104, 42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a5a33'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(cx - 118, cy - 8); ctx.lineTo(cx - 148, cy - 26); ctx.stroke();
  } else if (id === 'pot') {
    ctx.fillStyle = '#5a6b7a';
    rr(ctx, cx - 108, cy - 52, 216, 104, 18); ctx.fill();
    ctx.fillStyle = '#7d93a5';
    rr(ctx, cx - 108, cy - 52, 216, 26, 12); ctx.fill();
    ctx.fillStyle = '#f2b25c';
    ctx.beginPath(); ctx.ellipse(cx, cy - 34, 92, 16, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(cx, cy, 128, 54, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d9c48a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(cx, cy, 128, 54, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, cy, 92, 36, 0, 0, Math.PI * 2); ctx.stroke();
  }
  // contents
  if (station.state === 'burnt') {
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath(); ctx.ellipse(cx, cy - 6, 84, 30, 0, 0, Math.PI * 2); ctx.fill();
    text(ctx, '✕', cx, cy - 8, 34, '#5a5a5a', 'bold', 'center');
  } else if (station.state === 'done' && station.dish) {
    drawDish(ctx, station.dish, cx, cy - 6, 120);
  } else {
    station.contents.forEach((ing, i) => {
      const n = station.contents.length;
      const ox = (i - (n - 1) / 2) * 44;
      drawIngredient(ctx, ing, cx + ox, cy - 4, 40);
    });
  }
  // cooking progress (percent lives on the bar; no separate status line)
  if (station.state === 'cooking') {
    ctx.fillStyle = '#e5d5b3';
    rr(ctx, cx - 110, cy + 62, 220, 12, 6); ctx.fill();
    ctx.fillStyle = '#e8452c';
    rr(ctx, cx - 110, cy + 62, 220 * Math.min(1, station.progress), 12, 6); ctx.fill();
    text(ctx, `${Math.round(station.progress * 100)}%`, cx, cy + 68, 12, '#fff', 'bold', 'center');
  }
  if (station.state !== 'cooking') {
    const status = stationStatus(station, id);
    const statusColor = station.state === 'done' ? '#2f7d32' : station.state === 'ruined' || station.state === 'burnt' ? RED : '#ffe9a8';
    text(ctx, status, cx, s.y + s.h - 62, 15, statusColor, 'bold', 'center');
  }
  // buttons
  if (id === 'plate') {
    drawStationButton(ctx, stationButtonRect(id, 'trash'), 'BUANG', station.state !== 'empty', '#8a5a33');
  } else {
    const canCookNow = station.state === 'filling' && station.contents.length >= 2;
    drawStationButton(ctx, stationButtonRect(id, 'cook'), 'MASAK', canCookNow, '#c0392b');
    drawStationButton(ctx, stationButtonRect(id, 'toPlate'), 'KE PIRING →', station.state === 'done', '#2f7d32');
    drawStationButton(ctx, stationButtonRect(id, 'trash'), 'BUANG', station.state !== 'empty', '#8a5a33');
  }
}

function drawRecipes(ctx, world) {
  const r = LAYOUT.recipes;
  ctx.fillStyle = 'rgba(20, 69, 61, 0.92)';
  rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
  text(ctx, 'RESEP', r.x + 14, r.y + r.h / 2, 15, '#ffe9a8');
  const chipW = 192;
  RECIPES.forEach((recipe, i) => {
    const x = r.x + 92 + i * (chipW + 8);
    const locked = (recipe.level ?? 1) > world.level;
    ctx.fillStyle = locked ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.14)';
    rr(ctx, x, r.y + 8, chipW, r.h - 16, 8); ctx.fill();
    if (locked) {
      text(ctx, `Lv${recipe.level} — ${recipe.name}`, x + 10, r.y + 22, 13, '#9fd8c9');
      text(ctx, 'Belum terbuka', x + 10, r.y + 42, 12, '#7fb5a5');
      return;
    }
    text(ctx, recipe.name, x + 10, r.y + 20, 14, '#fff');
    recipe.needs.forEach((ing, j) => drawIngredient(ctx, ing, x + 22 + j * 26, r.y + 42, 20));
    text(ctx, `Rp${recipe.price}`, x + chipW - 10, r.y + 42, 13, '#ffe9a8', 'bold', 'right');
    text(ctx, recipe.station === 'wok' ? 'WOK' : recipe.station === 'pot' ? 'POT' : 'PIRING', x + chipW - 10, r.y + 20, 11, '#9fd8c9', 'bold', 'right');
  });
}

function drawBins(ctx, world) {
  const area = LAYOUT.bins;
  ctx.fillStyle = '#8a5a33';
  rr(ctx, area.x - 8, area.y - 6, area.w + 16, area.h + 12, 12); ctx.fill();
  INGREDIENTS.forEach((ing, i) => {
    const b = binRect(i);
    const isTarget = world.selected !== 'plate' || true;
    ctx.fillStyle = '#a9743f';
    rr(ctx, b.x, b.y, b.w, b.h, 10); ctx.fill();
    ctx.strokeStyle = '#6b4423'; ctx.lineWidth = 2;
    rr(ctx, b.x, b.y, b.w, b.h, 10); ctx.stroke();
    drawIngredient(ctx, ing.id, b.x + b.w / 2, b.y + 62, 64);
    text(ctx, ing.name, b.x + b.w / 2, b.y + 122, 16, '#fff', 'bold', 'center');
    ctx.fillStyle = '#14453d';
    ctx.beginPath(); ctx.arc(b.x + b.w - 18, b.y + 18, 13, 0, Math.PI * 2); ctx.fill();
    text(ctx, ing.key, b.x + b.w - 18, b.y + 19, 13, '#ffe9a8', 'bold', 'center');
    if (isTarget) {
      ctx.fillStyle = 'rgba(255, 217, 77, 0.12)';
      rr(ctx, b.x, b.y, b.w, b.h, 10); ctx.fill();
    }
  });
  const tb = binRect(8);
  ctx.fillStyle = '#7a3b2e';
  rr(ctx, tb.x, tb.y, tb.w, tb.h, 10); ctx.fill();
  ctx.strokeStyle = '#5a2a20'; ctx.lineWidth = 2;
  rr(ctx, tb.x, tb.y, tb.w, tb.h, 10); ctx.stroke();
  // trash can, drawn (no emoji glyph)
  ctx.fillStyle = '#fff';
  ctx.fillRect(tb.x + tb.w / 2 - 14, tb.y + 48, 28, 6);
  ctx.beginPath();
  ctx.moveTo(tb.x + tb.w / 2 - 16, tb.y + 58);
  ctx.lineTo(tb.x + tb.w / 2 + 16, tb.y + 58);
  ctx.lineTo(tb.x + tb.w / 2 + 12, tb.y + 96);
  ctx.lineTo(tb.x + tb.w / 2 - 12, tb.y + 96);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#7a3b2e'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(tb.x + tb.w / 2 - 5, tb.y + 64); ctx.lineTo(tb.x + tb.w / 2 - 5, tb.y + 90); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(tb.x + tb.w / 2 + 5, tb.y + 64); ctx.lineTo(tb.x + tb.w / 2 + 5, tb.y + 90); ctx.stroke();
  text(ctx, 'SAMPAH', tb.x + tb.w / 2, tb.y + 122, 15, '#fff', 'bold', 'center');
  text(ctx, 'buang masakan', tb.x + tb.w / 2, tb.y + 144, 11, '#e8b4a0', 'bold', 'center');
}

function drawBackground(ctx) {
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, 1280, 720);
  // wall tiles
  ctx.strokeStyle = 'rgba(122, 78, 42, 0.10)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 1280; x += 64) { ctx.beginPath(); ctx.moveTo(x, 56); ctx.lineTo(x, 448); ctx.stroke(); }
  for (let y = 56; y <= 448; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1280, y); ctx.stroke(); }
  // teal wainscot stripe behind the stations
  ctx.fillStyle = TEAL;
  ctx.fillRect(0, 180, 1280, 8);
  // floor
  ctx.fillStyle = '#b25a30';
  ctx.fillRect(0, 516, 1280, 204);
  ctx.fillStyle = '#c96f3f';
  for (let x = 0; x < 1280; x += 64) {
    for (let y = 516; y < 720; y += 64) {
      if (((x + y) / 64) % 2 === 0) ctx.fillRect(x, y, 64, 64);
    }
  }
}

function drawParticles(ctx, fx) {
  for (const p of fx.particles) {
    const life = Math.max(0, p.life / p.maxLife);
    if (p.kind === 'steam') {
      ctx.fillStyle = `rgba(255,255,255,${0.5 * life})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.6 - life * 0.6), 0, Math.PI * 2); ctx.fill();
    } else if (p.kind === 'fly') {
      const t = 1 - life;
      const x = p.x0 + (p.x1 - p.x0) * t;
      const y = p.y0 + (p.y1 - p.y0) * t - Math.sin(t * Math.PI) * 70;
      drawIngredient(ctx, p.ing, x, y, 34);
    } else if (p.kind === 'spark') {
      ctx.fillStyle = `rgba(255, 217, 77, ${life})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * life, 0, Math.PI * 2); ctx.fill();
    }
  }
  for (const f of fx.floats) {
    const life = Math.max(0, f.life / f.maxLife);
    ctx.globalAlpha = life;
    text(ctx, f.text, f.x, f.y - (1 - life) * 30, 22, f.color, 'bold', 'center');
    ctx.globalAlpha = 1;
  }
}

function dim(ctx) {
  ctx.fillStyle = 'rgba(20, 30, 25, 0.62)';
  ctx.fillRect(0, 0, 1280, 720);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = PAPER;
  rr(ctx, x, y, w, h, 16); ctx.fill();
  ctx.strokeStyle = '#d9a441'; ctx.lineWidth = 3;
  rr(ctx, x, y, w, h, 16); ctx.stroke();
}

function drawTitle(ctx, world) {
  dim(ctx);
  panel(ctx, 290, 110, 700, 500);
  text(ctx, 'WARUNG', 640, 190, 64, '#c0392b', 'bold', 'center');
  text(ctx, 'KILAT', 640, 252, 64, TEAL, 'bold', 'center');
  text(ctx, 'Dapur paling sibuk di kampung — masak cepat, saji tepat!', 640, 308, 17, '#7a4e2a', 'bold', 'center');
  const lines = [
    '1. Klik stasiun (WOK / POT / PIRING), lalu klik bahan 1-8.',
    '2. Masak sampai matang — jangan sampai gosong!',
    '3. Pindah ke piring, lalu klik pesanan yang cocok untuk mengantar.',
    '4. Sajikan sebelum kesabaran pelanggan habis. Kombo = cuan!',
  ];
  lines.forEach((line, i) => text(ctx, line, 640, 352 + i * 28, 15, '#3a2318', 'bold', 'center'));
  const b = BUTTONS.start;
  ctx.fillStyle = '#c0392b';
  rr(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
  text(ctx, 'MULAI MASAK', b.x + b.w / 2, b.y + b.h / 2 + 1, 22, '#fff', 'bold', 'center');
  text(ctx, 'atau tekan SPASI', 640, b.y + b.h + 26, 13, '#7a4e2a', 'bold', 'center');
  if (world.bestScore > 0) text(ctx, `Rekor: Rp${fmtCoins(world.bestScore)}`, 640, 150, 16, '#7a4e2a', 'bold', 'center');
}

function drawPause(ctx) {
  dim(ctx);
  panel(ctx, 440, 220, 400, 260);
  text(ctx, 'JEDA', 640, 300, 44, TEAL, 'bold', 'center');
  text(ctx, 'Istirahat sebentar, kompor tetap panas.', 640, 350, 15, '#7a4e2a', 'bold', 'center');
  const b = BUTTONS.resume;
  ctx.fillStyle = TEAL;
  rr(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
  text(ctx, 'LANJUTKAN', b.x + b.w / 2, b.y + b.h / 2 + 1, 20, '#fff', 'bold', 'center');
}

function drawGameOver(ctx, world) {
  dim(ctx);
  panel(ctx, 340, 120, 600, 500);
  text(ctx, 'SHIFT SELESAI!', 640, 190, 44, '#c0392b', 'bold', 'center');
  text(ctx, 'Dapur tutup. Waktunya menghitung cuan.', 640, 232, 16, '#7a4e2a', 'bold', 'center');
  text(ctx, `Rp${fmtCoins(world.score)}`, 640, 300, 56, TEAL, 'bold', 'center');
  const rows = [
    ['Hidangan disajikan', `${world.served}`],
    ['Kombo terbaik', `x${world.bestCombo}`],
    ['Level tercapai', `${world.level}`],
    ['Rekor', `Rp${fmtCoins(Math.max(world.bestScore, world.score))}`],
  ];
  rows.forEach(([label, value], i) => {
    const y = 360 + i * 34;
    text(ctx, label, 420, y, 17, '#3a2318', 'bold', 'left');
    text(ctx, value, 860, y, 17, TEAL, 'bold', 'right');
  });
  const b = BUTTONS.restart;
  ctx.fillStyle = '#c0392b';
  rr(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
  text(ctx, 'MASAK LAGI', b.x + b.w / 2, b.y + b.h / 2 + 1, 22, '#fff', 'bold', 'center');
  text(ctx, 'atau tekan SPASI / R', 640, b.y + b.h + 24, 13, '#7a4e2a', 'bold', 'center');
}

export function drawGame(ctx, world, fx, now) {
  drawBackground(ctx);
  drawOrders(ctx, world, now);
  drawStation(ctx, world, 'wok', now);
  drawStation(ctx, world, 'pot', now);
  drawStation(ctx, world, 'plate', now);
  drawRecipes(ctx, world);
  drawBins(ctx, world);
  drawParticles(ctx, fx);
  drawHud(ctx, world, now);
  if (world.screen === 'title') drawTitle(ctx, world);
  else if (world.screen === 'pause') drawPause(ctx);
  else if (world.screen === 'over') drawGameOver(ctx, world);
}

// Re-exported for tests: hit-testing helper used by the playtest harness.
export { pointInRect };
