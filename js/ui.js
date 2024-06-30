// ui.js
import { state, elements } from './game.js';
import { CONFIG } from './config.js';

export const UI = {
    /**
     * Updates the game score display.
     * @param {number} currentTime - The current time.
     */
    updateScore(currentTime) {
        const deltaTime = (currentTime - state.lastFrameTime) / 1000;
        state.distanceRan += state.currentSpeed * deltaTime;
        state.score = Math.floor(state.distanceRan * CONFIG.SCORING.POINTS_PER_PERCENT);
        elements.scoreDisplay.textContent = `Score: ${state.score}`;
    },

    /**
     * Updates the end game screen with the final score and high score.
     * @param {number} finalScore - The final score of the game.
     */
    updateEndGame(finalScore) {
        elements.finalScoreDisplay.textContent = `${finalScore}`;
        elements.highScoreDisplay.textContent = `High Score: ${state.highScore}`;
        elements.gameOverScreen.style.display = 'block';
        elements.instructionDialog.style.display = 'block'; // Show instruction dialog
        elements.gameContainer.classList.remove('parallax');
    },

    /**
     * Updates the initial game screen with the high score.
     */
    updateInitial() {
        elements.highScoreDisplay.textContent = `High Score: ${state.highScore}`;
        elements.instructionDialog.style.display = 'block';
        elements.gameOverScreen.style.display = 'none';
        elements.gameContainer.classList.remove('parallax');
    }
};
