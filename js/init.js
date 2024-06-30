// init.js
import { preloadAssets, log } from './utils.js';
import { setupEventListeners } from './events.js';
import { setupGameVisuals } from './assets.js';
import { UI } from './ui.js';
import { state, initDOMElements } from './game.js';
import { loadHighScore } from './utils.js';

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

/**
 * Initializes the game by preloading assets, setting up DOM elements,
 * event listeners, and game visuals, and updating the UI.
 */
export async function initializeGame() {
    try {
        await preloadAssets(assetList);
        state.highScore = loadHighScore();
        initDOMElements();
        setupEventListeners();
        setupGameVisuals(assetList);
        UI.updateInitial();
    } catch (error) {
        log('Failed to initialize game: ' + error.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', initializeGame);
