import { SETTINGS } from '../core/Settings.js';
import { gameState } from '../core/GameState.js';
import { ItemBase } from './ItemBase.js';
import { player } from '../entities/Player.js';
import { FloatingText } from '../effects/FloatingText.js';
import { buffManager, BUFF_TYPE, BUFF_ICON } from '../core/BuffManager.js';

export class InvincibleStar extends ItemBase {
    constructor(x, y) {
        super(x, y, SETTINGS.itemInvincibleStar.duration);
        this.category = 'PASSIVE';
        this.maxAimRadius = SETTINGS.itemInvincibleStar.maxAimRadius;
        this.effectDuration = SETTINGS.itemInvincibleStar.effectDuration;
        this.defendRatio = SETTINGS.itemInvincibleStar.defendRatio;
        this.size = 16;
        this.rot = 0;
    }

    onPassiveEffect() {
        buffManager.addBuff({
            id: 'invincible',
            type: BUFF_TYPE.INVINCIBLE,
            duration: this.effectDuration,
            showIcon: true,
            iconType: BUFF_ICON.SHIELD,
            iconColor: SETTINGS.colors.buffBorder,
            defendRatio: this.defendRatio
        });

        gameState.floatingTexts.push(
            new FloatingText(player.x, player.y, "INVINCIBLE!", {
                color: '#ffd700',
                offsetY: 30,
                scale: 1.2,
                fadeStyle: 'late'
            })
        );
    }

    update(dt) {
        super.update(dt);
        if (this.isHeld) return;
        this.rot += dt * 2;
        // pickup 檢測已移至 Game.js
    }

    drawIcon(ctx) {
        const boxSize = 18;
        ctx.fillStyle = 'rgba(20, 20, 20, 0.8)';
        ctx.fillRect(-boxSize / 2, -boxSize / 2, boxSize, boxSize);
        ctx.strokeStyle = SETTINGS.colors.star;
        ctx.lineWidth = 1;
        ctx.strokeRect(-boxSize / 2, -boxSize / 2, boxSize, boxSize);

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
    }

    draw(ctx) {
        if (this.isHeld) return;

        this.drawShadow(ctx);

        const drawY = this.y - this.z;
        const perspectiveScale = 1 + (this.z / 400);

        ctx.save();
        ctx.translate(this.x, drawY);
        ctx.scale(perspectiveScale * 1.5, perspectiveScale * 1.5);

        ctx.save();
        ctx.rotate(this.rot);
        this.drawIcon(ctx);
        ctx.restore();

        this.drawDurationBar(ctx, -16);
        ctx.restore();
    }
}
