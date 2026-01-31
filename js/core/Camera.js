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
    const az = cam.autoZoom;

    // Auto zoom wait 倒數（LMB 後等待）
    if (az.waitTimer > 0) {
        az.waitTimer -= dt;
        if (az.waitTimer <= 0) {
            // 等待結束，啟動回復 zoom
            startAutoZoom(az.prevZoom, SETTINGS.cameraConfig.autoZoomTime);
            cam.targetZoom = az.prevZoom;
        }
    }

    // Auto zoom 動畫進行中
    if (az.active) {
        az.elapsed += dt;
        const t = Math.min(1, az.elapsed / az.duration);
        // ease-in-out (smoothstep)
        const ease = t * t * (3 - 2 * t);
        cam.zoom = az.startZoom + (az.endZoom - az.startZoom) * ease;

        if (t >= 1) {
            az.active = false;
        }
        return; // auto zoom 期間跳過手動 lerp
    }

    // 一般 lerp 追趕
    const lerpSpeed = 1 - Math.exp(-10 * dt);
    cam.zoom += (cam.targetZoom - cam.zoom) * lerpSpeed;
}

/**
 * 計算讓整個瞄準圈可見所需的 zoom 值
 */
export function calcZoomForRadius(aimRadius) {
    const margin = 80; // 邊距留白（px）
    const diameter = aimRadius * 2 + margin;
    const zoomW = gameState.width / diameter;
    const zoomH = gameState.height / diameter;
    return Math.min(zoomW, zoomH);
}

/**
 * 啟動 auto zoom 動畫
 */
export function startAutoZoom(targetZoom, duration) {
    const az = gameState.camera.autoZoom;
    az.active = true;
    az.startZoom = gameState.camera.zoom;
    az.endZoom = targetZoom;
    az.elapsed = 0;
    az.duration = duration;
}
