import { SETTINGS } from '../core/Settings.js';
import { FieldObject } from './FieldObject.js';
import { player, takeDamage } from './Player.js';

export class FireTrap extends FieldObject {
    constructor(x, y) {
        super(x, y, 100, 100, "FireTrap");
        this.collisionLayer = 1;  // 環境危害：不擋玩家，可選擋投射物
        this.damage = SETTINGS.general.fireTrapDmg;
        this.tickTimer = 0;
        this.flames = [];

        for (let i = 0; i < 15; i++) {
            this.flames.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: 5 + Math.random() * 15,
                speed: 20 + Math.random() * 40,
                offset: Math.random() * Math.PI * 2
            });
        }
    }

    update(dt) {
        this.damage = SETTINGS.general.fireTrapDmg;

        // 更新火焰動畫
        this.flames.forEach(f => {
            f.y -= f.speed * dt;
            f.size -= dt * 5;
            if (f.y < 0 || f.size <= 0) {
                f.y = this.height;
                f.x = Math.random() * this.width;
                f.size = 10 + Math.random() * 20;
            }
        });

        if (this.isDragging) return;

        // 檢測玩家碰撞
        const closestX = Math.max(this.x, Math.min(player.x, this.x + this.width));
        const closestY = Math.max(this.y, Math.min(player.y, this.y + this.height));
        const dx = player.x - closestX;
        const dy = player.y - closestY;
        const distSq = dx * dx + dy * dy;

        if (distSq < (SETTINGS.playerSize * SETTINGS.playerSize)) {
            this.tickTimer += dt;
            if (this.tickTimer >= SETTINGS.general.fireTrapTick) {
                this.tickTimer = 0;
                takeDamage(this.damage);
            }
        } else {
            this.tickTimer = SETTINGS.general.fireTrapTick * 0.5;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.isDragging) ctx.globalAlpha = 0.5;

        ctx.fillStyle = SETTINGS.colors.fireTrap;
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.strokeStyle = '#ff4400';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, this.width, this.height);

        ctx.globalCompositeOperation = 'screen';

        this.flames.forEach(f => {
            const alpha = Math.min(1, f.size / 15);
            ctx.fillStyle = `rgba(255, ${Math.floor(Math.random() * 150)}, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
            ctx.fill();
        });

        if (this.isDragging) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.fillText(this.id, 2, 10);
        }

        if (this.isDragging && !this.isValidPlacement) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.strokeStyle = 'red';
            ctx.strokeRect(0, 0, this.width, this.height);
        }

        ctx.restore();
    }
}
