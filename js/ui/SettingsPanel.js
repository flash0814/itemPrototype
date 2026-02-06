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
    starDef: null,
    // EnergyDrink
    edrinkGroup: null,
    edrinkDur: null,
    edrinkInstant: null,
    edrinkEffect: null,
    // MeteorStrike
    meteorGroup: null,
    meteorDur: null,
    meteorAim: null,
    meteorDmg: null,
    meteorRad: null,
    // ReviveFeather
    featherGroup: null,
    featherDur: null,
    featherRevive: null,
    // Bomb
    bombGroup: null,
    bombDur: null,
    bombAim: null,
    bombDmg: null,
    bombRad: null
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
    inputs.edrinkGroup = document.getElementById('group-energydrink');
    inputs.edrinkDur = document.getElementById('inp-edrink-dur');
    inputs.edrinkInstant = document.getElementById('inp-edrink-instant');
    inputs.edrinkEffect = document.getElementById('inp-edrink-effect');
    inputs.meteorGroup = document.getElementById('group-meteorstrike');
    inputs.meteorDur = document.getElementById('inp-meteor-dur');
    inputs.meteorAim = document.getElementById('inp-meteor-aim');
    inputs.meteorDmg = document.getElementById('inp-meteor-dmg');
    inputs.meteorRad = document.getElementById('inp-meteor-rad');
    inputs.featherGroup = document.getElementById('group-revivefeather');
    inputs.featherDur = document.getElementById('inp-feather-dur');
    inputs.featherRevive = document.getElementById('inp-feather-revive');
    inputs.bombGroup = document.getElementById('group-bomb');
    inputs.bombDur = document.getElementById('inp-bomb-dur');
    inputs.bombAim = document.getElementById('inp-bomb-aim');
    inputs.bombDmg = document.getElementById('inp-bomb-dmg');
    inputs.bombRad = document.getElementById('inp-bomb-rad');

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
        inputs.edrinkGroup.classList.add('hidden');
        inputs.meteorGroup.classList.add('hidden');
        inputs.featherGroup.classList.add('hidden');
        inputs.bombGroup.classList.add('hidden');

        if (e.target.value === 'HealBox') {
            inputs.healboxGroup.classList.remove('hidden');
        } else if (e.target.value === 'HealPack') {
            inputs.packGroup.classList.remove('hidden');
        } else if (e.target.value === 'InvincibleStar') {
            inputs.starGroup.classList.remove('hidden');
        } else if (e.target.value === 'EnergyDrink') {
            inputs.edrinkGroup.classList.remove('hidden');
        } else if (e.target.value === 'MeteorStrike') {
            inputs.meteorGroup.classList.remove('hidden');
        } else if (e.target.value === 'ReviveFeather') {
            inputs.featherGroup.classList.remove('hidden');
        } else if (e.target.value === 'Bomb') {
            inputs.bombGroup.classList.remove('hidden');
        }
    });

    // --- HealBox ---
    inputs.aimRadius.addEventListener('change', (e) => SETTINGS.itemHealBox.maxAimRadius = Number(e.target.value));
    inputs.healCounts.addEventListener('change', (e) => SETTINGS.itemHealBox.counts = Math.max(1, parseInt(e.target.value)));
    inputs.healRad.addEventListener('change', (e) => SETTINGS.itemHealBox.radius = Number(e.target.value));
    inputs.healVal.addEventListener('change', (e) => SETTINGS.itemHealBox.value = Number(e.target.value));
    inputs.healTick.addEventListener('change', (e) => SETTINGS.itemHealBox.tick = Number(e.target.value));
    inputs.healboxDur.addEventListener('change', (e) => SETTINGS.itemHealBox.duration = Number(e.target.value));

    // --- HealPack ---
    inputs.packDur.addEventListener('change', (e) => SETTINGS.itemHealPack.duration = Number(e.target.value));
    inputs.packVal.addEventListener('change', (e) => SETTINGS.itemHealPack.value = Number(e.target.value));

    // --- InvincibleStar ---
    inputs.starDur.addEventListener('change', (e) => SETTINGS.itemInvincibleStar.duration = Number(e.target.value));
    inputs.starEffect.addEventListener('change', (e) => SETTINGS.itemInvincibleStar.effectDuration = Number(e.target.value));
    inputs.starDef.addEventListener('change', (e) => SETTINGS.itemInvincibleStar.defendRatio = Number(e.target.value));

    // --- EnergyDrink ---
    inputs.edrinkDur.addEventListener('change', (e) => SETTINGS.itemEnergyDrink.duration = Number(e.target.value));
    inputs.edrinkInstant.addEventListener('change', (e) => SETTINGS.itemEnergyDrink.instantPlus = Number(e.target.value));
    inputs.edrinkEffect.addEventListener('change', (e) => SETTINGS.itemEnergyDrink.effectDuration = Number(e.target.value));

    // --- MeteorStrike ---
    inputs.meteorDur.addEventListener('change', (e) => SETTINGS.itemMeteorStrike.duration = Number(e.target.value));
    inputs.meteorAim.addEventListener('change', (e) => SETTINGS.itemMeteorStrike.maxAimRadius = Number(e.target.value));
    inputs.meteorDmg.addEventListener('change', (e) => SETTINGS.itemMeteorStrike.damage = Number(e.target.value));
    inputs.meteorRad.addEventListener('change', (e) => SETTINGS.itemMeteorStrike.radius = Number(e.target.value));

    // --- Bomb ---
    inputs.bombDur.addEventListener('change', (e) => SETTINGS.itemBomb.duration = Number(e.target.value));
    inputs.bombAim.addEventListener('change', (e) => SETTINGS.itemBomb.maxAimRadius = Number(e.target.value));
    inputs.bombDmg.addEventListener('change', (e) => SETTINGS.itemBomb.damage = Number(e.target.value));
    inputs.bombRad.addEventListener('change', (e) => SETTINGS.itemBomb.radius = Number(e.target.value));

    // --- ReviveFeather ---
    inputs.featherDur.addEventListener('change', (e) => SETTINGS.itemReviveFeather.duration = Number(e.target.value));
    inputs.featherRevive.addEventListener('change', (e) => SETTINGS.deathRevive.reviveItemTime = Number(e.target.value));

    // --- 防止 panel 元素 focus 時攔截遊戲按鍵 ---
    // select：keydown 時 preventDefault + blur（防止方向鍵跳選項觸發 R/F 等遊戲鍵）
    document.querySelectorAll('#settings-panel select').forEach(el => {
        el.addEventListener('change', () => el.blur());
        el.addEventListener('keydown', (e) => {
            e.preventDefault();
            el.blur();
        });
    });
    // input：允許打字，只在 change 後 blur（讓 focus 回到遊戲）
    document.querySelectorAll('#settings-panel input').forEach(el => {
        el.addEventListener('change', () => el.blur());
    });

    // --- Select 高亮 + 滾輪切換 ---
    setupSelectHighlight();

    // --- Sync DOM inputs from SETTINGS ---
    syncInputsFromSettings();
}

/** 下拉選單高亮互動：點擊高亮、panel 空白處取消、滾輪切換選項 */
function setupSelectHighlight() {
    const panel = document.getElementById('settings-panel');
    const allSelects = panel.querySelectorAll('select');
    let activeSelect = null;

    // 點擊 select → 高亮
    allSelects.forEach(sel => {
        sel.addEventListener('click', (e) => {
            e.stopPropagation();
            if (activeSelect && activeSelect !== sel) {
                activeSelect.classList.remove('select-active');
            }
            activeSelect = sel;
            sel.classList.add('select-active');
        });
    });

    // 點擊 panel 內非 select 區域 → 取消高亮
    panel.addEventListener('click', () => {
        if (activeSelect) {
            activeSelect.classList.remove('select-active');
            activeSelect = null;
        }
    });

    // 全域滾輪切換高亮選項（非循環，Ctrl+滾輪保留給 zoom）
    window.addEventListener('wheel', (e) => {
        if (!activeSelect || e.ctrlKey) return;
        e.preventDefault();
        const idx = activeSelect.selectedIndex;
        const maxIdx = activeSelect.options.length - 1;
        if (e.deltaY > 0 && idx < maxIdx) {
            activeSelect.selectedIndex = idx + 1;
            activeSelect.dispatchEvent(new Event('change'));
        } else if (e.deltaY < 0 && idx > 0) {
            activeSelect.selectedIndex = idx - 1;
            activeSelect.dispatchEvent(new Event('change'));
        }
    }, { passive: false });
}

/** 將 SETTINGS 的值寫入所有 DOM input，確保面板顯示與程式碼一致 */
export function syncInputsFromSettings() {
    // Player
    inputs.maxHP.value = SETTINGS.general.maxPlayerHP;
    // Rocket
    inputs.rocketSpeed.value = SETTINGS.attackRocket.speed;
    inputs.rocketDmg.value = SETTINGS.attackRocket.damage;
    inputs.rocketRad.value = SETTINGS.attackRocket.radius;
    inputs.rocketLife.value = SETTINGS.attackRocket.lifetime;
    // FireTrap
    inputs.fireDmg.value = SETTINGS.general.fireTrapDmg;
    inputs.fireRate.value = SETTINGS.general.fireTrapTick;
    // HealBox
    inputs.aimRadius.value = SETTINGS.itemHealBox.maxAimRadius;
    inputs.healCounts.value = SETTINGS.itemHealBox.counts;
    inputs.healRad.value = SETTINGS.itemHealBox.radius;
    inputs.healVal.value = SETTINGS.itemHealBox.value;
    inputs.healTick.value = SETTINGS.itemHealBox.tick;
    inputs.healboxDur.value = SETTINGS.itemHealBox.duration;
    // HealPack
    inputs.packDur.value = SETTINGS.itemHealPack.duration;
    inputs.packVal.value = SETTINGS.itemHealPack.value;
    // InvincibleStar
    inputs.starDur.value = SETTINGS.itemInvincibleStar.duration;
    inputs.starEffect.value = SETTINGS.itemInvincibleStar.effectDuration;
    inputs.starDef.value = SETTINGS.itemInvincibleStar.defendRatio;
    // EnergyDrink
    inputs.edrinkDur.value = SETTINGS.itemEnergyDrink.duration;
    inputs.edrinkInstant.value = SETTINGS.itemEnergyDrink.instantPlus;
    inputs.edrinkEffect.value = SETTINGS.itemEnergyDrink.effectDuration;
    // MeteorStrike
    inputs.meteorDur.value = SETTINGS.itemMeteorStrike.duration;
    inputs.meteorAim.value = SETTINGS.itemMeteorStrike.maxAimRadius;
    inputs.meteorDmg.value = SETTINGS.itemMeteorStrike.damage;
    inputs.meteorRad.value = SETTINGS.itemMeteorStrike.radius;
    // ReviveFeather
    inputs.featherDur.value = SETTINGS.itemReviveFeather.duration;
    inputs.featherRevive.value = SETTINGS.deathRevive.reviveItemTime;
    // Bomb
    inputs.bombDur.value = SETTINGS.itemBomb.duration;
    inputs.bombAim.value = SETTINGS.itemBomb.maxAimRadius;
    inputs.bombDmg.value = SETTINGS.itemBomb.damage;
    inputs.bombRad.value = SETTINGS.itemBomb.radius;
}
