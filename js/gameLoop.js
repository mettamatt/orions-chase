// gameLoop.js
import { CONFIG, GameState } from './config.js';
import { state, elements, endGame } from './game.js';
import { checkCollision, calculateJumpPosition } from './utils.js';

const FIXED_TIME_STEP = 1000 / 60;
const MAX_FRAME_SKIP = 5;
const EMPIRICAL_ADJUSTMENT_FACTOR = 0.3; // Adjust this factor as needed

/**
 * GameLoop class to manage the game loop.
 */
export class GameLoop {
    static accumulatedTime = 0;
    static lastTime = performance.now();
    static animationFrameId = null;

    /**
     * Starts the game loop.
     */
    static start() {
        cancelAnimationFrame(this.animationFrameId);
        elements.obstacle.style.display = 'block';
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
        while (this.accumulatedTime >= FIXED_TIME_STEP && frameSkip < MAX_FRAME_SKIP) {
            this.updateGameObjects(currentTime, FIXED_TIME_STEP / 1000);
            this.accumulatedTime -= FIXED_TIME_STEP;
            frameSkip++;
        }

        if (frameSkip === MAX_FRAME_SKIP) {
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
     * @param {number} deltaTime - The time difference between frames.
     */
    static updateGameObjects(currentTime, deltaTime) {
        this.updatePlayerPosition(currentTime);
        this.updateOrionPosition(currentTime);
        this.updateObstaclePosition(deltaTime);
        this.updateBackgroundPosition(deltaTime);

        state.currentSpeed = Math.min(state.currentSpeed + CONFIG.GAME.ACCELERATION * deltaTime, CONFIG.GAME.MAX_SPEED);
    }

    /**
     * Updates the player position.
     * @param {number} currentTime - The current time.
     */
    static updatePlayerPosition(currentTime) {
        if (state.isJumping) {
            const { bottom, isJumpFinished } = calculateJumpPosition(state.jumpStartTime, currentTime);
            state.playerBottom = bottom;
            if (isJumpFinished) {
                state.isJumping = false;
                elements.player.classList.remove('jumping');
            }
            elements.player.style.bottom = `${state.playerBottom}vh`;
        }
    }

    /**
     * Updates Orion's position.
     * @param {number} currentTime - The current time.
     */
    static updateOrionPosition(currentTime) {
        const jumpDurationSeconds = CONFIG.JUMP.DURATION / 1000;
        const jumpTriggerDistance = state.currentSpeed * jumpDurationSeconds;
        const empiricalAdjustment = state.currentSpeed * EMPIRICAL_ADJUSTMENT_FACTOR;
        const adjustedJumpTriggerDistance = jumpTriggerDistance - empiricalAdjustment;
        const distanceToObstacle = state.obstacleLeft - state.orionLeft;

        if (!state.orionIsJumping && distanceToObstacle <= adjustedJumpTriggerDistance && distanceToObstacle > 0) {
            state.orionIsJumping = true;
            state.orionJumpStartTime = currentTime;
        }

        if (state.orionIsJumping) {
            const { bottom, isJumpFinished } = calculateJumpPosition(state.orionJumpStartTime, currentTime);
            state.orionBottom = bottom;
            if (isJumpFinished) {
                state.orionIsJumping = false;
            }
            elements.orion.style.bottom = `${state.orionBottom}vh`;
        }
    }

    /**
     * Updates the obstacle position.
     * @param {number} deltaTime - The time difference between frames.
     */
    static updateObstaclePosition(deltaTime) {
        state.obstacleLeft -= state.currentSpeed * deltaTime;
        if (state.obstacleLeft <= -CONFIG.OBSTACLE.WIDTH) {
            state.obstacleLeft = CONFIG.GAME.CONTAINER_WIDTH;
        }
        elements.obstacle.style.left = `${state.obstacleLeft}vw`;
    }

    /**
     * Updates the background position.
     * @param {number} deltaTime - The time difference between frames.
     */
    static updateBackgroundPosition(deltaTime) {
        state.backgroundPosX -= state.currentSpeed * deltaTime * 0.5;
        elements.gameContainer.style.backgroundPositionX = `${state.backgroundPosX}vw`;
    }

    /**
     * Updates the game score.
     * @param {number} currentTime - The current time.
     */
    static updateScore(currentTime) {
        const deltaTime = (currentTime - state.lastFrameTime) / 1000;
        state.distanceRan += state.currentSpeed * deltaTime;
        state.score = Math.floor(state.distanceRan * CONFIG.SCORING.POINTS_PER_PERCENT);
        elements.scoreDisplay.textContent = `Score: ${state.score}`;
        state.lastFrameTime = currentTime;
    }

    /**
     * Updates the game visuals.
     */
    static updateVisuals() {
        elements.player.style.bottom = `${state.playerBottom}vh`;
        elements.orion.style.bottom = `${state.orionBottom}vh`;
        elements.obstacle.style.left = `${state.obstacleLeft}vw`;
    }
}
