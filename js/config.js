// config.js

/**
 * Utility function to retrieve a CSS variable value.
 * @param {string} variableName - The name of the CSS variable.
 * @returns {string} The value of the CSS variable.
 */
function getCSSVariable(variableName) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
}

/**
 * Utility function to convert a CSS time value to milliseconds.
 * @param {string} cssTime - The CSS time value (e.g., '200ms', '0.5s').
 * @returns {number} The time in milliseconds.
 */
function cssTimeToMs(cssTime) {
  if (cssTime.endsWith("ms")) {
    return parseFloat(cssTime);
  } else if (cssTime.endsWith("s")) {
    return parseFloat(cssTime) * 1000;
  }
  return parseFloat(cssTime);
}

// Cache CSS variables for reuse.
const CSS_VARS = {
  playerWidth: getCSSVariable("--player-width"),
  playerHeight: getCSSVariable("--player-height"),
  playerLeft: getCSSVariable("--player-left"),
  playerJumpWidth: getCSSVariable("--player-jump-width"),
  playerJumpHeight: getCSSVariable("--player-jump-height"),
  orionWidth: getCSSVariable("--orion-width"),
  orionHeight: getCSSVariable("--orion-height"),
  orionLeft: getCSSVariable("--orion-left"),
  obstacleWidth: getCSSVariable("--obstacle-width"),
  obstacleHeight: getCSSVariable("--obstacle-height"),
  groundLevel: getCSSVariable("--ground-level"),
  jumpHeight: getCSSVariable("--jump-height"),
  jumpDuration: getCSSVariable("--jump-duration"),
};

// Define game configurations and responsive calculations.
export const CONFIG = {
  PLAYER: {
    WIDTH: parseInt(CSS_VARS.playerWidth),
    HEIGHT: parseInt(CSS_VARS.playerHeight),
    INITIAL_LEFT: parseFloat(CSS_VARS.playerLeft),
    JUMP_WIDTH: parseInt(CSS_VARS.playerJumpWidth),
    JUMP_HEIGHT: parseInt(CSS_VARS.playerJumpHeight),
  },
  ORION: {
    WIDTH: parseInt(CSS_VARS.orionWidth),
    HEIGHT: parseInt(CSS_VARS.orionHeight),
    INITIAL_LEFT: parseFloat(CSS_VARS.orionLeft),
  },
  OBSTACLE: {
    WIDTH: (parseFloat(CSS_VARS.obstacleWidth) / 100) * window.innerWidth,
    HEIGHT: (parseFloat(CSS_VARS.obstacleHeight) / 100) * window.innerHeight,
  },
  GAME: {
    INITIAL_SPEED: 31.25, // Game speed logic should be handled in JS.
    MAX_SPEED: 300,
    ACCELERATION: 1.15,
    GROUND_HEIGHT: parseFloat(CSS_VARS.groundLevel),
    CONTAINER_WIDTH: 100,
  },
  JUMP: {
    HEIGHT: parseFloat(CSS_VARS.jumpHeight),
    DURATION: cssTimeToMs(CSS_VARS.jumpDuration),
  },
  SCORING: {
    POINTS_PER_PERCENT: 0.5,
    OBSTACLE_BONUS: 100,
    UPDATE_INTERVAL: 100,
  },
};

// Define game states.
export const GameState = {
  INITIAL: "initial",
  PLAYING: "playing",
  PAUSED: "paused",
  CRASHED: "crashed",
};
