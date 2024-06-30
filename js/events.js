import { state, handleJump, startGame, resetGame, pauseGame, resumeGame } from './game.js';
import { GameState } from './config.js';
import { log } from './utils.js';

let spaceKeyDisabled = false;

const keyActions = {
    'Space': handleSpaceKey,
    'KeyP': togglePause
};

export function handleKeydown(e) {
    try {
        if (e.code === 'Space' && spaceKeyDisabled) return;
        const action = keyActions[e.code];
        if (action) action();
    } catch (error) {
        log(`Error handling keydown event: ${error.message}`, 'error');
    }
}

function handleSpaceKey() {
    log(`Handling Space key in state: ${state.gameState}`, 'info');
    switch (state.gameState) {
        case GameState.INITIAL:
        case GameState.CRASHED:
            resetGame();
            startGame();
            break;
        case GameState.PLAYING:
            handleJump();
            break;
    }
}

function togglePause() {
    state.gameState === GameState.PLAYING ? pauseGame() : resumeGame();
}

export function handleTouchStart() {
    log(`Handling touch start in state: ${state.gameState}`, 'info');
    switch (state.gameState) {
        case GameState.INITIAL:
        case GameState.CRASHED:
            resetGame();
            startGame();
            break;
        case GameState.PLAYING:
            handleJump();
            break;
    }
}

export function setSpaceKeyDisabled(value) {
    spaceKeyDisabled = value;
}

export function setupEventListeners() {
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('touchstart', handleTouchStart);
}

export function removeEventListeners() {
    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('touchstart', handleTouchStart);
}
