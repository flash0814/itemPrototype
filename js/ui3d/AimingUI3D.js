/**
 * AimingUI3D.js - 瞄準 UI
 *
 * 地面範圍圈 + 目標點指示器
 */

import * as THREE from 'three';

export class AimingUI3D {
    constructor(scene) {
        this.scene = scene;
        this.visible = false;

        // 目標位置
        this.targetPos = new THREE.Vector3();

        // 建立 UI 元素
        this.createRangeRing();
        this.createTargetIndicator();

        this.hide();
    }

    createRangeRing() {
        // 最大範圍圈（虛線效果用多段弧形模擬）
        const ringGeom = new THREE.RingGeometry(0.95, 1, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        this.rangeRing = new THREE.Mesh(ringGeom, ringMat);
        this.rangeRing.rotation.x = -Math.PI / 2;
        this.rangeRing.position.y = 0.02;
        this.scene.add(this.rangeRing);

        // 最小範圍圈
        const minRingGeom = new THREE.RingGeometry(0.95, 1, 32);
        const minRingMat = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        this.minRangeRing = new THREE.Mesh(minRingGeom, minRingMat);
        this.minRangeRing.rotation.x = -Math.PI / 2;
        this.minRangeRing.position.y = 0.02;
        this.scene.add(this.minRangeRing);
    }

    createTargetIndicator() {
        // 目標點（圓形）
        const indicatorGeom = new THREE.CircleGeometry(0.3, 16);
        const indicatorMat = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        this.targetIndicator = new THREE.Mesh(indicatorGeom, indicatorMat);
        this.targetIndicator.rotation.x = -Math.PI / 2;
        this.targetIndicator.position.y = 0.03;
        this.scene.add(this.targetIndicator);

        // 目標圈
        const targetRingGeom = new THREE.RingGeometry(0.35, 0.4, 16);
        const targetRingMat = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        this.targetRing = new THREE.Mesh(targetRingGeom, targetRingMat);
        this.targetRing.rotation.x = -Math.PI / 2;
        this.targetRing.position.y = 0.03;
        this.scene.add(this.targetRing);
    }

    /**
     * 更新瞄準 UI
     */
    update(playerPos, mousePos, item, dt) {
        if (!item || !this.visible) {
            this.hide();
            return;
        }

        // 計算到滑鼠的方向和距離
        const toMouse = new THREE.Vector3(
            mousePos.x - playerPos.x,
            0,
            mousePos.z - playerPos.z
        );
        const dist = toMouse.length();

        // 限制在範圍內
        const clampedDist = Math.max(
            item.minAimRadius,
            Math.min(item.maxAimRadius, dist)
        );

        // 計算目標位置
        if (dist > 0.01) {
            toMouse.normalize();
            this.targetPos.set(
                playerPos.x + toMouse.x * clampedDist,
                0,
                playerPos.z + toMouse.z * clampedDist
            );
        }

        // 更新範圍圈位置和大小
        this.rangeRing.position.set(playerPos.x, 0.02, playerPos.z);
        this.rangeRing.scale.set(item.maxAimRadius, item.maxAimRadius, 1);

        this.minRangeRing.position.set(playerPos.x, 0.02, playerPos.z);
        this.minRangeRing.scale.set(item.minAimRadius, item.minAimRadius, 1);

        // 更新目標點位置
        this.targetIndicator.position.set(this.targetPos.x, 0.03, this.targetPos.z);
        this.targetRing.position.set(this.targetPos.x, 0.03, this.targetPos.z);

        // 目標圈脈衝動畫
        const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.1;
        this.targetRing.scale.set(pulse, pulse, 1);
    }

    /**
     * 取得目標位置
     */
    getTargetPos() {
        return this.targetPos.clone();
    }

    show() {
        this.visible = true;
        this.rangeRing.visible = true;
        this.minRangeRing.visible = true;
        this.targetIndicator.visible = true;
        this.targetRing.visible = true;
    }

    hide() {
        this.visible = false;
        this.rangeRing.visible = false;
        this.minRangeRing.visible = false;
        this.targetIndicator.visible = false;
        this.targetRing.visible = false;
    }
}
