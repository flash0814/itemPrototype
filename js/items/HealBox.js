import { SETTINGS } from '../core/Settings.js';
import { ItemBase } from './ItemBase.js';
import { player } from '../entities/Player.js';

export class HealBox extends ItemBase {
    constructor(x, y) {
        const counts = SETTINGS.itemHealBox.counts;
        const tickRate = SETTINGS.itemHealBox.tick;
        super(x, y, counts * tickRate);

        this.category = 'ACTIVE';
        this.radius = SETTINGS.itemHealBox.radius;
        this.healValue = SETTINGS.itemHealBox.value;
        this.tickRate = tickRate;
        this.maxTicks = counts;
        this.ticksPerformed = 0;
        this.tickTimer = 0;
        this.pulseTime = 0;
        this.pulseDuration = 0.5;
    }

    onDurationEnd() {
        if (this.pulseTime <= 0) this.isDead = true;
    }

    update(dt) {
        super.update(dt);

        if (this.pulseTime > 0) this.pulseTime -= dt;

        if (this.ticksPerformed < this.maxTicks) {
            this.tickTimer += dt;
            if (this.tickTimer >= this.tickRate) {
                this.tickTimer -= this.tickRate;
                this.triggerTick();
                this.ticksPerformed++;
            }
        }

        if (this.pulseTime > 0 && this.duration !== -1 && this.lifeTimer >= this.duration) {
            // 等待脈衝完成
        } else if (this.duration !== -1 && this.lifeTimer >= this.duration) {
            this.isDead = true;
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

    draw(ctx) {
        const landingProgress = 1 - Math.min(1, this.z / 150);
        let pulseAlpha = 0;

        if (this.pulseTime > 0) {
            const progress = 1 - (this.pulseTime / this.pulseDuration);
            pulseAlpha = (1 - progress) * 0.4;
        }

        // 繪製範圍圓
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

        this.drawShadow(ctx);

        const drawY = this.y - this.z;
        const perspectiveScale = 1 + (this.z / 400);

        ctx.save();
        ctx.translate(this.x, drawY);
        ctx.scale(perspectiveScale, perspectiveScale);

        ctx.fillStyle = SETTINGS.colors.healBox;
        const boxSize = 18;
        ctx.fillRect(-boxSize / 2, -boxSize / 2, boxSize, boxSize);

        ctx.fillStyle = '#000';
        ctx.fillRect(-3, -6, 6, 12);
        ctx.fillRect(-6, -3, 12, 6);

        this.drawDurationBar(ctx, -16);
        ctx.restore();
    }
}
