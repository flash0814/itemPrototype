import { SETTINGS } from './Settings.js';
import { gameState, editorState, input, GAME_STATE_MODE } from './GameState.js';
import { lerpAngle, checkCollisionWithRect } from './Utils.js';
import { player, updateEnergy, consumeEnergy, restoreEnergy, onRevive } from '../entities/Player.js';
import { FieldObject } from '../entities/FieldObject.js';
import { Obstacle } from '../entities/Obstacle.js';
import { FireTrap } from '../entities/FireTrap.js';
import { Rocket } from '../projectiles/Rocket.js';
import { HealBox } from '../items/HealBox.js';
import { HealPack } from '../items/HealPack.js';
import { InvincibleStar } from '../items/InvincibleStar.js';
import { EnergyDrink } from '../items/EnergyDrink.js';
import { MeteorStrike } from '../items/MeteorStrike.js';
import { initSettingsPanel } from '../ui/SettingsPanel.js';
import {
    drawGrid,
    drawWorldBounds,
    drawTrail,
    drawPlayer,
    drawPlayerHPBar,
    drawAimingUI,
    drawHeldItemUI,
    getClampedAimPosition
} from '../rendering/Renderer.js';
import { updateCamera, applyCameraTransform, restoreCameraTransform, screenToWorld, applyZoom, updateZoom, calcZoomForRadius, startAutoZoom } from './Camera.js';

let canvas, ctx, container;
let debugInfoElement, aimStatusElement;
let lastTime = 0;

export function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    container = document.getElementById('game-container');
    debugInfoElement = document.getElementById('debug-info');
    aimStatusElement = document.getElementById('aim-status');

    // 初始化 UI
    initSettingsPanel();

    // 設定畫布大小
    resize();
    window.addEventListener('resize', resize);

    // 鍵盤事件
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (player.isDead) return;
        if (key === 'f') toggleAimMode();
        if (key === 'r') spawnItem();
        if (input.keys.hasOwnProperty(key)) input.keys[key] = true;
    });

    window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (input.keys.hasOwnProperty(key)) input.keys[key] = false;
    });

    // 滑鼠事件
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        input.mouse.screenX = (e.clientX - rect.left) * scaleX;
        input.mouse.screenY = (e.clientY - rect.top) * scaleY;
        const world = screenToWorld(input.mouse.screenX, input.mouse.screenY);
        input.mouse.x = world.x;
        input.mouse.y = world.y;
    });

    // 滾輪縮放
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        applyZoom(e.deltaY);
    }, { passive: false });

    canvas.addEventListener('contextmenu', e => e.preventDefault());

    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // 左鍵
            if (player.isDead) return;
            if (gameState.currentMode === GAME_STATE_MODE.AIMING) {
                tryThrowItem();
            } else if (gameState.currentMode === GAME_STATE_MODE.ROAMING) {
                if (consumeEnergy(SETTINGS.attackRocket.energyCost)) {
                    fireRocket(player.x, player.y, input.mouse.x, input.mouse.y);
                }
            }
        } else if (e.button === 1) { // 中鍵 (拖曳/複製)
            e.preventDefault();
            handleMiddleClick(e);
        }
    });

    // 初始化世界
    const wc = SETTINGS.worldConfig;
    gameState.world.width = wc.width;
    gameState.world.height = wc.height;
    gameState.camera.zoom = SETTINGS.cameraConfig.initialZoom;
    gameState.camera.targetZoom = SETTINGS.cameraConfig.initialZoom;

    // 初始化場景物件
    for (const o of wc.obstacles) {
        gameState.fieldObjects.push(new Obstacle(o.x, o.y, o.size));
    }
    for (const t of wc.fireTraps) {
        gameState.fieldObjects.push(new FireTrap(t.x, t.y));
    }

    // 邊界牆（isSolid，不繪製 — Renderer 負責視覺）
    const ww = wc.width, wh = wc.height, wt = wc.wallThickness;
    const wallDefs = [
        [0, 0, ww, wt],            // 上
        [0, wh - wt, ww, wt],      // 下
        [0, wt, wt, wh - wt * 2],  // 左
        [ww - wt, wt, wt, wh - wt * 2] // 右
    ];
    for (const [wx, wy, wWidth, wHeight] of wallDefs) {
        const wall = new FieldObject(wx, wy, wWidth, wHeight, 'Wall');
        wall.isSolid = true;
        wall.draw = () => {}; // 視覺由 Renderer.drawWorldBounds 處理
        gameState.fieldObjects.push(wall);
    }

    // 設定玩家初始位置
    player.x = wc.playerStart.x;
    player.y = wc.playerStart.y;

    // 開始遊戲迴圈
    requestAnimationFrame(gameLoop);
}

function handleMiddleClick(e) {
    if (editorState.draggingObj) {
        if (editorState.draggingObj.isValidPlacement) {
            editorState.draggingObj.isDragging = false;
            editorState.draggingObj = null;
        }
    } else {
        // 反向搜尋以選取最上層物件
        for (let i = gameState.fieldObjects.length - 1; i >= 0; i--) {
            const obj = gameState.fieldObjects[i];
            if (obj.contains(input.mouse.x, input.mouse.y)) {
                if (e.shiftKey) { // 複製
                    let newObj = null;
                    if (obj instanceof Obstacle) newObj = new Obstacle(obj.x, obj.y, obj.width);
                    else if (obj instanceof FireTrap) newObj = new FireTrap(obj.x, obj.y);

                    if (newObj) {
                        gameState.fieldObjects.push(newObj);
                        editorState.draggingObj = newObj;
                        newObj.isDragging = true;
                        editorState.dragOffsetX = newObj.width / 2;
                        editorState.dragOffsetY = newObj.height / 2;
                        newObj.x = input.mouse.x - editorState.dragOffsetX;
                        newObj.y = input.mouse.y - editorState.dragOffsetY;
                    }
                } else { // 拖曳
                    editorState.draggingObj = obj;
                    obj.isDragging = true;
                    editorState.dragOffsetX = obj.width / 2;
                    editorState.dragOffsetY = obj.height / 2;
                }
                break;
            }
        }
    }
}

// 強制退出瞄準模式（死亡時呼叫）
function exitAimMode() {
    if (gameState.currentMode !== GAME_STATE_MODE.AIMING) return;
    const cam = gameState.camera;
    const az = cam.autoZoom;
    gameState.currentMode = GAME_STATE_MODE.ROAMING;
    aimStatusElement.style.display = 'none';
    az.active = false;
    az.waitTimer = 0;
    startAutoZoom(az.prevZoom, SETTINGS.cameraConfig.autoZoomTime);
    cam.targetZoom = az.prevZoom;
}

function toggleAimMode() {
    const cam = gameState.camera;
    const az = cam.autoZoom;

    if (gameState.currentMode === GAME_STATE_MODE.ROAMING) {
        // 沒有持有 active 道具就不進入瞄準
        if (!player.heldItem) return;
        gameState.currentMode = GAME_STATE_MODE.AIMING;
        aimStatusElement.style.display = 'block';
        input.keys.w = input.keys.a = input.keys.s = input.keys.d = false;

        // Auto zoom：記錄當前 zoom，計算所需 zoom 並拉遠
        az.prevZoom = cam.targetZoom;
        az.waitTimer = 0;
        const neededZoom = calcZoomForRadius(player.heldItem.maxAimRadius);
        if (neededZoom < cam.zoom) {
            startAutoZoom(neededZoom, SETTINGS.cameraConfig.autoZoomTime);
            cam.targetZoom = neededZoom;
        }
    } else {
        gameState.currentMode = GAME_STATE_MODE.ROAMING;
        aimStatusElement.style.display = 'none';

        // 取消 aiming：直接回復 zoom（無等待）
        az.waitTimer = 0;
        startAutoZoom(az.prevZoom, SETTINGS.cameraConfig.autoZoomTime);
        cam.targetZoom = az.prevZoom;
    }
}

function tryThrowItem() {
    if (!player.heldItem) return;

    const aimPos = getClampedAimPosition(input);

    let hitSolid = false;
    for (let obj of gameState.fieldObjects) {
        if (obj.isSolid && checkCollisionWithRect(aimPos.x, aimPos.y, SETTINGS.aimIndicatorRadius, obj)) {
            hitSolid = true;
            break;
        }
    }

    if (hitSolid) return;

    // 取得 waitToBackZoom（從道具對應的 SETTINGS 取）
    const item = player.heldItem;
    const itemType = item.constructor.name;
    const cfgKey = 'item' + itemType;
    const waitTime = (SETTINGS[cfgKey] && SETTINGS[cfgKey].waitToBackZoom) || 0;

    player.heldItem = null;

    item.isHeld = false;
    item.x = aimPos.x;
    item.y = aimPos.y;
    item.z = 150;
    item.vz = 0;
    item.isGrounded = false;
    item.activate();

    // 離開 aiming，設定等待後回復 zoom
    const cam = gameState.camera;
    const az = cam.autoZoom;
    gameState.currentMode = GAME_STATE_MODE.ROAMING;
    aimStatusElement.style.display = 'none';

    // 只在 zoom 確實有改變時才做回復動畫
    const zoomChanged = Math.abs(az.prevZoom - cam.zoom) > 0.01;
    if (zoomChanged && waitTime > 0) {
        // 先停止進場動畫（如果還在播放）
        az.active = false;
        az.waitTimer = waitTime;
    } else if (zoomChanged) {
        az.active = false;
        startAutoZoom(az.prevZoom, SETTINGS.cameraConfig.autoZoomTime);
        cam.targetZoom = az.prevZoom;
    } else {
        // zoom 沒變，不需要回復
        az.active = false;
        az.waitTimer = 0;
    }
}

function spawnItem() {
    const maxAttempts = 10;
    const wallT = SETTINGS.worldConfig.wallThickness;
    const range = SETTINGS.itemDropRange;
    const margin = wallT + 30;

    for (let i = 0; i < maxAttempts; i++) {
        // 以玩家為中心，隨機角度和距離
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * range;
        let rx = player.x + Math.cos(angle) * dist;
        let ry = player.y + Math.sin(angle) * dist;

        // 夾在可活動區域內
        rx = Math.max(margin, Math.min(gameState.world.width - margin, rx));
        ry = Math.max(margin, Math.min(gameState.world.height - margin, ry));

        // 不與場景物件重疊
        let overlap = false;
        for (let obj of gameState.fieldObjects) {
            if (checkCollisionWithRect(rx, ry, 15, obj)) {
                overlap = true;
                break;
            }
        }

        // 不與玩家重疊
        if (!overlap) {
            const dx = rx - player.x;
            const dy = ry - player.y;
            const minSpawnDist = SETTINGS.playerSize + 20 + 10; // playerSize(20) + pickupRadius(20) + buffer(10) = 50
            if (dx * dx + dy * dy < minSpawnDist * minSpawnDist) {
                overlap = true;
            }
        }

        if (!overlap) {
            let newItem;
            if (gameState.currentItemType === 'HealPack') {
                newItem = new HealPack(rx, ry);
            } else if (gameState.currentItemType === 'InvincibleStar') {
                newItem = new InvincibleStar(rx, ry);
            } else if (gameState.currentItemType === 'HealBox') {
                newItem = new HealBox(rx, ry);
            } else if (gameState.currentItemType === 'EnergyDrink') {
                newItem = new EnergyDrink(rx, ry);
            } else if (gameState.currentItemType === 'MeteorStrike') {
                newItem = new MeteorStrike(rx, ry);
            }
            if (newItem) gameState.activeItems.push(newItem);
            return;
        }
    }
}

function fireRocket(startX, startY, targetX, targetY) {
    const angle = Math.atan2(targetY - startY, targetX - startX);
    const rocket = new Rocket(startX, startY, angle);
    gameState.projectiles.push(rocket);
}

function resize() {
    const margin = 40;
    const availableWidth = window.innerWidth - margin;
    const availableHeight = window.innerHeight - margin;

    if (availableWidth / availableHeight > SETTINGS.aspectRatio) {
        gameState.height = availableHeight;
        gameState.width = gameState.height * SETTINGS.aspectRatio;
    } else {
        gameState.width = availableWidth;
        gameState.height = gameState.width / SETTINGS.aspectRatio;
    }

    canvas.width = gameState.width;
    canvas.height = gameState.height;
    container.style.width = `${gameState.width}px`;
    container.style.height = `${gameState.height}px`;

    updateDebugInfo();
}

function updateDebugInfo() {
    if (debugInfoElement) {
        const held = player.heldItem ? player.heldItem.constructor.name : 'None';
        debugInfoElement.innerText = `HP: ${Math.ceil(player.currentHp)}/${player.maxHp} | Held: ${held} | Items: ${gameState.activeItems.length} | Zoom: ${gameState.camera.zoom.toFixed(2)}`;
    }
}

function checkCollision(cx, cy, radius) {
    for (let obj of gameState.fieldObjects) {
        if (obj.isSolid && checkCollisionWithRect(cx, cy, radius, obj)) {
            return true;
        }
    }
    return false;
}

// 集中 pickup 檢測
function checkItemPickup() {
    for (const item of gameState.activeItems) {
        // 跳過不可撿的道具
        if (item.isDead || item.isHeld || item.isActivated || !item.isGrounded) continue;

        const dx = player.x - item.x;
        const dy = player.y - item.y;
        const distSq = dx * dx + dy * dy;
        const pickupDist = SETTINGS.playerSize + item.pickupRadius;

        if (distSq < pickupDist * pickupDist) {
            if (item.category === 'PASSIVE') {
                item.onPickup();
            } else if (item.category === 'ACTIVE') {
                // 取代舊的 active 道具
                if (player.heldItem) {
                    const oldItem = player.heldItem;
                    // 觸發離開動畫
                    gameState.inventoryAnim.exitIcon = oldItem.drawIcon.bind(oldItem);
                    gameState.inventoryAnim.exitTimer = gameState.inventoryAnim.exitDuration;
                    oldItem.dropToGround(player.x, player.y);
                }
                // 觸發進入動畫
                gameState.inventoryAnim.enterTimer = gameState.inventoryAnim.enterDuration;
                player.heldItem = item;
                item.onPickup();
            }
        }
    }
}

function update(deltaTime) {
    // === 死亡狀態處理 ===
    if (player.isDead) {
        // 確保退出瞄準模式 & 清除移動輸入
        exitAimMode();
        input.keys.w = input.keys.a = input.keys.s = input.keys.d = false;

        player.deathTimer -= deltaTime;

        // 更新死亡效果
        if (gameState.deathEffect) {
            gameState.deathEffect.update(deltaTime);

            // 死亡倒數結束 → 觸發復活動畫
            if (player.deathTimer <= 0 && gameState.deathEffect.state === 'waiting') {
                gameState.deathEffect.startRevive();
            }

            // 復活動畫完成 → 正式復活
            if (gameState.deathEffect.state === 'done') {
                onRevive();
                gameState.deathEffect = null;
            }
        }

        // 死亡期間仍更新世界物件、彈射物、粒子等
        gameState.fieldObjects.forEach(obj => obj.update(deltaTime));
        gameState.projectiles.forEach(p => p.update(deltaTime));
        gameState.projectiles = gameState.projectiles.filter(p => !p.isDead);
        player.trail.forEach(p => p.life -= deltaTime * 4);
        player.trail = player.trail.filter(p => p.life > 0);
        gameState.activeItems.forEach(item => item.update(deltaTime));
        gameState.activeItems = gameState.activeItems.filter(item => !item.isDead);
        gameState.floatingTexts.forEach(txt => txt.update(deltaTime));
        gameState.floatingTexts = gameState.floatingTexts.filter(txt => txt.life > 0);
        gameState.particles.forEach(p => p.update(deltaTime));
        gameState.particles = gameState.particles.filter(p => p.life > 0);
        updateZoom(deltaTime);
        updateCamera(player.x, player.y);
        updateDebugInfo();
        return;
    }

    // === 正常狀態 ===

    // 復活 blink 計時器
    if (player.reviveBlinkTimer > 0) player.reviveBlinkTimer -= deltaTime;

    // 更新無敵計時器
    if (player.invincibleTimer > 0) {
        player.invincibleTimer -= deltaTime;
    } else {
        player.invincibleTimer = 0;
        player.defendRatio = 1;
    }

    if (player.damageShakeTimer > 0) player.damageShakeTimer -= deltaTime;
    if (player.damageFlashTimer > 0) player.damageFlashTimer -= deltaTime;

    // 更新 energy
    updateEnergy(deltaTime);

    // 更新 EnergyDrink buff ticks
    if (gameState.energyDrinkBuffs) {
        for (let i = gameState.energyDrinkBuffs.length - 1; i >= 0; i--) {
            const buff = gameState.energyDrinkBuffs[i];
            buff.timer -= deltaTime;
            if (buff.timer <= 0 && buff.ticksRemaining > 0) {
                restoreEnergy(buff.perTickPlus);
                buff.ticksRemaining--;
                buff.timer = buff.tickRate;
            }
            if (buff.ticksRemaining <= 0) {
                gameState.energyDrinkBuffs.splice(i, 1);
            }
        }
    }

    // 編輯器拖曳
    if (editorState.draggingObj) {
        const obj = editorState.draggingObj;
        const nextX = input.mouse.x - editorState.dragOffsetX;
        const nextY = input.mouse.y - editorState.dragOffsetY;
        obj.setPosition(nextX, nextY);

        obj.isValidPlacement = true;
        for (let other of gameState.fieldObjects) {
            if (obj !== other && obj.overlaps(other)) {
                obj.isValidPlacement = false;
                break;
            }
        }
        // 檢查是否與玩家重疊
        if (obj.isValidPlacement && obj.isSolid &&
            checkCollisionWithRect(player.x, player.y, SETTINGS.playerSize, obj)) {
            obj.isValidPlacement = false;
        }
    }

    // 玩家移動
    if (gameState.currentMode === GAME_STATE_MODE.ROAMING) {
        let dx = 0;
        let dy = 0;
        if (input.keys.w) dy -= 1;
        if (input.keys.s) dy += 1;
        if (input.keys.a) dx -= 1;
        if (input.keys.d) dx += 1;

        const length = Math.sqrt(dx * dx + dy * dy);
        if (length > 0) {
            dx /= length;
            dy /= length;
            player.targetAngle = Math.atan2(dy, dx);

            const moveDist = SETTINGS.playerSpeed * deltaTime;
            const margin = SETTINGS.playerSize;
            const wallT = SETTINGS.worldConfig.wallThickness;

            // X 軸移動（邊界 = 牆內側 + 玩家半徑）
            let nextX = player.x + dx * moveDist;
            nextX = Math.max(wallT + margin, Math.min(gameState.world.width - wallT - margin, nextX));

            let collideX = false;
            for (let obj of gameState.fieldObjects) {
                if (obj.isSolid && checkCollisionWithRect(nextX, player.y, SETTINGS.playerSize, obj)) {
                    collideX = true;
                    break;
                }
            }
            if (!collideX) player.x = nextX;

            // Y 軸移動
            let nextY = player.y + dy * moveDist;
            nextY = Math.max(wallT + margin, Math.min(gameState.world.height - wallT - margin, nextY));

            let collideY = false;
            for (let obj of gameState.fieldObjects) {
                if (obj.isSolid && checkCollisionWithRect(player.x, nextY, SETTINGS.playerSize, obj)) {
                    collideY = true;
                    break;
                }
            }
            if (!collideY) player.y = nextY;

            // 軌跡
            if (!collideX && !collideY && Math.random() > 0.5) {
                player.trail.push({ x: player.x, y: player.y, life: 1.0 });
            }
        }

        const t = 1 - Math.exp(-SETTINGS.rotationSpeed * deltaTime);
        player.currentAngle = lerpAngle(player.currentAngle, player.targetAngle, t);

    } else if (gameState.currentMode === GAME_STATE_MODE.AIMING) {
        const aimPos = getClampedAimPosition(input);
        const dx = aimPos.x - player.x;
        const dy = aimPos.y - player.y;
        player.targetAngle = Math.atan2(dy, dx);

        const t = 1 - Math.exp(-SETTINGS.rotationSpeed * deltaTime);
        player.currentAngle = lerpAngle(player.currentAngle, player.targetAngle, t);
    }

    // 更新場景物件
    gameState.fieldObjects.forEach(obj => obj.update(deltaTime));

    // 更新彈射物
    gameState.projectiles.forEach(p => p.update(deltaTime));
    gameState.projectiles = gameState.projectiles.filter(p => !p.isDead);

    // 更新軌跡
    player.trail.forEach(p => p.life -= deltaTime * 4);
    player.trail = player.trail.filter(p => p.life > 0);

    // 更新 inventory 動畫計時器
    const anim = gameState.inventoryAnim;
    if (anim.enterTimer > 0) anim.enterTimer -= deltaTime;
    if (anim.exitTimer > 0) {
        anim.exitTimer -= deltaTime;
        if (anim.exitTimer <= 0) anim.exitIcon = null;
    }

    // 更新道具
    gameState.activeItems.forEach(item => item.update(deltaTime));
    gameState.activeItems = gameState.activeItems.filter(item => !item.isDead);

    // 集中 pickup 檢測
    checkItemPickup();

    updateDebugInfo();

    // 更新浮動文字
    gameState.floatingTexts.forEach(txt => txt.update(deltaTime));
    gameState.floatingTexts = gameState.floatingTexts.filter(txt => txt.life > 0);

    // 更新粒子
    gameState.particles.forEach(p => p.update(deltaTime));
    gameState.particles = gameState.particles.filter(p => p.life > 0);

    // 更新攝影機
    updateZoom(deltaTime);
    updateCamera(player.x, player.y);
}

function draw() {
    // 清除整個畫布
    ctx.fillStyle = SETTINGS.colors.bg;
    ctx.fillRect(0, 0, gameState.width, gameState.height);

    // === 世界空間繪製 ===
    applyCameraTransform(ctx);

    drawGrid(ctx);
    drawWorldBounds(ctx);

    gameState.fieldObjects.forEach(obj => obj.draw(ctx));
    gameState.activeItems.forEach(item => item.draw(ctx));
    gameState.projectiles.forEach(p => p.draw(ctx));
    gameState.particles.forEach(p => p.draw(ctx));

    drawTrail(ctx);

    if (player.isDead) {
        if (gameState.deathEffect) gameState.deathEffect.draw(ctx);
    } else {
        drawPlayer(ctx);
        drawPlayerHPBar(ctx);
    }

    if (!player.isDead && gameState.currentMode === GAME_STATE_MODE.AIMING) {
        drawAimingUI(ctx, input);
    }

    gameState.floatingTexts.forEach(txt => txt.draw(ctx));

    restoreCameraTransform(ctx);

    // === 螢幕空間繪製（HUD）===
    if (!player.isDead) {
        drawHeldItemUI(ctx);
    }
}

function gameLoop(timestamp) {
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    if (deltaTime < 0.1) {
        update(deltaTime);
    }

    draw();
    requestAnimationFrame(gameLoop);
}
