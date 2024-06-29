import { CONFIG, GameState } from './config.js';
import { state, elements, endGame } from './game.js';
import { checkCollision, calculateJumpPosition } from './utils.js';

const FIXED_TIME_STEP = 1000 / 60;
const MAX_FRAME_SKIP = 5;
const EMPIRICAL_ADJUSTMENT_FACTOR = 0.3; // Adjust this factor as needed

export class GameLoop {
    static accumulatedTime = 0;
    static lastTime = performance.now();
    static animationFrameId = null;

    static start() {
        cancelAnimationFrame(this.animationFrameId);
        elements.obstacle.style.display = 'block';
        this.animationFrameId = requestAnimationFrame(this.update.bind(this));
    }

    static cancel() {
        cancelAnimationFrame(this.animationFrameId);
    }

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

    static updateGameObjects(currentTime, deltaTime) {
        this.updatePlayerPosition(currentTime);
        this.updateOrionPosition(currentTime);
        this.updateObstaclePosition(deltaTime);
        this.updateBackgroundPosition(deltaTime);

        state.currentSpeed = Math.min(state.currentSpeed + CONFIG.GAME.ACCELERATION * deltaTime, CONFIG.GAME.MAX_SPEED);
    }

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

    static updateOrionPosition(currentTime) {
        // Calculate the jump duration in seconds
        const jumpDurationSeconds = CONFIG.JUMP.DURATION / 1000;

        // Calculate the base distance Orion should start the jump
        const jumpTriggerDistance = state.currentSpeed * jumpDurationSeconds;

        // Empirical adjustment based on speed
        const empiricalAdjustment = state.currentSpeed * EMPIRICAL_ADJUSTMENT_FACTOR;

        // Apply the empirical adjustment to the jump trigger distance
        const adjustedJumpTriggerDistance = jumpTriggerDistance - empiricalAdjustment;

        // Calculate the current distance to the obstacle
        const distanceToObstacle = state.obstacleLeft - state.orionLeft;

        // Trigger the jump if Orion is not already jumping and the obstacle is within the adjusted jump trigger distance
        if (!state.orionIsJumping && distanceToObstacle <= adjustedJumpTriggerDistance && distanceToObstacle > 0) {
            state.orionIsJumping = true;
            state.orionJumpStartTime = currentTime;
        }

        // Handle the jump movement
        if (state.orionIsJumping) {
            const { bottom, isJumpFinished } = calculateJumpPosition(state.orionJumpStartTime, currentTime);
            state.orionBottom = bottom;
            if (isJumpFinished) {
                state.orionIsJumping = false;
            }
            elements.orion.style.bottom = `${state.orionBottom}vh`;
        }
    }

    static updateObstaclePosition(deltaTime) {
        state.obstacleLeft -= state.currentSpeed * deltaTime;
        if (state.obstacleLeft <= -CONFIG.OBSTACLE.WIDTH) {
            state.obstacleLeft = CONFIG.GAME.CONTAINER_WIDTH;
        }
        elements.obstacle.style.left = `${state.obstacleLeft}vw`;
    }

    static updateBackgroundPosition(deltaTime) {
        state.backgroundPosX -= state.currentSpeed * deltaTime * 0.5;
        elements.gameContainer.style.backgroundPositionX = `${state.backgroundPosX}vw`;
    }

    static updateScore(currentTime) {
        const deltaTime = (currentTime - state.lastFrameTime) / 1000;
        state.distanceRan += state.currentSpeed * deltaTime;
        state.score = Math.floor(state.distanceRan * CONFIG.SCORING.POINTS_PER_PERCENT);
        elements.scoreDisplay.textContent = `Score: ${state.score}`;
        state.lastFrameTime = currentTime;
    }

    static updateVisuals() {
        elements.player.style.bottom = `${state.playerBottom}vh`;
        elements.orion.style.bottom = `${state.orionBottom}vh`;
        elements.obstacle.style.left = `${state.obstacleLeft}vw`;
    }
}