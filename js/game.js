// game.js
import { CONFIG, GameState } from './config.js';
import { log, saveHighScore } from './utils.js';
import { GameLoop } from './gameLoop.js';
import { UI } from './ui.js';

/**
 * Represents the game state.
 */
class State {
    constructor() {
        this.highScore = 0;
        this.gameState = GameState.INITIAL;
        this.playerBottom = CONFIG.GAME.GROUND_HEIGHT;
        this.obstacleLeft = CONFIG.GAME.CONTAINER_WIDTH;
        this.orionLeft = CONFIG.ORION.INITIAL_LEFT;
        this.isJumping = false;
        this.jumpStartTime = 0;
        this.currentSpeed = CONFIG.GAME.INITIAL_SPEED;
        this.lastFrameTime = 0;
        this.distanceRan = 0;
        this.backgroundPosX = 0;
        this.gameStartTime = 0;
        this.score = 0;
        this.orionBottom = CONFIG.GAME.GROUND_HEIGHT;
        this.orionIsJumping = false;
        this.orionJumpStartTime = 0;
    }

    /**
     * Resets the game state to its initial values.
     */
    reset() {
        this.gameState = GameState.INITIAL;
        this.playerBottom = CONFIG.GAME.GROUND_HEIGHT;
        this.obstacleLeft = CONFIG.GAME.CONTAINER_WIDTH;
        this.orionLeft = CONFIG.ORION.INITIAL_LEFT;
        this.isJumping = false;
        this.jumpStartTime = 0;
        this.currentSpeed = CONFIG.GAME.INITIAL_SPEED;
        this.lastFrameTime = 0;
        this.distanceRan = 0;
        this.backgroundPosX = 0;
        this.gameStartTime = 0;
        this.score = 0;
        this.orionBottom = CONFIG.GAME.GROUND_HEIGHT;
        this.orionIsJumping = false;
        this.orionJumpStartTime = 0;
    }
}

export const state = new State();

export const elements = {
    player: null,
    orion: null,
    obstacle: null,
    scoreDisplay: null,
    highScoreDisplay: null,
    gameOverScreen: null,
    finalScoreDisplay: null,
    instructionDialog: null,
    gameContainer: null
};

/**
 * Initializes DOM elements by assigning them to the elements object.
 * @throws {Error} If a required DOM element is not found.
 */
export function initDOMElements() {
    const elementIdToKey = {
        'player': 'player',
        'orion': 'orion',
        'obstacle': 'obstacle',
        'score': 'scoreDisplay',
        'high-score': 'highScoreDisplay',
        'game-over': 'gameOverScreen',
        'final-score': 'finalScoreDisplay',
        'instruction-dialog': 'instructionDialog',
        'game-container': 'gameContainer'
    };
    
    for (const [id, key] of Object.entries(elementIdToKey)) {
        elements[key] = document.getElementById(id);
        if (!elements[key]) {
            throw new Error(`Required DOM element not found: ${id}`);
        }
    }
    elements.player.style.animationPlayState = 'paused';
    elements.orion.style.animationPlayState = 'paused';
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
    elements.player.style.bottom = `${state.playerBottom}vh`;
    elements.orion.style.bottom = `${state.orionBottom}vh`;
    elements.obstacle.style.left = `${state.obstacleLeft}vw`;
    elements.obstacle.style.display = isPlaying ? 'block' : 'none';

    elements.gameOverScreen.style.display = 'none';
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
    elements.orion.classList.toggle('running', isPlaying);
    elements.orion.classList.toggle('paused', !isPlaying);
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
