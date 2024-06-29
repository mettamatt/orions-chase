import { CONFIG } from './config.js';
import { state, elements } from './game.js';

const assets = { images: {}, audio: {} };

export function preloadAssets(assetList) {
    const imagePromises = assetList.images.map(loadImage);
    const audioPromises = assetList.audio.map(loadAudio);
    return Promise.all([...imagePromises, ...audioPromises]);
}

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

export const getAsset = (type, src) => assets[type][src];

export function setupGameVisuals(assetList) {
    assetList.images.forEach(asset => {
        const elementName = asset.split('/').pop().split('.')[0];
        const element = elements[elementName === 'background' ? 'gameContainer' : elementName];
        const image = getAsset('images', asset);
        if (element && image) {
            element.style.backgroundImage = `url(${image.src})`;
        } else {
            log(`Failed to set background image for ${elementName}`, 'warn');
        }
    });
}

export function saveHighScore(score) {
    try {
        localStorage.setItem('highScore', score.toString());
    } catch (e) {
        log('Failed to save high score: ' + e.message, 'error');
    }
}

export function loadHighScore() {
    try {
        return parseInt(localStorage.getItem('highScore')) || 0;
    } catch (e) {
        log('Failed to load high score: ' + e.message, 'error');
        return 0;
    }
}

export function log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console[level === 'error' ? 'error' : 'log'](`[${timestamp}] ${level.toUpperCase()}: ${message}`);
}

const jumpHeights = [1, 17, 35, 56, 80, 56, 35, 17]; // Measured jump heights for each frame
const numFrames = jumpHeights.length - 1; // Minus one to use for progression calculation

function calculateJumpOffset(jumpStartTime) {
    const elapsedTime = performance.now() - jumpStartTime;
    const jumpProgress = Math.min(elapsedTime / CONFIG.JUMP.DURATION, 1);
    
    // Determine the current frame based on jump progress
    const currentFrameIndex = Math.floor(jumpProgress * numFrames);
    return jumpHeights[currentFrameIndex];
}

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

export function checkCollision() {
    const { playerHitbox, obstacleRect } = calculateHitboxes();

    return !(
        playerHitbox.bottom <= obstacleRect.top ||
        playerHitbox.top >= obstacleRect.bottom ||
        playerHitbox.right <= obstacleRect.left ||
        playerHitbox.left >= obstacleRect.right
    );
}

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

        // Player hitbox
        const playerHitboxDiv = document.createElement('div');
        playerHitboxDiv.style.position = 'absolute';
        playerHitboxDiv.style.left = `${playerHitbox.left}px`;
        playerHitboxDiv.style.top = `${playerHitbox.top}px`;
        playerHitboxDiv.style.width = `${playerHitbox.right - playerHitbox.left}px`;
        playerHitboxDiv.style.height = `${playerHitbox.bottom - playerHitbox.top}px`;
        playerHitboxDiv.style.border = '2px solid blue';
        playerHitboxDiv.style.boxSizing = 'border-box';
        debugLayer.appendChild(playerHitboxDiv);

        // Full player sprite box
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

        // Obstacle box
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

export function calculateJumpPosition(jumpStartTime, currentTime) {
    const elapsedTime = currentTime - jumpStartTime;
    const jumpProgress = Math.min(elapsedTime / CONFIG.JUMP.DURATION, 1);
    const jumpHeight = Math.sin(jumpProgress * Math.PI) * CONFIG.JUMP.HEIGHT;
    
    return {
        bottom: CONFIG.GAME.GROUND_HEIGHT + jumpHeight,
        isJumpFinished: jumpProgress === 1
    };
}
