/**
 * InventoryUI3D.js - 道具欄 UI
 *
 * 螢幕底部的持有道具顯示（HTML Overlay）
 */

export class InventoryUI3D {
    constructor() {
        this.currentItem = null;
        this.animTimer = 0;
        this.animState = 'idle';  // 'idle', 'in', 'out'

        this.createDOM();
    }

    createDOM() {
        // 容器
        this.container = document.createElement('div');
        this.container.id = 'inventory-ui';
        this.container.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 70px;
            height: 70px;
            border: 3px solid #333;
            border-radius: 10px;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            z-index: 100;
            transition: transform 0.2s ease-out, opacity 0.2s;
        `;

        // 道具圖示
        this.icon = document.createElement('div');
        this.icon.style.cssText = `
            width: 50px;
            height: 50px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            font-weight: bold;
            color: white;
            text-shadow: 2px 2px 2px #000;
            transition: transform 0.3s ease-out;
        `;

        // 提示文字
        this.hint = document.createElement('div');
        this.hint.style.cssText = `
            position: absolute;
            bottom: -25px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 12px;
            color: #aaa;
            white-space: nowrap;
        `;
        this.hint.textContent = 'F: Aim';

        this.container.appendChild(this.icon);
        this.container.appendChild(this.hint);
        document.body.appendChild(this.container);

        this.setEmpty();
    }

    /**
     * 更新道具顯示
     */
    setItem(item) {
        if (!item) {
            this.setEmpty();
            return;
        }

        this.currentItem = item;
        const name = item.constructor.name.replace('3D', '');

        // 根據道具類型設定圖示和顏色
        let emoji = '📦';
        let bgColor = '#666';

        switch (name) {
            case 'HealBox':
                emoji = '💚';
                bgColor = '#66bb6a';
                break;
            case 'MeteorStrike':
                emoji = '☄️';
                bgColor = '#ef5350';
                break;
            case 'Bomb':
                emoji = '💣';
                bgColor = '#7e57c2';
                break;
        }

        this.icon.textContent = emoji;
        this.icon.style.background = bgColor;
        this.hint.style.display = 'block';

        // 進入動畫
        this.playInAnim();
    }

    setEmpty() {
        this.currentItem = null;
        this.icon.textContent = '';
        this.icon.style.background = 'rgba(50, 50, 50, 0.5)';
        this.hint.style.display = 'none';
    }

    playInAnim() {
        this.container.style.transform = 'translateX(-50%) scale(0.5)';
        this.container.style.opacity = '0.5';

        requestAnimationFrame(() => {
            this.container.style.transform = 'translateX(-50%) scale(1.1)';
            this.container.style.opacity = '1';

            setTimeout(() => {
                this.container.style.transform = 'translateX(-50%) scale(1)';
            }, 150);
        });
    }

    playOutAnim() {
        this.container.style.transform = 'translateX(-50%) scale(1.2)';
        this.container.style.opacity = '0';

        setTimeout(() => {
            this.setEmpty();
            this.container.style.transform = 'translateX(-50%) scale(1)';
            this.container.style.opacity = '1';
        }, 200);
    }

    /**
     * 丟出道具時呼叫
     */
    onThrow() {
        this.playOutAnim();
    }

    update(heldItem) {
        // 檢查道具變化
        if (heldItem !== this.currentItem) {
            if (heldItem) {
                this.setItem(heldItem);
            } else {
                this.setEmpty();
            }
        }
    }

    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}
