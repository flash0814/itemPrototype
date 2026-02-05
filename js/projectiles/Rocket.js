import { SETTINGS } from '../core/Settings.js';
import { gameState } from '../core/GameState.js';
import { Projectile } from './Projectile.js';
import { Particle } from '../effects/Particle.js';
import { ExplosionWave } from '../effects/ExplosionWave.js';

export class Rocket extends Projectile {
    constructor(x, y, angle) {
        super(x, y, angle, SETTINGS.attackRocket.speed, SETTINGS.attackRocket.lifetime);
        this.width = 20;
        this.height = 10;
        this.trailTimer = 0;
    }

    update(dt) {
        super.update(dt);

        this.trailTimer += dt;
        if (this.trailTimer > 0.02) {
            this.trailTimer = 0;
            const backX = this.x - Math.cos(this.angle) * 10;
            const backY = this.y - Math.sin(this.angle) * 10;
            gameState.particles.push(new Particle(backX, backY, 'smoke'));
        }

        const tipX = this.x + Math.cos(this.angle) * (this.width / 2);
        const tipY = this.y + Math.sin(this.angle) * (this.width / 2);

        for (let obj of gameState.fieldObjects) {
            if (this.collisionMask.has(obj.collisionLayer) && obj.contains(tipX, tipY)) {
                this.explode();
                return;
            }
        }
    }

    explode() {
        this.isDead = true;
        const radius = SETTINGS.attackRocket.radius;
        const damage = SETTINGS.attackRocket.damage;

        for (let i = 0; i < 15; i++) {
            gameState.particles.push(new Particle(this.x, this.y, 'explosion'));
        }
        gameState.particles.push(new ExplosionWave(this.x, this.y, radius * 1.2));

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
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.fillStyle = SETTINGS.colors.rocket;
        ctx.beginPath();
        ctx.moveTo(this.width / 2, 0);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.lineTo(-this.width / 2 + 4, 0);
        ctx.lineTo(-this.width / 2, -this.height / 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.fillRect(-2, -2, 4, 4);

        ctx.restore();
    }
}
