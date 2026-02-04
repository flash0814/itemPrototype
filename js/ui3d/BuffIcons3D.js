/**
 * BuffIcons3D.js - 3D Buff 圖示
 *
 * 顯示在玩家頭上的 buff 狀態圖示
 * 使用 Canvas texture 繪製 2D 風格的 icon + 進度外框
 * 移植自 2D 版本的 Renderer.drawBuffIcons
 */

import * as THREE from 'three';
import { buffManager3D, BUFF_ICON_3D } from '../core3d/BuffManager3D.js';

export class BuffIcons3D {
    constructor(scene) {
        this.scene = scene;

        // 配置
        this.iconSize = 32;       // Canvas 上的 icon 大小
        this.worldScale = 0.02;   // 3D 世界中的縮放
        this.spacing = 0.3;       // 圖示間距
        this.offsetY = 1.5;       // HP 上方（HP top = 1.372）

        // 圖示容器
        this.group = new THREE.Group();
        this.sprites = [];        // { sprite, canvas, ctx, texture }

        this.scene.add(this.group);
    }

    /**
     * 繪製單個 buff icon 到 canvas
     */
    drawIcon(ctx, size, progress, color, iconType) {
        const halfSize = size / 2;

        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.translate(halfSize, halfSize);

        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(-halfSize, -halfSize, size, size);

        // 繪製 icon 形狀
        ctx.fillStyle = color;
        this.drawIconShape(ctx, iconType, size * 0.7);

        // 繪製進度外框（從頂部中央逆時針）
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'butt';
        this.drawProgressBorder(ctx, size, progress);

        ctx.restore();
    }

    /**
     * 繪製 icon 形狀
     */
    drawIconShape(ctx, iconType, size) {
        const s = size / 2;

        switch (iconType) {
            case BUFF_ICON_3D.SHIELD:
                // 盾牌形狀
                ctx.beginPath();
                ctx.moveTo(0, s * 0.7);
                ctx.lineTo(s * 0.7, 0);
                ctx.lineTo(s * 0.7, -s * 0.35);
                ctx.lineTo(0, -s * 0.7);
                ctx.lineTo(-s * 0.7, -s * 0.35);
                ctx.lineTo(-s * 0.7, 0);
                ctx.closePath();
                ctx.fill();
                break;

            case BUFF_ICON_3D.ENERGY:
                // 閃電形狀
                const scale = size / 18;
                ctx.beginPath();
                ctx.moveTo(-2 * scale, -7 * scale);
                ctx.lineTo(3 * scale, -7 * scale);
                ctx.lineTo(0, -1 * scale);
                ctx.lineTo(4 * scale, -1 * scale);
                ctx.lineTo(-2 * scale, 7 * scale);
                ctx.lineTo(0, 1 * scale);
                ctx.lineTo(-4 * scale, 1 * scale);
                ctx.closePath();
                ctx.fill();
                break;

            case BUFF_ICON_3D.REVIVE:
                // 菱形
                ctx.beginPath();
                ctx.moveTo(0, -s * 0.5);
                ctx.lineTo(s * 0.35, 0);
                ctx.lineTo(0, s * 0.5);
                ctx.lineTo(-s * 0.35, 0);
                ctx.closePath();
                ctx.fill();
                break;

            case BUFF_ICON_3D.FEATHER:
                // 羽毛形狀
                const fs = s * 0.6;
                ctx.beginPath();
                ctx.moveTo(0, -fs);
                ctx.quadraticCurveTo(fs * 0.6, -fs * 0.3, fs * 0.3, fs * 0.8);
                ctx.lineTo(0, fs);
                ctx.lineTo(-fs * 0.1, fs * 0.6);
                ctx.quadraticCurveTo(-fs * 0.3, 0, 0, -fs);
                ctx.closePath();
                ctx.fill();
                // 羽毛中軸線
                ctx.strokeStyle = ctx.fillStyle;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, -fs * 0.8);
                ctx.quadraticCurveTo(fs * 0.2, 0, 0, fs * 0.8);
                ctx.stroke();
                break;

            default:
                // 預設圓形
                ctx.beginPath();
                ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
                ctx.fill();
        }
    }

    /**
     * 繪製進度外框（從頂部中央逆時針減少）
     */
    drawProgressBorder(ctx, size, progress) {
        if (progress <= 0) return;

        const w = size - 4;  // 留邊距
        const h = size - 4;
        const halfW = w / 2;
        const halfH = h / 2;

        // 總周長 = w + w + h + h = 2w + 2h
        const perimeter = 2 * w + 2 * h;
        const drawLength = perimeter * progress;

        ctx.beginPath();
        ctx.moveTo(0, -halfH);  // 頂部中央

        let remaining = drawLength;

        // Segment 1: 頂部中央 → 左上（向左）
        const seg1 = halfW;
        if (remaining > 0) {
            const draw = Math.min(remaining, seg1);
            ctx.lineTo(-draw, -halfH);
            remaining -= draw;
        }

        // Segment 2: 左上 → 左下（向下）
        const seg2 = h;
        if (remaining > 0) {
            const draw = Math.min(remaining, seg2);
            ctx.lineTo(-halfW, -halfH + draw);
            remaining -= draw;
        }

        // Segment 3: 左下 → 右下（向右）
        const seg3 = w;
        if (remaining > 0) {
            const draw = Math.min(remaining, seg3);
            ctx.lineTo(-halfW + draw, halfH);
            remaining -= draw;
        }

        // Segment 4: 右下 → 右上（向上）
        const seg4 = h;
        if (remaining > 0) {
            const draw = Math.min(remaining, seg4);
            ctx.lineTo(halfW, halfH - draw);
            remaining -= draw;
        }

        // Segment 5: 右上 → 頂部中央（向左回到起點）
        const seg5 = halfW;
        if (remaining > 0) {
            const draw = Math.min(remaining, seg5);
            ctx.lineTo(halfW - draw, -halfH);
            remaining -= draw;
        }

        ctx.stroke();
    }

    /**
     * 確保有足夠的 sprite
     */
    ensureSprites(count) {
        // 移除多餘的
        while (this.sprites.length > count) {
            const item = this.sprites.pop();
            this.group.remove(item.sprite);
            item.texture.dispose();
            item.sprite.material.dispose();
        }

        // 新增不足的
        while (this.sprites.length < count) {
            const canvas = document.createElement('canvas');
            canvas.width = this.iconSize;
            canvas.height = this.iconSize;
            const ctx = canvas.getContext('2d');

            const texture = new THREE.CanvasTexture(canvas);
            texture.minFilter = THREE.LinearFilter;

            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true
            });

            const sprite = new THREE.Sprite(material);
            sprite.scale.set(this.iconSize * this.worldScale, this.iconSize * this.worldScale, 1);

            this.group.add(sprite);
            this.sprites.push({ sprite, canvas, ctx, texture });
        }
    }

    /**
     * 更新
     */
    update(position, camera, dt) {
        // 取得可見 buff
        const visibleBuffs = buffManager3D.getVisibleBuffs();
        const count = visibleBuffs.length;

        // 確保有足夠的 sprite
        this.ensureSprites(count);

        if (count === 0) {
            this.group.visible = false;
            return;
        }

        this.group.visible = true;

        // 位置
        this.group.position.set(position.x, position.y + this.offsetY, position.z);

        // Billboard（面向攝影機）
        this.group.quaternion.copy(camera.quaternion);

        // 排列圖示（置中，新的在右邊）
        const totalWidth = count * this.spacing;
        let x = -totalWidth / 2 + this.spacing / 2;

        const now = Date.now();

        visibleBuffs.forEach((buff, i) => {
            const item = this.sprites[i];
            const progress = 1 - (buff.elapsed / buff.duration);

            // 閃爍效果（progress <= 0.4 時）
            let alpha = 1;
            if (progress <= 0.4) {
                const blink = Math.sin(now / 1000 * 12.56);
                alpha = 0.3 + 0.7 * ((blink + 1) / 2);
            }

            // 繪製 icon
            this.drawIcon(item.ctx, this.iconSize, progress, buff.iconColor, buff.iconType);
            item.texture.needsUpdate = true;

            // 設定透明度
            item.sprite.material.opacity = alpha;

            // 位置
            item.sprite.position.x = x;
            x += this.spacing;
        });
    }

    /**
     * 設定可見性
     */
    setVisible(visible) {
        this.group.visible = visible;
    }

    /**
     * 銷毀
     */
    destroy() {
        this.sprites.forEach(item => {
            this.group.remove(item.sprite);
            item.texture.dispose();
            item.sprite.material.dispose();
        });
        this.sprites = [];
        this.scene.remove(this.group);
    }
}
