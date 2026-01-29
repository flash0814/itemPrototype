import { SETTINGS } from '../core/Settings.js';
import { ItemBase } from './ItemBase.js';

export class HealPack extends ItemBase {
    constructor(x, y) {
        super(x, y, SETTINGS.itemHealPack.duration);
        this.category = 'PASSIVE';
        this.maxAimRadius = SETTINGS.itemHealPack.maxAimRadius;
        this.healValue = SETTINGS.itemHealPack.value;
        this.size = 16;
    }

    onPassiveEffect() {
        this.spawnHealFX(this.healValue);
    }

    update(dt) {
        super.update(dt);
        // pickup 檢測已移至 Game.js
    }

    drawIcon(ctx) {
        ctx.fillStyle = SETTINGS.colors.healPackBase;
        const baseSize = 18;
        ctx.fillRect(-baseSize / 2, -baseSize / 2, baseSize, baseSize);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-baseSize / 2, -baseSize / 2, baseSize, baseSize);
        ctx.fillStyle = SETTINGS.colors.healPack;
        const crossThick = 6;
        const crossLen = 14;
        ctx.fillRect(-crossLen / 2, -crossThick / 2, crossLen, crossThick);
        ctx.fillRect(-crossThick / 2, -crossLen / 2, crossThick, crossLen);
    }

    draw(ctx) {
        if (this.isHeld) return;

        this.drawShadow(ctx);

        const drawY = this.y - this.z;
        const perspectiveScale = 1 + (this.z / 400);

        ctx.save();
        ctx.translate(this.x, drawY);
        ctx.scale(perspectiveScale, perspectiveScale);

        this.drawIcon(ctx);
        this.drawDurationBar(ctx, -16);
        ctx.restore();
    }
}
