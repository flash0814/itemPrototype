import { SETTINGS } from '../core/Settings.js';
import { gameState } from '../core/GameState.js';
import { player } from '../entities/Player.js';

// UI 輸入元素引用
export const inputs = {
    playerSettingsSelect: null,
    groupPlayerStatus: null,
    groupRocketAttack: null,
    maxHP: null,
    rocketSpeed: null,
    rocketDmg: null,
    rocketRad: null,
    rocketLife: null,
    fireDmg: null,
    fireRate: null,
    // Items dropdown
    itemTypeSelect: null,
    // HealBox
    healboxGroup: null,
    aimRadius: null,
    healCounts: null,
    healRad: null,
    healVal: null,
    healTick: null,
    healboxDur: null,
    // HealPack
    packGroup: null,
    packDur: null,
    packVal: null,
    // InvincibleStar
    starGroup: null,
    starDur: null,
    starEffect: null,
    starDef: null
};

export function initSettingsPanel() {
    // 取得 DOM 元素
    inputs.playerSettingsSelect = document.getElementById('sel-player-settings');
    inputs.groupPlayerStatus = document.getElementById('group-player-status');
    inputs.groupRocketAttack = document.getElementById('group-rocket-attack');
    inputs.maxHP = document.getElementById('inp-player-hp');
    inputs.rocketSpeed = document.getElementById('inp-rocket-speed');
    inputs.rocketDmg = document.getElementById('inp-rocket-dmg');
    inputs.rocketRad = document.getElementById('inp-rocket-rad');
    inputs.rocketLife = document.getElementById('inp-rocket-life');
    inputs.fireDmg = document.getElementById('inp-fire-dmg');
    inputs.fireRate = document.getElementById('inp-fire-rate');

    // Items
    inputs.itemTypeSelect = document.getElementById('sel-item-type');
    inputs.healboxGroup = document.getElementById('group-healbox');
    inputs.aimRadius = document.getElementById('inp-aim-radius');
    inputs.healCounts = document.getElementById('inp-heal-counts');
    inputs.healRad = document.getElementById('inp-heal-rad');
    inputs.healVal = document.getElementById('inp-heal-val');
    inputs.healTick = document.getElementById('inp-heal-tick');
    inputs.healboxDur = document.getElementById('inp-healbox-dur');
    inputs.packGroup = document.getElementById('group-healpack');
    inputs.packDur = document.getElementById('inp-pack-dur');
    inputs.packVal = document.getElementById('inp-pack-val');
    inputs.starGroup = document.getElementById('group-star');
    inputs.starDur = document.getElementById('inp-star-dur');
    inputs.starEffect = document.getElementById('inp-star-effect');
    inputs.starDef = document.getElementById('inp-star-def');

    // --- Player Settings ---
    inputs.playerSettingsSelect.addEventListener('change', (e) => {
        gameState.currentPlayerSettingType = e.target.value;
        if (gameState.currentPlayerSettingType === 'PlayerStatus') {
            inputs.groupPlayerStatus.classList.remove('hidden');
            inputs.groupRocketAttack.classList.add('hidden');
        } else if (gameState.currentPlayerSettingType === 'RocketAttack') {
            inputs.groupPlayerStatus.classList.add('hidden');
            inputs.groupRocketAttack.classList.remove('hidden');
        }
    });

    inputs.maxHP.addEventListener('change', (e) => {
        SETTINGS.general.maxPlayerHP = Number(e.target.value);
        player.maxHp = SETTINGS.general.maxPlayerHP;
        if (player.currentHp > player.maxHp) player.currentHp = player.maxHp;
    });

    inputs.rocketSpeed.addEventListener('change', (e) => SETTINGS.attackRocket.speed = Number(e.target.value));
    inputs.rocketDmg.addEventListener('change', (e) => SETTINGS.attackRocket.damage = Number(e.target.value));
    inputs.rocketRad.addEventListener('change', (e) => SETTINGS.attackRocket.radius = Number(e.target.value));
    inputs.rocketLife.addEventListener('change', (e) => SETTINGS.attackRocket.lifetime = Number(e.target.value));
    inputs.fireDmg.addEventListener('change', (e) => SETTINGS.general.fireTrapDmg = Number(e.target.value));
    inputs.fireRate.addEventListener('change', (e) => SETTINGS.general.fireTrapTick = Number(e.target.value));

    // --- Items dropdown ---
    inputs.itemTypeSelect.addEventListener('change', (e) => {
        gameState.currentItemType = e.target.value;
        inputs.healboxGroup.classList.add('hidden');
        inputs.packGroup.classList.add('hidden');
        inputs.starGroup.classList.add('hidden');

        if (e.target.value === 'HealBox') {
            inputs.healboxGroup.classList.remove('hidden');
        } else if (e.target.value === 'HealPack') {
            inputs.packGroup.classList.remove('hidden');
        } else if (e.target.value === 'InvincibleStar') {
            inputs.starGroup.classList.remove('hidden');
        }
    });

    // --- HealBox ---
    inputs.aimRadius.addEventListener('change', (e) => SETTINGS.itemHealBox.maxAimRadius = Number(e.target.value));
    inputs.healCounts.addEventListener('change', (e) => SETTINGS.itemHealBox.counts = Math.max(1, parseInt(e.target.value)));
    inputs.healRad.addEventListener('change', (e) => SETTINGS.itemHealBox.radius = Number(e.target.value));
    inputs.healVal.addEventListener('change', (e) => SETTINGS.itemHealBox.value = Number(e.target.value));
    inputs.healTick.addEventListener('change', (e) => SETTINGS.itemHealBox.tick = Number(e.target.value));
    inputs.healboxDur.addEventListener('change', (e) => SETTINGS.itemHealBox.groundDuration = Number(e.target.value));

    // --- HealPack ---
    inputs.packDur.addEventListener('change', (e) => SETTINGS.itemHealPack.duration = Number(e.target.value));
    inputs.packVal.addEventListener('change', (e) => SETTINGS.itemHealPack.value = Number(e.target.value));

    // --- InvincibleStar ---
    inputs.starDur.addEventListener('change', (e) => SETTINGS.itemInvincibleStar.duration = Number(e.target.value));
    inputs.starEffect.addEventListener('change', (e) => SETTINGS.itemInvincibleStar.effectDuration = Number(e.target.value));
    inputs.starDef.addEventListener('change', (e) => SETTINGS.itemInvincibleStar.defendRatio = Number(e.target.value));
}
