import { SETTINGS } from '../core/Settings.js';
import { gameState } from '../core/GameState.js';
import { FloatingText } from '../effects/FloatingText.js';
import { Particle } from '../effects/Particle.js';

// 玩家物件
export const player = {
    x: 0,
    y: 0,
    targetAngle: -Math.PI / 2,
    currentAngle: -Math.PI / 2,
    velocity: { x: 0, y: 0 },
    trail: [],
    maxHp: SETTINGS.general.maxPlayerHP,
    currentHp: SETTINGS.general.maxPlayerHP,
    damageShakeTimer: 0,
    damageFlashTimer: 0,
    invincibleTimer: 0,
    maxInvincibleTimer: 0,
    defendRatio: 1,
    heldItem: null
};

// 治療玩家
export function healPlayer(amount) {
    player.currentHp = Math.min(player.maxHp, player.currentHp + amount);
    gameState.floatingTexts.push(
        new FloatingText(player.x, player.y - 30, `+${amount}`, SETTINGS.colors.textHeal)
    );
    for (let i = 0; i < 8; i++) {
        gameState.particles.push(new Particle(player.x, player.y, 'heal'));
    }
}

// 玩家受傷
export function takeDamage(amount) {
    const isInvincible = player.invincibleTimer > 0;
    const finalDamage = isInvincible ? amount * player.defendRatio : amount;

    player.currentHp = Math.max(0, player.currentHp - finalDamage);

    if (!isInvincible) {
        player.damageShakeTimer = 0.4;
    }
    player.damageFlashTimer = 0.4;

    gameState.floatingTexts.push(
        new FloatingText(player.x, player.y - 30, `-${finalDamage.toFixed(0)}`, SETTINGS.colors.textDmg)
    );

    for (let i = 0; i < 10; i++) {
        gameState.particles.push(new Particle(player.x, player.y, 'damage'));
    }
}
