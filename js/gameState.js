// gameState.js
import { GameState } from './config.js';
import { resetGame, startGame, handleJump, pauseGame, resumeGame } from './game.js';
import { log } from './utils.js';

/**
 * Handles state transitions for the game.
 * @param {Object} state - The current game state.
 * @param {string} action - The action to handle.
 */
export function handleStateTransition(state, action) {
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
            } else if (action === 'RESUME') {
                resumeGame();
            }
            break;
        case GameState.PAUSED:
            if (action === 'RESUME') {
                resumeGame();
            }
            break;
    }
}

/**
 * Logs state transitions for debugging purposes.
 * @param {Object} state - The current game state.
 * @param {string} action - The action being handled.
 */
export function logStateTransition(state, action) {
    log(`Handling ${action} in state: ${state.gameState}`, 'info');
}
