// 遊戲入口點
import { initGame } from './core/Game.js';
import { gameState } from './core/GameState.js';
import { World3D } from './core3d/World3D.js';
import { Camera3D } from './core3d/Camera3D.js';
import { Ground3D } from './core3d/Ground3D.js';
import { Wall3D } from './core3d/Wall3D.js';
import { Player3D } from './entities3d/Player3D.js';
import { Rocket3D } from './projectiles3d/Rocket3D.js';
import { Obstacle3D } from './entities3d/Obstacle3D.js';
import { FireTrap3D } from './entities3d/FireTrap3D.js';
import { HealPack3D } from './items3d/HealPack3D.js';
import { HealBox3D } from './items3d/HealBox3D.js';
import { InvincibleStar3D } from './items3d/InvincibleStar3D.js';
import { EnergyDrink3D } from './items3d/EnergyDrink3D.js';
import { ReviveFeather3D } from './items3d/ReviveFeather3D.js';
import { MeteorStrike3D } from './items3d/MeteorStrike3D.js';
import { Bomb3D } from './items3d/Bomb3D.js';
import { AimingUI3D } from './ui3d/AimingUI3D.js';
import { EffectsManager3D } from './effects3d/EffectsManager3D.js';
import { DeathEffect3D } from './effects3d/DeathEffect3D.js';
import { PlayerStatusUI3D } from './ui3d/PlayerStatusUI3D.js';
import { BuffIcons3D } from './ui3d/BuffIcons3D.js';
import { buffManager3D, BUFF_TYPE_3D, BUFF_ICON_3D } from './core3d/BuffManager3D.js';
import { FloatingTextManager3D } from './ui3d/FloatingText3D.js';
import { InventoryUI3D } from './ui3d/InventoryUI3D.js';
import * as THREE from 'three';

// 遊戲模式
const GAME_MODE = {
    NORMAL: 0,
    AIMING: 1
};
let currentMode = GAME_MODE.NORMAL;

// 3D 系統實例
let world3d = null;
let camera3d = null;
let ground3d = null;
let wall3d = null;
let player3d = null;
let effects3d = null;
let deathEffect = null;

// 遊戲物件陣列
const rockets = [];
const obstacles = [];
const fireTraps = [];
const items = [];

// 道具類型由 gameState.currentItemType 控制（Settings Panel 連動）

// UI 系統
let aimingUI = null;
let playerStatusUI = null;
let buffIcons = null;
let floatingTexts = null;
let inventoryUI = null;

// 射擊冷卻
let shootCooldown = 0;
const SHOOT_COOLDOWN_TIME = 0.15;

// 輸入狀態
const input = {
    keys: {},
    keysProcessed: {},  // 防止重複觸發
    mouse: {
        x: 0,
        z: 0,
        screenX: 0,
        screenY: 0,
        leftDown: false,
        leftPressed: false
    }
};

// Raycaster
let raycaster = null;
let mouseNDC = new THREE.Vector2();

// 世界設定
const WORLD_SIZE = 25;

// 時間追蹤
let lastTime = performance.now();

// DOM 載入完成後啟動遊戲
document.addEventListener('DOMContentLoaded', () => {
    init3D();
    initGame();
    animate3D();
});

function init3D() {
    const container = document.getElementById('game-container');

    // 建立 3D 世界
    world3d = new World3D(container);

    // 建立攝影機
    camera3d = new Camera3D(window.innerWidth / window.innerHeight);

    // 建立地面
    ground3d = new Ground3D(world3d.getScene(), WORLD_SIZE);

    // 建立邊界牆
    wall3d = new Wall3D(world3d.getScene(), WORLD_SIZE);

    // 建立玩家
    player3d = new Player3D(world3d.getScene(), WORLD_SIZE);

    // 初始化特效管理器（必須在 createSceneObjects 之前）
    effects3d = new EffectsManager3D(world3d.getScene());
    deathEffect = new DeathEffect3D(world3d.getScene());

    // 設定玩家特效回調
    player3d.onDeath = (pos, hadFeather) => {
        // 啟動碎片死亡特效
        deathEffect.startDeath(pos);

        // 簡單粒子特效（補充）
        effects3d.damageEffect(pos.x, pos.z, 8);

        // 死亡時清除所有 buff
        buffManager3D.clearAll();

        // 如果有羽毛，顯示文字
        if (hadFeather) {
            floatingTexts.showText(pos, 'FEATHER USED!', 0xffffff);
        }
    };
    player3d.onReviveStart = (pos) => {
        // 啟動碎片復活特效
        deathEffect.startRevive(pos);

        // 設定復活完成回調
        deathEffect.onReviveComplete = () => {
            // 復活完成（讓 Player3D 顯示）
        };
    };
    player3d.onRevive = (pos) => {
        floatingTexts.showText(pos, 'REVIVE!', 0x00ffff);
        // 金色星星特效
        effects3d.invincibleEffect(pos.x, pos.z);
        // 復活後加入 3 秒無敵（顯示 REVIVE 菱形 icon）
        buffManager3D.addOrRefreshBuff({
            id: 'reviveBlink',
            type: BUFF_TYPE_3D.INVINCIBLE,
            duration: 3,
            showIcon: true,
            iconType: BUFF_ICON_3D.REVIVE,
            iconColor: '#00ffff',
            defendRatio: 0
        });
    };
    player3d.onFeatherUsed = () => {
        buffManager3D.removeBuffByType(BUFF_TYPE_3D.REVIVE_FEATHER);
    };
    player3d.onTakeDamage = (pos, amount) => {
        floatingTexts.showDamage(pos, amount);
    };
    player3d.onHeal = (pos, amount) => {
        floatingTexts.showHeal(pos, amount);
    };

    // 建立場景物件
    createSceneObjects();

    // 初始化 Raycaster
    raycaster = new THREE.Raycaster();

    // 初始化瞄準 UI
    aimingUI = new AimingUI3D(world3d.getScene());

    // 初始化 UI 系統
    playerStatusUI = new PlayerStatusUI3D(world3d.getScene());
    buffIcons = new BuffIcons3D(world3d.getScene());
    floatingTexts = new FloatingTextManager3D(world3d.getScene());
    inventoryUI = new InventoryUI3D();

    // 綁定輸入事件
    setupInputHandlers();

    console.log('3D system initialized - Phase 12: Complete');
    console.log('Obstacles:', obstacles.map(o => ({x: o.position.x, z: o.position.z, size: o.size})));
}

function createSceneObjects() {
    const scene = world3d.getScene();

    // 測試障礙物
    const obstaclePositions = [
        { x: 4, z: 4 },
        { x: -4, z: 4 },
        { x: 4, z: -4 },
        { x: -4, z: -4 },
        { x: 0, z: 6 },
    ];

    obstaclePositions.forEach(pos => {
        const obstacle = new Obstacle3D(scene, pos.x, pos.z, 2);
        obstacles.push(obstacle);
    });

    // 測試火焰陷阱
    const fireTrapPositions = [
        { x: 2, z: 0 },
        { x: -2, z: 0 },
    ];

    fireTrapPositions.forEach(pos => {
        const fireTrap = new FireTrap3D(scene, pos.x, pos.z, {
            damage: 50,
            damageInterval: 0.7
        });
        fireTrap.onDamage = (playerPos, damage) => {
            effects3d.damageEffect(playerPos.x, playerPos.z, 6);
        };
        fireTraps.push(fireTrap);
    });
}

function setupInputHandlers() {
    window.addEventListener('keydown', (e) => {
        input.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
        input.keys[e.code] = false;
    });

    window.addEventListener('mousemove', (e) => {
        input.mouse.screenX = e.clientX;
        input.mouse.screenY = e.clientY;
        mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
        updateMouseWorldPosition();
    });

    window.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            input.mouse.leftDown = true;
            input.mouse.leftPressed = true;
        }
    });

    window.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            input.mouse.leftDown = false;
        }
    });

    window.addEventListener('wheel', (e) => {
        camera3d.applyZoom(e.deltaY > 0 ? 1 : -1);
    });

    window.addEventListener('resize', () => {
        camera3d.onResize(window.innerWidth / window.innerHeight);
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());
}

function updateMouseWorldPosition() {
    if (!raycaster || !camera3d || !ground3d) return;
    raycaster.setFromCamera(mouseNDC, camera3d.getCamera());
    const intersects = raycaster.intersectObject(ground3d.getMesh());
    if (intersects.length > 0) {
        input.mouse.x = intersects[0].point.x;
        input.mouse.z = intersects[0].point.z;
    }
}

function processInput(dt) {
    // WASD 移動
    let moveX = 0;
    let moveZ = 0;

    if (input.keys['KeyW'] || input.keys['ArrowUp']) moveZ = -1;
    if (input.keys['KeyS'] || input.keys['ArrowDown']) moveZ = 1;
    if (input.keys['KeyA'] || input.keys['ArrowLeft']) moveX = -1;
    if (input.keys['KeyD'] || input.keys['ArrowRight']) moveX = 1;

    player3d.setMoveInput(moveX, moveZ);
    player3d.setFacingTarget(input.mouse.x, input.mouse.z);

    // F 鍵切換瞄準模式
    if (input.keys['KeyF'] && !input.keysProcessed['KeyF']) {
        if (player3d.heldItem && player3d.heldItem.type === 'ACTIVE') {
            if (currentMode === GAME_MODE.NORMAL) {
                enterAimingMode();
            } else {
                exitAimingMode();
            }
        }
        input.keysProcessed['KeyF'] = true;
    }
    if (!input.keys['KeyF']) {
        input.keysProcessed['KeyF'] = false;
    }

    // 射擊 / 丟出道具
    if (shootCooldown > 0) shootCooldown -= dt;

    if (input.mouse.leftDown && shootCooldown <= 0 && !player3d.isDead) {
        if (currentMode === GAME_MODE.AIMING) {
            // 丟出道具
            throwItem();
        } else {
            // 射擊火箭
            fireRocket();
            shootCooldown = SHOOT_COOLDOWN_TIME;
        }
    }

    // R 鍵生成道具
    if (input.keys['KeyR'] && !input.keysProcessed['KeyR']) {
        spawnItem();
        input.keysProcessed['KeyR'] = true;
    }
    if (!input.keys['KeyR']) {
        input.keysProcessed['KeyR'] = false;
    }

    input.mouse.leftPressed = false;
}

// 火箭消耗 energy
const ROCKET_ENERGY_COST = 10;

function fireRocket() {
    // 檢查 energy（有 buff 時不消耗）
    if (!player3d.hasEnergyBuff) {
        if (player3d.energy < ROCKET_ENERGY_COST) {
            return;  // energy 不足，無法發射
        }
        player3d.energy -= ROCKET_ENERGY_COST;
    }

    const playerPos = player3d.getPosition();
    const direction = new THREE.Vector3(
        input.mouse.x - playerPos.x,
        0,
        input.mouse.z - playerPos.z
    ).normalize();

    const startPos = playerPos.clone();
    startPos.x += direction.x * 0.5;
    startPos.z += direction.z * 0.5;

    const rocket = new Rocket3D(world3d.getScene(), startPos, direction, {
        speed: 7.5,
        damage: 15,
        radius: 2.2,
        lifetime: 4
    });

    rocket.onExplode = (pos, radius, damage) => {
        onRocketExplode(pos, radius, damage);
    };

    rockets.push(rocket);
}

function onRocketExplode(position, radius, damage) {
    // 爆炸特效
    effects3d.rocketExplosion(position.x, position.z, radius);
    console.log(`Rocket exploded at (${position.x.toFixed(1)}, ${position.z.toFixed(1)})`);
}

function enterAimingMode() {
    currentMode = GAME_MODE.AIMING;
    aimingUI.show();

    // Auto zoom（如果範圍太大）
    const item = player3d.heldItem;
    if (item) {
        const neededZoom = camera3d.calcZoomForRadius(item.maxAimRadius);
        if (neededZoom < camera3d.zoom) {
            camera3d.startAutoZoom(neededZoom, 0.5);
        }
    }

    console.log('Entered aiming mode');
}

function exitAimingMode() {
    currentMode = GAME_MODE.NORMAL;
    aimingUI.hide();
    camera3d.returnToNormalZoom(0.5);
    console.log('Exited aiming mode');
}

function throwItem() {
    const item = player3d.heldItem;
    if (!item) return;

    const targetPos = aimingUI.getTargetPos();
    const playerPos = player3d.getPosition();

    // Bomb 需要玩家位置計算拋物線
    if (item.constructor.name === 'Bomb3D') {
        item.activate(targetPos, playerPos);
    } else {
        item.activate(targetPos);
    }

    player3d.heldItem = null;

    exitAimingMode();
    shootCooldown = 0.3;

    console.log(`Threw item to (${targetPos.x.toFixed(1)}, ${targetPos.z.toFixed(1)})`);
}

function spawnItem() {
    const scene = world3d.getScene();

    // 隨機位置（玩家附近）
    const playerPos = player3d.getPosition();
    const angle = Math.random() * Math.PI * 2;
    const dist = 3 + Math.random() * 5;
    let x = playerPos.x + Math.cos(angle) * dist;
    let z = playerPos.z + Math.sin(angle) * dist;

    // 限制在世界範圍內
    const margin = 2;
    const halfWorld = WORLD_SIZE / 2 - margin;
    x = Math.max(-halfWorld, Math.min(halfWorld, x));
    z = Math.max(-halfWorld, Math.min(halfWorld, z));

    // 根據類型生成
    let item;
    switch (gameState.currentItemType) {
        case 'HealBox':
            item = new HealBox3D(scene, x, z, {
                minAimRadius: 2,
                maxAimRadius: 10,
                healRadius: 2,
                healAmount: 25,
                tickRate: 1,
                maxTicks: 5
            });
            item.onHealTick = (pos, radius, amount) => {
                effects3d.healEffect(pos.x, pos.z, 8);
                // 檢查玩家是否在範圍內
                if (item.isPlayerInRange(player3d)) {
                    player3d.heal(amount);
                }
            };
            break;
        case 'HealPack':
            item = new HealPack3D(scene, x, z, { healAmount: 30, duration: 30 });
            break;
        case 'InvincibleStar':
            item = new InvincibleStar3D(scene, x, z, { buffDuration: 5, duration: 20 });
            item.onActivate = (duration) => {
                buffManager3D.addOrRefreshBuff({
                    type: BUFF_TYPE_3D.INVINCIBLE,
                    duration: duration,
                    showIcon: true,
                    iconType: BUFF_ICON_3D.SHIELD,
                    iconColor: '#ffd54f',
                    defendRatio: 0
                });
            };
            break;
        case 'EnergyDrink':
            item = new EnergyDrink3D(scene, x, z, { buffDuration: 10, duration: 20 });
            item.onActivate = (duration) => {
                buffManager3D.addOrRefreshBuff({
                    type: BUFF_TYPE_3D.ENERGY_HOT,
                    duration: duration,
                    showIcon: true,
                    iconType: BUFF_ICON_3D.ENERGY,
                    iconColor: '#e8c828'
                });
            };
            break;
        case 'ReviveFeather':
            item = new ReviveFeather3D(scene, x, z, { duration: 20 });
            item.onActivate = () => {
                // 羽毛 buff 一次只能存在 1 個
                if (buffManager3D.hasBuff(BUFF_TYPE_3D.REVIVE_FEATHER)) return;
                buffManager3D.addBuff({
                    id: 'reviveFeather',
                    type: BUFF_TYPE_3D.REVIVE_FEATHER,
                    duration: 999999,  // 永久直到死亡消耗
                    showIcon: true,
                    iconType: BUFF_ICON_3D.FEATHER,
                    iconColor: '#ffffff'
                });
            };
            break;
        case 'MeteorStrike':
            item = new MeteorStrike3D(scene, x, z, {
                minAimRadius: 3,
                maxAimRadius: 12,
                damage: 150,
                explosionRadius: 2.5
            });
            item.onImpact = (pos, radius, damage) => {
                effects3d.meteorImpact(pos.x, pos.z, radius);
                // TODO: 傷害判定
            };
            break;
        case 'Bomb':
            item = new Bomb3D(scene, x, z, {
                minAimRadius: 1,
                maxAimRadius: 8,
                damage: 100,
                explosionRadius: 2.2
            });
            item.onExplode = (pos, radius, damage) => {
                effects3d.bombExplosion(pos.x, pos.z, radius);
                // TODO: 傷害判定
            };
            break;
        default:
            item = new HealPack3D(scene, x, z, { healAmount: 30, duration: 30 });
            break;
    }

    // 通用撿起特效
    item.onPickup = (pos, type) => {
        // 根據道具類型選擇顏色
        let color = 0xffffff;
        switch (gameState.currentItemType) {
            case 'HealBox':
            case 'HealPack':
                color = 0x66ff66;
                break;
            case 'InvincibleStar':
                color = 0xffd54f;
                effects3d.invincibleEffect(pos.x, pos.z);
                break;
            case 'EnergyDrink':
                color = 0xffb74d;
                effects3d.energyEffect(pos.x, pos.z, 8);
                break;
            case 'ReviveFeather':
                color = 0x00ffff;
                break;
            default:
                color = 0xffffff;
        }
        effects3d.pickupEffect(pos.x, pos.z, color);
    };

    items.push(item);
    console.log(`Spawned ${gameState.currentItemType} at (${x.toFixed(1)}, ${z.toFixed(1)})`);
}

function updateItems(dt) {
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];

        // 更新
        item.update(dt);

        // 嘗試撿取
        if (!item.isDead && !item.isHeld) {
            item.tryPickup(player3d);
        }

        // 移除死亡道具
        if (item.isDead) {
            items.splice(i, 1);
        }
    }
}

function updateRockets(dt) {
    for (let i = rockets.length - 1; i >= 0; i--) {
        const rocket = rockets[i];

        if (rocket.isDead) {
            rockets.splice(i, 1);
            continue;
        }

        // 先更新位置
        rocket.update(dt, WORLD_SIZE);

        // 再檢查與障礙物碰撞
        if (!rocket.isDead) {
            const rx = rocket.position.x;
            const rz = rocket.position.z;

            for (const obstacle of obstacles) {
                const ox = obstacle.position.x;
                const oz = obstacle.position.z;
                const half = obstacle.size / 2;

                // 檢測
                if (rx >= ox - half && rx <= ox + half &&
                    rz >= oz - half && rz <= oz + half) {
                    console.log(`HIT! Rocket(${rx.toFixed(2)}, ${rz.toFixed(2)}) -> Obstacle(${ox}, ${oz})`);
                    rocket.explode();
                    break;
                }
            }
        }

        if (rocket.isDead) {
            rockets.splice(i, 1);
        }
    }
}

function updateObstacles() {
    // 玩家與障礙物碰撞
    for (const obstacle of obstacles) {
        obstacle.resolveSphereCollision(player3d.position, player3d.radius);
    }
    // 碰撞解決後同步 mesh 位置
    player3d.mesh.position.copy(player3d.position);
}

function updateFireTraps(dt) {
    for (const fireTrap of fireTraps) {
        fireTrap.update(dt, player3d);
    }
}

function update(dt) {
    // ===== 死亡狀態處理 =====
    if (player3d.isDead) {
        // 退出瞄準模式
        if (currentMode === GAME_MODE.AIMING) {
            currentMode = GAME_MODE.NORMAL;
            aimingUI.hide();
        }

        // 更新死亡倒數
        player3d.updateDeath(dt);

        // 更新死亡特效（碎片物理 + 復活動畫）
        deathEffect.update(dt);

        // 死亡期間仍更新世界物件
        updateRockets(dt);
        updateFireTraps(dt);
        updateItems(dt);
        effects3d.update(dt);

        // 攝影機仍跟隨
        const playerPos = player3d.getPosition();
        camera3d.setTarget(playerPos.x, 0, playerPos.z);
        camera3d.update(dt);

        // 隱藏 UI
        playerStatusUI.setVisible(false);
        buffIcons.setVisible(false);

        floatingTexts.update(dt);
        inventoryUI.update(null);
        return;
    }

    // 如果死亡特效仍在播放（例如復活動畫），繼續更新
    if (deathEffect.isActive()) {
        deathEffect.update(dt);
    }

    // ===== 正常狀態 =====
    processInput(dt);

    // 更新 buff 系統
    buffManager3D.update(dt);

    // 同步 buff 狀態到 player3d
    const invBuff = buffManager3D.getBuff(BUFF_TYPE_3D.INVINCIBLE);
    if (invBuff) {
        player3d.isInvincible = true;
        player3d.invincibleTimer = invBuff.duration - invBuff.elapsed;
    } else {
        player3d.isInvincible = false;
        player3d.invincibleTimer = 0;
    }

    const energyBuff = buffManager3D.getBuff(BUFF_TYPE_3D.ENERGY_HOT);
    if (energyBuff) {
        player3d.hasEnergyBuff = true;
        player3d.energyBuffTimer = energyBuff.duration - energyBuff.elapsed;
    } else {
        player3d.hasEnergyBuff = false;
        player3d.energyBuffTimer = 0;
    }

    player3d.hasReviveFeather = buffManager3D.hasBuff(BUFF_TYPE_3D.REVIVE_FEATHER);

    player3d.update(dt);

    // 障礙物碰撞（在玩家移動後）
    updateObstacles();

    updateRockets(dt);
    updateFireTraps(dt);
    updateItems(dt);

    // 更新特效
    effects3d.update(dt);

    // 瞄準 UI
    if (currentMode === GAME_MODE.AIMING && player3d.heldItem) {
        aimingUI.update(
            player3d.getPosition(),
            { x: input.mouse.x, z: input.mouse.z },
            player3d.heldItem,
            dt
        );
    }

    // 攝影機跟隨
    const playerPos = player3d.getPosition();
    camera3d.setTarget(playerPos.x, 0, playerPos.z);
    camera3d.update(dt);

    // 更新 UI
    const cam = camera3d.getCamera();
    playerStatusUI.update(playerPos, player3d.hp, player3d.maxHp, player3d.energy, player3d.maxEnergy, cam, dt);
    playerStatusUI.setVisible(true);
    buffIcons.update(playerPos, cam, dt);
    buffIcons.setVisible(true);

    floatingTexts.update(dt);
    inventoryUI.update(player3d.heldItem);
}

function animate3D() {
    requestAnimationFrame(animate3D);

    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    update(dt);
    world3d.render(camera3d.getCamera());
}

// 匯出
export { world3d, camera3d, ground3d, wall3d, player3d, effects3d, rockets, obstacles, fireTraps, items, input, WORLD_SIZE };
