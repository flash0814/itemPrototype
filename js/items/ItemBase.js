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
        this.vx = 0;
        this.vy = 0;
        this.gravity = 2500;
        this.bounciness = 0.4;
        this.isGrounded = false;

        // 道具系統屬性
        this.category = 'PASSIVE';
        this.maxAimRadius = 0;
        this.pickupRadius = 10;
        this.isHeld = false;
        this.isActivated = false;
        this.hasFlightPath = false;
    }

    update(dt) {
        // 持有中不更新
        if (this.isHeld) return;

        // Duration 倒數（0 = 永久，啟動後由子類自行控制死亡）
        if (!this.isActivated && this.duration !== 0 && this.duration !== -1) {
            this.lifeTimer += dt;
            if (this.lifeTimer >= this.duration) {
                this.onDurationEnd();
            }
        }

        // 物理：重力 + 彈跳 + 水平移動
        if (!this.isGrounded) {
            this.vz += this.gravity * dt;
            this.z -= this.vz * dt;

            // 水平移動（拋出時用）
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.vx *= 0.98;
            this.vy *= 0.98;

            if (this.z <= 0) {
                this.z = 0;
                this.vz = -this.vz * this.bounciness;
                this.vx *= 0.6;
                this.vy *= 0.6;
                if (Math.abs(this.vz) < 50) {
                    this.vz = 0;
                    this.vx = 0;
                    this.vy = 0;
                    this.isGrounded = true;
                    // 還原預設物理參數
                    this.gravity = 2500;
                    this.bounciness = 0.4;
                }
            }
        }
    }

    onDurationEnd() {
        this.isDead = true;
    }

    // 被動道具效果 — 子類覆寫
    onPassiveEffect() {}

    // 道具被撿起
    onPickup() {
        if (this.category === 'PASSIVE') {
            this.onPassiveEffect();
            this.isDead = true;
        } else {
            this.isHeld = true;
        }
    }

    // Active 道具被取代掉落到地上
    dropToGround(x, y) {
        this.isHeld = false;
        this.isActivated = false;
        this.x = x;
        this.y = y;
        this.z = 30;
        this.vz = -200;
        this.gravity = 500;
        this.bounciness = 0.3;
        this.isGrounded = false;
        this.lifeTimer = 0;

        // 水平為主、低弧線拋出
        const angle = Math.random() * Math.PI * 2;
        const speed = 150 + Math.random() * 80;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }

    // 畫 icon（子類覆寫）— 以原點為中心
    drawIcon(ctx) {}

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
        if (this.duration === 0 || this.duration === -1) return;

        const lifePercent = Math.max(0, 1 - (this.lifeTimer / this.duration));
        const barWidth = 24;
        const barHeight = 3;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(-barWidth / 2, yOffset, barWidth, barHeight);

        ctx.fillStyle = '#00ff00';
        ctx.fillRect(-barWidth / 2, yOffset, barWidth * lifePercent, barHeight);
    }
}
