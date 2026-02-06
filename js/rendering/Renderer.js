import { SETTINGS } from '../core/Settings.js';
import { gameState, GAME_STATE_MODE } from '../core/GameState.js';
import { player } from '../entities/Player.js';
import { checkCollisionWithRect } from '../core/Utils.js';
import { buffManager } from '../core/BuffManager.js';

// 繪製 Buff 圖標
export function drawBuffIcon(ctx, x, y, size, progress, color, type = 'SHIELD') {
    const halfSize = size / 2;
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(-halfSize, -halfSize, size, size);

    if (type === 'SHIELD') {
        ctx.fillStyle = color;
        ctx.beginPath();
        const s = size * 0.7;
        ctx.moveTo(0, s / 2);
        ctx.lineTo(s / 2, 0);
        ctx.lineTo(s / 2, -s / 4);
        ctx.lineTo(0, -s / 2);
        ctx.lineTo(-s / 2, -s / 4);
        ctx.lineTo(-s / 2, 0);
        ctx.closePath();
        ctx.fill();
    } else if (type === 'ENERGY') {
        // 與 EnergyDrink item icon 相同的閃電樣式
        const scale = size / 18;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-2 * scale, -7 * scale);
        ctx.lineTo(3 * scale, -7 * scale);
        ctx.lineTo(0, -1 * scale);
        ctx.lineTo(4 * scale, -1 * scale);
        ctx.lineTo(-2 * scale, 7 * scale);
        ctx.lineTo(0, 1 * scale);
        ctx.lineTo(-4 * scale, 1 * scale);
        ctx.closePath();
        ctx.fill();
    } else if (type === 'REVIVE') {
        ctx.fillStyle = color;
        const s = size * 0.3;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.7, 0);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.7, 0);
        ctx.closePath();
        ctx.fill();
    } else if (type === 'FEATHER') {
        // 羽毛 icon
        ctx.fillStyle = color;
        const s = size * 0.4;
        ctx.beginPath();
        // 羽毛主軸
        ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(s * 0.6, -s * 0.3, s * 0.3, s * 0.8);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.1, s * 0.6);
        ctx.quadraticCurveTo(-s * 0.3, 0, 0, -s);
        ctx.closePath();
        ctx.fill();
        // 羽毛中軸線
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.8);
        ctx.quadraticCurveTo(s * 0.2, 0, 0, s * 0.8);
        ctx.stroke();
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    ctx.beginPath();

    const p = progress;
    const w = size;
    const h = size;
    const perimeter = 2 * w + 2 * h;
    const drawLength = perimeter * p;

    ctx.moveTo(0, -h / 2);
    let remaining = drawLength;

    const seg1 = w / 2;
    if (remaining > 0) { const draw = Math.min(remaining, seg1); ctx.lineTo(-draw, -h / 2); remaining -= draw; }
    const seg2 = h;
    if (remaining > 0) { const draw = Math.min(remaining, seg2); ctx.lineTo(-w / 2, -h / 2 + draw); remaining -= draw; }
    const seg3 = w;
    if (remaining > 0) { const draw = Math.min(remaining, seg3); ctx.lineTo(-w / 2 + draw, h / 2); remaining -= draw; }
    const seg4 = h;
    if (remaining > 0) { const draw = Math.min(remaining, seg4); ctx.lineTo(w / 2, h / 2 - draw); remaining -= draw; }
    const seg5 = w / 2;
    if (remaining > 0) { const draw = Math.min(remaining, seg5); ctx.lineTo(w / 2 - draw, -h / 2); remaining -= draw; }

    ctx.stroke();
    ctx.restore();
}

// 繪製多 buff icons（左至右排列，整體置中）
export function drawBuffIcons(ctx, centerX, baseY) {
    const visibleBuffs = buffManager.getVisibleBuffs();
    if (visibleBuffs.length === 0) return;

    const iconSize = 22;
    const gap = 4;
    const spacing = iconSize + gap;
    const totalWidth = visibleBuffs.length * iconSize + (visibleBuffs.length - 1) * gap;
    const startX = centerX - totalWidth / 2 + iconSize / 2;

    visibleBuffs.forEach((buff, i) => {
        const x = startX + i * spacing;
        const progress = 1 - (buff.elapsed / buff.duration);

        ctx.save();
        if (progress <= 0.4) {
            const blink = Math.sin(Date.now() / 1000 * 12.56);
            ctx.globalAlpha = 0.3 + 0.7 * ((blink + 1) / 2);
        }
        drawBuffIcon(ctx, x, baseY, iconSize, progress, buff.iconColor, buff.iconType);
        ctx.restore();
    });
}

// 繪製網格（只繪製可見範圍）
export function drawGrid(ctx) {
    const cam = gameState.camera;
    const zoom = cam.zoom;
    const viewW = gameState.width / zoom;
    const viewH = gameState.height / zoom;
    const left = cam.x - viewW / 2;
    const top = cam.y - viewH / 2;
    const right = cam.x + viewW / 2;
    const bottom = cam.y + viewH / 2;

    const gs = SETTINGS.gridSize;
    const startX = Math.floor(left / gs) * gs;
    const startY = Math.floor(top / gs) * gs;
    const endX = Math.ceil(right / gs) * gs;
    const endY = Math.ceil(bottom / gs) * gs;

    ctx.strokeStyle = SETTINGS.colors.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = startX; x <= endX; x += gs) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gs) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
    }

    ctx.stroke();
}

// 繪製單面牆段
function drawWallSegment(ctx, x, y, w, h, innerEdge) {
    // innerEdge: 'bottom' | 'top' | 'right' | 'left' — 面向場內的邊

    // 主體
    ctx.fillStyle = SETTINGS.colors.wallBase;
    ctx.fillRect(x, y, w, h);

    // 面向場內的高光邊（光源感）
    ctx.fillStyle = SETTINGS.colors.wallHighlight;
    if (innerEdge === 'bottom') ctx.fillRect(x, y + h - 2, w, 2);
    else if (innerEdge === 'top') ctx.fillRect(x, y, w, 2);
    else if (innerEdge === 'right') ctx.fillRect(x + w - 2, y, 2, h);
    else if (innerEdge === 'left') ctx.fillRect(x, y, 2, h);

    // 表面紋理
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const step = 16;
    if (innerEdge === 'top' || innerEdge === 'bottom') {
        for (let ly = y + step; ly < y + h; ly += step) {
            ctx.moveTo(x, ly);
            ctx.lineTo(x + w, ly);
        }
    } else {
        for (let lx = x + step; lx < x + w; lx += step) {
            ctx.moveTo(lx, y);
            ctx.lineTo(lx, y + h);
        }
    }
    ctx.stroke();

    // 內邊框線
    ctx.strokeStyle = SETTINGS.colors.wallBorder;
    ctx.lineWidth = 1.5;
    if (innerEdge === 'bottom') {
        ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.stroke();
    } else if (innerEdge === 'top') {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
    } else if (innerEdge === 'right') {
        ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.stroke();
    } else if (innerEdge === 'left') {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.stroke();
    }
}

// 繪製世界邊界（四面厚牆）
export function drawWorldBounds(ctx) {
    const ww = gameState.world.width;
    const wh = gameState.world.height;
    const t = SETTINGS.worldConfig.wallThickness;

    // 上牆
    drawWallSegment(ctx, 0, 0, ww, t, 'bottom');
    // 下牆
    drawWallSegment(ctx, 0, wh - t, ww, t, 'top');
    // 左牆
    drawWallSegment(ctx, 0, t, t, wh - t * 2, 'right');
    // 右牆
    drawWallSegment(ctx, ww - t, t, t, wh - t * 2, 'left');
}

// 繪製玩家軌跡
export function drawTrail(ctx) {
    player.trail.forEach(p => {
        ctx.fillStyle = `rgba(0, 243, 255, ${p.life * 0.3})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, SETTINGS.playerSize * 0.4 * p.life, 0, Math.PI * 2);
        ctx.fill();
    });
}

// 繪製玩家
export function drawPlayer(ctx) {
    ctx.save();

    // 復活 blink 閃爍
    if (player.reviveBlinkTimer > 0) {
        ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(Date.now() / 1000 * 12));
    }

    let shakeX = 0, shakeY = 0;
    if (player.damageShakeTimer > 0) {
        const shakeIntensity = 3;
        shakeX = (Math.random() - 0.5) * shakeIntensity * 2;
        shakeY = (Math.random() - 0.5) * shakeIntensity * 2;
    }

    ctx.translate(player.x + shakeX, player.y + shakeY);

    // 無敵護盾
    if (player.invincibleTimer > 0) {
        const shieldScale = 1 + Math.sin(Date.now() / 100) * 0.1;
        ctx.save();
        ctx.scale(shieldScale, shieldScale);

        const r = SETTINGS.playerSize * 1.5;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3 - Math.PI / 2;
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();

        ctx.fillStyle = SETTINGS.colors.shield;
        ctx.fill();
        ctx.strokeStyle = SETTINGS.colors.shieldBorder;
        ctx.lineWidth = 2;
        ctx.stroke();

        // 光澤效果
        ctx.save();
        ctx.clip();
        const cycle = 1000;
        const t = (Date.now() % cycle) / cycle;
        const dist = r * 5;
        const offset = (t * dist) - (dist / 2);
        const bandSize = r * 0.8;
        const x0 = offset - bandSize;
        const y0 = -offset + bandSize;
        const x1 = offset + bandSize;
        const y1 = -offset - bandSize;
        const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(-r * 2, -r * 2, r * 4, r * 4);
        ctx.restore();

        ctx.restore();
    }

    ctx.rotate(player.currentAngle);

    ctx.shadowBlur = 15;
    if (player.damageFlashTimer > 0) {
        ctx.shadowColor = '#ff0000';
        ctx.fillStyle = '#ff3333';
    } else {
        ctx.shadowColor = SETTINGS.colors.playerShadow;
        ctx.fillStyle = SETTINGS.colors.player;
    }

    ctx.beginPath();
    ctx.moveTo(SETTINGS.playerSize, 0);
    ctx.lineTo(-SETTINGS.playerSize * 0.6, SETTINGS.playerSize * 0.7);
    ctx.lineTo(-SETTINGS.playerSize * 0.3, 0);
    ctx.lineTo(-SETTINGS.playerSize * 0.6, -SETTINGS.playerSize * 0.7);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// 繪製玩家血條
export function drawPlayerHPBar(ctx) {
    ctx.save();

    let shakeX = 0, shakeY = 0;
    if (player.damageShakeTimer > 0) {
        const shakeIntensity = 3;
        shakeX = (Math.random() - 0.5) * shakeIntensity * 2;
        shakeY = (Math.random() - 0.5) * shakeIntensity * 2;
    }

    ctx.translate(player.x + shakeX, player.y + shakeY);

    const barW = 48;
    const barH = 6;
    const yOffset = -SETTINGS.playerSize - 15;

    // Buff icons（多 buff 左至右排列，整體置中）
    drawBuffIcons(ctx, 0, yOffset - 17);

    // 血條背景
    ctx.fillStyle = '#111';
    ctx.fillRect(-barW / 2 - 1, yOffset - 1, barW + 2, barH + 2);

    // 血條
    const hpPct = player.currentHp / player.maxHp;
    let hpColor = '#00ff00';
    if (hpPct < 0.3) hpColor = '#ff0000';
    else if (hpPct < 0.6) hpColor = '#ffff00';

    ctx.fillStyle = hpColor;
    ctx.fillRect(-barW / 2, yOffset, barW * hpPct, barH);

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(-barW / 2 - 1, yOffset - 1, barW + 2, barH + 2);

    // Energy bar（HP 正下方）
    const energyBarH = 5;
    const energyY = yOffset + barH + 3;
    const energyPct = player.displayEnergy / player.maxEnergy;

    ctx.fillStyle = '#111';
    ctx.fillRect(-barW / 2 - 1, energyY - 1, barW + 2, energyBarH + 2);

    ctx.fillStyle = SETTINGS.colors.energy;
    ctx.fillRect(-barW / 2, energyY, barW * energyPct, energyBarH);

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(-barW / 2 - 1, energyY - 1, barW + 2, energyBarH + 2);

    ctx.restore();
}

// 繪製持有道具 UI（始終顯示）
// 位置參數：boxSize 控制框大小，marginBottom 控制離底部距離，iconScale 控制 icon 縮放
export function drawHeldItemUI(ctx) {
    const boxSize = 58;          // 框大小（原 48，放大 20%）
    const iconScale = 2.4;      // icon 縮放（原 2，放大 20%）
    const marginBottom = 20;    // 離畫布底部的距離（px）
    const x = gameState.width / 2;
    const y = gameState.height - marginBottom - boxSize / 2;
    const anim = gameState.inventoryAnim;

    ctx.save();

    // 背景框（始終顯示）
    ctx.fillStyle = player.heldItem ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)';
    ctx.strokeStyle = player.heldItem ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.fillRect(x - boxSize / 2, y - boxSize / 2, boxSize, boxSize);
    ctx.strokeRect(x - boxSize / 2, y - boxSize / 2, boxSize, boxSize);

    // 標題（框上方）
    ctx.fillStyle = player.heldItem ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('[F] Use', x, y - boxSize / 2 - 5);

    // 離開動畫（舊道具向上淡出）
    if (anim.exitTimer > 0 && anim.exitIcon) {
        const p = anim.exitTimer / anim.exitDuration;
        ctx.save();
        ctx.globalAlpha = p;
        ctx.translate(x, y - (1 - p) * 20);
        ctx.scale(iconScale, iconScale);
        anim.exitIcon(ctx);
        ctx.restore();
    }

    // 當前持有道具
    if (player.heldItem) {
        ctx.save();
        if (anim.enterTimer > 0) {
            // 進入動畫（從下方滑入 + 縮放）
            const p = 1 - anim.enterTimer / anim.enterDuration;
            const ease = 1 - (1 - p) * (1 - p); // easeOutQuad
            ctx.globalAlpha = ease;
            ctx.translate(x, y + (1 - ease) * 20);
            const s = (iconScale * 0.75) + (iconScale * 0.25) * ease;
            ctx.scale(s, s);
        } else {
            ctx.translate(x, y);
            ctx.scale(iconScale, iconScale);
        }
        player.heldItem.drawIcon(ctx);
        ctx.restore();
    }

    ctx.restore();
}

// 取得持有道具的瞄準半徑
function getAimRadius() {
    return player.heldItem ? player.heldItem.maxAimRadius : 200;
}

// 射線 vs 膨脹矩形交點（Minkowski Sum：矩形四邊外推 radius）
// 回傳射線首次碰到膨脹矩形的 t 值（0~1），無碰撞回傳 Infinity
function rayVsExpandedRect(fromX, fromY, dx, dy, obj, radius) {
    const left   = obj.x - radius;
    const right  = obj.x + obj.width + radius;
    const top    = obj.y - radius;
    const bottom = obj.y + obj.height + radius;

    let tMin, tMax;

    if (dx !== 0) {
        const t1 = (left - fromX) / dx;
        const t2 = (right - fromX) / dx;
        tMin = Math.min(t1, t2);
        tMax = Math.max(t1, t2);
    } else {
        // 射線水平分量為 0，檢查起點是否在範圍內
        if (fromX < left || fromX > right) return Infinity;
        tMin = -Infinity;
        tMax = Infinity;
    }

    if (dy !== 0) {
        const t1 = (top - fromY) / dy;
        const t2 = (bottom - fromY) / dy;
        const tyMin = Math.min(t1, t2);
        const tyMax = Math.max(t1, t2);
        tMin = Math.max(tMin, tyMin);
        tMax = Math.min(tMax, tyMax);
    } else {
        if (fromY < top || fromY > bottom) return Infinity;
    }

    if (tMin > tMax || tMax < 0) return Infinity;
    return tMin > 0 ? tMin : tMax > 0 ? 0 : Infinity;
}

// 沿飛行路徑找最遠可達位置（Ray vs 膨脹矩形，精確無晃動）
function getFlightPathClamped(fromX, fromY, toX, toY, radius) {
    const mask = player.heldItem?.collisionMask;
    if (!mask) return { x: toX, y: toY };

    const dx = toX - fromX;
    const dy = toY - fromY;
    if (dx === 0 && dy === 0) return { x: toX, y: toY };

    let minT = 1; // 1 = 完整到達 aimpoint

    for (const obj of gameState.fieldObjects) {
        if (obj.type === 'Wall') continue;
        if (!mask.has(obj.collisionLayer)) continue;
        const t = rayVsExpandedRect(fromX, fromY, dx, dy, obj, radius);
        if (t < minT) minT = t;
    }

    return {
        x: fromX + dx * minT,
        y: fromY + dy * minT
    };
}

// 繪製瞄準 UI
export function drawAimingUI(ctx, input) {
    const aimPos = getClampedAimPosition(input);

    // 連線
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(aimPos.x, aimPos.y);
    ctx.stroke();

    // 作用範圍預覽
    if (player.heldItem && player.heldItem.aimPreview) {
        const r = player.heldItem.aimPreview.radius;
        ctx.beginPath();
        ctx.arc(aimPos.x, aimPos.y, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // 瞄準點
    ctx.fillStyle = SETTINGS.colors.aimValid;
    ctx.beginPath();
    ctx.arc(aimPos.x, aimPos.y, SETTINGS.aimIndicatorRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
}

// 取得限制在範圍內的瞄準位置
export function getClampedAimPosition(input) {
    const aimRadius = getAimRadius();
    const isPad = gameState.aimInputMode === 'PAD';
    const rawX = isPad ? gameState.padAim.x : input.mouse.x;
    const rawY = isPad ? gameState.padAim.y : input.mouse.y;

    const dx = rawX - player.x;
    const dy = rawY - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let finalX = rawX;
    let finalY = rawY;

    // 限制在 maxAimRadius 內
    if (dist > aimRadius) {
        const ratio = aimRadius / dist;
        finalX = player.x + dx * ratio;
        finalY = player.y + dy * ratio;
    }

    // 限制在 edgeWall 內側（圓心不超出牆壁內邊界）
    const wallT = SETTINGS.worldConfig.wallThickness;
    const world = gameState.world;
    finalX = Math.max(wallT, Math.min(world.width - wallT, finalX));
    finalY = Math.max(wallT, Math.min(world.height - wallT, finalY));

    // 飛行路徑 clamp（hasFlightPath 的道具如 Bomb，限制在障礙物前方）
    if (player.heldItem && player.heldItem.hasFlightPath) {
        const clamped = getFlightPathClamped(player.x, player.y, finalX, finalY, 8);
        finalX = clamped.x;
        finalY = clamped.y;
    }

    // PAD mode: 寫回 clamped 值防止累積超出
    if (isPad) {
        gameState.padAim.x = finalX;
        gameState.padAim.y = finalY;
    }

    return { x: finalX, y: finalY };
}
