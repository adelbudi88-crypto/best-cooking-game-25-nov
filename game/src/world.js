// Warung Kilat — world: the pure game logic. One job: orders, cooking,
// scoring, combos and levels. No drawing, no sound, no DOM — so the same
// rules drive real play and the deterministic screenshot scenes.

import { RECIPES, RECIPE_BY_ID, SHIFT_SECONDS, TUNING, unlockedRecipes } from './config.js';
import { mulberry32, pick } from './random.js';

export const STATION_IDS = ['wok', 'pot', 'plate'];

function emptyStation() {
  return { contents: [], state: 'empty', progress: 0, cookTime: 0, dish: null, bonus: false, doneFor: 0 };
}

export function createWorld(seed = 1) {
  const world = {
    seed,
    rng: mulberry32(seed),
    screen: 'title',
    timeLeft: SHIFT_SECONDS,
    score: 0,
    served: 0,
    combo: 0,
    bestCombo: 0,
    level: 1,
    bestScore: 0,
    orders: [],
    nextOrderId: 1,
    orderTimer: 4,
    selected: 'wok',
    wok: emptyStation(),
    pot: emptyStation(),
    plate: emptyStation(),
    events: [],
    elapsed: 0,
    lastTickSecond: -1,
  };
  return world;
}

export function resetWorld(world) {
  const fresh = createWorld(world.seed);
  fresh.bestScore = world.bestScore;
  Object.keys(fresh).forEach((k) => { world[k] = fresh[k]; });
  world.events = [];
}

export function startGame(world) {
  resetWorld(world);
  world.screen = 'play';
  world.orderTimer = 2.5;
  spawnOrder(world);
  spawnOrder(world);
}

export function levelFor(served) {
  return 1 + Math.floor(served / TUNING.servesPerLevel);
}

function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}

function isSubset(a, b) {
  return a.every((v) => b.includes(v));
}

// Match a pile of ingredients against the recipe book.
// Returns { recipe, bonus } when complete, null when still a valid start,
// { ruined: true } when no recipe can ever come out of it.
export function matchRecipe(contents) {
  const uniq = [...new Set(contents)];
  if (uniq.length !== contents.length) return { ruined: true };
  for (const recipe of RECIPES) {
    if (sameSet(uniq, recipe.needs)) return { recipe, bonus: false };
    if (sameSet(uniq, [...recipe.needs, recipe.extra])) return { recipe, bonus: true };
  }
  for (const recipe of RECIPES) {
    if (isSubset(uniq, [...recipe.needs, recipe.extra])) return null;
  }
  return { ruined: true };
}

export function comboMultiplier(combo) {
  return 1 + Math.min(combo, TUNING.comboCap) * TUNING.comboStep;
}

function orderInterval(level) {
  return Math.max(
    TUNING.orderIntervalMin,
    TUNING.orderIntervalStart + (level - 1) * TUNING.orderIntervalPerLevel,
  );
}

function orderPatience(level) {
  return Math.max(
    TUNING.patienceMin,
    TUNING.patienceStart + (level - 1) * TUNING.patiencePerLevel,
  );
}

export function spawnOrder(world, recipeId) {
  if (world.orders.length >= TUNING.maxOrders) return null;
  const pool = unlockedRecipes(world.level);
  const recipe = recipeId ? RECIPE_BY_ID[recipeId] : pick(world.rng, pool);
  const patience = orderPatience(world.level);
  const order = { id: world.nextOrderId, recipeId: recipe.id, patience, maxPatience: patience, warned: false };
  world.nextOrderId += 1;
  world.orders.push(order);
  return order;
}

export function selectStation(world, id) {
  if (!STATION_IDS.includes(id)) return;
  world.selected = id;
  world.events.push({ type: 'select', station: id });
}

export function addIngredient(world, ingId) {
  if (world.screen !== 'play') return;
  const target = world.selected;
  const station = world[target];
  if (station.state === 'cooking' || station.state === 'done' || station.state === 'burnt') {
    world.events.push({ type: 'blocked', reason: 'busy', station: target });
    return;
  }
  if (station.state === 'ruined') {
    world.events.push({ type: 'blocked', reason: 'ruined', station: target });
    return;
  }
  if (station.contents.length >= 4) {
    world.events.push({ type: 'blocked', reason: 'full', station: target });
    return;
  }
  station.contents.push(ingId);
  station.state = 'filling';
  world.events.push({ type: 'add', station: target, ing: ingId });
  const match = matchRecipe(station.contents);
  if (match && match.ruined) {
    station.state = 'ruined';
    world.score = Math.max(0, world.score - TUNING.mistakePenalty);
    world.combo = 0;
    world.events.push({ type: 'mistake', station: target, reason: 'wrong-mix', penalty: TUNING.mistakePenalty });
    return;
  }
  if (target === 'plate' && match && match.recipe) {
    station.dish = match.recipe.id;
    station.bonus = match.bonus;
    station.state = 'done';
    world.events.push({ type: 'cookdone', station: 'plate', dish: match.recipe.id });
  }
}

export function canCook(world, id) {
  const station = world[id];
  if (id === 'plate' || station.state !== 'filling') return false;
  const match = matchRecipe(station.contents);
  return Boolean(match && match.recipe);
}

export function startCooking(world, id) {
  if (world.screen !== 'play') return;
  if (!canCook(world, id)) {
    world.events.push({ type: 'blocked', reason: 'not-ready', station: id });
    return;
  }
  const station = world[id];
  const match = matchRecipe(station.contents);
  station.dish = match.recipe.id;
  station.bonus = match.bonus;
  station.cookTime = match.recipe.cook;
  station.progress = 0;
  station.state = 'cooking';
  world.events.push({ type: 'cookstart', station: id, dish: match.recipe.id });
}

export function moveToPlate(world, id) {
  if (world.screen !== 'play') return;
  const station = world[id];
  if (station.state !== 'done') {
    world.events.push({ type: 'blocked', reason: 'not-done', station: id });
    return;
  }
  if (world.plate.state !== 'empty') {
    world.events.push({ type: 'blocked', reason: 'plate-busy', station: id });
    return;
  }
  world.plate.dish = station.dish;
  world.plate.bonus = station.bonus;
  world.plate.contents = [...station.contents];
  world.plate.state = 'done';
  world.wok = id === 'wok' ? emptyStation() : world.wok;
  world.pot = id === 'pot' ? emptyStation() : world.pot;
  world.events.push({ type: 'toplate', station: id, dish: world.plate.dish });
}

export function trashStation(world, id) {
  const station = world[id];
  if (station.state === 'empty') return;
  world[id] = emptyStation();
  world.events.push({ type: 'trash', station: id });
}

export function plateDish(world) {
  return world.plate.state === 'done' ? world.plate.dish : null;
}

function payForServe(world, order) {
  const recipe = RECIPE_BY_ID[order.recipeId];
  const patienceFraction = Math.max(0, order.patience / order.maxPatience);
  const tip = Math.round(recipe.price * 0.5 * patienceFraction) + (world.plate.bonus ? recipe.extraTip : 0);
  const amount = Math.round((recipe.price + tip) * comboMultiplier(world.combo));
  world.score += amount;
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  world.served += 1;
  world.orders = world.orders.filter((o) => o.id !== order.id);
  world.plate = emptyStation();
  const newLevel = levelFor(world.served);
  const leveled = newLevel > world.level;
  if (leveled) {
    world.level = newLevel;
    world.events.push({ type: 'levelup', level: newLevel });
  }
  return amount;
}

export function serveOrder(world, orderId) {
  if (world.screen !== 'play') return false;
  const dish = plateDish(world);
  if (!dish) {
    world.events.push({ type: 'blocked', reason: 'no-dish' });
    return false;
  }
  const order = world.orders.find((o) => o.id === orderId);
  if (!order) return false;
  if (order.recipeId !== dish) {
    world.events.push({ type: 'blocked', reason: 'wrong-order', order: orderId });
    return false;
  }
  const amount = payForServe(world, order);
  world.events.push({ type: 'serve', order: orderId, dish, amount, combo: world.combo });
  return true;
}

export function serveOldest(world) {
  if (world.screen !== 'play') return false;
  const dish = plateDish(world);
  if (!dish) {
    world.events.push({ type: 'blocked', reason: 'no-dish' });
    return false;
  }
  const order = world.orders.find((o) => o.recipeId === dish);
  if (!order) {
    world.events.push({ type: 'blocked', reason: 'no-match' });
    return false;
  }
  const amount = payForServe(world, order);
  world.events.push({ type: 'serve', order: order.id, dish, amount, combo: world.combo });
  return true;
}

export function togglePause(world) {
  if (world.screen === 'play') world.screen = 'pause';
  else if (world.screen === 'pause') world.screen = 'play';
}

function updateCooking(world, station, dt, name) {
  if (station.state === 'cooking') {
    station.progress += dt / station.cookTime;
    if (station.progress >= 1) {
      station.progress = 1;
      station.state = 'done';
      station.doneFor = 0;
      world.events.push({ type: 'cookdone', station: name, dish: station.dish });
    }
    return;
  }
  if (station.state === 'done') {
    station.doneFor += dt;
    if (station.doneFor > TUNING.burnGrace) {
      station.state = 'burnt';
      world.combo = 0;
      world.events.push({ type: 'burnt', station: name });
    }
  }
}

export function update(world, dt) {
  if (world.screen !== 'play') return;
  world.elapsed += dt;
  world.timeLeft -= dt;

  const second = Math.ceil(world.timeLeft);
  if (world.timeLeft <= 30 && second !== world.lastTickSecond && world.timeLeft > 0) {
    world.lastTickSecond = second;
    world.events.push({ type: 'tick' });
  }

  if (world.timeLeft <= 0) {
    world.timeLeft = 0;
    world.screen = 'over';
    world.events.push({ type: 'gameover', score: world.score });
    return;
  }

  world.orderTimer -= dt;
  if (world.orderTimer <= 0) {
    spawnOrder(world);
    world.orderTimer = orderInterval(world.level);
  }

  for (const order of [...world.orders]) {
    order.patience -= dt;
    if (!order.warned && order.patience <= 8) {
      order.warned = true;
      world.events.push({ type: 'orderwarn' });
    }
    if (order.patience <= 0) {
      world.orders = world.orders.filter((o) => o.id !== order.id);
      world.combo = 0;
      world.events.push({ type: 'expired', order: order.id, dish: order.recipeId });
    }
  }

  updateCooking(world, world.wok, dt, 'wok');
  updateCooking(world, world.pot, dt, 'pot');
}

export function takeEvents(world) {
  const events = world.events;
  world.events = [];
  return events;
}
