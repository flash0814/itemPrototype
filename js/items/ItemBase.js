import { healPlayer } from '../entities/Player.js';

// 道具基類
export class ItemBase {
    constructor(x, y, duration) {
        this.x = x;
        this.y = y;
        this.duration = duration;
        this.lifeTimer = 0;
        this.isDead = false;
        this.z = 150;
        this.vz = 0;
        this.gravity = 2500;
        this.bounciness = 0.4;
        this.isGrounded = false;
    }

    update(dt) {
        if (this.duration !== -1) {
            this.lifeTimer += dt;
            if (this.lifeTimer >= this.duration) {
                this.onDurationEnd();
            }
        }

        if (!this.isGrounded) {
            this.vz += this.gravity * dt;
            this.z -= this.vz * dt;
            if (this.z <= 0) {
                this.z = 0;
                this.vz = -this.vz * this.bounciness;
                if (Math.abs(this.vz) < 100) {
                    this.vz = 0;
                    this.isGrounded = true;
                }
            }
        }
    }

    onDurationEnd() {
        this.isDead = true;
    }

    spawnHealFX(value) {
        healPlayer(value);
    }

    drawShadow(ctx) {
        const shadowScale = Math.max(0.2, 1 - (this.z / 200));
        const shadowAlpha = Math.max(0.1, 1 - (this.z / 200)) * 0.5;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(shadowScale, shadowScale);
        ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawDurationBar(ctx, yOffset) {
        if (this.duration === -1) return;

        const lifePercent = Math.max(0, 1 - (this.lifeTimer / this.duration));
        const barWidth = 24;
        const barHeight = 3;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(-barWidth / 2, yOffset, barWidth, barHeight);

        ctx.fillStyle = '#00ff00';
        ctx.fillRect(-barWidth / 2, yOffset, barWidth * lifePercent, barHeight);
    }
}
