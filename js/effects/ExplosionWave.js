import { SETTINGS } from '../core/Settings.js';

export class ExplosionWave {
    constructor(x, y, maxRadius, strokeColor = null, fillColor = null) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.maxRadius = maxRadius;
        this.life = 1.0;
        this.alpha = 1.0;
        this.strokeColor = strokeColor || SETTINGS.colors.rocketExplosion;
        this.fillColor = fillColor || 'rgba(255, 200, 100, 0.3)';
    }

    update(dt) {
        this.radius += (this.maxRadius - this.radius) * 5 * dt;
        this.life -= dt * 2;
        this.alpha = Math.max(0, this.life);
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.strokeStyle = this.strokeColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = this.fillColor;
        ctx.fill();
        ctx.restore();
    }
}
