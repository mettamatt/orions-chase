// js/core.js

import { CONFIG, GameState } from './config.js';

/**
 * Holds references to all essential DOM elements.
 */
export const elements = {
  player: null,
  orion: null,
  obstacle: null,
  scoreDisplay: null,
  highScoreDisplay: null,
  finalScoreDisplay: null,
  instructionDialog: null,
  gameContainer: null,
  gameOverMessage: null,
  instructionMessage: null,
};

/**
 * Represents the game state.
 */
export class State {
  constructor() {
    this.highScore = 0;
    this.gameState = GameState.INITIAL;
    this.playerBottom = CONFIG.GAME.GROUND_LEVEL;
    this.obstacleLeft = CONFIG.GAME.CONTAINER_WIDTH;
    this.orionLeft = CONFIG.ORION.INITIAL_LEFT;
    this.isJumping = false;
    this.jumpStartTime = 0;
    this.currentSpeed = CONFIG.GAME.STARTING_SPEED;
    this.lastFrameTime = 0;
    this.distanceRan = 0;
    this.backgroundPosX = 0;
    this.gameStartTime = 0;
    this.score = 0;
    this.orionBottom = CONFIG.GAME.GROUND_LEVEL;
    this.orionIsJumping = false;
    this.orionJumpStartTime = 0;
    this.playerLeft = CONFIG.PLAYER.INITIAL_LEFT;
  }

  /**
   * Resets the game state to its initial values.
   */
  reset() {
    this.gameState = GameState.INITIAL;
    this.playerBottom = CONFIG.GAME.GROUND_LEVEL;
    this.obstacleLeft = CONFIG.GAME.CONTAINER_WIDTH;
    this.orionLeft = CONFIG.ORION.INITIAL_LEFT;
    this.isJumping = false;
    this.jumpStartTime = 0;
    this.currentSpeed = CONFIG.GAME.STARTING_SPEED;
    this.lastFrameTime = 0;
    this.distanceRan = 0;
    this.backgroundPosX = 0;
    this.gameStartTime = 0;
    this.score = 0;
    this.orionBottom = CONFIG.GAME.GROUND_LEVEL;
    this.orionIsJumping = false;
    this.orionJumpStartTime = 0;
    this.playerLeft = CONFIG.PLAYER.INITIAL_LEFT;
  }
}

/**
 * Singleton instance of the game state.
 */
export const state = new State();

/**
 * Initializes DOM elements by assigning them to the elements object.
 * @throws {Error} If a required DOM element is not found.
 */
export function initDOMElements() {
  const elementIdToKey = {
    player: 'player',
    orion: 'orion',
    obstacle: 'obstacle',
    score: 'scoreDisplay',
    'high-score': 'highScoreDisplay',
    'final-score': 'finalScoreDisplay',
    'instruction-dialog': 'instructionDialog',
    'game-container': 'gameContainer',
    'game-over-message': 'gameOverMessage',
    'instruction-message': 'instructionMessage',
  };

  for (const [id, key] of Object.entries(elementIdToKey)) {
    elements[key] = document.getElementById(id);
    if (!elements[key]) {
      throw new Error(`Required DOM element not found: ${id}`);
    }
  }

  // Initialize styles as needed...
  const groundLevel = CONFIG.GAME.GROUND_LEVEL;

  // Set initial positions
  elements.player.style.animationPlayState = 'paused';
  elements.orion.style.animationPlayState = 'paused';
  elements.player.style.left = `${CONFIG.PLAYER.INITIAL_LEFT}px`;
  elements.player.style.bottom = `${groundLevel}px`;
  elements.orion.style.left = `${CONFIG.ORION.INITIAL_LEFT}px`;
  elements.orion.style.bottom = `${groundLevel}px`;
  elements.obstacle.style.display = 'none'; // Hide initially
  elements.obstacle.style.left = `${CONFIG.OBSTACLE.INITIAL_LEFT}px`;
  elements.obstacle.style.width = `${CONFIG.OBSTACLE.WIDTH}px`;
  elements.obstacle.style.height = `${CONFIG.OBSTACLE.HEIGHT}px`;
  elements.obstacle.style.bottom = `${CONFIG.GAME.GROUND_LEVEL + CONFIG.PLAYER.HEIGHT / 2}px`;
}
