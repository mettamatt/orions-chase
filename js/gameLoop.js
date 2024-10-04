// js/gameLoop.js

import { CONFIG, GameState } from './config.js'; // Corrected import
import { state, elements } from './core.js';
import { endGame, handleJump, updateOrionState, UI } from './gameLogic.js';
import { checkCollision, calculateJumpPosition } from './utils.js';

/**
 * Retrieves a CSS variable value.
 * @param {string} variableName - The name of the CSS variable.
 * @returns {number} The numeric value of the CSS variable.
 */
function getCSSVariable(variableName) {
  const styles = getComputedStyle(document.documentElement);
  const value = styles.getPropertyValue(variableName);
  return parseFloat(value);
}

// Define constants at the top of the module
const FPS = getCSSVariable('--fps') || 60; // Default to 60 FPS if not defined
const FIXED_TIME_STEP = 1000 / FPS; // Milliseconds per frame
const MAX_FRAME_SKIP = 5;
const EMPIRICAL_ADJUSTMENT_FACTOR = 0.3; // Adjust as needed

/**
 * GameLoop class to manage the game loop.
 */
export class GameLoop {
  static accumulatedTime = 0;
  static lastTime = performance.now();
  static animationFrameId = null;

  /**
   * Starts the game loop.
   */
  static start() {
    cancelAnimationFrame(this.animationFrameId);
    elements.obstacle.style.display = 'block';
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.update.bind(this));
  }

  /**
   * Cancels the game loop.
   */
  static cancel() {
    cancelAnimationFrame(this.animationFrameId);
  }

  /**
   * Updates the game state and renders the next frame.
   * @param {number} currentTime - The current time.
   */
  static update(currentTime) {
    if (state.gameState !== GameState.PLAYING) { // Corrected condition
      this.animationFrameId = requestAnimationFrame(this.update.bind(this));
      return;
    }

    this.accumulatedTime += currentTime - this.lastTime;
    this.lastTime = currentTime;

    let frameSkip = 0;
    while (
      this.accumulatedTime >= FIXED_TIME_STEP &&
      frameSkip < MAX_FRAME_SKIP
    ) {
      this.updateGameObjects(currentTime, FIXED_TIME_STEP / 1000);
      this.accumulatedTime -= FIXED_TIME_STEP;
      frameSkip++;
    }

    if (frameSkip === MAX_FRAME_SKIP) {
      this.accumulatedTime = 0;
    }

    this.updateScore(currentTime);
    this.updateVisuals();

    if (checkCollision()) {
      endGame();
      return;
    }

    this.animationFrameId = requestAnimationFrame(this.update.bind(this));
  }

  /**
   * Updates the game objects.
   * @param {number} currentTime - The current time.
   * @param {number} deltaTime - The time difference between frames in seconds.
   */
  static updateGameObjects(currentTime, deltaTime) {
    this.updatePlayerPosition(currentTime);
    this.updateOrionPosition(currentTime);
    this.updateObstaclePosition(deltaTime);
    this.updateBackgroundPosition(deltaTime);

    state.currentSpeed = Math.min(
      state.currentSpeed + CONFIG.GAME.ACCELERATION * deltaTime,
      CONFIG.GAME.MAX_SPEED
    );
  }

  /**
   * Updates the player position.
   * @param {number} currentTime - The current time.
   */
  static updatePlayerPosition(currentTime) {
    const groundLevel = CONFIG.GAME.GROUND_LEVEL;
    if (state.isJumping) {
      const { bottom, isJumpFinished } = calculateJumpPosition(
        state.jumpStartTime,
        currentTime
      );
      state.playerBottom = groundLevel + bottom;
      if (isJumpFinished) {
        state.isJumping = false;
        elements.player.classList.remove('jumping');
      }
    } else {
      state.playerBottom = groundLevel;
    }
    elements.player.style.bottom = `${state.playerBottom}px`;
  }

  /**
   * Updates Orion's position.
   * @param {number} currentTime - The current time.
   */
  static updateOrionPosition(currentTime) {
    const groundLevel = CONFIG.GAME.GROUND_LEVEL;
    const jumpDurationSeconds = CONFIG.JUMP.DURATION / 1000;
    const jumpTriggerDistance = state.currentSpeed * jumpDurationSeconds;
    const empiricalAdjustment =
      state.currentSpeed * EMPIRICAL_ADJUSTMENT_FACTOR;
    const adjustedJumpTriggerDistance =
      jumpTriggerDistance - empiricalAdjustment;
    const distanceToObstacle = state.obstacleLeft - state.orionLeft;

    if (
      !state.orionIsJumping &&
      distanceToObstacle <= adjustedJumpTriggerDistance &&
      distanceToObstacle > 0
    ) {
      state.orionIsJumping = true;
      state.orionJumpStartTime = currentTime;
    }

    if (state.orionIsJumping) {
      const { bottom, isJumpFinished } = calculateJumpPosition(
        state.orionJumpStartTime,
        currentTime
      );
      state.orionBottom = groundLevel + bottom;
      if (isJumpFinished) {
        state.orionIsJumping = false;
      }
    } else {
      state.orionBottom = groundLevel;
    }

    elements.orion.style.bottom = `${state.orionBottom}px`;
  }

  /**
   * Updates the obstacle position.
   * @param {number} deltaTime - The time difference between frames in seconds.
   */
  static updateObstaclePosition(deltaTime) {
    state.obstacleLeft -= state.currentSpeed * deltaTime;
    if (state.obstacleLeft <= -CONFIG.OBSTACLE.WIDTH) {
      state.obstacleLeft = window.innerWidth;
    }
    elements.obstacle.style.left = `${state.obstacleLeft}px`;
  }

  /**
   * Updates the background position.
   * @param {number} deltaTime - The time difference between frames in seconds.
   */
  static updateBackgroundPosition(deltaTime) {
    state.backgroundPosX -= state.currentSpeed * deltaTime * 0.5;
    elements.gameContainer.style.backgroundPositionX = `${state.backgroundPosX}px`;
  }

  /**
   * Updates the game score.
   * @param {number} currentTime - The current time.
   */
  static updateScore(currentTime) {
    const deltaTime = (currentTime - state.lastFrameTime) / 1000;
    state.distanceRan += state.currentSpeed * deltaTime;
    state.score = Math.floor(
      state.distanceRan * CONFIG.SCORING.POINTS_PER_PERCENT
    );
    UI.updateScoreDisplay(state.score);
    state.lastFrameTime = currentTime;
  }

  /**
   * Updates the game visuals.
   */
  static updateVisuals() {
    elements.player.style.bottom = `${state.playerBottom}px`;
    elements.orion.style.bottom = `${state.orionBottom}px`;
    elements.obstacle.style.left = `${state.obstacleLeft}px`;
  }
}
