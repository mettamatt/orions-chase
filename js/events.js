// js/events.js
import { state } from "./game.js";
import { GameState } from "./config.js";
import { log } from "./utils.js";
import { handleStateTransition, logStateTransition } from "./gameState.js";

let spaceKeyDisabled = false;

// Define key actions and their corresponding handlers.
const keyActions = {
  Space: () =>
    handleStateTransition(
      state,
      state.gameState === GameState.INITIAL ||
        state.gameState === GameState.CRASHED
        ? "START"
        : "JUMP",
    ),
  KeyP: () =>
    handleStateTransition(
      state,
      state.gameState === GameState.PLAYING ? "PAUSE" : "RESUME",
    ),
};

/**
 * Handles the keydown event.
 * @param {KeyboardEvent} e - The keyboard event.
 */
export function handleKeydown(e) {
  try {
    if (e.code === "Space" && spaceKeyDisabled) return;
    const action = keyActions[e.code];
    if (action) {
      logStateTransition(state, e.code === "Space" ? "JUMP" : "TOGGLE PAUSE");
      action();
    }
  } catch (error) {
    log(`Error handling keydown event: ${error.message}`, "error");
  }
}

/**
 * Handles the touchstart event.
 */
export function handleTouchStart() {
  logStateTransition(state, "JUMP");
  handleStateTransition(state, "JUMP");
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
  document.addEventListener("keydown", handleKeydown);
  document.addEventListener("touchstart", handleTouchStart);
}

/**
 * Removes event listeners for keydown and touchstart events.
 */
export function removeEventListeners() {
  document.removeEventListener("keydown", handleKeydown);
  document.removeEventListener("touchstart", handleTouchStart);
}
