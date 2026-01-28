import { SETTINGS } from '../core/Settings.js';
import { FieldObject } from './FieldObject.js';

export class Obstacle extends FieldObject {
    constructor(x, y, size) {
        super(x, y, size, size, "Obstacle");
        this.isSolid = true;
    }

    draw(ctx) {
        ctx.save();

        if (this.isDragging) ctx.globalAlpha = 0.5;

        ctx.fillStyle = SETTINGS.colors.obstacle;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.strokeStyle = SETTINGS.colors.obstacleBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // 對角線裝飾
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.moveTo(this.x + this.width, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.stroke();

        if (this.isDragging) {
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.fillText(this.id, this.x + 2, this.y + 10);
        }

        if (this.isDragging && !this.isValidPlacement) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }

        ctx.restore();
    }
}
