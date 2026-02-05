import { SETTINGS } from '../core/Settings.js';
import { gameState } from '../core/GameState.js';
import { checkCollisionWithRect } from '../core/Utils.js';
import { ItemBase } from './ItemBase.js';
import { player, takeDamage } from '../entities/Player.js';
import { Particle } from '../effects/Particle.js';
import { ExplosionWave } from '../effects/ExplosionWave.js';

export class Bomb extends ItemBase {
    constructor(x, y) {
        super(x, y, SETTINGS.itemBomb.duration);
        this.category = 'ACTIVE';
        this.maxAimRadius = SETTINGS.itemBomb.maxAimRadius;
        this.collisionMask = new Set([0]);
        this.size = 16;
        this.fuseTimer = 0;
    }

    activate(targetX, targetY) {
        this.isActivated = true;
        this.isGrounded = false;

        // 從玩家位置出發
        this.x = player.x;
        this.y = player.y;

        // 計算水平速度朝目標
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = SETTINGS.itemBomb.throwSpeed;

        if (dist > 0) {
            this.vx = (dx / dist) * speed;
            this.vy = (dy / dist) * speed;
        }

        // 拋物線：根據飛行時間計算初始 vz
        const flightTime = dist / speed;
        this.gravity = 800;
        this.z = 10;
        // vz 負值 = 向上拋，gravity 會拉回來
        // 要在 flightTime 時 z 回到 0：z0 + vz*t - 0.5*g*t^2 = 0
        // vz = (0.5*g*t^2 - z0) / t
        this.vz = -(0.5 * this.gravity * flightTime - this.z / flightTime);

        this.fuseTimer = 0;
    }

    update(dt) {
        if (this.isHeld) return;

        // 飛行中：只跑物理 + 引線粒子
        if (this.isActivated && !this.isGrounded) {
            this.vz += this.gravity * dt;
            this.z -= this.vz * dt;
            this.x += this.vx * dt;
            this.y += this.vy * dt;

            // 飛行中碰撞檢測
            for (let obj of gameState.fieldObjects) {
                if (this.collisionMask.has(obj.collisionLayer) &&
                    checkCollisionWithRect(this.x, this.y, 8, obj)) {
                    this.y -= this.z;
                    this.z = 0;
                    this.explode();
                    return;
                }
            }

            // 引線火花
            this.fuseTimer += dt;
            if (this.fuseTimer > 0.03) {
                this.fuseTimer = 0;
                gameState.particles.push(new Particle(this.x, this.y - this.z - 8, 'bombSpark'));
            }

            // 落地
            if (this.z <= 0) {
                this.z = 0;
                this.explode();
            }
            return;
        }

        // 未啟動：正常 ItemBase 邏輯（地面 idle）
        super.update(dt);
    }

    explode() {
        this.isDead = true;
        const radius = SETTINGS.itemBomb.radius;
        const damage = SETTINGS.itemBomb.damage;

        // 紅色爆炸粒子
        for (let i = 0; i < 15; i++) {
            gameState.particles.push(new Particle(this.x, this.y, 'bombExplosion'));
        }
        // 煙霧
        for (let i = 0; i < 6; i++) {
            gameState.particles.push(new Particle(this.x, this.y, 'smoke'));
        }
        // 紅色爆炸波
        gameState.particles.push(new ExplosionWave(
            this.x, this.y, radius * 1.2,
            SETTINGS.colors.bombExplosion,
            'rgba(255, 80, 40, 0.3)'
        ));

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
                const cdx = this.x - closestX;
                const cdy = this.y - closestY;
                if ((cdx * cdx + cdy * cdy) < (radius * radius)) {
                    obj.takeDamage(damage, closestX, closestY);
                }
            }
        }
    }

    drawIcon(ctx) {
        const boxSize = 18;
        // 亮紫底
        ctx.fillStyle = SETTINGS.colors.bomb;
        ctx.fillRect(-boxSize / 2, -boxSize / 2, boxSize, boxSize);

        // 深紫炸彈（圓形本體）
        ctx.fillStyle = SETTINGS.colors.bombDark;
        ctx.beginPath();
        ctx.arc(0, 1, 5.5, 0, Math.PI * 2);
        ctx.fill();

        // 引線
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(2, -4);
        ctx.quadraticCurveTo(5, -7, 3, -8);
        ctx.stroke();

        // 引線火花
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(3, -8, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    draw(ctx) {
        if (this.isHeld) return;

        // 飛行中的炸彈
        if (this.isActivated && !this.isGrounded) {
            this.drawShadow(ctx);
            const drawY = this.y - this.z;

            ctx.save();
            ctx.translate(this.x, drawY);

            // 紫色炸彈本體
            ctx.fillStyle = SETTINGS.colors.bombDark;
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();

            // 高光
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.beginPath();
            ctx.arc(-2, -2, 3, 0, Math.PI * 2);
            ctx.fill();

            // 引線
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(3, -6);
            ctx.quadraticCurveTo(7, -10, 5, -12);
            ctx.stroke();

            // 引線頂端火花
            ctx.fillStyle = '#ffaa00';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ffaa00';
            ctx.beginPath();
            ctx.arc(5, -12, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.restore();
            return;
        }

        // 地面 icon
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
