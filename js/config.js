// js/config.js

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
  if (cssTime.endsWith('ms')) {
    return parseFloat(cssTime);
  } else if (cssTime.endsWith('s')) {
    return parseFloat(cssTime) * 1000;
  }
  return parseFloat(cssTime);
}

/**
 * Cache CSS variables for reuse.
 * These variables are extracted from the CSS file and are used to define various properties for the game elements.
 */
const CSS_VARS = {
  playerWidth: getCSSVariable('--player-width'),
  playerHeight: getCSSVariable('--player-height'),
  playerLeft: getCSSVariable('--player-left'),
  playerJumpWidth: getCSSVariable('--player-jump-width'),
  playerJumpHeight: getCSSVariable('--player-jump-height'),
  orionWidth: getCSSVariable('--orion-width'),
  orionHeight: getCSSVariable('--orion-height'),
  orionLeft: getCSSVariable('--orion-left'),
  obstacleWidth: getCSSVariable('--obstacle-width'),
  obstacleHeight: getCSSVariable('--obstacle-height'),
  obstacleInitialLeft: getCSSVariable('--obstacle-initial-left'),
  groundLevel: getCSSVariable('--ground-level'),
  jumpHeight: getCSSVariable('--jump-height'),
  jumpDuration: getCSSVariable('--jump-duration'),
};

/**
 * Define game configurations and responsive calculations.
 */
export const CONFIG = {
  /**
   * Configuration for the player character.
   * WIDTH: Width of the player character (Read-Only).
   * HEIGHT: Height of the player character (Read-Only).
   * INITIAL_LEFT: Initial left position of the player character (Read-Only).
   * JUMP_WIDTH: Width of the player character during a jump (Read-Only).
   * JUMP_HEIGHT: Height of the player character during a jump (Read-Only).
   */
  PLAYER: {
    WIDTH: parseInt(CSS_VARS.playerWidth),
    HEIGHT: parseInt(CSS_VARS.playerHeight),
    INITIAL_LEFT: parseFloat(CSS_VARS.playerLeft),
    JUMP_WIDTH: parseInt(CSS_VARS.playerJumpWidth),
    JUMP_HEIGHT: parseInt(CSS_VARS.playerJumpHeight),
  },
  /**
   * Configuration for the Orion character.
   * WIDTH: Width of the Orion character (Read-Only).
   * HEIGHT: Height of the Orion character (Read-Only).
   * INITIAL_LEFT: Initial left position of the Orion character (Read-Only).
   */
  ORION: {
    WIDTH: parseInt(CSS_VARS.orionWidth),
    HEIGHT: parseInt(CSS_VARS.orionHeight),
    INITIAL_LEFT: parseFloat(CSS_VARS.orionLeft),
  },
  /**
   * Configuration for the obstacles.
   * WIDTH: Width of obstacles (Read-Only).
   * HEIGHT: Height of obstacles (Read-Only).
   * INITIAL_LEFT: Initial left position of obstacles (Mutable).
   */
  OBSTACLE: {
    WIDTH: parseFloat(CSS_VARS.obstacleWidth),
    HEIGHT: parseFloat(CSS_VARS.obstacleHeight),
    INITIAL_LEFT: window.innerWidth,
  },
  /**
   * Configuration for the game settings.
   * STARTING_SPEED: Initial speed of the game (Mutable).
   * MAX_SPEED: Maximum speed of the game (Read-Only).
   * ACCELERATION: Acceleration rate of the game speed (Read-Only).
   * GROUND_LEVEL: Ground level position (Read-Only).
   * CONTAINER_WIDTH: Width of the game container (Read-Only).
   */
  GAME: {
    STARTING_SPEED: 31.25,
    MAX_SPEED: 300,
    ACCELERATION: 1.15,
    GROUND_LEVEL: (parseFloat(CSS_VARS.groundLevel) * window.innerHeight) / 100,
    CONTAINER_WIDTH: 100,
  },
  /**
   * Configuration for the jump settings.
   * Controls both the jump for the player and Orion.
   * MAX_HEIGHT: Maximum height of the jump (Mutable).
   * DURATION: Duration of the jump (Read-Only).
   */
  JUMP: {
    MAX_HEIGHT: parseFloat(CSS_VARS.jumpHeight),
    DURATION: cssTimeToMs(CSS_VARS.jumpDuration),
  },
  /**
   * Configuration for the scoring system.
   * POINTS_PER_PERCENT: Points awarded per percent distance ran (Read-Only).
   * OBSTACLE_BONUS: Bonus points awarded for passing obstacles (Read-Only).
   * SCORE_UPDATE_INTERVAL: Interval for updating the score display (Not Used).
   */
  SCORING: {
    POINTS_PER_PERCENT: 0.5,
    OBSTACLE_BONUS: 100,
    SCORE_UPDATE_INTERVAL: 100,
  },
};

/**
 * Define game states.
 */
export const GameState = {
  INITIAL: 'initial',
  PLAYING: 'playing',
  PAUSED: 'paused',
  CRASHED: 'crashed',
};
