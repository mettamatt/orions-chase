// js/gameLogic.js

import { CONFIG, GameState } from './config.js';
import { log, saveHighScore, getAsset } from './utils.js';
import { GameLoop } from './gameLoop.js';
import { state, elements, initDOMElements } from './core.js'; // Updated import path

/**
 * Sets up the game visuals by applying background images to elements.
 * @param {Object} assetList - The list of assets to set up.
 */
const assetToElementMap = {
  'player_sprite_sheet.png': 'player',
  'player-jump_sprite_sheet.png': 'player',
  'orion_sprite_sheet.png': 'orion',
  'obstacle.png': 'obstacle',
  'background.svg': 'gameContainer',
};

export function setupGameVisuals(assetList) {
  assetList.images.forEach((asset) => {
    const assetName = asset.split('/').pop();
    const elementKey = assetToElementMap[assetName];
    if (!elementKey) {
      log(`No mapping found for asset: ${assetName}`, 'warn');
      return;
    }
    const element = elements[elementKey];
    const image = getAsset('images', asset);
    if (element && image) {
      element.style.backgroundImage = `url(${image.src})`;
    } else {
      log(`Failed to set background image for ${elementKey}`, 'warn');
    }
  });
}

/**
 * Starts the game.
 */
export function startGame() {
  state.lastFrameTime = performance.now();
  state.gameState = GameState.PLAYING;
  updateGameUI(true);
  GameLoop.start();
  elements.instructionDialog.style.display = 'none';
  elements.player.style.animationPlayState = 'running';
  elements.obstacle.style.display = 'block';
  updateOrionState(false, true);
  elements.gameContainer.classList.add('parallax');
  log('Game started');
}

/**
 * Resets the game.
 */
export function resetGame() {
  GameLoop.cancel();
  state.reset();
  updateGameUI(false);
  elements.instructionDialog.style.display = 'block';
  log('Game reset');
}

/**
 * Updates the game UI based on the playing state.
 * @param {boolean} isPlaying - Indicates whether the game is currently being played.
 */
function updateGameUI(isPlaying) {
  elements.player.style.bottom = `${state.playerBottom}px`;
  elements.orion.style.bottom = `${state.orionBottom}px`;
  elements.obstacle.style.left = `${state.obstacleLeft}px`;
  elements.obstacle.style.display = isPlaying ? 'block' : 'none';

  elements.gameOverMessage.style.display = 'none';
  elements.instructionDialog.style.display = isPlaying ? 'none' : 'block';
  elements.player.style.animationPlayState = isPlaying ? 'running' : 'paused';
  elements.orion.style.animationPlayState = isPlaying ? 'running' : 'paused';
  elements.scoreDisplay.textContent = 'Score: 0';
  elements.highScoreDisplay.textContent = `High Score: ${state.highScore}`;
  elements.gameContainer.classList.toggle('parallax', isPlaying);
}

/**
 * Ends the game.
 */
export function endGame() {
  GameLoop.cancel();
  state.gameState = GameState.CRASHED;
  elements.player.style.animationPlayState = 'paused';
  elements.orion.style.animationPlayState = 'paused';
  elements.player.classList.remove('jumping');

  const finalScore = state.score;
  if (finalScore > state.highScore) {
    state.highScore = finalScore;
    saveHighScore(state.highScore);
  }

  UI.updateEndGame(finalScore);
  log(`Game ended. Final score: ${finalScore}`);
}

/**
 * Handles the player's jump action.
 */
export function handleJump() {
  if (!state.isJumping) {
    state.isJumping = true;
    state.jumpStartTime = performance.now();
    elements.player.classList.add('jumping');
    log('Player jumped');
  }
}

/**
 * Updates Orion's state based on jumping and playing status.
 * @param {boolean} isJumping - Indicates whether Orion is jumping.
 * @param {boolean} isPlaying - Indicates whether the game is being played.
 */
export function updateOrionState(isJumping, isPlaying) {
  elements.orion.classList.toggle('jumping', isJumping);
  elements.orion.style.animationPlayState = isPlaying ? 'running' : 'paused';
}

/**
 * Pauses the game.
 */
export function pauseGame() {
  if (state.gameState === GameState.PLAYING) {
    GameLoop.cancel();
    state.gameState = GameState.PAUSED;
    elements.player.style.animationPlayState = 'paused';
    updateOrionState(state.orionIsJumping, false);
    elements.gameContainer.classList.remove('parallax');
    log('Game paused');
  }
}

/**
 * Resumes the game.
 */
export function resumeGame() {
  if (state.gameState === GameState.PAUSED) {
    state.lastFrameTime = performance.now();
    state.gameState = GameState.PLAYING;
    elements.player.style.animationPlayState = 'running';
    updateOrionState(state.orionIsJumping, true);
    elements.gameContainer.classList.add('parallax');
    GameLoop.start();
    log('Game resumed');
  }
}

/**
 * UI Module within Game Logic
 */
export const UI = {
  /**
   * Updates the game score display.
   * @param {number} score - The current score.
   */
  updateScoreDisplay(score) {
    elements.scoreDisplay.textContent = `Score: ${score}`;
  },

  /**
   * Updates the end game screen with the final score and high score.
   * @param {number} finalScore - The final score of the game.
   */
  updateEndGame(finalScore) {
    elements.finalScoreDisplay.textContent = `${finalScore}`;
    elements.highScoreDisplay.textContent = `High Score: ${state.highScore}`;
    elements.gameOverMessage.classList.remove('hidden');
    elements.instructionDialog.style.display = 'block';
    elements.gameContainer.classList.remove('parallax');
  },

  /**
   * Updates the initial game screen with the high score.
   */
  updateInitial() {
    elements.highScoreDisplay.textContent = `High Score: ${state.highScore}`;
    elements.gameOverMessage.classList.add('hidden');
    elements.instructionDialog.style.display = 'block';
    elements.gameContainer.classList.remove('parallax');
  },
};
