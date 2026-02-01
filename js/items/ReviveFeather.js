import { SETTINGS } from '../core/Settings.js';
import { gameState } from '../core/GameState.js';
import { ItemBase } from './ItemBase.js';
import { player } from '../entities/Player.js';
import { FloatingText } from '../effects/FloatingText.js';
import { buffManager, BUFF_TYPE, BUFF_ICON } from '../core/BuffManager.js';

export class ReviveFeather extends ItemBase {
    constructor(x, y) {
        super(x, y, SETTINGS.itemReviveFeather.duration);
        this.category = 'PASSIVE';
        this.maxAimRadius = 0;
        this.size = 16;
    }

    onPassiveEffect() {
        // 羽毛 buff 一次只能存在 1 個
        if (buffManager.hasBuff(BUFF_TYPE.REVIVE_FEATHER)) {
            // 已有羽毛 buff，不疊加
            return;
        }

        // 添加永久 buff（duration 設為很大的值，死亡時消耗）
        buffManager.addBuff({
            id: 'reviveFeather',
            type: BUFF_TYPE.REVIVE_FEATHER,
            duration: 999999,  // 永久存在直到死亡消耗
            showIcon: true,
            iconType: BUFF_ICON.FEATHER,
            iconColor: '#ffffff'
        });

        gameState.floatingTexts.push(
            new FloatingText(player.x, player.y, "REVIVE READY!", {
                color: '#ffffff',
                offsetY: 30,
                scale: 1.1,
                fadeStyle: 'late'
            })
        );
    }

    drawIcon(ctx) {
        const boxSize = 18;
        // 白色底
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-boxSize / 2, -boxSize / 2, boxSize, boxSize);

        // 黑色羽毛
        ctx.fillStyle = '#000000';
        const s = 6;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(s * 0.6, -s * 0.3, s * 0.3, s * 0.8);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.1, s * 0.6);
        ctx.quadraticCurveTo(-s * 0.3, 0, 0, -s);
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
