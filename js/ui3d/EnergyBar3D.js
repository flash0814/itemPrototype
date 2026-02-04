/**
 * EnergyBar3D.js - 3D 能量條
 *
 * 跟隨玩家的世界空間能量條（血條下方）
 */

import * as THREE from 'three';

export class EnergyBar3D {
    constructor(scene) {
        this.scene = scene;

        // 尺寸（與 HP 同寬，厚度為 HP 一半）
        this.width = 1.02;    // 與 HP 同寬
        this.height = 0.072;  // HP 厚度的一半
        this.offsetY = 1.16;  // 緊貼 HP 下方

        // 狀態
        this.currentEnergy = 1;
        this.displayEnergy = 1;

        this.createMesh();
    }

    createMesh() {
        this.group = new THREE.Group();

        // 背景
        const bgGeom = new THREE.PlaneGeometry(this.width, this.height);
        const bgMat = new THREE.MeshBasicMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        this.bgMesh = new THREE.Mesh(bgGeom, bgMat);
        this.group.add(this.bgMesh);

        // 能量條（金黃色）
        const barGeom = new THREE.PlaneGeometry(this.width - 0.03, this.height - 0.03);
        this.barMat = new THREE.MeshBasicMaterial({
            color: 0xffd54f,
            side: THREE.DoubleSide
        });
        this.barMesh = new THREE.Mesh(barGeom, this.barMat);
        this.barMesh.position.z = 0.001;
        this.group.add(this.barMesh);

        // 邊框
        const borderGeom = new THREE.PlaneGeometry(this.width + 0.015, this.height + 0.015);
        const borderMat = new THREE.MeshBasicMaterial({
            color: 0x222222,
            side: THREE.DoubleSide
        });
        const borderMesh = new THREE.Mesh(borderGeom, borderMat);
        borderMesh.position.z = -0.001;
        this.group.add(borderMesh);

        this.scene.add(this.group);
    }

    update(position, energy, maxEnergy, camera, dt) {
        // 位置
        this.group.position.set(position.x, position.y + this.offsetY, position.z);

        // Billboard
        this.group.quaternion.copy(camera.quaternion);

        // 平滑過渡
        this.currentEnergy = energy / maxEnergy;
        this.displayEnergy += (this.currentEnergy - this.displayEnergy) * Math.min(1, 10 * dt);

        // 更新寬度
        const fillWidth = Math.max(0.01, this.displayEnergy);
        this.barMesh.scale.x = fillWidth;
        this.barMesh.position.x = (fillWidth - 1) * (this.width - 0.03) / 2;
    }

    setVisible(visible) {
        this.group.visible = visible;
    }
}
