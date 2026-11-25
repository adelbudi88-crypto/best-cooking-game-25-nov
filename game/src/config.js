// Warung Kilat — configuration: ingredients, recipes, tuning and screen layout.
// One job: every number and rectangle the rest of the game shares lives here.

export const VIEW = { width: 1280, height: 720 };

export const SHIFT_SECONDS = 180;

export const INGREDIENTS = [
  { id: 'nasi', name: 'Nasi', key: '1', color: '#fff7e0', dark: '#d9c48a' },
  { id: 'mie', name: 'Mie', key: '2', color: '#ffd94d', dark: '#c79a1d' },
  { id: 'telur', name: 'Telur', key: '3', color: '#fff3c4', dark: '#e0a83c' },
  { id: 'ayam', name: 'Ayam', key: '4', color: '#e8a06a', dark: '#a35a24' },
  { id: 'sayur', name: 'Sayur', key: '5', color: '#7dc383', dark: '#3e7d44' },
  { id: 'kecap', name: 'Kecap', key: '6', color: '#5a3a28', dark: '#2e1c12' },
  { id: 'cabai', name: 'Cabai', key: '7', color: '#e8452c', dark: '#8f1d0e' },
  { id: 'kuah', name: 'Kuah', key: '8', color: '#f2b25c', dark: '#b97a1e' },
];

export const ING_BY_ID = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

// station: where the dish is built. 'plate' dishes are assembled cold, no cooking.
export const RECIPES = [
  { id: 'nasgor', name: 'Nasi Goreng', needs: ['nasi', 'telur', 'kecap'], extra: 'ayam', extraTip: 40, price: 120, station: 'wok', cook: 4 },
  { id: 'miegor', name: 'Mie Goreng', needs: ['mie', 'telur', 'sayur'], extra: 'cabai', extraTip: 30, price: 110, station: 'wok', cook: 4 },
  { id: 'gado', name: 'Gado-Gado', needs: ['sayur', 'telur', 'kecap'], extra: 'cabai', extraTip: 30, price: 100, station: 'plate', cook: 0 },
  { id: 'soto', name: 'Soto Ayam', needs: ['ayam', 'kuah', 'nasi'], extra: 'cabai', extraTip: 40, price: 150, station: 'pot', cook: 6, level: 2 },
  { id: 'geprek', name: 'Ayam Geprek', needs: ['ayam', 'cabai', 'nasi'], extra: 'telur', extraTip: 40, price: 140, station: 'wok', cook: 5, level: 3 },
  { id: 'miekuah', name: 'Mie Kuah', needs: ['mie', 'kuah', 'ayam'], extra: 'sayur', extraTip: 30, price: 130, station: 'pot', cook: 6, level: 4 },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

// Recipes a level can order. Level 1 starts with three, a new one unlocks per level.
export function unlockedRecipes(level) {
  return RECIPES.filter((r) => (r.level ?? 1) <= level);
}

export const TUNING = {
  orderIntervalStart: 9, // seconds between new tickets at level 1
  orderIntervalPerLevel: -0.8,
  orderIntervalMin: 4,
  patienceStart: 48, // seconds a ticket waits at level 1
  patiencePerLevel: -2,
  patienceMin: 26,
  maxOrders: 4,
  burnGrace: 6, // seconds past done before a cooked dish burns
  servesPerLevel: 5,
  comboStep: 0.25, // +25% pay per combo step
  comboCap: 8,
  mistakePenalty: 25,
};

export const LAYOUT = {
  hud: { x: 0, y: 0, w: 1280, h: 56 },
  orders: { x: 16, y: 64, w: 296, h: 112, gap: 16 },
  stations: {
    wok: { x: 16, y: 188, w: 380, h: 248 },
    pot: { x: 450, y: 188, w: 380, h: 248 },
    plate: { x: 846, y: 188, w: 418, h: 248 },
  },
  recipes: { x: 16, y: 448, w: 1248, h: 64 },
  bins: { x: 16, y: 524, w: 1248, h: 188 },
};

// Big overlay buttons (title / pause / game over) and HUD buttons, shared by
// input and render so a click always lands where the button is drawn.
export const BUTTONS = {
  start: { x: 490, y: 468, w: 300, h: 64 },
  resume: { x: 490, y: 400, w: 300, h: 64 },
  restart: { x: 490, y: 516, w: 300, h: 64 },
  pause: { x: 1152, y: 8, w: 56, h: 40 },
  mute: { x: 1216, y: 8, w: 56, h: 40 },
};

// Ingredient bin rectangles, computed from the bins area (9 slots: 8 ingredients + trash).
export function binRect(index) {
  const area = LAYOUT.bins;
  const slot = area.w / 9;
  return { x: area.x + index * slot + 4, y: area.y + 6, w: slot - 8, h: area.h - 12 };
}

export function ticketRect(index) {
  const o = LAYOUT.orders;
  return { x: o.x + index * (o.w + o.gap), y: o.y, w: o.w, h: o.h };
}

export function stationButtonRect(stationId, button) {
  // button: 'cook' | 'toPlate' | 'trash' — small buttons along the station panel bottom.
  const s = LAYOUT.stations[stationId];
  const bw = 118;
  const bh = 34;
  const y = s.y + s.h - 44;
  const x0 = s.x + (s.w - (bw * 3 + 16)) / 2;
  const order = { cook: 0, toPlate: 1, trash: 2 };
  return { x: x0 + order[button] * (bw + 8), y, w: bw, h: bh };
}

export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}
