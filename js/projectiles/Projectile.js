// 彈射物基類
export class Projectile {
    constructor(x, y, angle, speed, lifetime) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.lifetime = lifetime;
        this.isDead = false;
        this.collisionMask = new Set([0]);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.lifetime -= dt;
        if (this.lifetime <= 0) this.isDead = true;
    }

    draw(ctx) {}
}
