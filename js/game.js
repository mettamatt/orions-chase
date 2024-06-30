import { CONFIG, GameState } from './config.js';
import { preloadAssets, setupGameVisuals, log, loadHighScore, saveHighScore } from './utils.js';
import { setupEventListeners } from './events.js';
import { GameLoop } from './gameLoop.js';

const assetList = {
    images: [
        'assets/player_sprite_sheet.png',
        'assets/player-jump_sprite_sheet.png',
        'assets/orion_sprite_sheet.png',
        'assets/obstacle.png',
        'assets/background.svg'
    ],
    audio: []
};

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

const UI = {
    updateScore(currentTime) {
        const deltaTime = (currentTime - state.lastFrameTime) / 1000;
        state.distanceRan += state.currentSpeed * deltaTime;
        state.score = Math.floor(state.distanceRan * CONFIG.SCORING.POINTS_PER_PERCENT);
        elements.scoreDisplay.textContent = `Score: ${state.score}`;
    },

    updateEndGame(finalScore) {
        elements.finalScoreDisplay.textContent = `${finalScore}`;
        elements.highScoreDisplay.textContent = `High Score: ${state.highScore}`;
        elements.gameOverScreen.style.display = 'block';
        elements.instructionDialog.style.display = 'none';
        elements.gameContainer.classList.remove('parallax');
    },

    updateInitial() {
        elements.highScoreDisplay.textContent = `High Score: ${state.highScore}`;
        elements.instructionDialog.style.display = 'block';
        elements.gameContainer.classList.remove('parallax');
    }
};

export async function initializeGame() {
    try {
        await preloadAssets(assetList);
        state.highScore = loadHighScore();
        initDOMElements();
        setupEventListeners();
        setupGameVisuals(assetList);
        UI.updateInitial();
        //addDebugVisualization();
    } catch (error) {
        log('Failed to initialize game: ' + error.message, 'error');
    }
}

function initDOMElements() {
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

export function resetGame() {
    GameLoop.cancel();
    state.reset();
    updateGameUI(false);
    elements.instructionDialog.style.display = 'block';
    log('Game reset');
}

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

export function handleJump() {
    if (!state.isJumping) {
        state.isJumping = true;
        state.jumpStartTime = performance.now();
        elements.player.classList.add('jumping');
        log('Player jumped');
    }
}

export function updateOrionState(isJumping, isPlaying) {
    elements.orion.classList.toggle('jumping', isJumping);
    elements.orion.classList.toggle('running', isPlaying);
    elements.orion.classList.toggle('paused', !isPlaying);
}

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

window.addEventListener('error', function(event) {
    log('Uncaught error: ' + event.message, 'error');
});

document.addEventListener('DOMContentLoaded', initializeGame);