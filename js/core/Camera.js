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
 * 滾輪縮放
 */
/**
 * 滾輪縮放（修改 targetZoom，由 updateZoom lerp 追趕）
 */
export function applyZoom(delta) {
    const cam = gameState.camera;
    const cfg = SETTINGS.cameraConfig;
    // delta > 0 = 滾輪下 = 縮小
    const factor = 1 - Math.sign(delta) * cfg.zoomSpeed;
    cam.targetZoom = Math.max(cfg.zoomMin, Math.min(cfg.zoomMax, cam.targetZoom * factor));
}

/**
 * 每幀呼叫：zoom smooth 追趕 targetZoom
 */
export function updateZoom(dt) {
    const cam = gameState.camera;
    const lerpSpeed = 1 - Math.exp(-10 * dt);
    cam.zoom += (cam.targetZoom - cam.zoom) * lerpSpeed;
}
