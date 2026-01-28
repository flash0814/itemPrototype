export class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1.0;
        this.speedY = 50;
    }

    update(dt) {
        this.y -= this.speedY * dt;
        this.life -= dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}
