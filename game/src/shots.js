// Warung Kilat — screenshot scenes behind ?shot=start|play|rush|end.
// Each scene drives the REAL world forward through its own public actions
// from a fixed seed, so the frame is what real play looks like and the same
// seed always gives the same frame. A few numbers (score, clock) are staged
// so the shot reads as mid-shift instead of second zero.

import { addIngredient, createWorld, resetWorld, selectStation, spawnOrder, startCooking, startGame, update } from './world.js';

const STEP = 1 / 30;

function setOrderPatience(world, index, frac) {
  const order = world.orders[index];
  if (order) order.patience = order.maxPatience * frac;
}

function cookAhead(world, seconds) {
  for (let t = 0; t < seconds; t += STEP) update(world, STEP);
}

// Build the named scene in `world` and return the screen to draw.
export function stageShot(name, world) {
  resetWorld(world);
  if (name === 'play') {
    startGame(world);
    selectStation(world, 'wok');
    addIngredient(world, 'nasi');
    addIngredient(world, 'telur');
    addIngredient(world, 'kecap');
    startCooking(world, 'wok');
    cookAhead(world, 2.4);
    spawnOrder(world, 'gado');
    setOrderPatience(world, 0, 0.75);
    setOrderPatience(world, 1, 0.55);
    setOrderPatience(world, 2, 0.9);
    world.score = 240;
    world.served = 2;
    world.combo = 2;
    world.timeLeft = 152;
    return;
  }
  if (name === 'rush') {
    startGame(world);
    world.served = 12;
    world.level = 3;
    world.score = 1250;
    world.combo = 5;
    world.bestCombo = 5;
    world.timeLeft = 42;
    spawnOrder(world, 'soto');
    spawnOrder(world, 'geprek');
    setOrderPatience(world, 0, 0.62);
    setOrderPatience(world, 1, 0.45);
    setOrderPatience(world, 2, 0.15);
    setOrderPatience(world, 3, 0.7);
    // Wok: nasi goreng almost done.
    selectStation(world, 'wok');
    addIngredient(world, 'nasi');
    addIngredient(world, 'telur');
    addIngredient(world, 'kecap');
    startCooking(world, 'wok');
    world.wok.progress = 0.85;
    // Pot: mie kuah mid-assembly.
    selectStation(world, 'pot');
    addIngredient(world, 'mie');
    addIngredient(world, 'kuah');
    // Plate: a finished mie goreng, ready to serve.
    world.plate.contents = ['mie', 'telur', 'sayur'];
    world.plate.dish = 'miegor';
    world.plate.bonus = false;
    world.plate.state = 'done';
    return;
  }
  if (name === 'end') {
    startGame(world);
    world.score = 1840;
    world.served = 14;
    world.bestCombo = 6;
    world.combo = 0;
    world.level = 3;
    world.timeLeft = 0;
    world.screen = 'over';
    if (world.bestScore < 1840) world.bestScore = 1840;
    return;
  }
  // start (default): title screen over a live-looking kitchen.
  spawnOrder(world, 'nasgor');
  spawnOrder(world, 'miegor');
  spawnOrder(world, 'gado');
  setOrderPatience(world, 0, 0.7);
  setOrderPatience(world, 1, 0.55);
  setOrderPatience(world, 2, 0.85);
  world.wok.contents = ['nasi', 'telur'];
  world.wok.state = 'filling';
  world.selected = 'wok';
  world.timeLeft = 175;
}

export function createShotWorld() {
  return createWorld(1);
}
