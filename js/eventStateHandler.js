// js/eventStateHandler.js

import { state } from './core.js'; // Import only 'state' from 'core.js'
import { GameState } from './config.js'; // Import 'GameState' directly from 'config.js'
import { log } from './utils.js';
import { resetGame, startGame, handleJump, pauseGame, resumeGame } from './gameLogic.js'; // Ensure correct imports from 'gameLogic.js'

/**
 * Handles state transitions for the game.
 * @param {Object} state - The current game state.
 * @param {string} action - The action to handle.
 */
function handleStateTransition(state, action) {
  log(`Handling ${action} in state: ${state.gameState}`);
  switch (state.gameState) {
    case GameState.INITIAL:
    case GameState.CRASHED:
      if (action === 'START') {
        resetGame();
        startGame();
      }
      break;
    case GameState.PLAYING:
      if (action === 'JUMP') {
        handleJump();
      } else if (action === 'PAUSE') {
        pauseGame();
      } else if (action === 'RESUME') {
        resumeGame();
      }
      break;
    case GameState.PAUSED:
      if (action === 'RESUME') {
        resumeGame();
      }
      break;
    default:
      log(`Unhandled game state: ${state.gameState}`, 'warn');
  }
}

/**
 * Logs state transitions for debugging purposes.
 * @param {Object} state - The current game state.
 * @param {string} action - The action being handled.
 */
function logStateTransition(state, action) {
  log(`Handling ${action} in state: ${state.gameState}`, 'info');
}

/**
 * Define key actions and their corresponding handlers.
 */
const keyActions = {
  Space: () =>
    handleStateTransition(
      state,
      state.gameState === GameState.INITIAL ||
        state.gameState === GameState.CRASHED
        ? 'START'
        : 'JUMP'
    ),
  KeyP: () =>
    handleStateTransition(
      state,
      state.gameState === GameState.PLAYING ? 'PAUSE' : 'RESUME'
    ),
};

let spaceKeyDisabled = false;

/**
 * Handles the keydown event.
 * @param {KeyboardEvent} e - The keyboard event.
 */
export function handleKeydown(e) {
  try {
    if (e.code === 'Space' && spaceKeyDisabled) return;
    const action = keyActions[e.code];
    if (action) {
      const actionType =
        e.code === 'Space'
          ? state.gameState === GameState.INITIAL ||
            state.gameState === GameState.CRASHED
            ? 'START'
            : 'JUMP'
          : state.gameState === GameState.PLAYING
            ? 'PAUSE'
            : 'RESUME';
      logStateTransition(state, actionType);
      action();
    }
  } catch (error) {
    log(`Error handling keydown event: ${error.message}`, 'error');
  }
}

/**
 * Handles the touchstart event.
 */
export function handleTouchStart() {
  logStateTransition(state, 'JUMP');
  handleStateTransition(state, 'JUMP');
}

/**
 * Sets the space key disabled state.
 * @param {boolean} value - The disabled state.
 */
export function setSpaceKeyDisabled(value) {
  spaceKeyDisabled = value;
}

/**
 * Sets up event listeners for keydown and touchstart events.
 */
export function setupEventListeners() {
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('touchstart', handleTouchStart);
}

/**
 * Removes event listeners for keydown and touchstart events.
 */
export function removeEventListeners() {
  document.removeEventListener('keydown', handleKeydown);
  document.removeEventListener('touchstart', handleTouchStart);
}
