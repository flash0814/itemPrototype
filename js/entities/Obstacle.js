import { SETTINGS } from '../core/Settings.js';
import { FieldObject } from './FieldObject.js';

export class Obstacle extends FieldObject {
    constructor(x, y, size) {
        super(x, y, size, size, "Obstacle");
        // collisionLayer = 0 (inherited) — 實體障礙
    }

    draw(ctx) {
        ctx.save();

        if (this.isDragging) ctx.globalAlpha = 0.5;

        const x = this.x;
        const y = this.y;
        const w = this.width;
        const h = this.height;

        // 底部陰影（深度感）
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(x + 3, y + 3, w, h);

        // 主體
        ctx.fillStyle = SETTINGS.colors.obstacle;
        ctx.fillRect(x, y, w, h);

        // 頂部/左側高光邊（光源感）
        ctx.fillStyle = SETTINGS.colors.obstacleHighlight;
        ctx.fillRect(x, y, w, 2);
        ctx.fillRect(x, y, 2, h);

        // 底部/右側暗邊
        ctx.fillStyle = SETTINGS.colors.obstacleShadowInner;
        ctx.fillRect(x, y + h - 2, w, 2);
        ctx.fillRect(x + w - 2, y, 2, h);

        // 表面紋理：細橫線
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const step = 12;
        for (let ly = y + step; ly < y + h; ly += step) {
            ctx.moveTo(x + 4, ly);
            ctx.lineTo(x + w - 4, ly);
        }
        ctx.stroke();

        // 外框
        ctx.strokeStyle = SETTINGS.colors.obstacleBorder;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

        if (this.isDragging) {
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.fillText(this.id, x + 2, y + 10);
        }

        if (this.isDragging && !this.isValidPlacement) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);
        }

        ctx.restore();
    }
}
