import { SETTINGS } from '../core/Settings.js';
import { ItemBase } from './ItemBase.js';
import { player } from '../entities/Player.js';

export class HealPack extends ItemBase {
    constructor(x, y) {
        super(x, y, SETTINGS.itemHealPack.duration);
        this.category = 'PASSIVE';
        this.healValue = SETTINGS.itemHealPack.value;
        this.size = 16;
    }

    update(dt) {
        super.update(dt);

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
        this.spawnHealFX(this.healValue);
        this.isDead = true;
    }

    draw(ctx) {
        this.drawShadow(ctx);

        const drawY = this.y - this.z;
        const perspectiveScale = 1 + (this.z / 400);

        ctx.save();
        ctx.translate(this.x, drawY);
        ctx.scale(perspectiveScale, perspectiveScale);

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

        this.drawDurationBar(ctx, -16);
        ctx.restore();
    }
}
