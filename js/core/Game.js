import { SETTINGS } from './Settings.js';
import { gameState, editorState, input, GAME_STATE_MODE } from './GameState.js';
import { lerpAngle, checkCollisionWithRect } from './Utils.js';
import { player } from '../entities/Player.js';
import { Obstacle } from '../entities/Obstacle.js';
import { FireTrap } from '../entities/FireTrap.js';
import { Rocket } from '../projectiles/Rocket.js';
import { HealBox } from '../items/HealBox.js';
import { HealPack } from '../items/HealPack.js';
import { InvincibleStar } from '../items/InvincibleStar.js';
import { initSettingsPanel } from '../ui/SettingsPanel.js';
import {
    drawGrid,
    drawTrail,
    drawPlayer,
    drawPlayerHPBar,
    drawAimingUI,
    drawHeldItemUI,
    getClampedAimPosition
} from '../rendering/Renderer.js';

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
        input.mouse.x = e.clientX - rect.left;
        input.mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener('contextmenu', e => e.preventDefault());

    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // 左鍵
            if (gameState.currentMode === GAME_STATE_MODE.AIMING) {
                tryThrowItem();
            } else if (gameState.currentMode === GAME_STATE_MODE.ROAMING) {
                fireRocket(player.x, player.y, input.mouse.x, input.mouse.y);
            }
        } else if (e.button === 2) { // 右鍵
            if (gameState.currentMode === GAME_STATE_MODE.AIMING) {
                toggleAimMode();
            }
        } else if (e.button === 1) { // 中鍵 (拖曳/複製)
            e.preventDefault();
            handleMiddleClick(e);
        }
    });

    // 初始化場景物件
    const h = gameState.height || window.innerHeight;
    const obsSize = h / 3;
    gameState.fieldObjects.push(new Obstacle(100, 200, obsSize));
    gameState.fieldObjects.push(new FireTrap(80, 80));

    // 設定玩家初始位置
    player.x = gameState.width * 0.4;
    player.y = gameState.height / 2;

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

function toggleAimMode() {
    if (gameState.currentMode === GAME_STATE_MODE.ROAMING) {
        // 沒有持有 active 道具就不進入瞄準
        if (!player.heldItem) return;
        gameState.currentMode = GAME_STATE_MODE.AIMING;
        aimStatusElement.style.display = 'block';
        input.keys.w = input.keys.a = input.keys.s = input.keys.d = false;
    } else {
        gameState.currentMode = GAME_STATE_MODE.ROAMING;
        aimStatusElement.style.display = 'none';
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

    // 取出持有道具，啟動並放置
    const item = player.heldItem;
    player.heldItem = null;

    item.isHeld = false;
    item.x = aimPos.x;
    item.y = aimPos.y;
    item.z = 150;
    item.vz = 0;
    item.isGrounded = false;
    item.activate();

    gameState.activeItems.push(item);
    toggleAimMode();
}

function spawnItem() {
    const maxAttempts = 10;
    const padding = 50;

    for (let i = 0; i < maxAttempts; i++) {
        const rx = padding + Math.random() * (gameState.width - padding * 2);
        const ry = padding + Math.random() * (gameState.height - padding * 2);

        let overlap = false;
        for (let obj of gameState.fieldObjects) {
            if (checkCollisionWithRect(rx, ry, 15, obj)) {
                overlap = true;
                break;
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

    // 調整障礙物大小
    const obs = gameState.fieldObjects.find(o => o instanceof Obstacle);
    if (obs && !obs.isDragging) {
        obs.width = gameState.height / 3;
        obs.height = gameState.height / 3;
        obs.x = (gameState.width - obs.width) / 2;
        obs.y = (gameState.height - obs.height) / 2;
    }

    updateDebugInfo();

    // 檢查玩家是否卡住
    let stuck = false;
    for (let obj of gameState.fieldObjects) {
        if (obj.isSolid && checkCollisionWithRect(player.x, player.y, SETTINGS.playerSize, obj)) {
            stuck = true;
            break;
        }
    }

    if (stuck) {
        player.x = gameState.width * 0.1;
        player.y = gameState.height * 0.5;
    }
}

function updateDebugInfo() {
    if (debugInfoElement) {
        const held = player.heldItem ? player.heldItem.constructor.name : 'None';
        debugInfoElement.innerText = `HP: ${Math.ceil(player.currentHp)}/${player.maxHp} | Held: ${held} | Items: ${gameState.activeItems.length}`;
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
                    oldItem.dropToGround(player.x, player.y);
                    gameState.activeItems.push(oldItem);
                }
                player.heldItem = item;
                item.onPickup();
            }
        }
    }
}

function update(deltaTime) {
    // 更新無敵計時器
    if (player.invincibleTimer > 0) {
        player.invincibleTimer -= deltaTime;
    } else {
        player.invincibleTimer = 0;
        player.defendRatio = 1;
    }

    if (player.damageShakeTimer > 0) player.damageShakeTimer -= deltaTime;
    if (player.damageFlashTimer > 0) player.damageFlashTimer -= deltaTime;

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

            // X 軸移動
            let nextX = player.x + dx * moveDist;
            nextX = Math.max(margin, Math.min(gameState.width - margin, nextX));

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
            nextY = Math.max(margin, Math.min(gameState.height - margin, nextY));

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
}

function draw() {
    ctx.fillStyle = SETTINGS.colors.bg;
    ctx.fillRect(0, 0, gameState.width, gameState.height);

    drawGrid(ctx);

    gameState.fieldObjects.forEach(obj => obj.draw(ctx));
    gameState.activeItems.forEach(item => item.draw(ctx));
    gameState.projectiles.forEach(p => p.draw(ctx));
    gameState.particles.forEach(p => p.draw(ctx));

    drawTrail(ctx);
    drawPlayer(ctx);
    drawPlayerHPBar(ctx);
    drawHeldItemUI(ctx);

    if (gameState.currentMode === GAME_STATE_MODE.AIMING) {
        drawAimingUI(ctx, input);
    }

    gameState.floatingTexts.forEach(txt => txt.draw(ctx));
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
