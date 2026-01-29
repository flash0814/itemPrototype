import { SETTINGS } from '../core/Settings.js';
import { ItemBase } from './ItemBase.js';
import { player } from '../entities/Player.js';

export class HealBox extends ItemBase {
    constructor(x, y) {
        // 地上狀態用 groundDuration
        super(x, y, SETTINGS.itemHealBox.groundDuration);

        this.category = 'ACTIVE';
        this.maxAimRadius = SETTINGS.itemHealBox.maxAimRadius;
        this.radius = SETTINGS.itemHealBox.radius;
        this.healValue = SETTINGS.itemHealBox.value;
        this.tickRate = SETTINGS.itemHealBox.tick;
        this.maxTicks = SETTINGS.itemHealBox.counts;
        this.ticksPerformed = 0;
        this.tickTimer = 0;
        this.pulseTime = 0;
        this.pulseDuration = 0.5;
    }

    // 從持有狀態丟出啟動
    activate() {
        this.isActivated = true;
        this.duration = this.maxTicks * this.tickRate;
        this.lifeTimer = 0;
        this.ticksPerformed = 0;
        this.tickTimer = 0;
    }

    onDurationEnd() {
        if (this.isActivated) {
            if (this.pulseTime <= 0) this.isDead = true;
        } else {
            this.isDead = true;
        }
    }

    update(dt) {
        super.update(dt);
        if (this.isHeld) return;

        if (this.pulseTime > 0) this.pulseTime -= dt;

        // 只有啟動後才執行治療邏輯
        if (this.isActivated) {
            if (this.ticksPerformed < this.maxTicks) {
                this.tickTimer += dt;
                if (this.tickTimer >= this.tickRate) {
                    this.tickTimer -= this.tickRate;
                    this.triggerTick();
                    this.ticksPerformed++;
                }
            }

            if (this.pulseTime > 0 && this.duration !== 0 && this.lifeTimer >= this.duration) {
                // 等待脈衝完成
            } else if (this.duration !== 0 && this.lifeTimer >= this.duration) {
                this.isDead = true;
            }
        }
    }

    triggerTick() {
        this.pulseTime = this.pulseDuration;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distSq = dx * dx + dy * dy;

        if (distSq <= this.radius * this.radius) {
            this.spawnHealFX(this.healValue);
        }
    }

    drawIcon(ctx) {
        ctx.fillStyle = SETTINGS.colors.healBox;
        const boxSize = 18;
        ctx.fillRect(-boxSize / 2, -boxSize / 2, boxSize, boxSize);
        ctx.fillStyle = '#000';
        ctx.fillRect(-3, -6, 6, 12);
        ctx.fillRect(-6, -3, 12, 6);
    }

    draw(ctx) {
        if (this.isHeld) return;

        // 啟動狀態：繪製範圍圓和治療效果
        if (this.isActivated) {
            const landingProgress = 1 - Math.min(1, this.z / 150);
            let pulseAlpha = 0;

            if (this.pulseTime > 0) {
                const progress = 1 - (this.pulseTime / this.pulseDuration);
                pulseAlpha = (1 - progress) * 0.4;
            }

            ctx.save();
            ctx.globalAlpha = Math.max(0.1, landingProgress);
            ctx.strokeStyle = SETTINGS.colors.healRange;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();

            if (this.pulseTime > 0) {
                ctx.fillStyle = `rgba(0, 255, 0, ${pulseAlpha})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = `rgba(0, 255, 0, ${pulseAlpha * 2})`;
                ctx.lineWidth = 4;
                ctx.beginPath();
                const waveRadius = (this.radius * 0.3) + (this.radius * 0.7 * (1 - (this.pulseTime / this.pulseDuration)));
                ctx.arc(this.x, this.y, waveRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }

        this.drawShadow(ctx);

        const drawY = this.y - this.z;
        const perspectiveScale = 1 + (this.z / 400);

        ctx.save();
        ctx.translate(this.x, drawY);
        ctx.scale(perspectiveScale, perspectiveScale);

        // 啟動狀態加入 glow 特效
        if (this.isActivated) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ff00';
        }

        this.drawIcon(ctx);
        this.drawDurationBar(ctx, -16);
        ctx.restore();
    }
}
