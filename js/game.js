// js/game.js

// ----------------------------------------
// Utility Functions
// ----------------------------------------

const assets = { images: {}, audio: {} };

/**
 * Logs a message with a specified log level.
 * @param {string} message - The message to log.
 * @param {'info'|'warn'|'error'} [level='info'] - The log level.
 */
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  console[level === 'error' ? 'error' : 'log'](
    `[${timestamp}] ${level.toUpperCase()}: ${message}`
  );
}

/**
 * Logs an error message.
 * @param {Error} error - The error to log.
 */
function logError(error) {
  log(`Error: ${error.message}`, 'error');
}

/**
 * Preloads all assets (images and audio).
 * @param {Object} assetList - The list of assets to preload.
 * @returns {Promise} Resolves when all assets are loaded.
 */
async function preloadAssets(assetList) {
  const loadPromises = [];

  assetList.images.forEach((src) => {
    loadPromises.push(
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          assets.images[src] = img;
          resolve();
        };
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
      })
    );
  });

  assetList.audio.forEach((src) => {
    loadPromises.push(
      new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.oncanplaythrough = () => {
          assets.audio[src] = audio;
          resolve();
        };
        audio.onerror = () => reject(new Error(`Failed to load audio: ${src}`));
        audio.src = src;
      })
    );
  });

  try {
    await Promise.all(loadPromises);
  } catch (error) {
    logError(error);
    throw error;
  }
}

/**
 * Gets a preloaded asset.
 * @param {'images'|'audio'} type - The type of the asset.
 * @param {string} src - The source URL of the asset.
 * @returns {HTMLImageElement|HTMLAudioElement} The preloaded asset.
 */
const getAsset = (type, src) => assets[type][src];

/**
 * Saves the high score to local storage.
 * @param {number} score - The high score to save.
 */
function saveHighScore(score) {
  try {
    localStorage.setItem('highScore', score.toString());
  } catch (e) {
    logError(e);
  }
}

/**
 * Loads the high score from local storage.
 * @returns {number} The high score.
 */
function loadHighScore() {
  try {
    return parseInt(localStorage.getItem('highScore')) || 0;
  } catch (e) {
    logError(e);
    return 0;
  }
}

/**
 * Calculates the jump position based on the jump start time and current time.
 * @param {number} jumpStartTime - The time the jump started.
 * @param {number} currentTime - The current time.
 * @returns {Object} An object with jump height and jump completion status.
 */
function calculateJumpPosition(jumpStartTime, currentTime) {
  const elapsedTime = currentTime - jumpStartTime;
  const jumpProgress = Math.min(elapsedTime / CONFIG.JUMP.DURATION, 1);
  const jumpHeight = Math.sin(jumpProgress * Math.PI) * CONFIG.JUMP.MAX_HEIGHT;

  return {
    jumpY: jumpHeight,
    isJumpFinished: jumpProgress === 1,
  };
}

/**
 * Calculates the hitboxes for collision detection.
 * @returns {Object} An object containing the player and obstacle hitboxes.
 */
function calculateHitboxes() {
  const playerRect = elements.player.getBoundingClientRect();
  const obstacleRect = elements.obstacle.getBoundingClientRect();

  const playerHitbox = {
    left: playerRect.left + playerRect.width * 0.2,
    right: playerRect.right - playerRect.width * 0.2,
    top: playerRect.top + playerRect.height * 0.1,
    bottom: playerRect.bottom - playerRect.height * 0.05,
  };

  return { playerHitbox, obstacleRect };
}

/**
 * Checks for collisions between the player and obstacle.
 * @returns {boolean} True if a collision is detected, false otherwise.
 */
function checkCollision() {
  const { playerHitbox, obstacleRect } = calculateHitboxes();

  return !(
    playerHitbox.bottom <= obstacleRect.top ||
    playerHitbox.top >= obstacleRect.bottom ||
    playerHitbox.right <= obstacleRect.left ||
    playerHitbox.left >= obstacleRect.right
  );
}

// ----------------------------------------
// Configuration and State Management
// ----------------------------------------

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
 * Converts a CSS time value to milliseconds.
 * @param {string} cssTime - The CSS time value.
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

function parseCSSValue(value) {
  value = value.trim();
  if (value.endsWith('px')) {
    return parseFloat(value);
  } else if (value.endsWith('vw')) {
    return (parseFloat(value) / 100) * window.innerWidth;
  } else if (value.endsWith('vh')) {
    return (parseFloat(value) / 100) * window.innerHeight;
  } else if (value.endsWith('%')) {
    // Handle percentages if necessary
    return parseFloat(value);
  } else {
    console.warn(`Unsupported CSS unit in value: ${value}`);
    return parseFloat(value);
  }
}

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
  fps: getCSSVariable('--fps'),
};

const CONFIG = {
   PLAYER: {
    WIDTH: parseCSSValue(CSS_VARS.playerWidth),
    HEIGHT: parseCSSValue(CSS_VARS.playerHeight),
    INITIAL_LEFT: parseCSSValue(CSS_VARS.playerLeft),
    JUMP_WIDTH: parseCSSValue(CSS_VARS.playerJumpWidth),
    JUMP_HEIGHT: parseCSSValue(CSS_VARS.playerJumpHeight),
  },
  ORION: {
    WIDTH: parseCSSValue(CSS_VARS.orionWidth),
    HEIGHT: parseCSSValue(CSS_VARS.orionHeight),
    INITIAL_LEFT: parseCSSValue(CSS_VARS.orionLeft),
  },
  OBSTACLE: {
    WIDTH: parseCSSValue(CSS_VARS.obstacleWidth),
    HEIGHT: parseCSSValue(CSS_VARS.obstacleHeight),
    INITIAL_LEFT: window.innerWidth,
  },
  GAME: {
    STARTING_SPEED: 31.25,
    MAX_SPEED: 300,
    ACCELERATION: 1.15,
    GROUND_LEVEL: (parseFloat(CSS_VARS.groundLevel) * window.innerHeight) / 100,
    CONTAINER_WIDTH: 100,
    WINDOW_WIDTH: window.innerWidth,
  },
  JUMP: {
    MAX_HEIGHT: parseFloat(CSS_VARS.jumpHeight),
    DURATION: cssTimeToMs(CSS_VARS.jumpDuration),
  },
  SCORING: {
    POINTS_PER_PERCENT: 0.5,
    OBSTACLE_BONUS: 100,
  },
  BACKGROUND: {
    INITIAL_DURATION: 20, // Initial duration in seconds
  },
  FPS: parseFloat(CSS_VARS.fps) || 60,
  GAME_LOOP: {
    MAX_FRAME_SKIP: 5,
    EMPIRICAL_ADJUSTMENT_FACTOR: 0.3,
  },
};

const GameState = {
  INITIAL: 'initial',
  PLAYING: 'playing',
  PAUSED: 'paused',
  CRASHED: 'crashed',
};

const elements = {};

/**
 * Represents the game state.
 */
class State {
  constructor() {
    this.highScore = 0;
    this.gameState = GameState.INITIAL;
    this.playerY = 0; // Using Y instead of bottom
    this.obstacleX = CONFIG.GAME.CONTAINER_WIDTH; // Using X instead of left
    this.orionX = CONFIG.ORION.INITIAL_LEFT; // Using X instead of left
    this.isJumping = false;
    this.jumpStartTime = 0;
    this.currentSpeed = CONFIG.GAME.STARTING_SPEED;
    this.lastFrameTime = 0;
    this.distanceRan = 0;
    this.backgroundPosX = 0;
    this.gameStartTime = 0;
    this.score = 0;
    this.orionY = 0; // Using Y instead of bottom
    this.orionIsJumping = false;
    this.orionJumpStartTime = 0;
    this.playerX = CONFIG.PLAYER.INITIAL_LEFT; // Using X instead of left
  }

  /**
   * Resets the game state to its initial values.
   */
  reset() {
    this.gameState = GameState.INITIAL;
    this.playerY = 0;
    this.obstacleX = CONFIG.GAME.CONTAINER_WIDTH;
    this.orionX = CONFIG.ORION.INITIAL_LEFT;
    this.isJumping = false;
    this.jumpStartTime = 0;
    this.currentSpeed = CONFIG.GAME.STARTING_SPEED;
    this.lastFrameTime = 0;
    this.distanceRan = 0;
    this.backgroundPosX = 0;
    this.gameStartTime = 0;
    this.score = 0;
    this.orionY = 0;
    this.orionIsJumping = false;
    this.orionJumpStartTime = 0;
    this.playerX = CONFIG.PLAYER.INITIAL_LEFT;
  }
}

/**
 * Singleton instance of the game state.
 */
const state = new State();

/**
 * Initializes DOM elements by assigning them to the elements object.
 * @throws {Error} If a required DOM element is not found.
 */
function initDOMElements() {
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

  const groundLevel = CONFIG.GAME.GROUND_LEVEL;

  // Initialize transforms with fixed X positions and correct Y positions
  elements.player.style.transform = `translate(${state.playerX}px, ${-state.playerY}px)`;
  elements.orion.style.transform = `translate(${state.orionX}px, ${-state.orionY}px)`;

  elements.obstacle.style.display = 'none';
  elements.obstacle.style.top = `${groundLevel - CONFIG.OBSTACLE.HEIGHT}px`; // Align with ground
  state.obstacleX = CONFIG.GAME.WINDOW_WIDTH;
  elements.obstacle.style.transform = `translate(${state.obstacleX}px, ${elements.obstacle.style.top})`;
}

/**
 * Handles state transitions for the game.
 * @param {string} action - The action to handle.
 */
function handleStateTransition(action) {
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

const keyActions = {
  Space: () => handleStateTransition(
    state.gameState === GameState.PLAYING ? 'JUMP' : 'START'
  ),
  KeyP: () => handleStateTransition(
    state.gameState === GameState.PLAYING ? 'PAUSE' : 'RESUME'
  ),
};

let spaceKeyDisabled = false;

/**
 * Handles the keydown event.
 * @param {KeyboardEvent} e - The keyboard event.
 */
function handleKeydown(e) {
  try {
    if (e.code === 'Space' && spaceKeyDisabled) return;
    const action = keyActions[e.code];
    if (action) {
      action();
    }
  } catch (error) {
    logError(error);
  }
}

/**
 * Handles the touchstart event.
 */
function handleTouchStart() {
  if (state.gameState === GameState.PLAYING) {
    handleStateTransition('JUMP');
  } else if (state.gameState === GameState.INITIAL || state.gameState === GameState.CRASHED) {
    handleStateTransition('START');
  }
}

/**
 * Sets up event listeners for keydown and touchstart events.
 */
function setupEventListeners() {
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('touchstart', handleTouchStart);
}

/**
 * Updates the game score display.
 * @param {number} score - The current score.
 */
const UI = {
  updateScoreDisplay(score) {
    elements.scoreDisplay.textContent = `Score: ${score}`;
  },
  updateEndGame(finalScore) {
    elements.finalScoreDisplay.textContent = `${finalScore}`;
    elements.highScoreDisplay.textContent = `High Score: ${state.highScore}`;
    elements.gameOverMessage.classList.remove('hidden');
    elements.instructionDialog.style.display = 'block';
    elements.gameContainer.classList.remove('parallax');
  },
  updateInitial() {
    elements.highScoreDisplay.textContent = `High Score: ${state.highScore}`;
    elements.gameOverMessage.classList.add('hidden');
    elements.instructionDialog.style.display = 'block';
    elements.gameContainer.classList.remove('parallax');
  },
};

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

function setupGameVisuals(assetList) {
  assetList.images.forEach((asset) => {
    const assetName = asset.substring(asset.lastIndexOf('/') + 1);
    const elementKey = assetToElementMap[assetName];
    if (!elementKey) {
      log(`No mapping found for asset: ${assetName}`, 'warn');
      return;
    }
    const element = elements[elementKey];
    const image = getAsset('images', asset);
    if (element && image) {
      if (elementKey === 'gameContainer') {
        // For background, ensure no-repeat and cover
        element.style.backgroundImage = `url(${image.src})`;
        element.style.backgroundRepeat = 'no-repeat';
        element.style.backgroundSize = 'cover';
        element.style.backgroundPosition = 'center';
      } else {
        element.style.backgroundImage = `url(${image.src})`;
      }
    } else {
      log(`Failed to set background image for ${elementKey}`, 'warn');
    }
  });
}

/**
 * Starts the game.
 */
function startGame() {
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
function resetGame() {
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
  // Position elements using transform
  elements.player.style.transform = `translate(${state.playerX}px, ${-state.playerY}px)`;
  elements.orion.style.transform = `translate(${state.orionX}px, ${-state.orionY}px)`;
  elements.obstacle.style.transform = `translate(${state.obstacleX}px, ${CONFIG.GAME.GROUND_LEVEL + CONFIG.PLAYER.HEIGHT / 2}px)`;
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
function endGame() {
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
  elements.gameContainer.classList.remove('parallax');
}

/**
 * Handles the player's jump action.
 */
function handleJump() {
  if (!state.isJumping) {
    state.isJumping = true;
    state.jumpStartTime = performance.now();
    elements.player.classList.add('jumping');
    elements.player.style.animationPlayState = 'running';
    log('Player jumped');
  }
}

/**
 * Updates Orion's state based on jumping and playing status.
 * @param {boolean} isJumping - Indicates whether Orion is jumping.
 * @param {boolean} isPlaying - Indicates whether the game is being played.
 */
function updateOrionState(isJumping, isPlaying) {
  elements.orion.classList.toggle('jumping', isJumping);
  elements.orion.style.animationPlayState = isPlaying ? 'running' : 'paused';
}

/**
 * Pauses the game.
 */
function pauseGame() {
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
function resumeGame() {
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

// ----------------------------------------
// Game Loop
// ----------------------------------------

/**
 * GameLoop class to manage the game loop.
 */
class GameLoop {
  static accumulatedTime = 0;
  static lastTime = performance.now();
  static animationFrameId = null;
  static FIXED_TIME_STEP = 1000 / CONFIG.FPS;
  static MAX_FRAME_SKIP = CONFIG.GAME_LOOP.MAX_FRAME_SKIP;
  static EMPIRICAL_ADJUSTMENT_FACTOR =
    CONFIG.GAME_LOOP.EMPIRICAL_ADJUSTMENT_FACTOR;

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
    if (state.gameState !== GameState.PLAYING) {
      this.animationFrameId = requestAnimationFrame(this.update.bind(this));
      return;
    }

    this.accumulatedTime += currentTime - this.lastTime;
    this.lastTime = currentTime;

    let frameSkip = 0;

    while (
      this.accumulatedTime >= this.FIXED_TIME_STEP &&
      frameSkip < this.MAX_FRAME_SKIP
    ) {
      this.updateGameObjects(currentTime, this.FIXED_TIME_STEP / 1000);
      this.accumulatedTime -= this.FIXED_TIME_STEP;
      frameSkip++;
    }

    if (frameSkip === this.MAX_FRAME_SKIP) {
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

    // Increase game speed smoothly
    state.currentSpeed = Math.min(
      state.currentSpeed + CONFIG.GAME.ACCELERATION * deltaTime,
      CONFIG.GAME.MAX_SPEED
    );
  }

  /**
   * Updates the player position using transform.
   * @param {number} currentTime - The current time.
   */
  static updatePlayerPosition(currentTime) {
    if (state.isJumping) {
      const { jumpY, isJumpFinished } = calculateJumpPosition(
        state.jumpStartTime,
        currentTime
      );
      state.playerY = jumpY;
      if (isJumpFinished) {
        state.isJumping = false;
        elements.player.classList.remove('jumping');
        elements.player.style.animationPlayState = 'running';
      }
    } else {
      state.playerY = 0;
    }
    elements.player.style.transform = `translate(${state.playerX}px, -${state.playerY}px)`;
  }

  /**
   * Updates Orion's position using transform.
   * @param {number} currentTime - The current time.
   */
  static updateOrionPosition(currentTime) {
    const jumpDurationSeconds = CONFIG.JUMP.DURATION / 1000;
    const jumpTriggerDistance = state.currentSpeed * jumpDurationSeconds;
    const empiricalAdjustment =
      state.currentSpeed *
      CONFIG.GAME.ACCELERATION *
      this.EMPIRICAL_ADJUSTMENT_FACTOR;
    const distanceToObstacle = state.obstacleX - state.orionX;
    const adjustedJumpTriggerDistance = jumpTriggerDistance - empiricalAdjustment;

    if (
      !state.orionIsJumping &&
      distanceToObstacle <= adjustedJumpTriggerDistance &&
      distanceToObstacle > 0
    ) {
      state.orionIsJumping = true;
      state.orionJumpStartTime = currentTime;
    }

    if (state.orionIsJumping) {
      const { jumpY, isJumpFinished } = calculateJumpPosition(
        state.orionJumpStartTime,
        currentTime
      );
      state.orionY = jumpY;
      if (isJumpFinished) {
        state.orionIsJumping = false;
      }
    }

    elements.orion.style.transform = `translate(${state.orionX}px, ${-state.orionY}px)`;
  }

  /**
   * Updates the obstacle position using transform.
   * @param {number} deltaTime - The time difference between frames in seconds.
   */
  static updateObstaclePosition(deltaTime) {
    state.obstacleX -= state.currentSpeed * deltaTime;
    if (state.obstacleX <= -CONFIG.OBSTACLE.WIDTH) {
      state.obstacleX = CONFIG.GAME.WINDOW_WIDTH;
    }
    const obstacleY = CONFIG.GAME.GROUND_LEVEL - CONFIG.OBSTACLE.HEIGHT;
    elements.obstacle.style.transform = `translate(${state.obstacleX}px, ${-obstacleY}px)`;
  }

  /**
   * Updates the background position using transform for parallax effect.
   */
  static updateBackgroundPosition() {
    const speedFactor = state.currentSpeed / CONFIG.GAME.STARTING_SPEED;
    const backgroundDuration = CONFIG.BACKGROUND.INITIAL_DURATION / speedFactor;
    document.documentElement.style.setProperty('--game-speed', `${backgroundDuration}s`);
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
    // Already handled by individual update functions
    // This can be used for additional visual updates if necessary
  }
}

// ----------------------------------------
// Initialization
// ----------------------------------------

const assetList = {
  images: [
    'assets/player_sprite_sheet.png',
    'assets/player-jump_sprite_sheet.png',
    'assets/orion_sprite_sheet.png',
    'assets/obstacle.png',
    'assets/background.svg',
  ],
  audio: [],
};

/**
 * Initializes the game by preloading assets, setting up DOM elements,
 * event listeners, and game visuals, and updating the UI.
 */
async function initializeGame() {
  try {
    await preloadAssets(assetList);
    state.highScore = loadHighScore();
    initDOMElements();
    setupEventListeners();
    setupGameVisuals(assetList);
    UI.updateInitial();
  } catch (error) {
    logError(error);
  }
}

/**
 * Initializes the game once the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', initializeGame);

// ----------------------------------------
// Exported Members
// ----------------------------------------

export { CONFIG, GameState, elements, state, UI, initializeGame, GameLoop };
