export class Particle {
    constructor(x, y, type = 'heal') {
        this.x = x + (Math.random() - 0.5) * 20;
        this.y = y + (Math.random() - 0.5) * 20;
        this.type = type;
        this.life = 0.5 + Math.random() * 0.5;

        if (type === 'smoke') {
            this.vx = (Math.random() - 0.5) * 20;
            this.vy = (Math.random() - 0.5) * 20;
            this.size = 3 + Math.random() * 3;
            this.color = '#aaaaaa';
            this.life = 0.4;
        } else if (type === 'explosion') {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.size = 4 + Math.random() * 4;
            this.color = '#ffaa00';
        } else if (type === 'damage') {
            this.vx = (Math.random() - 0.5) * 20;
            this.vy = -30 - Math.random() * 50;
            this.size = 4 + Math.random() * 4;
            this.color = '#ff4400';
        } else {
            // heal
            this.vx = (Math.random() - 0.5) * 20;
            this.vy = -60 - Math.random() * 60;
            this.size = 3 + Math.random() * 2;
            this.color = '#00ff00';
        }
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;

        if (this.type === 'damage' || this.type === 'smoke') {
            this.size += dt * 2;
        }
        if (this.type === 'explosion') {
            this.vx *= 0.9;
            this.vy *= 0.9;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;

        if (this.type === 'heal') {
            const s = this.size;
            const thick = s / 3;
            ctx.translate(this.x, this.y);
            ctx.fillRect(-s, -thick / 2, s * 2, thick);
            ctx.fillRect(-thick / 2, -s, thick, s * 2);
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}
