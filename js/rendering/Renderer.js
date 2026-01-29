import { SETTINGS } from '../core/Settings.js';
import { gameState, GAME_STATE_MODE } from '../core/GameState.js';
import { player } from '../entities/Player.js';
import { checkCollisionWithRect } from '../core/Utils.js';

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

// 繪製網格
export function drawGrid(ctx) {
    ctx.strokeStyle = SETTINGS.colors.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = 0; x <= gameState.width; x += SETTINGS.gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, gameState.height);
    }
    for (let y = 0; y <= gameState.height; y += SETTINGS.gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(gameState.width, y);
    }

    ctx.stroke();
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

    const barW = 40;
    const barH = 5;
    const yOffset = -SETTINGS.playerSize - 15;

    // Buff 圖標
    if (player.invincibleTimer > 0 && player.maxInvincibleTimer > 0) {
        const progress = player.invincibleTimer / player.maxInvincibleTimer;
        const iconSize = 22;

        ctx.save();
        if (progress <= 0.4) {
            const speed = 12.56;
            const blink = Math.sin(Date.now() / 1000 * speed);
            ctx.globalAlpha = 0.3 + 0.7 * ((blink + 1) / 2);
        }
        drawBuffIcon(ctx, 0, yOffset - 17, iconSize, progress, SETTINGS.colors.buffBorder, 'SHIELD');
        ctx.restore();
    }

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

    ctx.restore();
}

// 繪製持有道具 UI（始終顯示）
export function drawHeldItemUI(ctx) {
    const boxSize = 48;
    const x = gameState.width / 2;
    const y = 20 + boxSize / 2;
    const anim = gameState.inventoryAnim;

    ctx.save();

    // 背景框（始終顯示）
    ctx.fillStyle = player.heldItem ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)';
    ctx.strokeStyle = player.heldItem ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.fillRect(x - boxSize / 2, y - boxSize / 2, boxSize, boxSize);
    ctx.strokeRect(x - boxSize / 2, y - boxSize / 2, boxSize, boxSize);

    // 標題
    ctx.fillStyle = player.heldItem ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('[F] Use', x, y - boxSize / 2 - 4);

    // 離開動畫（舊道具向上淡出）
    if (anim.exitTimer > 0 && anim.exitIcon) {
        const p = anim.exitTimer / anim.exitDuration;
        ctx.save();
        ctx.globalAlpha = p;
        ctx.translate(x, y - (1 - p) * 20);
        ctx.scale(2, 2);
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
            const s = 1.5 + 0.5 * ease;
            ctx.scale(s, s);
        } else {
            ctx.translate(x, y);
            ctx.scale(2, 2);
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

// 繪製瞄準 UI
export function drawAimingUI(ctx, input) {
    const aimPos = getClampedAimPosition(input);
    const aimRadius = getAimRadius();

    let isColliding = false;
    for (let obj of gameState.fieldObjects) {
        if (obj.isSolid && checkCollisionWithRect(aimPos.x, aimPos.y, SETTINGS.aimIndicatorRadius, obj)) {
            isColliding = true;
            break;
        }
    }

    // 瞄準範圍圓
    ctx.strokeStyle = SETTINGS.colors.aimRange;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, aimRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, aimRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 連線
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(aimPos.x, aimPos.y);
    ctx.stroke();

    // 瞄準點
    ctx.fillStyle = isColliding ? SETTINGS.colors.aimInvalid : SETTINGS.colors.aimValid;
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
    const dx = input.mouse.x - player.x;
    const dy = input.mouse.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let finalX = input.mouse.x;
    let finalY = input.mouse.y;

    if (dist > aimRadius) {
        const ratio = aimRadius / dist;
        finalX = player.x + dx * ratio;
        finalY = player.y + dy * ratio;
    }

    return { x: finalX, y: finalY };
}
