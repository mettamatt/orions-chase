// js/game.js

// ----------------------------------------
// Constants and Enumerations
// ----------------------------------------

const GAME_STATES = {
  INITIAL: 'initial',
  PLAYING: 'playing',
  PAUSED: 'paused',
  CRASHED: 'crashed',
};

const ACTIONS = {
  START: 'START',
  PAUSE: 'PAUSE',
  RESUME: 'RESUME',
  JUMP: 'JUMP',
};

const LOG_LEVELS = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

// ----------------------------------------
// Utility Functions
// ----------------------------------------

const assets = { images: {}, audio: {} };

/**
 * Logs a message with a specified log level.
 * @param {string} message - The message to log.
 * @param {keyof LOG_LEVELS} [level=LOG_LEVELS.INFO] - The log level.
 */
const log = (message, level = LOG_LEVELS.INFO) => {
  const timestamp = new Date().toISOString();
  const logMethod = console[level] || console.log;
  logMethod(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
};

/**
 * Logs an error message.
 * @param {Error} error - The error to log.
 */
const logError = (error) => {
  log(`Error: ${error.message}`, LOG_LEVELS.ERROR);
};

/**
 * Preloads all assets (images and audio).
 * @param {Object} assetList - The list of assets to preload.
 * @returns {Promise<void>} Resolves when all assets are loaded.
 */
const preloadAssets = async (assetList) => {
  try {
    const imagePromises = assetList.images.map(
      (src) =>
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

    const audioPromises = assetList.audio.map(
      (src) =>
        new Promise((resolve, reject) => {
          const audio = new Audio();
          audio.oncanplaythrough = () => {
            assets.audio[src] = audio;
            resolve();
          };
          audio.onerror = () =>
            reject(new Error(`Failed to load audio: ${src}`));
          audio.src = src;
        })
    );

    await Promise.all([...imagePromises, ...audioPromises]);
    log('All assets preloaded successfully.');
  } catch (error) {
    logError(error);
    throw error;
  }
};

/**
 * Retrieves a preloaded asset.
 * @param {'images'|'audio'} type - The type of the asset.
 * @param {string} src - The source URL of the asset.
 * @returns {HTMLImageElement|HTMLAudioElement} The preloaded asset.
 */
const getAsset = (type, src) => assets[type][src];

/**
 * Saves the high score to local storage.
 * @param {number} score - The high score to save.
 */
const saveHighScore = (score) => {
  try {
    localStorage.setItem('highScore', score.toString());
    log(`High score saved: ${score}`, LOG_LEVELS.INFO);
  } catch (error) {
    logError(error);
  }
};

/**
 * Loads the high score from local storage.
 * @returns {number} The high score.
 */
const loadHighScore = () => {
  try {
    const storedScore = parseInt(localStorage.getItem('highScore'), 10);
    const highScore = isNaN(storedScore) ? 0 : storedScore;
    log(`High score loaded: ${highScore}`, LOG_LEVELS.INFO);
    return highScore;
  } catch (error) {
    logError(error);
    return 0;
  }
};

/**
 * Calculates the jump position based on the jump start time and current time.
 * @param {number} jumpStartTime - The time the jump started.
 * @param {number} currentTime - The current time.
 * @param {number} duration - Jump duration in milliseconds.
 * @param {number} maxHeight - Maximum jump height.
 * @returns {Object} An object with jump height and jump completion status.
 */
const calculateJumpPosition = (
  jumpStartTime,
  currentTime,
  duration,
  maxHeight
) => {
  const elapsedTime = currentTime - jumpStartTime;
  const jumpProgress = Math.min(elapsedTime / duration, 1);
  const jumpHeight = Math.sin(jumpProgress * Math.PI) * maxHeight;

  return {
    jumpY: jumpHeight,
    isJumpFinished: jumpProgress === 1,
  };
};

/**
 * Retrieves the value of a CSS variable.
 * @param {string} variableName - The name of the CSS variable.
 * @returns {string} The value of the CSS variable.
 */
const getCSSVariable = (variableName) =>
  getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();

/**
 * Converts a CSS time value to milliseconds.
 * @param {string} cssTime - The CSS time value.
 * @returns {number} The time in milliseconds.
 */
const cssTimeToMs = (cssTime) => {
  if (cssTime.endsWith('ms')) {
    return parseFloat(cssTime);
  } else if (cssTime.endsWith('s')) {
    return parseFloat(cssTime) * 1000;
  }
  return parseFloat(cssTime);
};

/**
 * Parses a CSS size value and converts it to pixels.
 * @param {string} value - The CSS size value.
 * @returns {number} The size in pixels.
 */
const parseCSSValue = (value) => {
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
    log(`Unsupported CSS unit in value: ${value}`, LOG_LEVELS.WARN);
    return parseFloat(value);
  }
};

// ----------------------------------------
// Configuration
// ----------------------------------------

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
    STARTING_SPEED: 200, // pixels per second
    MAX_SPEED: 600, // pixels per second
    ACCELERATION: 10, // pixels per second squared
    GROUND_LEVEL: (parseFloat(CSS_VARS.groundLevel) * window.innerHeight) / 100,
    CONTAINER_WIDTH: window.innerWidth,
    WINDOW_WIDTH: window.innerWidth,
    SPEED_INCREMENT_INTERVAL: 5000, // milliseconds
    SPEED_INCREMENT_AMOUNT: 20, // pixels per second
  },
  JUMP: {
    MAX_HEIGHT: parseFloat(CSS_VARS.jumpHeight),
    DURATION: cssTimeToMs(CSS_VARS.jumpDuration),
  },
  SCORING: {
    POINTS_PER_SECOND: 1, // Points per second of survival
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

// ----------------------------------------
// State Management
// ----------------------------------------

const elements = {};

/**
 * Represents the game state.
 */
class State {
  constructor() {
    this.reset();
  }

  /**
   * Resets the game state to its initial values.
   */
  reset() {
    this.highScore = loadHighScore();
    this.gameState = GAME_STATES.INITIAL;
    this.playerY = 0; // Vertical position
    this.obstacleX = CONFIG.OBSTACLE.INITIAL_LEFT;
    this.isJumping = false;
    this.jumpStartTime = 0;
    this.currentSpeed = CONFIG.GAME.STARTING_SPEED;
    this.lastFrameTime = 0;
    this.distanceRan = 0;
    this.score = 0;
    this.gameStartTime = 0;
    this.orionIsJumping = false;
    this.orionJumpStartTime = 0;
    this.lastSpeedIncrementTime = 0;
  }
}

const state = new State();

// ----------------------------------------
// DOM Initialization
// ----------------------------------------

/**
 * Initializes DOM elements by assigning them to the elements object.
 * @throws {Error} If a required DOM element is not found.
 */
const initDOMElements = () => {
  const elementIdToKey = {
    player: 'player',
    orion: 'orion',
    obstacle: 'obstacle',
    score: 'score',
    'high-score': 'highScore',
    'final-score': 'finalScore',
    'instruction-dialog': 'instructionDialog',
    'game-container': 'gameContainer',
    'sky-background': 'skyBackground', 
    'ground': 'ground',               
    'game-over-message': 'gameOverMessage',
    'instruction-message': 'instructionMessage',
  };

  Object.entries(elementIdToKey).forEach(([id, key]) => {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Required DOM element not found: ${id}`);
    }
    elements[key] = element;
  });

  // Initialize obstacle position
  elements.obstacle.style.left = `${CONFIG.OBSTACLE.INITIAL_LEFT}px`;
  // Obstacle's bottom is dynamically set in updateObstaclePosition

  // Ensure bottom positions are set via CSS
  elements.player.style.bottom = 'var(--ground-level)';
  elements.orion.style.bottom = 'var(--ground-level)';
  elements.ground.style.bottom = '0'; // Ground is already positioned at bottom

  // Remove any vertical translations
  elements.player.style.transform = 'translateY(0)';
  elements.orion.style.transform = 'translateY(0)';

  log('DOM elements initialized.', LOG_LEVELS.INFO);
};

// ----------------------------------------
// UI Management
// ----------------------------------------

const UI = {
  /**
   * Updates the game score display.
   * @param {number} score - The current score.
   */
  updateScoreDisplay(score) {
    elements.score.textContent = `Score: ${score}`;
  },

  /**
   * Updates the end game UI with the final score and high score.
   * @param {number} finalScore - The final score achieved.
   */
  updateEndGame(finalScore) {
    elements.finalScore.textContent = `${finalScore}`;
    elements.highScore.textContent = `High Score: ${state.highScore}`;
    elements.gameOverMessage.classList.remove('hidden');
    elements.instructionDialog.style.display = 'block';
    elements.gameContainer.classList.remove('parallax'); // Stop background
  },

  /**
   * Updates the initial UI before the game starts.
   */
  updateInitial() {
    elements.highScore.textContent = `High Score: ${state.highScore}`;
    elements.gameOverMessage.classList.add('hidden');
    elements.instructionDialog.style.display = 'block';
    elements.gameContainer.classList.remove('parallax'); // Ensure background is stopped
  },

  /**
   * Updates the game UI based on the playing state.
   * @param {boolean} isPlaying - Indicates whether the game is currently being played.
   */
  updateGameUI(isPlaying) {
    // Apply vertical translation only
    elements.player.style.transform = `translateY(-${state.playerY}px)`;
    elements.orion.style.transform = `translateY(-${state.orionY}px)`;
    elements.obstacle.style.transform = `translate(${state.obstacleX}px, ${0}px)`;
    elements.obstacle.style.display = isPlaying ? 'block' : 'none';

    elements.gameOverMessage.style.display = 'none';
    elements.instructionDialog.style.display = isPlaying ? 'none' : 'block';
    elements.player.style.animationPlayState = isPlaying ? 'running' : 'paused';
    elements.orion.style.animationPlayState = isPlaying ? 'running' : 'paused';
    UI.updateScoreDisplay(isPlaying ? 0 : state.score);
    elements.highScore.textContent = `High Score: ${state.highScore}`;
    elements.gameContainer.classList.toggle('parallax', isPlaying); // Start or stop background
  },
};

// ----------------------------------------
// Game Visuals Setup
// ----------------------------------------

const assetToElementMap = {
  'player_sprite_sheet.png': 'player',
  // 'player-jump_sprite_sheet.png': 'player', // Already handled separately
  'orion_sprite_sheet.png': 'orion',
  'obstacle.png': 'obstacle',
  'sky.svg': 'skyBackground',
  'ground.svg': 'ground',
};

/**
 * Sets up the game visuals by applying background images to elements.
 * @param {Object} assetList - The list of assets to set up.
 */
const setupGameVisuals = (assetList) => {
  assetList.images.forEach((asset) => {
    const assetName = asset.substring(asset.lastIndexOf('/') + 1);
    const elementKey = assetToElementMap[assetName];
    if (!elementKey) {
      log(`No mapping found for asset: ${assetName}`, LOG_LEVELS.WARN);
      return;
    }
    const element = elements[elementKey];
    const image = getAsset('images', asset);
    if (element && image) {
      if (['player_sprite_sheet.png', 'orion_sprite_sheet.png', 'obstacle.png'].includes(assetName)) {
        element.style.backgroundImage = `url(${image.src})`;
      }
      // Background images are handled via CSS, no action needed here
    } else {
      log(`Failed to set background image for ${elementKey}`, LOG_LEVELS.WARN);
    }
  });
  log('Game visuals set up.', LOG_LEVELS.INFO);
};

/**
 * Preloads the jump sprite sheet separately to avoid initial loading.
 * @returns {Promise<void>} Resolves when the jump sprite sheet is loaded.
 */
const preloadJumpSprite = () => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      assets.images['player-jump_sprite_sheet.png'] = img;
      log('Jump sprite sheet preloaded.', LOG_LEVELS.INFO);
      resolve();
    };
    img.onerror = () =>
      reject(new Error('Failed to load player-jump_sprite_sheet.png'));
    img.src = 'assets/player-jump_sprite_sheet.png';
  });
};

// ----------------------------------------
// Event Handling
// ----------------------------------------

const keyActions = {
  Space: () =>
    handleStateTransition(
      state.gameState === GAME_STATES.PLAYING ? ACTIONS.JUMP : ACTIONS.START
    ),
  KeyP: () =>
    handleStateTransition(
      state.gameState === GAME_STATES.PLAYING ? ACTIONS.PAUSE : ACTIONS.RESUME
    ),
};

/**
 * Handles the keydown event.
 * @param {KeyboardEvent} e - The keyboard event.
 */
const handleKeydown = (e) => {
  try {
    if (e.code === 'Space' && state.gameState === GAME_STATES.INITIAL) {
      e.preventDefault(); // Prevent default behavior like page scrolling
      keyActions.Space();
      return;
    }

    const action = keyActions[e.code];
    if (action) {
      e.preventDefault(); // Prevent default behavior like page scrolling
      action();
    }
  } catch (error) {
    logError(error);
  }
};

/**
 * Handles the touchstart event.
 */
const handleTouchStart = () => {
  if (state.gameState === GAME_STATES.PLAYING) {
    handleStateTransition(ACTIONS.JUMP);
  } else if (
    [GAME_STATES.INITIAL, GAME_STATES.CRASHED].includes(state.gameState)
  ) {
    handleStateTransition(ACTIONS.START);
  }
};

/**
 * Sets up event listeners for keydown and touchstart events.
 */
const setupEventListeners = () => {
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('touchstart', handleTouchStart);
  log('Event listeners set up.', LOG_LEVELS.INFO);
};

// ----------------------------------------
// State Transition Handling
// ----------------------------------------

/**
 * Handles state transitions based on actions.
 * @param {string} action - The action to handle.
 */
const handleStateTransition = (action) => {
  log(`Handling ${action} in state: ${state.gameState}`, LOG_LEVELS.INFO);
  switch (state.gameState) {
    case GAME_STATES.INITIAL:
    case GAME_STATES.CRASHED:
      if (action === ACTIONS.START) {
        resetGame();
        startGame();
      }
      break;
    case GAME_STATES.PLAYING:
      if (action === ACTIONS.JUMP) {
        handleJump();
      } else if (action === ACTIONS.PAUSE) {
        pauseGame();
      }
      break;
    case GAME_STATES.PAUSED:
      if (action === ACTIONS.RESUME) {
        resumeGame();
      }
      break;
    default:
      log(`Unhandled game state: ${state.gameState}`, LOG_LEVELS.WARN);
  }
};

// ----------------------------------------
// Game Control Functions
// ----------------------------------------

/**
 * Starts the game.
 */
const startGame = () => {
  state.lastFrameTime = performance.now();
  state.gameState = GAME_STATES.PLAYING;
  UI.updateGameUI(true);
  GameLoop.start();
  elements.instructionDialog.style.display = 'none';
  elements.player.classList.add('running');
  elements.orion.classList.add('running');
  elements.obstacle.style.display = 'block';
  elements.gameContainer.classList.add('parallax'); // Start background animation
  state.gameStartTime = performance.now();
  state.lastSpeedIncrementTime = performance.now();
  log('Game started.', LOG_LEVELS.INFO);
};

/**
 * Resets the game.
 */
const resetGame = () => {
  GameLoop.cancel();
  state.reset();
  UI.updateGameUI(false);
  elements.instructionDialog.style.display = 'block';
  elements.gameOverMessage.classList.add('hidden');
  elements.obstacle.style.display = 'none';
  elements.player.classList.remove('jumping');
  elements.player.classList.remove('running');
  elements.orion.classList.remove('running');
  elements.gameContainer.classList.remove('parallax'); // Stop background animation
  log('Game reset.', LOG_LEVELS.INFO);
};

/**
 * Ends the game.
 */
const endGame = () => {
  GameLoop.cancel();
  state.gameState = GAME_STATES.CRASHED;
  elements.player.classList.remove('jumping');
  elements.player.classList.remove('running');
  elements.orion.classList.remove('running');

  const finalScore = state.score;
  if (finalScore > state.highScore) {
    state.highScore = finalScore;
    saveHighScore(state.highScore);
  }

  UI.updateEndGame(finalScore);
  log(`Game ended. Final score: ${finalScore}`, LOG_LEVELS.INFO);
  elements.gameContainer.classList.remove('parallax'); // Stop background animation
};

/**
 * Handles the player's jump action.
 */
const handleJump = () => {
  if (!state.isJumping) {
    state.isJumping = true;
    state.jumpStartTime = performance.now();
    elements.player.classList.add('jumping');
    log('Player jumped.', LOG_LEVELS.INFO);
  }
};

/**
 * Pauses the game.
 */
const pauseGame = () => {
  if (state.gameState === GAME_STATES.PLAYING) {
    GameLoop.cancel();
    state.gameState = GAME_STATES.PAUSED;
    elements.player.style.animationPlayState = 'paused';
    elements.orion.style.animationPlayState = 'paused';
    elements.gameContainer.classList.remove('parallax'); // Stop background animation
    log('Game paused.', LOG_LEVELS.INFO);
  }
};

/**
 * Resumes the game.
 */
const resumeGame = () => {
  if (state.gameState === GAME_STATES.PAUSED) {
    state.lastFrameTime = performance.now();
    state.gameState = GAME_STATES.PLAYING;
    elements.player.style.animationPlayState = 'running';
    elements.orion.style.animationPlayState = 'running';
    elements.gameContainer.classList.add('parallax'); // Start background animation
    GameLoop.start();
    log('Game resumed.', LOG_LEVELS.INFO);
  }
};

// ----------------------------------------
// Game Loop
// ----------------------------------------

class GameLoopClass {
  constructor() {
    this.accumulatedTime = 0;
    this.lastTime = performance.now();
    this.animationFrameId = null;
    this.FIXED_TIME_STEP = 1000 / CONFIG.FPS;
    this.MAX_FRAME_SKIP = CONFIG.GAME_LOOP.MAX_FRAME_SKIP;
    this.EMPIRICAL_ADJUSTMENT_FACTOR =
      CONFIG.GAME_LOOP.EMPIRICAL_ADJUSTMENT_FACTOR;
  }

  /**
   * Starts the game loop.
   */
  start() {
    cancelAnimationFrame(this.animationFrameId);
    this.lastTime = performance.now();
    this.accumulatedTime = 0;
    this.animationFrameId = requestAnimationFrame(this.update.bind(this));
    log('Game loop started.', LOG_LEVELS.INFO);
  }

  /**
   * Cancels the game loop.
   */
  cancel() {
    cancelAnimationFrame(this.animationFrameId);
    log('Game loop canceled.', LOG_LEVELS.INFO);
  }

  /**
   * The main update loop.
   * @param {number} currentTime - The current time.
   */
  update(currentTime) {
    if (state.gameState !== GAME_STATES.PLAYING) {
      this.animationFrameId = requestAnimationFrame(this.update.bind(this));
      return;
    }

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    this.accumulatedTime += deltaTime;

    let frameSkip = 0;

    while (
      this.accumulatedTime >= this.FIXED_TIME_STEP &&
      frameSkip < this.MAX_FRAME_SKIP
    ) {
      this.updateGameObjects(this.FIXED_TIME_STEP / 1000);
      this.accumulatedTime -= this.FIXED_TIME_STEP;
      frameSkip++;
    }

    if (frameSkip === this.MAX_FRAME_SKIP) {
      this.accumulatedTime = 0;
    }

    this.updateScore(currentTime);
    this.checkAndIncreaseSpeed(currentTime);
    this.updateVisuals();

    if (checkCollision()) {
      endGame();
      return;
    }

    this.animationFrameId = requestAnimationFrame(this.update.bind(this));
  }

  /**
   * Updates all game objects.
   * @param {number} deltaTime - The time difference between frames in seconds.
   */
  updateGameObjects(deltaTime) {
    this.updateObstaclePosition(deltaTime);
    this.updatePlayerPosition();
    this.updateOrionPosition();
    // No need to handle background position here as CSS manages it
  }

  /**
   * Updates the obstacle position.
   * @param {number} deltaTime - The time difference between frames in seconds.
   */
  updateObstaclePosition(deltaTime) {
    state.obstacleX -= state.currentSpeed * deltaTime;
    if (state.obstacleX <= -CONFIG.OBSTACLE.WIDTH) {
      state.obstacleX = CONFIG.GAME.WINDOW_WIDTH;
      state.score += CONFIG.SCORING.OBSTACLE_BONUS; // Bonus for passing obstacle
      UI.updateScoreDisplay(state.score);
    }

    // Calculate Player's center Y position
    const playerCenterY = CONFIG.GAME.GROUND_LEVEL + CONFIG.PLAYER.HEIGHT / 2;
    // Calculate Obstacle's bottom to align centers
    const obstacleBottom = playerCenterY - CONFIG.OBSTACLE.HEIGHT / 2;
    elements.obstacle.style.bottom = `${obstacleBottom}px`;

    elements.obstacle.style.left = `${state.obstacleX}px`;
  }

  /**
   * Updates the player position using transform.
   */
  updatePlayerPosition() {
    if (state.isJumping) {
      const { jumpY, isJumpFinished } = calculateJumpPosition(
        state.jumpStartTime,
        performance.now(),
        CONFIG.JUMP.DURATION,
        CONFIG.JUMP.MAX_HEIGHT
      );
      state.playerY = jumpY;
      if (isJumpFinished) {
        state.isJumping = false;
        elements.player.classList.remove('jumping');
        elements.player.classList.add('running');
      }
    } else {
      state.playerY = 0;
    }
    // Apply vertical translation only
    elements.player.style.transform = `translateY(-${state.playerY}px)`;
  }

  /**
   * Updates Orion's position using transform.
   */
  updateOrionPosition() {
    const timeSinceGameStart = performance.now() - state.gameStartTime;
    const jumpDurationSeconds = CONFIG.JUMP.DURATION / 1000;
    const jumpInterval = (state.currentSpeed * jumpDurationSeconds * 2) / 1000; // Adjust as needed

    if (!state.orionIsJumping && timeSinceGameStart >= jumpInterval * 1000) {
      state.orionIsJumping = true;
      state.orionJumpStartTime = performance.now();
      state.gameStartTime = performance.now(); // Reset game start time for next jump
    }

    if (state.orionIsJumping) {
      const { jumpY, isJumpFinished } = calculateJumpPosition(
        state.orionJumpStartTime,
        performance.now(),
        CONFIG.JUMP.DURATION,
        CONFIG.JUMP.MAX_HEIGHT
      );
      state.orionY = jumpY;
      if (isJumpFinished) {
        state.orionIsJumping = false;
      }
    } else {
      state.orionY = 0;
    }

    elements.orion.style.transform = `translateY(-${state.orionY}px)`;
  }

  /**
   * Updates the game score based on survival time.
   * @param {number} currentTime - The current time.
   */
  updateScore(currentTime) {
    const deltaTime = (currentTime - state.lastFrameTime) / 1000;
    state.distanceRan += state.currentSpeed * deltaTime;
    state.score = Math.floor(
      state.distanceRan * CONFIG.SCORING.POINTS_PER_SECOND
    );
    UI.updateScoreDisplay(state.score);
    state.lastFrameTime = currentTime;
  }

  /**
   * Checks if it's time to increase the game speed and updates it.
   * @param {number} currentTime - The current time.
   */
  checkAndIncreaseSpeed(currentTime) {
    if (
      currentTime - state.lastSpeedIncrementTime >=
      CONFIG.GAME.SPEED_INCREMENT_INTERVAL
    ) {
      state.currentSpeed = Math.min(
        state.currentSpeed + CONFIG.GAME.SPEED_INCREMENT_AMOUNT,
        CONFIG.GAME.MAX_SPEED
      );
      // Update CSS variable for background speed
      const newGameSpeed =
        CONFIG.BACKGROUND.INITIAL_DURATION /
        (state.currentSpeed / CONFIG.GAME.STARTING_SPEED);
      document.documentElement.style.setProperty(
        '--background-speed',
        `${newGameSpeed}s`
      );
      state.lastSpeedIncrementTime = currentTime;
      log(`Game speed increased to ${state.currentSpeed}px/s`, LOG_LEVELS.INFO);
    }
  }

  /**
   * Updates the game visuals.
   */
  updateVisuals() {
    // Additional visual updates can be handled here if necessary
  }
}

const GameLoop = new GameLoopClass();

/**
 * Checks for collisions between the player and obstacle.
 * @returns {boolean} True if a collision is detected, false otherwise.
 */
const checkCollision = () => {
  const playerRect = elements.player.getBoundingClientRect();
  const obstacleRect = elements.obstacle.getBoundingClientRect();

  const collision =
    playerRect.right > obstacleRect.left &&
    playerRect.left < obstacleRect.right &&
    playerRect.bottom > obstacleRect.top &&
    playerRect.top < obstacleRect.bottom;

  if (collision) {
    log('Collision detected.', LOG_LEVELS.INFO);
  }

  return collision;
};

// ----------------------------------------
// Initialization
// ----------------------------------------

const assetList = {
  images: [
    'assets/player_sprite_sheet.png',
    // 'assets/player-jump_sprite_sheet.png', // Removed from initial mapping
    'assets/orion_sprite_sheet.png',
    'assets/obstacle.png',
    'assets/sky.svg',      
    'assets/ground.svg',
  ],
  audio: [], // Add audio asset paths if any
};

/**
 * Initializes the game by preloading assets, setting up DOM elements,
 * event listeners, and game visuals, and updating the UI.
 */
const initializeGame = async () => {
  try {
    await preloadAssets(assetList);
    await preloadJumpSprite(); // Preload jump sprite separately
    initDOMElements();
    setupEventListeners();
    setupGameVisuals(assetList);
    UI.updateInitial();
    log('Game initialized successfully.', LOG_LEVELS.INFO);
  } catch (error) {
    logError(error);
  }
};

/**
 * Initializes the game once the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', initializeGame);

// ----------------------------------------
// Exported Members (if needed elsewhere)
// ----------------------------------------

export { CONFIG, GAME_STATES, elements, state, UI, initializeGame, GameLoop };
