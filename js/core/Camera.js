import { SETTINGS } from './Settings.js';
import { gameState } from './GameState.js';

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
    // 先移到畫布中心，再縮放，再偏移攝影機位置
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
        // 計算準心離螢幕邊緣的權重
        const zoom = cam.zoom;
        const viewW = gameState.width / zoom;
        const viewH = gameState.height / zoom;

        const dx = aimX - playerX;
        const dy = aimY - playerY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // 安全區域 = 螢幕半寬 × (1 - threshold)
        const safeX = (viewW / 2) * (1 - cfg.camToAimEdgeThreshold);
        const safeY = (viewH / 2) * (1 - cfg.camToAimEdgeThreshold);

        // 超出安全區域時計算需要的偏移權重
        const weightX = absDx > 0 ? Math.max(0, 1 - safeX / absDx) : 0;
        const weightY = absDy > 0 ? Math.max(0, 1 - safeY / absDy) : 0;
        const targetWeight = Math.max(weightX, weightY);

        // 平滑過渡
        const lerpSpeed = 1 - Math.exp(-cfg.camToAimLerpSpeed * dt);
        af.weight += (targetWeight - af.weight) * lerpSpeed;

        return {
            x: playerX + (aimX - playerX) * af.weight,
            y: playerY + (aimY - playerY) * af.weight
        };
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
