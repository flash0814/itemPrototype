import { SETTINGS } from '../core/Settings.js';
import { ItemBase } from './ItemBase.js';
import { restoreEnergy } from '../entities/Player.js';
import { buffManager, BUFF_TYPE, BUFF_ICON } from '../core/BuffManager.js';

export class EnergyDrink extends ItemBase {
    constructor(x, y) {
        super(x, y, SETTINGS.itemEnergyDrink.duration);
        this.category = 'PASSIVE';
        this.maxAimRadius = 0;
        this.size = 16;
    }

    onPassiveEffect() {
        const cfg = SETTINGS.itemEnergyDrink;

        // 瞬間增加
        if (cfg.instantPlus > 0) {
            restoreEnergy(cfg.instantPlus);
        }

        // Energy 不扣減 buff
        if (cfg.effectDuration > 0) {
            buffManager.addOrRefreshBuff({
                type: BUFF_TYPE.ENERGY_HOT,
                duration: cfg.effectDuration,
                showIcon: true,
                iconType: BUFF_ICON.ENERGY,
                iconColor: SETTINGS.colors.energyDrink
            });
        }
    }

    drawIcon(ctx) {
        const boxSize = 18;
        // 黃色底
        ctx.fillStyle = SETTINGS.colors.energyDrink;
        ctx.fillRect(-boxSize / 2, -boxSize / 2, boxSize, boxSize);

        // 白色閃電符號
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(-2, -7);
        ctx.lineTo(3, -7);
        ctx.lineTo(0, -1);
        ctx.lineTo(4, -1);
        ctx.lineTo(-2, 7);
        ctx.lineTo(0, 1);
        ctx.lineTo(-4, 1);
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

        this.drawIcon(ctx);
        this.drawDurationBar(ctx, -16);
        ctx.restore();
    }
}
