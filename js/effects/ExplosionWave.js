import { SETTINGS } from '../core/Settings.js';

export class ExplosionWave {
    constructor(x, y, maxRadius) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.maxRadius = maxRadius;
        this.life = 1.0;
        this.alpha = 1.0;
    }

    update(dt) {
        this.radius += (this.maxRadius - this.radius) * 5 * dt;
        this.life -= dt * 2;
        this.alpha = Math.max(0, this.life);
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.strokeStyle = SETTINGS.colors.rocketExplosion;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
        ctx.fill();
        ctx.restore();
    }
}
