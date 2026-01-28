import { SETTINGS } from '../core/Settings.js';
import { gameState } from '../core/GameState.js';
import { ItemBase } from './ItemBase.js';
import { player } from '../entities/Player.js';
import { FloatingText } from '../effects/FloatingText.js';

export class InvincibleStar extends ItemBase {
    constructor(x, y) {
        super(x, y, SETTINGS.itemInvincibleStar.duration);
        this.category = 'PASSIVE';
        this.effectDuration = SETTINGS.itemInvincibleStar.effectDuration;
        this.defendRatio = SETTINGS.itemInvincibleStar.defendRatio;
        this.size = 16;
        this.rot = 0;
    }

    update(dt) {
        super.update(dt);
        this.rot += dt * 2;

        if (this.z < 50 && !this.isDead) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distSq = dx * dx + dy * dy;
            const collisionDist = SETTINGS.playerSize + this.size;

            if (distSq < collisionDist * collisionDist) {
                this.pickedUp();
            }
        }
    }

    pickedUp() {
        player.invincibleTimer = this.effectDuration;
        player.maxInvincibleTimer = this.effectDuration;
        player.defendRatio = this.defendRatio;
        gameState.floatingTexts.push(
            new FloatingText(player.x, player.y - 30, "INVINCIBLE!", '#ffd700')
        );
        this.isDead = true;
    }

    draw(ctx) {
        this.drawShadow(ctx);

        const drawY = this.y - this.z;
        const perspectiveScale = 1 + (this.z / 400);

        ctx.save();
        ctx.translate(this.x, drawY);
        ctx.scale(perspectiveScale, perspectiveScale);

        const boxSize = 18;
        ctx.fillStyle = 'rgba(20, 20, 20, 0.8)';
        ctx.fillRect(-boxSize / 2, -boxSize / 2, boxSize, boxSize);

        ctx.strokeStyle = SETTINGS.colors.star;
        ctx.lineWidth = 1;
        ctx.strokeRect(-boxSize / 2, -boxSize / 2, boxSize, boxSize);

        ctx.save();
        ctx.rotate(this.rot);
        ctx.fillStyle = SETTINGS.colors.star;
        ctx.shadowBlur = 8;
        ctx.shadowColor = SETTINGS.colors.starGlow;

        ctx.beginPath();
        const spikes = 5;
        const outerRadius = 7;
        const innerRadius = 3;
        for (let i = 0; i < spikes * 2; i++) {
            const r = (i % 2 === 0) ? outerRadius : innerRadius;
            const a = (Math.PI / spikes) * i;
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        this.drawDurationBar(ctx, -16);
        ctx.restore();
    }
}
