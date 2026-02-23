import { SETTINGS } from './Settings.js';
import { gameState, GAME_STATE_MODE } from './GameState.js';
import { player } from '../entities/Player.js';
import { Particle } from '../effects/Particle.js';

export const dashState = {
    isDashing: false,
    dashTimer: 0,
    dashDirX: 0,
    dashDirY: 0,
    dashEnergy: SETTINGS.dashConfig.maxEnergy,
    displayDashEnergy: SETTINGS.dashConfig.maxEnergy,
    recoveryDelayTimer: 0,
    dashTrailTimer: 0
};

export function canDash() {
    return (gameState.currentMode === GAME_STATE_MODE.ROAMING ||
            gameState.currentMode === GAME_STATE_MODE.AIMING)
        && !player.isDead
        && !dashState.isDashing
        && dashState.dashEnergy >= SETTINGS.dashConfig.energyCost;
}

export function tryDash(dirX, dirY) {
    if (!canDash()) return false;

    if (dirX === 0 && dirY === 0) {
        dirX = Math.cos(player.currentAngle);
        dirY = Math.sin(player.currentAngle);
    }

    const len = Math.sqrt(dirX * dirX + dirY * dirY);
    if (len > 0) { dirX /= len; dirY /= len; }

    dashState.dashDirX = dirX;
    dashState.dashDirY = dirY;
    dashState.isDashing = true;
    dashState.dashTimer = SETTINGS.dashConfig.dashTime;
    dashState.dashTrailTimer = 0;
    dashState.dashEnergy -= SETTINGS.dashConfig.energyCost;
    dashState.recoveryDelayTimer = 0;

    return true;
}

export function updateDash(dt) {
    const cfg = SETTINGS.dashConfig;

    if (dashState.isDashing) {
        dashState.dashTimer -= dt;

        dashState.dashTrailTimer -= dt;
        if (dashState.dashTrailTimer <= 0) {
            dashState.dashTrailTimer = cfg.trailInterval;
            const ctx = { dirX: dashState.dashDirX, dirY: dashState.dashDirY };
            for (let i = 0; i < 3; i++) {
                gameState.particles.push(new Particle(player.x, player.y, 'dash', ctx));
            }
        }

        if (dashState.dashTimer <= 0) {
            dashState.isDashing = false;
            dashState.dashTimer = 0;
            dashState.recoveryDelayTimer = cfg.recoveryDelay;
        }
    }

    if (!dashState.isDashing && dashState.recoveryDelayTimer > 0) {
        dashState.recoveryDelayTimer -= dt;
    }

    if (!dashState.isDashing && dashState.recoveryDelayTimer <= 0
        && dashState.dashEnergy < cfg.maxEnergy) {
        dashState.dashEnergy = Math.min(
            cfg.maxEnergy,
            dashState.dashEnergy + cfg.recoveryRate * dt
        );
    }

    const lerpSpeed = 1 - Math.exp(-10 * dt);
    dashState.displayDashEnergy +=
        (dashState.dashEnergy - dashState.displayDashEnergy) * lerpSpeed;
}

export function getDashSpeedMultiplier() {
    return dashState.isDashing ? SETTINGS.dashConfig.speedRatio : 1;
}

export function resetDash() {
    const cfg = SETTINGS.dashConfig;
    dashState.isDashing = false;
    dashState.dashTimer = 0;
    dashState.dashDirX = 0;
    dashState.dashDirY = 0;
    dashState.dashEnergy = cfg.maxEnergy;
    dashState.displayDashEnergy = cfg.maxEnergy;
    dashState.recoveryDelayTimer = 0;
    dashState.dashTrailTimer = 0;
}
