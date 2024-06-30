// config.js
/**
 * Retrieves a CSS variable value.
 * @param {string} variableName - The name of the CSS variable.
 * @returns {string} The value of the CSS variable.
 */
function getCSSVariable(variableName) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
    console.log(`CSS Variable - ${variableName}: ${value}`);
    return value;
}

/**
 * Converts a CSS time value to milliseconds.
 * @param {string} cssTime - The CSS time value (e.g., '200ms', '0.5s').
 * @returns {number} The time in milliseconds.
 */
function cssTimeToMs(cssTime) {
    if (cssTime.endsWith('ms')) {
        return parseFloat(cssTime);
    } else if (cssTime.endsWith('s')) {
        return parseFloat(cssTime) * 1000;
    }
    return parseFloat(cssTime);
}

// Define game configurations.
export const CONFIG = {
    PLAYER: {
        WIDTH: parseInt(getCSSVariable('--player-width')),
        HEIGHT: parseInt(getCSSVariable('--player-height')),
        INITIAL_LEFT: parseFloat(getCSSVariable('--player-left'))
    },
    ORION: {
        WIDTH: parseInt(getCSSVariable('--orion-width')),
        HEIGHT: parseInt(getCSSVariable('--orion-height')),
        INITIAL_LEFT: parseFloat(getCSSVariable('--orion-left'))
    },
    OBSTACLE: {
        WIDTH: parseFloat(getCSSVariable('--obstacle-width')) / 100 * window.innerWidth,
        HEIGHT: parseFloat(getCSSVariable('--obstacle-height')) / window.innerHeight * 100,
    },
    GAME: {
        INITIAL_SPEED: 31.25,
        MAX_SPEED: 300,
        ACCELERATION: 1.15,
        GROUND_HEIGHT: parseFloat(getCSSVariable('--ground-level')),
        CONTAINER_WIDTH: 100,
    },
    JUMP: {
        HEIGHT: parseFloat(getCSSVariable('--jump-height')),
        DURATION: cssTimeToMs(getCSSVariable('--jump-duration')),
    },
    SCORING: {
        POINTS_PER_PERCENT: 0.5,
        OBSTACLE_BONUS: 100,
        UPDATE_INTERVAL: 100,
    },
};

// Define game states.
export const GameState = {
    INITIAL: 'initial',
    PLAYING: 'playing',
    PAUSED: 'paused',
    CRASHED: 'crashed'
};
