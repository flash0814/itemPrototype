/**
 * BuffIcons3D.js - 3D Buff 圖示
 *
 * 顯示在玩家頭上的 buff 狀態圖示
 */

import * as THREE from 'three';

// Buff 類型定義
export const BUFF_TYPE_3D = {
    INVINCIBLE: 'INVINCIBLE',
    ENERGY_BUFF: 'ENERGY_BUFF',
    REVIVE_FEATHER: 'REVIVE_FEATHER'
};

export class BuffIcons3D {
    constructor(scene) {
        this.scene = scene;

        // 配置
        this.iconSize = 0.2;
        this.spacing = 0.25;
        this.offsetY = 1.3;  // 血條上方

        // 圖示容器
        this.group = new THREE.Group();
        this.icons = new Map();  // buffType -> { mesh, startTime, duration }

        this.scene.add(this.group);
    }

    /**
     * 新增或更新 buff 圖示
     */
    addBuff(type, duration, color = 0xffffff) {
        // 移除舊的同類 buff
        if (this.icons.has(type)) {
            this.removeBuff(type);
        }

        // 建立圖示 mesh
        const mesh = this.createIconMesh(type, color);
        this.group.add(mesh);

        this.icons.set(type, {
            mesh,
            startTime: performance.now() / 1000,
            duration,
            color
        });

        this.arrangeIcons();
    }

    createIconMesh(type, color) {
        let geometry;

        switch (type) {
            case BUFF_TYPE_3D.INVINCIBLE:
                // 盾牌（六邊形）
                geometry = new THREE.CircleGeometry(this.iconSize * 0.5, 6);
                break;

            case BUFF_TYPE_3D.ENERGY_BUFF:
                // 閃電（菱形）
                geometry = new THREE.BufferGeometry();
                const s = this.iconSize * 0.5;
                const vertices = new Float32Array([
                    0, s, 0,
                    s * 0.5, 0, 0,
                    0, -s, 0,
                    -s * 0.5, 0, 0
                ]);
                const indices = [0, 1, 3, 1, 2, 3];
                geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                geometry.setIndex(indices);
                break;

            case BUFF_TYPE_3D.REVIVE_FEATHER:
                // 羽毛（橢圓）
                geometry = new THREE.CircleGeometry(this.iconSize * 0.4, 16);
                break;

            default:
                geometry = new THREE.CircleGeometry(this.iconSize * 0.4, 16);
        }

        const material = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.type = type;
        return mesh;
    }

    /**
     * 移除 buff 圖示
     */
    removeBuff(type) {
        const icon = this.icons.get(type);
        if (icon) {
            this.group.remove(icon.mesh);
            icon.mesh.geometry.dispose();
            icon.mesh.material.dispose();
            this.icons.delete(type);
            this.arrangeIcons();
        }
    }

    /**
     * 排列圖示（置中）
     */
    arrangeIcons() {
        const count = this.icons.size;
        if (count === 0) return;

        const totalWidth = count * this.spacing;
        let x = -totalWidth / 2 + this.spacing / 2;

        for (const [type, icon] of this.icons) {
            icon.mesh.position.x = x;
            x += this.spacing;
        }
    }

    /**
     * 更新
     */
    update(position, camera, dt) {
        // 位置
        this.group.position.set(position.x, position.y + this.offsetY, position.z);

        // Billboard
        this.group.quaternion.copy(camera.quaternion);

        // 更新每個圖示
        const now = performance.now() / 1000;
        const toRemove = [];

        for (const [type, icon] of this.icons) {
            const elapsed = now - icon.startTime;
            const remaining = icon.duration - elapsed;
            const progress = remaining / icon.duration;

            // 時間到了移除
            if (remaining <= 0) {
                toRemove.push(type);
                continue;
            }

            // 倒數動畫（閃爍 + 縮放）
            if (progress < 0.3) {
                // 閃爍
                const flash = Math.sin(now * 12) > 0;
                icon.mesh.material.opacity = flash ? 0.9 : 0.4;
                // 縮放
                const scale = 0.8 + progress * 0.7;
                icon.mesh.scale.setScalar(scale);
            } else {
                icon.mesh.material.opacity = 0.9;
                icon.mesh.scale.setScalar(1);
            }

            // 旋轉動畫
            icon.mesh.rotation.z = Math.sin(now * 2) * 0.1;
        }

        // 移除過期的
        toRemove.forEach(type => this.removeBuff(type));
    }

    /**
     * 清除所有 buff
     */
    clearAll() {
        for (const [type, icon] of this.icons) {
            this.group.remove(icon.mesh);
            icon.mesh.geometry.dispose();
            icon.mesh.material.dispose();
        }
        this.icons.clear();
    }

    setVisible(visible) {
        this.group.visible = visible;
    }
}
