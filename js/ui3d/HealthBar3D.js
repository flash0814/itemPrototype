/**
 * HealthBar3D.js - 3D 血條
 *
 * 跟隨玩家的世界空間血條（Overcooked 風格圓角）
 */

import * as THREE from 'three';

export class HealthBar3D {
    constructor(scene) {
        this.scene = scene;

        // 尺寸
        this.width = 1.02;    // 原 1.2，縮短 15%
        this.height = 0.144;  // 原 0.12，加厚 20%
        this.offsetY = 1.3;   // 上移，不蓋頭

        // 狀態
        this.currentHP = 1;
        this.displayHP = 1;  // 平滑過渡用

        this.createMesh();
    }

    createMesh() {
        this.group = new THREE.Group();

        // 背景（深灰）
        const bgGeom = new THREE.PlaneGeometry(this.width, this.height);
        const bgMat = new THREE.MeshBasicMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        this.bgMesh = new THREE.Mesh(bgGeom, bgMat);
        this.group.add(this.bgMesh);

        // 血條（綠色）
        const barGeom = new THREE.PlaneGeometry(this.width - 0.04, this.height - 0.04);
        this.barMat = new THREE.MeshBasicMaterial({
            color: 0x66bb6a,
            side: THREE.DoubleSide
        });
        this.barMesh = new THREE.Mesh(barGeom, this.barMat);
        this.barMesh.position.z = 0.001;  // 略前
        this.group.add(this.barMesh);

        // 邊框
        const borderGeom = new THREE.PlaneGeometry(this.width + 0.02, this.height + 0.02);
        const borderMat = new THREE.MeshBasicMaterial({
            color: 0x222222,
            side: THREE.DoubleSide
        });
        const borderMesh = new THREE.Mesh(borderGeom, borderMat);
        borderMesh.position.z = -0.001;
        this.group.add(borderMesh);

        this.scene.add(this.group);
    }

    /**
     * 更新血條
     * @param {THREE.Vector3} position - 玩家位置
     * @param {number} hp - 當前 HP
     * @param {number} maxHp - 最大 HP
     * @param {THREE.Camera} camera - 攝影機（用於 billboard）
     */
    update(position, hp, maxHp, camera, dt) {
        // 位置（玩家頭上）
        this.group.position.set(position.x, position.y + this.offsetY, position.z);

        // Billboard：始終面向攝影機
        this.group.quaternion.copy(camera.quaternion);

        // 平滑過渡 HP
        this.currentHP = hp / maxHp;
        this.displayHP += (this.currentHP - this.displayHP) * Math.min(1, 10 * dt);

        // 更新血條寬度（用 scale）
        const fillWidth = Math.max(0.01, this.displayHP);
        this.barMesh.scale.x = fillWidth;
        this.barMesh.position.x = (fillWidth - 1) * (this.width - 0.04) / 2;

        // 顏色根據 HP 變化（綠→黃→紅）
        this.updateColor();
    }

    updateColor() {
        const ratio = this.displayHP;
        let color;

        if (ratio > 0.6) {
            // 綠色
            color = new THREE.Color(0x66bb6a);
        } else if (ratio > 0.3) {
            // 黃色
            const t = (ratio - 0.3) / 0.3;
            color = new THREE.Color().lerpColors(
                new THREE.Color(0xffca28),
                new THREE.Color(0x66bb6a),
                t
            );
        } else {
            // 紅色
            const t = ratio / 0.3;
            color = new THREE.Color().lerpColors(
                new THREE.Color(0xef5350),
                new THREE.Color(0xffca28),
                t
            );
        }

        this.barMat.color = color;
    }

    setVisible(visible) {
        this.group.visible = visible;
    }
}
