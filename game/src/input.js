// Warung Kilat — input. One job: turn mouse clicks and keys (in the game's
// 1280x720 logical coordinates) into world actions. The hit rectangles come
// from config.js, the same ones render.js draws.

import { BUTTONS, INGREDIENTS, LAYOUT, binRect, pointInRect, stationButtonRect, ticketRect } from './config.js';
import { toggleMute } from './audio.js';
import {
  addIngredient, moveToPlate, selectStation, serveOldest, serveOrder,
  startCooking, startGame, togglePause, trashStation,
} from './world.js';

function clickStationButtons(world, x, y) {
  for (const id of ['wok', 'pot', 'plate']) {
    if (pointInRect(x, y, stationButtonRect(id, 'cook')) && id !== 'plate') {
      selectStation(world, id);
      startCooking(world, id);
      return true;
    }
    if (pointInRect(x, y, stationButtonRect(id, 'toPlate')) && id !== 'plate') {
      moveToPlate(world, id);
      return true;
    }
    if (pointInRect(x, y, stationButtonRect(id, 'trash'))) {
      trashStation(world, id);
      return true;
    }
  }
  return false;
}

// Handle a click at logical coordinates. Returns true when it did something.
export function handleClick(world, x, y) {
  if (pointInRect(x, y, BUTTONS.mute)) {
    toggleMute();
    return true;
  }
  if (world.screen === 'title') {
    startGame(world);
    return true;
  }
  if (world.screen === 'over') {
    if (pointInRect(x, y, BUTTONS.restart)) startGame(world);
    return true;
  }
  if (world.screen === 'pause') {
    if (pointInRect(x, y, BUTTONS.resume)) togglePause(world);
    return true;
  }
  // Playing.
  if (pointInRect(x, y, BUTTONS.pause)) {
    togglePause(world);
    return true;
  }
  for (let i = 0; i < world.orders.length; i += 1) {
    if (pointInRect(x, y, ticketRect(i))) {
      serveOrder(world, world.orders[i].id);
      return true;
    }
  }
  if (clickStationButtons(world, x, y)) return true;
  for (const id of ['wok', 'pot', 'plate']) {
    if (pointInRect(x, y, LAYOUT.stations[id])) {
      selectStation(world, id);
      return true;
    }
  }
  for (let i = 0; i < INGREDIENTS.length; i += 1) {
    if (pointInRect(x, y, binRect(i))) {
      addIngredient(world, INGREDIENTS[i].id);
      return true;
    }
  }
  if (pointInRect(x, y, binRect(8))) {
    trashStation(world, world.selected);
    return true;
  }
  return false;
}

// Handle a key press. Returns true when it did something.
export function handleKey(world, key) {
  const k = key.toLowerCase();
  if (k === 'm') {
    toggleMute();
    return true;
  }
  if (world.screen === 'title' && (k === ' ' || k === 'enter')) {
    startGame(world);
    return true;
  }
  if (world.screen === 'over' && (k === ' ' || k === 'enter' || k === 'r')) {
    startGame(world);
    return true;
  }
  if ((k === 'p' || k === 'escape') && (world.screen === 'play' || world.screen === 'pause')) {
    togglePause(world);
    return true;
  }
  if (world.screen !== 'play') return false;
  if (k === ' ') {
    serveOldest(world);
    return true;
  }
  if (k === 'r') {
    startGame(world);
    return true;
  }
  const ing = INGREDIENTS.find((item) => item.key === k);
  if (ing) {
    addIngredient(world, ing.id);
    return true;
  }
  return false;
}
