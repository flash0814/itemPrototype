import { SETTINGS } from '../core/Settings.js';

export class FloatingText {
    /**
     * @param {number} x - 世界座標 X
     * @param {number} y - 世界座標 Y
     * @param {string} text - 顯示文字
     * @param {object} opts - per-attack 參數（缺少的 fallback 到 SETTINGS.floatingText）
     *   color, offsetY, scale, spreadX, life, speedY, font, fadeStyle
     */
    constructor(x, y, text, opts = {}) {
        const defaults = SETTINGS.floatingText;

        this.text = text;
        this.color = opts.color || '#fff';
        this.life = opts.life ?? defaults.life;
        this.maxLife = this.life;
        this.speedY = opts.speedY ?? defaults.speedY;
        this.font = opts.font ?? defaults.font;
        this.fadeStyle = opts.fadeStyle ?? defaults.fadeStyle;
        this.scale = opts.scale ?? defaults.scale;

        const spread = opts.spreadX ?? defaults.spreadX;
        this.x = x + (spread ? (Math.random() - 0.5) * spread : 0);
        this.y = y - (opts.offsetY ?? 0);
    }

    update(dt) {
        this.y -= this.speedY * dt;
        this.life -= dt;
    }

    draw(ctx) {
        if (this.life <= 0) return;

        let alpha;
        const t = this.life / this.maxLife; // 1→0
        if (this.fadeStyle === 'late') {
            // 前 60% 不透明，後 40% 快速淡出
            alpha = t > 0.4 ? 1.0 : t / 0.4;
        } else {
            alpha = t;
        }

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;

        if (this.scale !== 1) {
            ctx.translate(this.x, this.y);
            ctx.scale(this.scale, this.scale);
            ctx.font = this.font;
            ctx.textAlign = 'center';
            ctx.fillText(this.text, 0, 0);
        } else {
            ctx.font = this.font;
            ctx.textAlign = 'center';
            ctx.fillText(this.text, this.x, this.y);
        }

        ctx.restore();
    }
}
