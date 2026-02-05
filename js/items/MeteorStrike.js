import { SETTINGS } from '../core/Settings.js';
import { gameState } from '../core/GameState.js';
import { ItemBase } from './ItemBase.js';
import { player, takeDamage } from '../entities/Player.js';
import { Particle } from '../effects/Particle.js';
import { ExplosionWave } from '../effects/ExplosionWave.js';
import { FloatingText } from '../effects/FloatingText.js';

// 隕石投射物（內部類別，不 export）
class Meteor {
    constructor(targetX, targetY) {
        const cfg = SETTINGS.itemMeteorStrike;
        this.targetX = targetX;
        this.targetY = targetY;
        this.damage = cfg.damage;
        this.explosionRadius = cfg.radius;
        this.speed = cfg.meteorSpeed;
        this.isDead = false;

        // 從右上方飛入：根據角度和高度計算起始位置
        const angleRad = cfg.meteorAngle * (Math.PI / 180);
        const offsetX = Math.cos(angleRad) * cfg.meteorAltitude;
        const offsetY = Math.sin(angleRad) * cfg.meteorAltitude;
        this.x = targetX + offsetX;
        this.y = targetY - offsetY;

        // 飛行方向（朝目標）
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        this.dirX = dx / dist;
        this.dirY = dy / dist;
        this.totalDist = dist;
        this.traveled = 0;

        // 尾跡歷史
        this.trail = [];
        this.trailTimer = 0;

        // 隕石視覺大小
        this.bodyRadius = 12;
    }

    update(dt) {
        const step = this.speed * dt;
        this.x += this.dirX * step;
        this.y += this.dirY * step;
        this.traveled += step;

        // 尾跡粒子
        this.trailTimer += dt;
        if (this.trailTimer > 0.015) {
            this.trailTimer = 0;
            this.trail.push({
                x: this.x - this.dirX * 8,
                y: this.y - this.dirY * 8,
                life: 1.0,
                size: this.bodyRadius * (0.6 + Math.random() * 0.4)
            });
        }

        // 尾跡衰減
        for (let i = this.trail.length - 1; i >= 0; i--) {
            this.trail[i].life -= dt * 4;
            if (this.trail[i].life <= 0) this.trail.splice(i, 1);
        }

        // 抵達目標
        if (this.traveled >= this.totalDist) {
            this.x = this.targetX;
            this.y = this.targetY;
            this.explode();
        }
    }

    explode() {
        this.isDead = true;
        const radius = this.explosionRadius;
        const damage = this.damage;

        // 大量爆炸粒子（rocket 的 2 倍）
        for (let i = 0; i < 30; i++) {
            gameState.particles.push(new Particle(this.x, this.y, 'explosion'));
        }
        // 煙霧粒子
        for (let i = 0; i < 10; i++) {
            gameState.particles.push(new Particle(this.x, this.y, 'smoke'));
        }
        // 爆炸波（比 rocket 更大的倍率）
        gameState.particles.push(new ExplosionWave(this.x, this.y, radius * 1.5));

        // 撞擊震動
        player.damageShakeTimer = Math.max(player.damageShakeTimer, 0.3);

        // 傷害玩家
        const pdx = player.x - this.x;
        const pdy = player.y - this.y;
        if ((pdx * pdx + pdy * pdy) < (radius * radius)) {
            takeDamage(damage);
        }

        // 傷害場景物件
        for (let obj of gameState.fieldObjects) {
            if (obj.isSolid) {
                const closestX = Math.max(obj.x, Math.min(this.x, obj.x + obj.width));
                const closestY = Math.max(obj.y, Math.min(this.y, obj.y + obj.height));
                const dx = this.x - closestX;
                const dy = this.y - closestY;

                if ((dx * dx + dy * dy) < (radius * radius)) {
                    obj.takeDamage(damage, closestX, closestY);
                }
            }
        }
    }

    draw(ctx) {
        const progress = Math.min(1, this.traveled / this.totalDist);

        // 地面陰影（目標點，隨接近放大）
        ctx.save();
        const shadowSize = 10 + progress * 30;
        const shadowAlpha = 0.1 + progress * 0.4;
        ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
        ctx.beginPath();
        ctx.arc(this.targetX, this.targetY, shadowSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 尾跡
        for (const t of this.trail) {
            ctx.save();
            ctx.globalAlpha = t.life * 0.6;
            ctx.fillStyle = `rgba(255, ${80 + Math.floor(t.life * 100)}, 20, 1)`;
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.size * t.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 隕石本體
        ctx.save();
        ctx.translate(this.x, this.y);

        // 外層光暈
        ctx.shadowBlur = 25;
        ctx.shadowColor = SETTINGS.colors.meteorGlow;

        // 本體（深紅到橘色漸層）
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.bodyRadius);
        grad.addColorStop(0, '#fff8e0');
        grad.addColorStop(0.3, '#ffaa30');
        grad.addColorStop(0.7, '#cc4400');
        grad.addColorStop(1, '#661100');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, this.bodyRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export class MeteorStrike extends ItemBase {
    constructor(x, y) {
        super(x, y, SETTINGS.itemMeteorStrike.duration);
        this.category = 'ACTIVE';
        this.maxAimRadius = SETTINGS.itemMeteorStrike.maxAimRadius;
        this.size = 16;
        this.aimPreview = { radius: SETTINGS.itemMeteorStrike.radius };
    }

    activate() {
        this.isActivated = true;
        // 召喚隕石投射物，道具本身消耗
        gameState.projectiles.push(new Meteor(this.x, this.y));
        this.isDead = true;
    }

    drawIcon(ctx) {
        const boxSize = 18;
        // 紅色底
        ctx.fillStyle = SETTINGS.colors.meteorStrike;
        ctx.fillRect(-boxSize / 2, -boxSize / 2, boxSize, boxSize);

        // 白色隕石 icon（圓 + 尾跡線）
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(1, 1, 4, 0, Math.PI * 2);
        ctx.fill();

        // 尾跡線條
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-2, -2);
        ctx.lineTo(-7, -7);
        ctx.moveTo(-1, -4);
        ctx.lineTo(-5, -8);
        ctx.moveTo(-4, -1);
        ctx.lineTo(-8, -5);
        ctx.stroke();
    }

    draw(ctx) {
        if (this.isHeld) return;

        this.drawShadow(ctx);

        const drawY = this.y - this.z;
        const perspectiveScale = 1 + (this.z / 400);

        ctx.save();
        ctx.translate(this.x, drawY);
        ctx.scale(perspectiveScale * 1.5, perspectiveScale * 1.5);

        this.drawIcon(ctx);
        this.drawDurationBar(ctx, -16);
        ctx.restore();
    }
}
