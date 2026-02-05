import { SETTINGS } from './Settings.js';
import { gameState, input } from './GameState.js';

/**
 * 更新攝影機位置（跟隨目標，夾在世界邊界內）
 */
export function updateCamera(targetX, targetY) {
    const cam = gameState.camera;
    const world = gameState.world;
    const zoom = cam.zoom;

    // 視窗在世界中的可見尺寸
    const viewW = gameState.width / zoom;
    const viewH = gameState.height / zoom;

    // 攝影機中心 = 目標位置，夾到世界邊界
    if (viewW >= world.width) {
        cam.x = world.width / 2;
    } else {
        cam.x = Math.max(viewW / 2, Math.min(world.width - viewW / 2, targetX));
    }

    if (viewH >= world.height) {
        cam.y = world.height / 2;
    } else {
        cam.y = Math.max(viewH / 2, Math.min(world.height - viewH / 2, targetY));
    }
}

/**
 * 套用攝影機變換（在繪製世界物件前呼叫）
 */
export function applyCameraTransform(ctx) {
    const cam = gameState.camera;
    const zoom = cam.zoom;
    ctx.save();
    ctx.translate(gameState.width / 2, gameState.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-cam.x, -cam.y);
}

/**
 * 還原攝影機變換（繪製世界物件後呼叫）
 */
export function restoreCameraTransform(ctx) {
    ctx.restore();
}

/**
 * 螢幕座標轉世界座標
 */
export function screenToWorld(screenX, screenY) {
    const cam = gameState.camera;
    const zoom = cam.zoom;
    const worldX = (screenX - gameState.width / 2) / zoom + cam.x;
    const worldY = (screenY - gameState.height / 2) / zoom + cam.y;
    return { x: worldX, y: worldY };
}

/**
 * 滾輪縮放（線性加減法，保證精確值）
 */
export function applyZoom(delta) {
    const cam = gameState.camera;
    const cfg = SETTINGS.cameraConfig;
    const step = Math.sign(delta) * -cfg.zoomStep;
    cam.targetZoom = Math.round(Math.max(cfg.zoomMin, Math.min(cfg.zoomMax, cam.targetZoom + step)) * 100) / 100;
}

/**
 * 每幀呼叫：zoom smooth 追趕 targetZoom
 */
export function updateZoom(dt) {
    const cam = gameState.camera;
    const lerpSpeed = 1 - Math.exp(-10 * dt);
    cam.zoom += (cam.targetZoom - cam.zoom) * lerpSpeed;
}

/**
 * 計算 Edge Pan 速度（MOUSE aiming 用）
 * 螢幕邊緣 margin 範圍內：線性 ramp 0 → maxSpeed
 * 除以 zoom 保持螢幕空間速度一致
 */
function getEdgePanVelocity() {
    const cfg = SETTINGS.cameraConfig;
    const margin = cfg.edgePanMargin;
    const maxSpeed = cfg.edgePanMaxSpeed;
    const w = gameState.width;
    const h = gameState.height;
    const sx = input.mouse.screenX;
    const sy = input.mouse.screenY;
    const zoom = gameState.camera.zoom;

    let vx = 0, vy = 0;
    const edgeW = w * margin;
    const edgeH = h * margin;

    if (sx < edgeW)          vx = -maxSpeed * (1 - sx / edgeW) / zoom;
    else if (sx > w - edgeW) vx =  maxSpeed * ((sx - (w - edgeW)) / edgeW) / zoom;

    if (sy < edgeH)          vy = -maxSpeed * (1 - sy / edgeH) / zoom;
    else if (sy > h - edgeH) vy =  maxSpeed * ((sy - (h - edgeH)) / edgeH) / zoom;

    return { x: vx, y: vy };
}

/**
 * 根據 aimFollow 狀態計算攝影機目標位置
 * @returns {{ x: number, y: number }}
 */
export function getAimFollowTarget(dt, playerX, playerY, aimX, aimY) {
    const af = gameState.camera.aimFollow;
    const cfg = SETTINGS.cameraConfig;
    const cam = gameState.camera;

    if (af.state === 'FOLLOW_PLAYER') {
        af.weight = 0;
        return { x: playerX, y: playerY };
    }

    if (af.state === 'FOLLOW_AIM') {
        if (gameState.aimInputMode === 'MOUSE') {
            // Edge Pan: 累積 offset
            const ep = cam.edgePan;
            const panVel = getEdgePanVelocity();
            ep.offsetX += panVel.x * dt;
            ep.offsetY += panVel.y * dt;
            return { x: playerX + ep.offsetX, y: playerY + ep.offsetY };
        } else {
            // PAD: camera lerp 追蹤 aimpoint
            const lerpSpeed = 1 - Math.exp(-cfg.padCamLerpSpeed * dt);
            af.padCamX += (aimX - af.padCamX) * lerpSpeed;
            af.padCamY += (aimY - af.padCamY) * lerpSpeed;
            return { x: af.padCamX, y: af.padCamY };
        }
    }

    if (af.state === 'RETURNING') {
        // 延遲倒數
        if (af.returnDelay > 0) {
            af.returnDelay -= dt;
            return { x: af.returnFromX, y: af.returnFromY };
        }

        // duration 為 0 → 立即回歸
        if (af.returnDuration <= 0) {
            af.state = 'FOLLOW_PLAYER';
            af.weight = 0;
            return { x: playerX, y: playerY };
        }

        af.returnTimer += dt;
        const t = Math.min(1, af.returnTimer / af.returnDuration);
        const eased = 1 - (1 - t) * (1 - t); // ease-out quad

        const x = af.returnFromX + (playerX - af.returnFromX) * eased;
        const y = af.returnFromY + (playerY - af.returnFromY) * eased;

        if (t >= 1) {
            af.state = 'FOLLOW_PLAYER';
            af.weight = 0;
        }

        return { x, y };
    }

    return { x: playerX, y: playerY };
}

/**
 * 進入 FOLLOW_AIM 狀態
 */
export function startAimFollow() {
    gameState.camera.aimFollow.state = 'FOLLOW_AIM';
}

/**
 * 開始攝影機回歸玩家
 * @param {boolean} hasDelay - true=丟出道具後（有延遲），false=取消瞄準（無延遲）
 */
export function startCameraReturn(hasDelay) {
    const af = gameState.camera.aimFollow;
    const cfg = SETTINGS.cameraConfig;
    const cam = gameState.camera;

    af.state = 'RETURNING';
    af.returnFromX = cam.x;
    af.returnFromY = cam.y;
    af.returnDelay = hasDelay ? cfg.camBackPlayerDelay : 0;
    af.returnTimer = 0;
    af.returnDuration = cfg.camBackPlayerTime;
}

/**
 * 重置瞄準攝影機狀態（離開 aiming 時呼叫）
 */
export function resetAimCameraState() {
    const cam = gameState.camera;
    cam.edgePan.offsetX = 0;
    cam.edgePan.offsetY = 0;
    gameState.padAim.x = 0;
    gameState.padAim.y = 0;
    gameState.padAim.moveHoldTime = 0;
}
