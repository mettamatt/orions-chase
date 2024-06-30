// utils.js
import { CONFIG } from './config.js';
import { state, elements } from './game.js';

const assets = { images: {}, audio: {} };

/**
 * Logs a message with a specified log level.
 * @param {string} message - The message to log.
 * @param {string} [level='info'] - The log level ('info', 'warn', 'error').
 */
export function log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console[level === 'error' ? 'error' : 'log'](`[${timestamp}] ${level.toUpperCase()}: ${message}`);
}

/**
 * Handles and logs an error.
 * @param {Error} error - The error to handle.
 */
export function handleError(error) {
    log(`Error: ${error.message}`, 'error');
}

/**
 * Preloads assets (images and audio).
 * @param {Object} assetList - The list of assets to preload.
 * @returns {Promise} A promise that resolves when all assets are loaded.
 */
export async function preloadAssets(assetList) {
    try {
        const imagePromises = assetList.images.map(loadImage);
        const audioPromises = assetList.audio.map(loadAudio);
        return await Promise.all([...imagePromises, ...audioPromises]);
    } catch (error) {
        handleError(error);
        throw error;
    }
}

/**
 * Loads an image asset.
 * @param {string} src - The source URL of the image.
 * @returns {Promise} A promise that resolves when the image is loaded.
 */
function loadImage(src) {
    return new Promise((resolve, reject) => {
        if (assets.images[src]) {
            resolve(assets.images[src]);
        } else {
            const img = new Image();
            img.onload = () => {
                assets.images[src] = img;
                resolve(img);
            };
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        }
    });
}

/**
 * Loads an audio asset.
 * @param {string} src - The source URL of the audio.
 * @returns {Promise} A promise that resolves when the audio is loaded.
 */
function loadAudio(src) {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.oncanplaythrough = () => {
            assets.audio[src] = audio;
            resolve(audio);
        };
        audio.onerror = () => reject(new Error(`Failed to load audio: ${src}`));
        audio.src = src;
    });
}

/**
 * Gets a preloaded asset.
 * @param {string} type - The type of the asset ('images' or 'audio').
 * @param {string} src - The source URL of the asset.
 * @returns {HTMLImageElement|HTMLAudioElement} The preloaded asset.
 */
export const getAsset = (type, src) => assets[type][src];

/**
 * Saves the high score to local storage.
 * @param {number} score - The high score to save.
 */
export function saveHighScore(score) {
    try {
        localStorage.setItem('highScore', score.toString());
    } catch (e) {
        handleError(e);
    }
}

/**
 * Loads the high score from local storage.
 * @returns {number} The high score.
 */
export function loadHighScore() {
    try {
        return parseInt(localStorage.getItem('highScore')) || 0;
    } catch (e) {
        handleError(e);
        return 0;
    }
}

const jumpHeights = [1, 17, 35, 56, 80, 56, 35, 17];
const numFrames = jumpHeights.length - 1;

/**
 * Calculates the jump offset based on the jump start time.
 * @param {number} jumpStartTime - The time the jump started.
 * @returns {number} The jump offset.
 */
function calculateJumpOffset(jumpStartTime) {
    const elapsedTime = performance.now() - jumpStartTime;
    const jumpProgress = Math.min(elapsedTime / CONFIG.JUMP.DURATION, 1);
    const currentFrameIndex = Math.floor(jumpProgress * numFrames);
    return jumpHeights[currentFrameIndex];
}

/**
 * Calculates the hitboxes for the player and obstacle.
 * @returns {Object} An object containing the player hitbox and obstacle rectangle.
 */
export function calculateHitboxes() {
    const playerRect = elements.player.getBoundingClientRect();
    const obstacleRect = elements.obstacle.getBoundingClientRect();

    let jumpOffset = 0;
    if (state.isJumping) {
        jumpOffset = calculateJumpOffset(state.jumpStartTime);
    }

    const playerWidth = playerRect.width * 0.2;
    const playerHeightTop = playerRect.height * 0.1;
    const playerHeightBottom = playerRect.height * 0.05;

    const playerHitbox = {
        left: playerRect.left + playerWidth,
        right: playerRect.right - playerWidth,
        top: playerRect.top + playerHeightTop - jumpOffset,
        bottom: playerRect.bottom - playerHeightBottom - jumpOffset
    };

    return { playerHitbox, obstacleRect };
}

/**
 * Checks for collisions between the player and obstacle.
 * @returns {boolean} True if a collision is detected, false otherwise.
 */
export function checkCollision() {
    const { playerHitbox, obstacleRect } = calculateHitboxes();

    return !(
        playerHitbox.bottom <= obstacleRect.top ||
        playerHitbox.top >= obstacleRect.bottom ||
        playerHitbox.right <= obstacleRect.left ||
        playerHitbox.left >= obstacleRect.right
    );
}

/**
 * Adds a debug visualization layer to the game.
 */
export function addDebugVisualization() {
    const debugLayer = document.createElement('div');
    debugLayer.style.position = 'fixed';
    debugLayer.style.top = '0';
    debugLayer.style.left = '0';
    debugLayer.style.width = '100%';
    debugLayer.style.height = '100%';
    debugLayer.style.pointerEvents = 'none';
    debugLayer.style.zIndex = '9999';
    document.body.appendChild(debugLayer);

    function updateDebugVisualization() {
        debugLayer.innerHTML = '';
        const { playerHitbox, obstacleRect } = calculateHitboxes();

        const playerHitboxDiv = document.createElement('div');
        playerHitboxDiv.style.position = 'absolute';
        playerHitboxDiv.style.left = `${playerHitbox.left}px`;
        playerHitboxDiv.style.top = `${playerHitbox.top}px`;
        playerHitboxDiv.style.width = `${playerHitbox.right - playerHitbox.left}px`;
        playerHitboxDiv.style.height = `${playerHitbox.bottom - playerHitbox.top}px`;
        playerHitboxDiv.style.border = '2px solid blue';
        playerHitboxDiv.style.boxSizing = 'border-box';
        debugLayer.appendChild(playerHitboxDiv);

        const playerRect = elements.player.getBoundingClientRect();
        const playerBox = document.createElement('div');
        playerBox.style.position = 'absolute';
        playerBox.style.left = `${playerRect.left}px`;
        playerBox.style.top = `${playerRect.top}px`;
        playerBox.style.width = `${playerRect.width}px`;
        playerBox.style.height = `${playerRect.height}px`;
        playerBox.style.border = '2px dashed lightblue';
        playerBox.style.boxSizing = 'border-box';
        debugLayer.appendChild(playerBox);

        const obstacleBox = document.createElement('div');
        obstacleBox.style.position = 'absolute';
        obstacleBox.style.left = `${obstacleRect.left}px`;
        obstacleBox.style.top = `${obstacleRect.top}px`;
        obstacleBox.style.width = `${obstacleRect.width}px`;
        obstacleBox.style.height = `${obstacleRect.height}px`;
        obstacleBox.style.border = '2px solid red';
        obstacleBox.style.boxSizing = 'border-box';
        debugLayer.appendChild(obstacleBox);

        requestAnimationFrame(updateDebugVisualization);
    }

    updateDebugVisualization();
}

/**
 * Calculates the jump position based on the jump start time and current time.
 * @param {number} jumpStartTime - The time the jump started.
 * @param {number} currentTime - The current time.
 * @returns {Object} An object containing the bottom position and whether the jump is finished.
 */
export function calculateJumpPosition(jumpStartTime, currentTime) {
    const elapsedTime = currentTime - jumpStartTime;
    const jumpProgress = Math.min(elapsedTime / CONFIG.JUMP.DURATION, 1);
    const jumpHeight = Math.sin(jumpProgress * Math.PI) * CONFIG.JUMP.HEIGHT;
    
    return {
        bottom: CONFIG.GAME.GROUND_HEIGHT + jumpHeight,
        isJumpFinished: jumpProgress === 1
    };
}
