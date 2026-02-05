import { generateId } from '../core/Utils.js';
import { gameState } from '../core/GameState.js';
import { FloatingText } from '../effects/FloatingText.js';

// 場景物件基類
export class FieldObject {
    constructor(x, y, w, h, typeName) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.type = typeName;
        this.id = generateId(typeName);

        this.collisionLayer = 0;
        this.damage = 0;
        this.isDragging = false;
        this.isValidPlacement = true;
    }

    update(dt) {}

    draw(ctx) {
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    contains(px, py) {
        return px >= this.x && px <= this.x + this.width &&
               py >= this.y && py <= this.y + this.height;
    }

    overlaps(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }

    setPosition(nx, ny) {
        const clampedX = Math.max(0, Math.min(gameState.world.width - this.width, nx));
        const clampedY = Math.max(0, Math.min(gameState.world.height - this.height, ny));
        this.x = clampedX;
        this.y = clampedY;
    }

    takeDamage(amount, hitX, hitY) {
        // 若有碰撞點則用碰撞點，否則 fallback 到中心
        const tx = hitX ?? (this.x + this.width / 2);
        const ty = hitY ?? (this.y + this.height / 2);
        gameState.floatingTexts.push(
            new FloatingText(tx, ty, `-${amount}`, {
                color: '#ffaa00',
                offsetY: 20,
                spreadX: 10
            })
        );
    }
}
