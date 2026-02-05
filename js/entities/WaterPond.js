import { FieldObject } from './FieldObject.js';

export class WaterPond extends FieldObject {
    constructor(x, y) {
        super(x, y, 100, 100, "WaterPond");
        this.collisionLayer = 2;  // 地形障礙：擋玩家，投射物穿越

        // 波紋系統
        this.ripples = [];
        this.rippleTimer = 0;
        this.rippleInterval = 0.6;

        // 水面光斑
        this.caustics = [];
        for (let i = 0; i < 12; i++) {
            this.caustics.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: 8 + Math.random() * 16,
                phase: Math.random() * Math.PI * 2,
                speed: 0.8 + Math.random() * 1.2
            });
        }

        // 水流線
        this.flowLines = [];
        for (let i = 0; i < 6; i++) {
            this.flowLines.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                length: 15 + Math.random() * 25,
                speed: 10 + Math.random() * 15,
                phase: Math.random() * Math.PI * 2
            });
        }

        this.time = 0;
    }

    update(dt) {
        this.time += dt;

        // 生成新波紋
        this.rippleTimer += dt;
        if (this.rippleTimer >= this.rippleInterval) {
            this.rippleTimer = 0;
            this.ripples.push({
                x: 10 + Math.random() * (this.width - 20),
                y: 10 + Math.random() * (this.height - 20),
                radius: 0,
                maxRadius: 20 + Math.random() * 25,
                life: 1.0
            });
        }

        // 更新波紋
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const r = this.ripples[i];
            r.life -= dt * 0.8;
            r.radius += dt * 30;
            if (r.life <= 0) {
                this.ripples.splice(i, 1);
            }
        }

        // 水流線緩慢移動
        this.flowLines.forEach(f => {
            f.y += f.speed * dt;
            if (f.y > this.height + 10) {
                f.y = -10;
                f.x = Math.random() * this.width;
            }
        });
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.isDragging) ctx.globalAlpha = 0.5;

        // 水底（深藍）
        ctx.fillStyle = 'rgba(20, 80, 140, 0.7)';
        ctx.fillRect(0, 0, this.width, this.height);

        // 水面光斑（caustics）
        this.caustics.forEach(c => {
            const pulse = Math.sin(this.time * c.speed + c.phase);
            const alpha = 0.08 + pulse * 0.06;
            const size = c.size + pulse * 4;

            ctx.fillStyle = `rgba(120, 210, 255, ${alpha})`;
            ctx.beginPath();
            ctx.ellipse(c.x, c.y, size, size * 0.6, this.time * 0.3 + c.phase, 0, Math.PI * 2);
            ctx.fill();
        });

        // 水流線
        ctx.globalCompositeOperation = 'screen';
        this.flowLines.forEach(f => {
            const wave = Math.sin(this.time * 2 + f.phase) * 3;
            const alpha = 0.15;
            ctx.strokeStyle = `rgba(180, 230, 255, ${alpha})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(f.x + wave, f.y);
            ctx.quadraticCurveTo(
                f.x + wave * 2, f.y + f.length * 0.5,
                f.x - wave, f.y + f.length
            );
            ctx.stroke();
        });

        // 波紋（同心圓）
        this.ripples.forEach(r => {
            const alpha = r.life * 0.35;
            ctx.strokeStyle = `rgba(200, 240, 255, ${alpha})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            ctx.stroke();

            // 內圈
            if (r.radius > 5) {
                ctx.strokeStyle = `rgba(200, 240, 255, ${alpha * 0.5})`;
                ctx.beginPath();
                ctx.arc(r.x, r.y, r.radius * 0.5, 0, Math.PI * 2);
                ctx.stroke();
            }
        });

        ctx.globalCompositeOperation = 'source-over';

        // 邊框（水藍色）
        ctx.strokeStyle = 'rgba(80, 180, 220, 0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, this.width, this.height);

        // 拖曳標籤
        if (this.isDragging) {
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.fillText(this.id, 2, 10);
        }

        if (this.isDragging && !this.isValidPlacement) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.strokeStyle = 'red';
            ctx.strokeRect(0, 0, this.width, this.height);
        }

        ctx.restore();
    }
}
