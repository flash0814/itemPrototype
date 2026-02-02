import { SETTINGS } from '../core/Settings.js';
import { gameState } from '../core/GameState.js';
import { FloatingText } from '../effects/FloatingText.js';
import { Particle } from '../effects/Particle.js';
import { DeathEffect } from '../effects/DeathEffect.js';
import { buffManager, BUFF_TYPE, BUFF_ICON } from '../core/BuffManager.js';

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
    heldItem: null,

    // Energy
    maxEnergy: SETTINGS.general.maxEnergy,
    currentEnergy: SETTINGS.general.defEnergy,
    displayEnergy: SETTINGS.general.defEnergy,
    energyRecoverRate: SETTINGS.general.energyRecoverRate,
    energyRecoverCD: 0,
    energyRecoverBlocked: false,

    // Death/Revive
    isDead: false,
    deathTimer: 0,
    reviveBlinkTimer: 0
};

// 更新 energy（每幀呼叫）
export function updateEnergy(dt) {
    // 回復硬直倒數
    if (player.energyRecoverCD > 0) {
        player.energyRecoverCD -= dt;
    } else if (!player.energyRecoverBlocked && player.currentEnergy < player.maxEnergy) {
        // 自動回復
        player.currentEnergy = Math.min(
            player.maxEnergy,
            player.currentEnergy + player.energyRecoverRate * dt
        );
    }

    // displayEnergy smooth 追趕 currentEnergy
    const lerpSpeed = 1 - Math.exp(-10 * dt);
    player.displayEnergy += (player.currentEnergy - player.displayEnergy) * lerpSpeed;
}

// 消耗 energy，成功 return true
export function consumeEnergy(amount, recoverCD = 0) {
    if (player.currentEnergy < amount) return false;
    // ENERGY_HOT buff：不扣減 energy
    if (buffManager.hasBuff(BUFF_TYPE.ENERGY_HOT)) return true;
    player.currentEnergy -= amount;
    if (recoverCD > 0) player.energyRecoverCD = recoverCD;
    return true;
}

// 恢復 energy
export function restoreEnergy(amount) {
    player.currentEnergy = Math.min(player.maxEnergy, player.currentEnergy + amount);
    gameState.floatingTexts.push(
        new FloatingText(player.x, player.y, `+${amount} EP`, {
            color: '#e8c828',
            offsetY: 45,
            spreadX: 10
        })
    );
    for (let i = 0; i < 6; i++) {
        gameState.particles.push(new Particle(player.x, player.y, 'energy'));
    }
}

// 治療玩家
export function healPlayer(amount) {
    player.currentHp = Math.min(player.maxHp, player.currentHp + amount);
    gameState.floatingTexts.push(
        new FloatingText(player.x, player.y, `+${amount}`, {
            color: SETTINGS.colors.textHeal,
            offsetY: 30,
            spreadX: 10
        })
    );
    for (let i = 0; i < 8; i++) {
        gameState.particles.push(new Particle(player.x, player.y, 'heal'));
    }
}

// 玩家受傷
export function takeDamage(amount) {
    if (player.isDead) return;

    const isInvincible = player.invincibleTimer > 0;
    const finalDamage = isInvincible ? amount * player.defendRatio : amount;

    player.currentHp = Math.max(0, player.currentHp - finalDamage);

    if (!isInvincible) {
        player.damageShakeTimer = 0.4;
    }
    player.damageFlashTimer = 0.4;

    gameState.floatingTexts.push(
        new FloatingText(player.x, player.y, `-${finalDamage.toFixed(0)}`, {
            color: SETTINGS.colors.textDmg,
            offsetY: 30,
            spreadX: 8
        })
    );

    for (let i = 0; i < 10; i++) {
        gameState.particles.push(new Particle(player.x, player.y, 'damage'));
    }

    if (player.currentHp <= 0) {
        onDeath();
    }
}

// 玩家死亡
export function onDeath() {
    player.isDead = true;

    // 檢查是否有復活羽毛 buff（在清除前檢查）
    const hasFeather = buffManager.hasBuff(BUFF_TYPE.REVIVE_FEATHER);
    if (hasFeather) {
        // 有羽毛：使用快速復活時間
        player.deathTimer = SETTINGS.deathRevive.reviveItemTime;
    } else {
        // 無羽毛：使用正常復活時間
        player.deathTimer = SETTINGS.deathRevive.autoReviveTime;
    }

    // 清除所有 buffs（透過 BuffManager）— 包括羽毛
    buffManager.clearAll();
    player.invincibleTimer = 0;
    player.maxInvincibleTimer = 0;
    player.defendRatio = 1;

    // 清除 held item
    if (player.heldItem) {
        player.heldItem.isDead = true;
        player.heldItem = null;
    }

    // 生成死亡效果
    gameState.deathEffect = new DeathEffect(player.x, player.y);
}

// 玩家復活
export function onRevive() {
    player.isDead = false;
    player.currentHp = player.maxHp;
    player.currentEnergy = player.maxEnergy;
    player.displayEnergy = player.maxEnergy;
    player.damageShakeTimer = 0;
    player.damageFlashTimer = 0;

    // 復活無敵 buff（顯示 REVIVE icon）
    buffManager.addOrRefreshBuff({
        id: 'reviveBlink',
        type: BUFF_TYPE.INVINCIBLE,
        duration: SETTINGS.deathRevive.reviveInvincibleTime,
        showIcon: true,
        iconType: BUFF_ICON.REVIVE,
        iconColor: '#00f3ff',
        defendRatio: 0
    });
}
