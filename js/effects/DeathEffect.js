import { SETTINGS } from '../core/Settings.js';
import { gameState } from '../core/GameState.js';
import { Particle } from './Particle.js';

class TriangleShard {
    constructor(x, y, originX, originY, size, color, angle) {
        this.x = x;
        this.y = y;
        this.originX = originX;
        this.originY = originY;
        this.size = size;
        this.color = color;
        this.shardAngle = angle;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 12;
        this.alpha = 1.0;

        // 崩解速度
        const scatterAngle = Math.atan2(y - originY, x - originX) + (Math.random() - 0.5) * 0.8;
        const speed = 80 + Math.random() * 120;
        this.vx = Math.cos(scatterAngle) * speed;
        this.vy = Math.sin(scatterAngle) * speed;
        this.gravity = 150;

        // 重組用
        this.scatterX = 0;
        this.scatterY = 0;
        this.targetRotation = this.shardAngle;
    }
}

export class DeathEffect {
    constructor(x, y) {
        this.playerX = x;
        this.playerY = y;
        this.state = 'dying';
        this.timer = 0;
        this.shards = [];
        this.glowTimer = 0;

        this.deathDuration = SETTINGS.deathRevive.deathAnimTime;
        this.reviveDuration = SETTINGS.deathRevive.reviveAnimTime;

        this._createShards();
    }

    _createShards() {
        const ps = SETTINGS.playerSize;
        const cx = this.playerX;
        const cy = this.playerY;
        const color = SETTINGS.colors.player;

        // 將玩家三角形拆成 7 個碎片（不規則三角形）
        const shardDefs = [
            { ox: ps * 0.5, oy: 0, size: ps * 0.5 },
            { ox: -ps * 0.2, oy: -ps * 0.4, size: ps * 0.4 },
            { ox: -ps * 0.2, oy: ps * 0.4, size: ps * 0.4 },
            { ox: ps * 0.1, oy: -ps * 0.2, size: ps * 0.35 },
            { ox: ps * 0.1, oy: ps * 0.2, size: ps * 0.35 },
            { ox: -ps * 0.4, oy: -ps * 0.15, size: ps * 0.3 },
            { ox: -ps * 0.4, oy: ps * 0.15, size: ps * 0.3 }
        ];

        for (const def of shardDefs) {
            const angle = Math.atan2(def.oy, def.ox);
            this.shards.push(new TriangleShard(
                cx + def.ox, cy + def.oy,
                cx + def.ox, cy + def.oy,
                def.size, color, angle
            ));
        }
    }

    startRevive() {
        this.state = 'reviving';
        this.timer = 0;
        this.glowTimer = 0;

        // 記錄碎片當前散落位置
        for (const s of this.shards) {
            s.scatterX = s.x;
            s.scatterY = s.y;
            s.alpha = 0.3;
        }
    }

    update(dt) {
        this.timer += dt;

        if (this.state === 'dying') {
            const progress = Math.min(1, this.timer / this.deathDuration);

            for (const s of this.shards) {
                s.x += s.vx * dt;
                s.y += s.vy * dt;
                s.vy += s.gravity * dt;
                s.vx *= 0.97;
                s.rotation += s.rotSpeed * dt;
                s.rotSpeed *= 0.98;
                s.alpha = 1.0 - progress * 0.7;
            }

            if (progress >= 1) {
                this.state = 'waiting';
                this.timer = 0;
                for (const s of this.shards) {
                    s.vx = 0;
                    s.vy = 0;
                    s.rotSpeed = 0;
                }
            }

        } else if (this.state === 'waiting') {
            // 碎片靜止，微微閃爍
            const flicker = 0.2 + 0.1 * Math.sin(this.timer * 4);
            for (const s of this.shards) {
                s.alpha = flicker;
            }

        } else if (this.state === 'reviving') {
            const progress = Math.min(1, this.timer / this.reviveDuration);
            // ease-in-out
            const ease = progress * progress * (3 - 2 * progress);

            for (const s of this.shards) {
                // 從散落位置飛回原始位置
                s.x = s.scatterX + (s.originX - s.scatterX) * ease;
                s.y = s.scatterY + (s.originY - s.scatterY) * ease;
                // 旋轉歸零
                s.rotation = s.rotation * (1 - ease);
                // alpha 回復
                s.alpha = 0.3 + 0.7 * ease;
            }

            // 集中光效粒子
            this.glowTimer += dt;
            if (this.glowTimer > 0.05 && progress < 0.9) {
                this.glowTimer = 0;
                const angle = Math.random() * Math.PI * 2;
                const dist = 40 + Math.random() * 60;
                const px = this.playerX + Math.cos(angle) * dist * (1 - ease);
                const py = this.playerY + Math.sin(angle) * dist * (1 - ease);
                const p = new Particle(px, py, 'revive');
                // 朝中心匯聚
                p.vx = (this.playerX - px) * 3;
                p.vy = (this.playerY - py) * 3;
                gameState.particles.push(p);
            }

            if (progress >= 1) {
                // 最終閃光爆發
                for (let i = 0; i < 15; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 30 + Math.random() * 80;
                    const p = new Particle(this.playerX, this.playerY, 'revive');
                    p.vx = Math.cos(angle) * speed;
                    p.vy = Math.sin(angle) * speed;
                    p.life = 0.6 + Math.random() * 0.4;
                    gameState.particles.push(p);
                }
                this.state = 'done';
            }
        }
    }

    draw(ctx) {
        // 繪製碎片
        for (const s of this.shards) {
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.rotation);
            ctx.globalAlpha = s.alpha;

            // 光暈（復活時增強）
            if (this.state === 'reviving') {
                const progress = Math.min(1, this.timer / this.reviveDuration);
                ctx.shadowBlur = 10 + progress * 15;
                ctx.shadowColor = SETTINGS.colors.playerShadow;
            }

            // 三角碎片
            ctx.fillStyle = s.color;
            ctx.beginPath();
            const sz = s.size;
            ctx.moveTo(sz, 0);
            ctx.lineTo(-sz * 0.5, sz * 0.6);
            ctx.lineTo(-sz * 0.5, -sz * 0.6);
            ctx.closePath();
            ctx.fill();

            // 碎片邊緣亮光
            ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.restore();
        }

        // 復活中心光效
        if (this.state === 'reviving') {
            const progress = Math.min(1, this.timer / this.reviveDuration);
            ctx.save();
            ctx.globalAlpha = progress * 0.6;
            const grad = ctx.createRadialGradient(
                this.playerX, this.playerY, 0,
                this.playerX, this.playerY, 30 * progress
            );
            grad.addColorStop(0, 'rgba(0, 243, 255, 0.8)');
            grad.addColorStop(1, 'rgba(0, 243, 255, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.playerX, this.playerY, 30 * progress, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}
