const root = document.documentElement;

function getCSSVariable(variableName) {
    const value = getComputedStyle(root).getPropertyValue(variableName).trim();
    console.log(`CSS Variable - ${variableName}: ${value}`);
    return value;
}

function cssTimeToMs(cssTime) {
    if (cssTime.endsWith('ms')) {
        return parseFloat(cssTime);
    } else if (cssTime.endsWith('s')) {
        return parseFloat(cssTime) * 1000;
    }
    return parseFloat(cssTime);
}

const playerWidth = parseInt(getCSSVariable('--player-width'));
const playerHeight = parseInt(getCSSVariable('--player-height'));
const orionWidth = parseInt(getCSSVariable('--orion-width'));
const orionHeight = parseInt(getCSSVariable('--orion-height'));
const obstacleWidth = parseFloat(getCSSVariable('--obstacle-width')) / 100 * window.innerWidth;
const obstacleHeight = parseFloat(getCSSVariable('--obstacle-height')) / window.innerHeight * 100;
const groundLevel = parseFloat(getCSSVariable('--ground-level'));
const jumpHeightVh = parseFloat(getCSSVariable('--jump-height'));
const jumpDurationMs = cssTimeToMs(getCSSVariable('--jump-duration'));

export const CONFIG = {
    PLAYER: {
        WIDTH: playerWidth,
        HEIGHT: playerHeight,
        INITIAL_LEFT: parseFloat(getCSSVariable('--player-left'))
    },
    ORION: {
        WIDTH: orionWidth,
        HEIGHT: orionHeight,
        INITIAL_LEFT: parseFloat(getCSSVariable('--orion-left'))
    },
    OBSTACLE: {
        WIDTH: obstacleWidth,
        HEIGHT: obstacleHeight,
    },
    GAME: {
        INITIAL_SPEED: 31.25, // % of viewport width per second
        MAX_SPEED: 300, // % of viewport width per second
        ACCELERATION: 1.15, // % of viewport width per second^2
        GROUND_HEIGHT: groundLevel,
        CONTAINER_WIDTH: 100, // % of viewport width
    },
    JUMP: {
        HEIGHT: jumpHeightVh,
        DURATION: jumpDurationMs,
    },
    SCORING: {
        POINTS_PER_PERCENT: 0.5,
        OBSTACLE_BONUS: 100,
        UPDATE_INTERVAL: 100,
    },
};

export const GameState = {
    INITIAL: 'initial',
    PLAYING: 'playing',
    PAUSED: 'paused',
    CRASHED: 'crashed'
};