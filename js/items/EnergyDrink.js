import { SETTINGS } from '../core/Settings.js';
import { gameState } from '../core/GameState.js';
import { ItemBase } from './ItemBase.js';
import { player, restoreEnergy } from '../entities/Player.js';
import { Particle } from '../effects/Particle.js';

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

        // 徐徐增加（HoT 效果）— 存在 player 身上作為 buff
        if (cfg.totalTicks > 0 && cfg.perTickPlus > 0) {
            gameState.energyDrinkBuffs = gameState.energyDrinkBuffs || [];
            gameState.energyDrinkBuffs.push({
                ticksRemaining: cfg.totalTicks,
                perTickPlus: cfg.perTickPlus,
                tickRate: cfg.tickRate,
                timer: cfg.waitToFirstTick
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
        ctx.scale(perspectiveScale, perspectiveScale);

        this.drawIcon(ctx);
        this.drawDurationBar(ctx, -16);
        ctx.restore();
    }
}
