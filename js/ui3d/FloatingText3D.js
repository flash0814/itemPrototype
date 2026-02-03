/**
 * FloatingText3D.js - 浮動文字
 *
 * 顯示傷害數字、治療數字等（Overcooked 風格 bounce 動畫）
 */

import * as THREE from 'three';

export class FloatingText3D {
    constructor(scene, text, position, config = {}) {
        this.scene = scene;

        // 配置
        this.text = text;
        this.color = config.color || 0xffffff;
        this.size = config.size || 0.3;
        this.duration = config.duration || 1.0;

        // 狀態
        this.position = position.clone();
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            1.5 + Math.random() * 0.5,
            (Math.random() - 0.5) * 0.5
        );
        this.life = this.duration;
        this.isDead = false;

        // 動畫
        this.bounceTime = 0;
        this.scale = 0;  // 從 0 放大（pop in）

        this.createMesh();
    }

    createMesh() {
        // 使用 Canvas 繪製文字，然後作為貼圖
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 設定 canvas 大小
        canvas.width = 128;
        canvas.height = 64;

        // 繪製文字
        ctx.fillStyle = 'transparent';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 描邊
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText(this.text, canvas.width / 2, canvas.height / 2);

        // 填充
        const colorHex = '#' + this.color.toString(16).padStart(6, '0');
        ctx.fillStyle = colorHex;
        ctx.fillText(this.text, canvas.width / 2, canvas.height / 2);

        // 建立貼圖
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        // 建立 sprite
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 1
        });

        this.sprite = new THREE.Sprite(material);
        this.sprite.scale.set(this.size * 2, this.size, 1);
        this.sprite.position.copy(this.position);

        this.scene.add(this.sprite);
    }

    update(dt) {
        if (this.isDead) return;

        // 移動
        this.velocity.y -= 3 * dt;  // 輕微重力
        this.position.add(this.velocity.clone().multiplyScalar(dt));

        // 生命倒數
        this.life -= dt;
        const progress = 1 - this.life / this.duration;

        // Pop in 動畫（彈跳）
        this.bounceTime += dt;
        if (progress < 0.2) {
            // 彈入
            const t = progress / 0.2;
            this.scale = this.easeOutBack(t);
        } else if (progress > 0.7) {
            // 縮小消失
            const t = (progress - 0.7) / 0.3;
            this.scale = 1 - t;
        } else {
            this.scale = 1;
        }

        // 更新 sprite
        this.sprite.position.copy(this.position);
        this.sprite.scale.set(this.size * 2 * this.scale, this.size * this.scale, 1);
        this.sprite.material.opacity = Math.max(0, this.life / this.duration);

        // 死亡判定
        if (this.life <= 0) {
            this.die();
        }
    }

    easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    die() {
        this.isDead = true;
        if (this.sprite) {
            this.scene.remove(this.sprite);
            this.sprite.material.map.dispose();
            this.sprite.material.dispose();
        }
    }
}

/**
 * FloatingTextManager3D - 管理所有浮動文字
 */
export class FloatingTextManager3D {
    constructor(scene) {
        this.scene = scene;
        this.texts = [];
    }

    /**
     * 顯示傷害數字
     */
    showDamage(position, amount) {
        const text = new FloatingText3D(this.scene, `-${amount}`, position, {
            color: 0xff4444,
            size: 0.35,
            duration: 1.0
        });
        this.texts.push(text);
    }

    /**
     * 顯示治療數字
     */
    showHeal(position, amount) {
        const text = new FloatingText3D(this.scene, `+${amount}`, position, {
            color: 0x66ff66,
            size: 0.35,
            duration: 1.0
        });
        this.texts.push(text);
    }

    /**
     * 顯示自訂文字
     */
    showText(position, str, color = 0xffffff) {
        const text = new FloatingText3D(this.scene, str, position, {
            color,
            size: 0.3,
            duration: 1.2
        });
        this.texts.push(text);
    }

    update(dt) {
        for (let i = this.texts.length - 1; i >= 0; i--) {
            const text = this.texts[i];
            text.update(dt);
            if (text.isDead) {
                this.texts.splice(i, 1);
            }
        }
    }

    clear() {
        this.texts.forEach(t => t.die());
        this.texts = [];
    }
}
