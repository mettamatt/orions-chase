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

const log = (message, level = LOG_LEVELS.INFO) => {
  const timestamp = new Date().toISOString();
  const logMethod = console[level] || console.log;
  logMethod(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
};

const logError = (error) => {
  log(`Error: ${error.message}`, LOG_LEVELS.ERROR);
};

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

const getAsset = (type, src) => assets[type][src];

const saveHighScore = (score) => {
  try {
    localStorage.setItem('highScore', score.toString());
    log(`High score saved: ${score}`, LOG_LEVELS.INFO);
  } catch (error) {
    logError(error);
  }
};

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

const calculateJumpPosition = (
  jumpStartTime,
  currentTime,
  duration,
  maxHeight
) => {
  const elapsedTime = currentTime - jumpStartTime;
  const jumpProgress = Math.min(elapsedTime / duration, 1);
  const jumpHeight = Math.sin(jumpProgress * Math.PI) * maxHeight;

  // Ensure the player doesn't move beyond the container's top
  const maxPlayerY =
    CONFIG.GAME.CONTAINER_HEIGHT -
    CONFIG.PLAYER.HEIGHT -
    CONFIG.GAME.GROUND_LEVEL;
  const adjustedJumpY = Math.min(jumpHeight, maxPlayerY);

  return {
    jumpY: adjustedJumpY,
    isJumpFinished: jumpProgress === 1,
  };
};

const getCSSVariable = (variableName) =>
  getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();

const cssTimeToMs = (cssTime) => {
  if (cssTime.endsWith('ms')) {
    return parseFloat(cssTime);
  } else if (cssTime.endsWith('s')) {
    return parseFloat(cssTime) * 1000;
  }
  return parseFloat(cssTime);
};

const parseCSSValue = (value) => {
  value = value.trim();
  if (value.endsWith('px')) {
    return parseFloat(value);
  } else if (value.endsWith('vw')) {
    return (parseFloat(value) / 100) * window.innerWidth;
  } else if (value.endsWith('vh')) {
    return (parseFloat(value) / 100) * window.innerHeight;
  } else if (value.endsWith('%')) {
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
    STARTING_SPEED: 400, // pixels per second
    MAX_SPEED: 800, // pixels per second
    ACCELERATION: 10, // pixels per second squared
    GROUND_LEVEL: parseCSSValue(CSS_VARS.groundLevel),
    CONTAINER_WIDTH: window.innerWidth,
    CONTAINER_HEIGHT: window.innerHeight,
    SPEED_INCREMENT_INTERVAL: 5000, // milliseconds
    SPEED_INCREMENT_AMOUNT: 20, // pixels per second
  },
  JUMP: {
    MAX_HEIGHT: parseCSSValue(CSS_VARS.jumpHeight),
    DURATION: cssTimeToMs(CSS_VARS.jumpDuration),
  },
  SCORING: {
    POINTS_PER_SECOND: 1,
    OBSTACLE_BONUS: 100,
  },
  BACKGROUND: {
    INITIAL_DURATION_SKY: 16, // default sky animation duration
    INITIAL_DURATION_GROUND: 8, // default ground animation duration
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

class State {
  constructor() {
    this.reset();
  }

  reset() {
    this.highScore = loadHighScore();
    this.gameState = GAME_STATES.INITIAL;
    this.playerY = 0;
    this.orionY = 0;
    this.obstacleX = CONFIG.GAME.CONTAINER_WIDTH + CONFIG.OBSTACLE.WIDTH + 100;
    this.collisionDisabledUntil = performance.now() + 500; // grace period
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
    ground: 'ground',
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

  elements.obstacle.style.left = `${CONFIG.OBSTACLE.INITIAL_LEFT}px`;
  elements.player.style.bottom = 'var(--ground-level)';
  elements.orion.style.bottom = 'var(--ground-level)';
  elements.ground.style.bottom = '0';

  elements.player.style.transform = 'translateY(0)';
  elements.orion.style.transform = 'translateY(0)';

  log('DOM elements initialized.', LOG_LEVELS.INFO);
};

// ----------------------------------------
// UI Management
// ----------------------------------------

const UI = {
  updateScoreDisplay(score) {
    elements.score.textContent = `Score: ${score}`;
  },

  updateEndGame(finalScore) {
    elements.finalScore.textContent = `${finalScore}`;
    elements.highScore.textContent = `High Score: ${state.highScore}`;
    elements.gameOverMessage.classList.remove('hidden');
    elements.instructionDialog.style.display = 'block';
    elements.gameContainer.classList.remove('parallax');
  },

  updateInitial() {
    elements.highScore.textContent = `High Score: ${state.highScore}`;
    elements.gameOverMessage.classList.add('hidden');
    elements.instructionDialog.style.display = 'block';
    elements.gameContainer.classList.remove('parallax');
  },

  updateGameUI(isPlaying) {
    // Only apply vertical translation
    elements.player.style.transform = `translateY(-${state.playerY}px)`;
    elements.orion.style.transform = `translateY(-${state.orionY}px)`;

    elements.obstacle.style.display = isPlaying ? 'block' : 'none';
    elements.gameOverMessage.style.display = 'none';
    elements.instructionDialog.style.display = isPlaying ? 'none' : 'block';
    elements.player.style.animationPlayState = isPlaying ? 'running' : 'paused';
    elements.orion.style.animationPlayState = isPlaying ? 'running' : 'paused';
    UI.updateScoreDisplay(isPlaying ? 0 : state.score);
    elements.highScore.textContent = `High Score: ${state.highScore}`;
    elements.gameContainer.classList.toggle('parallax', isPlaying);
  },
};

// ----------------------------------------
// Game Visuals Setup
// ----------------------------------------

const assetToElementMap = {
  'player_sprite_sheet.png': 'player',
  'orion_sprite_sheet.png': 'orion',
  'obstacle.png': 'obstacle',
  'sky.svg': 'skyBackground',
  'ground.svg': 'ground',
};

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
      // Skip setting background-image for player (handled by CSS)
      if (['orion_sprite_sheet.png', 'obstacle.png'].includes(assetName)) {
        element.style.backgroundImage = `url(${image.src})`;
      }
    } else {
      log(`Failed to set background image for ${elementKey}`, LOG_LEVELS.WARN);
    }
  });
  log('Game visuals set up.', LOG_LEVELS.INFO);
};

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

const handleKeydown = (e) => {
  try {
    if (e.code === 'Space' && state.gameState === GAME_STATES.INITIAL) {
      e.preventDefault();
      keyActions.Space();
      return;
    }

    const action = keyActions[e.code];
    if (action) {
      e.preventDefault();
      action();
    }
  } catch (error) {
    logError(error);
  }
};

const handleTouchStart = () => {
  if (state.gameState === GAME_STATES.PLAYING) {
    handleStateTransition(ACTIONS.JUMP);
  } else if (
    [GAME_STATES.INITIAL, GAME_STATES.CRASHED].includes(state.gameState)
  ) {
    handleStateTransition(ACTIONS.START);
  }
};

const setupEventListeners = () => {
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('touchstart', handleTouchStart);
  log('Event listeners set up.', LOG_LEVELS.INFO);
};

// ----------------------------------------
// State Transition Handling
// ----------------------------------------

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

const startGame = () => {
  state.lastFrameTime = performance.now();
  state.gameState = GAME_STATES.PLAYING;
  UI.updateGameUI(true);
  GameLoop.start();
  elements.instructionDialog.style.display = 'none';
  elements.player.classList.add('running');
  elements.orion.classList.add('running');
  elements.obstacle.style.display = 'block';
  elements.gameContainer.classList.add('parallax');
  state.gameStartTime = performance.now();
  state.lastSpeedIncrementTime = performance.now();
  log('Game started.', LOG_LEVELS.INFO);
};

const resetGame = () => {
  GameLoop.cancel();
  state.reset();
  resetPositions();
  UI.updateGameUI(false);
  elements.instructionDialog.style.display = 'block';
  elements.gameOverMessage.classList.add('hidden');
  elements.obstacle.style.display = 'none';
  elements.player.classList.remove('jumping');
  elements.player.classList.remove('running');
  elements.orion.classList.remove('running');
  elements.gameContainer.classList.remove('parallax');
  log('Game reset.', LOG_LEVELS.INFO);
};

const resetPositions = () => {
  elements.obstacle.style.left = `${state.obstacleX}px`;
  const playerCenterY = CONFIG.GAME.GROUND_LEVEL + CONFIG.PLAYER.HEIGHT / 2.5;
  const obstacleBottom = playerCenterY - CONFIG.OBSTACLE.HEIGHT;
  elements.obstacle.style.bottom = `${obstacleBottom}px`;

  elements.player.style.transform = `translateY(0)`;
  elements.orion.style.transform = `translateY(0)`;
};

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
  elements.gameContainer.classList.remove('parallax');
};

const handleJump = () => {
  if (!state.isJumping) {
    state.isJumping = true;
    state.jumpStartTime = performance.now();
    elements.player.classList.remove('running');
    elements.player.classList.add('jumping');
    log('Player jumped.', LOG_LEVELS.INFO);
  }
};

const pauseGame = () => {
  if (state.gameState === GAME_STATES.PLAYING) {
    GameLoop.cancel();
    state.gameState = GAME_STATES.PAUSED;
    elements.player.style.animationPlayState = 'paused';
    elements.orion.style.animationPlayState = 'paused';
    elements.gameContainer.classList.remove('parallax');
    log('Game paused.', LOG_LEVELS.INFO);
  }
};

const resumeGame = () => {
  if (state.gameState === GAME_STATES.PAUSED) {
    state.lastFrameTime = performance.now();
    state.gameState = GAME_STATES.PLAYING;
    elements.player.style.animationPlayState = 'running';
    elements.orion.style.animationPlayState = 'running';
    elements.gameContainer.classList.add('parallax');
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

  start() {
    cancelAnimationFrame(this.animationFrameId);
    this.lastTime = performance.now();
    this.accumulatedTime = 0;
    this.animationFrameId = requestAnimationFrame(this.update.bind(this));
    log('Game loop started.', LOG_LEVELS.INFO);
  }

  cancel() {
    cancelAnimationFrame(this.animationFrameId);
    log('Game loop canceled.', LOG_LEVELS.INFO);
  }

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

  updateGameObjects(deltaTime) {
    this.updateObstaclePosition(deltaTime);
    this.updatePlayerPosition();
    this.updateOrionPosition();
  }

  updateObstaclePosition(deltaTime) {
    state.obstacleX -= state.currentSpeed * deltaTime;
    if (state.obstacleX <= -CONFIG.OBSTACLE.WIDTH) {
      state.obstacleX = CONFIG.GAME.CONTAINER_WIDTH;
      state.score += CONFIG.SCORING.OBSTACLE_BONUS;
      UI.updateScoreDisplay(state.score);
    }

    const playerCenterY = CONFIG.GAME.GROUND_LEVEL + CONFIG.PLAYER.HEIGHT / 2.5;
    const obstacleBottom = playerCenterY - CONFIG.OBSTACLE.HEIGHT;
    elements.obstacle.style.bottom = `${obstacleBottom}px`;
    elements.obstacle.style.left = `${state.obstacleX}px`;
  }

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
    elements.player.style.transform = `translateY(-${state.playerY}px)`;
  }

  updateOrionPosition() {
    const orionX = CONFIG.ORION.INITIAL_LEFT;
    const obstacleX = state.obstacleX;
    const obstacleSpeed = state.currentSpeed;

    // Time for obstacle to collide (if same Y) with Orion
    const timeToReachOrion = (obstacleX - orionX) / obstacleSpeed;
    const timeToJumpPeak = CONFIG.JUMP.DURATION / 2 / 1000;

    // If obstacle is approaching Orion, make Orion jump
    if (!state.orionIsJumping && timeToReachOrion <= timeToJumpPeak) {
      state.orionIsJumping = true;
      state.orionJumpStartTime = performance.now();
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

  updateScore(currentTime) {
    const deltaTime = (currentTime - state.lastFrameTime) / 1000;
    state.distanceRan += state.currentSpeed * deltaTime;
    state.score = Math.floor(
      state.distanceRan * CONFIG.SCORING.POINTS_PER_SECOND
    );
    UI.updateScoreDisplay(state.score);
    state.lastFrameTime = currentTime;
  }

  checkAndIncreaseSpeed(currentTime) {
    if (
      currentTime - state.lastSpeedIncrementTime >=
      CONFIG.GAME.SPEED_INCREMENT_INTERVAL
    ) {
      state.currentSpeed = Math.min(
        state.currentSpeed + CONFIG.GAME.SPEED_INCREMENT_AMOUNT,
        CONFIG.GAME.MAX_SPEED
      );

      // Dynamically adjust background animation durations
      // so the sky/ground moves faster in sync with currentSpeed
      const speedRatio = CONFIG.GAME.STARTING_SPEED / state.currentSpeed;

      // Sky originally moves in 16s, ground in 8s
      const newSkyDuration =
        CONFIG.BACKGROUND.INITIAL_DURATION_SKY * speedRatio;
      const newGroundDuration =
        CONFIG.BACKGROUND.INITIAL_DURATION_GROUND * speedRatio;

      document.documentElement.style.setProperty(
        '--sky-move-duration',
        `${newSkyDuration}s`
      );
      document.documentElement.style.setProperty(
        '--ground-move-duration',
        `${newGroundDuration}s`
      );

      state.lastSpeedIncrementTime = currentTime;
      log(`Game speed increased to ${state.currentSpeed}px/s`, LOG_LEVELS.INFO);
    }
  }

  updateVisuals() {
    // Additional visual updates can be placed here if needed
  }
}

const GameLoop = new GameLoopClass();

const getAdjustedBoundingBox = (element, reductionFactor) => {
  const rect = element.getBoundingClientRect();
  const widthReduction = rect.width * reductionFactor;
  const heightReduction = rect.height * reductionFactor;
  return {
    left: rect.left + widthReduction / 2,
    top: rect.top + heightReduction / 2,
    right: rect.right - widthReduction / 2,
    bottom: rect.bottom - heightReduction / 2,
    width: rect.width - widthReduction,
    height: rect.height - heightReduction,
  };
};

const checkCollision = () => {
  if (performance.now() < state.collisionDisabledUntil) {
    return false;
  }

  const playerReductionFactor = 0.4;
  const obstacleReductionFactor = 0.2;

  const playerRect = getAdjustedBoundingBox(
    elements.player,
    playerReductionFactor
  );
  const obstacleRect = getAdjustedBoundingBox(
    elements.obstacle,
    obstacleReductionFactor
  );

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
    'assets/orion_sprite_sheet.png',
    'assets/obstacle.png',
    'assets/sky.svg',
    'assets/ground.svg',
  ],
  audio: [],
};

const initializeGame = async () => {
  try {
    await preloadAssets(assetList);
    await preloadJumpSprite();
    initDOMElements();
    setupEventListeners();
    setupGameVisuals(assetList);
    UI.updateInitial();
    log('Game initialized successfully.', LOG_LEVELS.INFO);
  } catch (error) {
    logError(error);
  }
};

document.addEventListener('DOMContentLoaded', initializeGame);

// Export if needed
export { CONFIG, GAME_STATES, elements, state, UI, initializeGame, GameLoop };
