/**
 * PlayerStatusUI3D.js - 玩家狀態 UI
 *
 * 統一管理 HP 和 Energy 條，確保平行且相對位置固定
 */

import * as THREE from 'three';

export class PlayerStatusUI3D {
    constructor(scene) {
        this.scene = scene;

        // 整體 UI 位置
        this.offsetY = 1.25;  // UI 中心點在玩家頭上

        // HP 條參數
        this.hpWidth = 1.02;
        this.hpHeight = 0.144;
        this.hpLocalY = 0.05;  // 相對於 group 中心

        // Energy 條參數
        this.energyWidth = 1.02;
        this.energyHeight = 0.072;  // HP 的一半
        this.energyLocalY = -0.08;  // HP 下方

        // 狀態
        this.displayHP = 1;
        this.displayEnergy = 1;

        this.createMesh();
    }

    createMesh() {
        // 統一的父容器（只對這個做 billboard）
        this.group = new THREE.Group();

        // ===== HP 條 =====
        this.hpGroup = new THREE.Group();
        this.hpGroup.position.y = this.hpLocalY;

        // HP 背景
        const hpBgGeom = new THREE.PlaneGeometry(this.hpWidth, this.hpHeight);
        const hpBgMat = new THREE.MeshBasicMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        this.hpBgMesh = new THREE.Mesh(hpBgGeom, hpBgMat);
        this.hpGroup.add(this.hpBgMesh);

        // HP 填充
        const hpPadding = 0.03;
        const hpBarGeom = new THREE.PlaneGeometry(this.hpWidth - hpPadding * 2, this.hpHeight - hpPadding * 2);
        this.hpBarMat = new THREE.MeshBasicMaterial({
            color: 0x66bb6a,
            side: THREE.DoubleSide
        });
        this.hpBarMesh = new THREE.Mesh(hpBarGeom, this.hpBarMat);
        this.hpBarMesh.position.z = 0.001;
        this.hpGroup.add(this.hpBarMesh);

        // HP 邊框
        const hpBorderGeom = new THREE.PlaneGeometry(this.hpWidth + 0.02, this.hpHeight + 0.02);
        const hpBorderMat = new THREE.MeshBasicMaterial({
            color: 0x222222,
            side: THREE.DoubleSide
        });
        const hpBorderMesh = new THREE.Mesh(hpBorderGeom, hpBorderMat);
        hpBorderMesh.position.z = -0.001;
        this.hpGroup.add(hpBorderMesh);

        this.group.add(this.hpGroup);

        // ===== Energy 條 =====
        this.energyGroup = new THREE.Group();
        this.energyGroup.position.y = this.energyLocalY;

        // Energy 背景
        const energyBgGeom = new THREE.PlaneGeometry(this.energyWidth, this.energyHeight);
        const energyBgMat = new THREE.MeshBasicMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        this.energyBgMesh = new THREE.Mesh(energyBgGeom, energyBgMat);
        this.energyGroup.add(this.energyBgMesh);

        // Energy 填充（padding 比例與 HP 一致）
        const energyPadding = 0.015;  // HP padding 的一半
        const energyBarGeom = new THREE.PlaneGeometry(this.energyWidth - energyPadding * 2, this.energyHeight - energyPadding * 2);
        this.energyBarMat = new THREE.MeshBasicMaterial({
            color: 0xffd54f,
            side: THREE.DoubleSide
        });
        this.energyBarMesh = new THREE.Mesh(energyBarGeom, this.energyBarMat);
        this.energyBarMesh.position.z = 0.001;
        this.energyGroup.add(this.energyBarMesh);

        // Energy 邊框
        const energyBorderGeom = new THREE.PlaneGeometry(this.energyWidth + 0.01, this.energyHeight + 0.01);
        const energyBorderMat = new THREE.MeshBasicMaterial({
            color: 0x222222,
            side: THREE.DoubleSide
        });
        const energyBorderMesh = new THREE.Mesh(energyBorderGeom, energyBorderMat);
        energyBorderMesh.position.z = -0.001;
        this.energyGroup.add(energyBorderMesh);

        this.group.add(this.energyGroup);

        this.scene.add(this.group);
    }

    /**
     * 更新
     */
    update(position, hp, maxHp, energy, maxEnergy, camera, dt) {
        // 位置
        this.group.position.set(position.x, position.y + this.offsetY, position.z);

        // Billboard（只對父容器做一次）
        this.group.quaternion.copy(camera.quaternion);

        // ===== HP 更新 =====
        const targetHP = hp / maxHp;
        this.displayHP += (targetHP - this.displayHP) * Math.min(1, 10 * dt);

        const hpFill = Math.max(0.01, this.displayHP);
        this.hpBarMesh.scale.x = hpFill;
        this.hpBarMesh.position.x = (hpFill - 1) * (this.hpWidth - 0.06) / 2;

        // HP 顏色
        this.updateHPColor();

        // ===== Energy 更新 =====
        const targetEnergy = energy / maxEnergy;
        this.displayEnergy += (targetEnergy - this.displayEnergy) * Math.min(1, 10 * dt);

        const energyFill = Math.max(0.01, this.displayEnergy);
        this.energyBarMesh.scale.x = energyFill;
        this.energyBarMesh.position.x = (energyFill - 1) * (this.energyWidth - 0.03) / 2;
    }

    updateHPColor() {
        const ratio = this.displayHP;
        let color;

        if (ratio > 0.6) {
            color = new THREE.Color(0x66bb6a);
        } else if (ratio > 0.3) {
            const t = (ratio - 0.3) / 0.3;
            color = new THREE.Color().lerpColors(
                new THREE.Color(0xffca28),
                new THREE.Color(0x66bb6a),
                t
            );
        } else {
            const t = ratio / 0.3;
            color = new THREE.Color().lerpColors(
                new THREE.Color(0xef5350),
                new THREE.Color(0xffca28),
                t
            );
        }

        this.hpBarMat.color = color;
    }

    setVisible(visible) {
        this.group.visible = visible;
    }
}
