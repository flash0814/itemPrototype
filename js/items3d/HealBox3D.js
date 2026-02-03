/**
 * HealBox3D.js - 治療箱
 *
 * ACTIVE 道具：撿起持有 → F 瞄準 → 左鍵丟出 → 範圍治療
 */

import * as THREE from 'three';
import { ItemBase3D } from './ItemBase3D.js';
import { COLORS_3D } from '../core3d/World3D.js';

export class HealBox3D extends ItemBase3D {
    constructor(scene, x, z, config = {}) {
        super(scene, x, z, {
            type: 'ACTIVE',
            duration: config.duration || 0,  // 地上永久
            size: 0.5,
            ...config
        });

        // 瞄準參數
        this.minAimRadius = config.minAimRadius || 2;
        this.maxAimRadius = config.maxAimRadius || 10;

        // 治療參數
        this.healRadius = config.healRadius || 2;
        this.healAmount = config.healAmount || 25;
        this.tickRate = config.tickRate || 1;
        this.maxTicks = config.maxTicks || 5;

        // 啟動後狀態
        this.ticksPerformed = 0;
        this.tickTimer = 0;
        this.pulseTime = 0;
        this.effectStarted = false;

        // 視覺效果
        this.healRing = null;

        this.createMesh();
    }

    createMesh() {
        this.mesh = new THREE.Group();

        // 綠色圓角盒子
        const boxGeom = new THREE.BoxGeometry(0.45, 0.35, 0.45);
        const boxMat = new THREE.MeshToonMaterial({ color: COLORS_3D.heal });
        const box = new THREE.Mesh(boxGeom, boxMat);
        box.castShadow = true;
        this.mesh.add(box);

        // 白色十字（凸起）
        const crossMat = new THREE.MeshToonMaterial({ color: 0xffffff });

        const crossH = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.08, 0.08),
            crossMat
        );
        crossH.position.y = 0.18;
        this.mesh.add(crossH);

        const crossV = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.08, 0.25),
            crossMat
        );
        crossV.position.y = 0.18;
        this.mesh.add(crossV);

        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }

    activate(targetPos) {
        super.activate(targetPos);
        this.effectStarted = false;
        this.ticksPerformed = 0;
        this.tickTimer = 0;
    }

    onGrounded() {
        if (this.isActivated && !this.effectStarted) {
            this.startEffect();
        }
    }

    startEffect() {
        this.effectStarted = true;
        this.tickTimer = 0;

        // 建立治療範圍視覺圈
        this.createHealRing();

        console.log(`HealBox activated at (${this.position.x.toFixed(1)}, ${this.position.z.toFixed(1)})`);
    }

    createHealRing() {
        const ringGeom = new THREE.RingGeometry(
            this.healRadius - 0.1,
            this.healRadius,
            32
        );
        const ringMat = new THREE.MeshBasicMaterial({
            color: COLORS_3D.heal,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        this.healRing = new THREE.Mesh(ringGeom, ringMat);
        this.healRing.rotation.x = -Math.PI / 2;
        this.healRing.position.set(this.position.x, 0.05, this.position.z);
        this.scene.add(this.healRing);
    }

    update(dt) {
        if (this.isDead) return;
        if (this.isHeld) return;

        // 未啟動：正常物理
        if (!this.isActivated) {
            super.update(dt);
            return;
        }

        // 啟動後但未落地：只跑物理
        if (!this.isGrounded) {
            this.updatePhysics(dt);
            if (this.mesh) {
                this.mesh.position.copy(this.position);
            }
            return;
        }

        // 落地後：效果邏輯
        if (this.effectStarted) {
            this.tickTimer += dt;

            if (this.tickTimer >= this.tickRate && this.ticksPerformed < this.maxTicks) {
                this.performTick();
                this.tickTimer = 0;
                this.ticksPerformed++;
                this.pulseTime = 0.3;  // 脈衝動畫
            }

            // 脈衝動畫
            if (this.pulseTime > 0) {
                this.pulseTime -= dt;
                if (this.healRing) {
                    const scale = 1 + (0.3 - this.pulseTime) * 0.5;
                    this.healRing.scale.set(scale, scale, 1);
                    this.healRing.material.opacity = 0.4 + this.pulseTime;
                }
            }

            // 完成所有 tick
            if (this.ticksPerformed >= this.maxTicks && this.pulseTime <= 0) {
                this.die();
            }
        }
    }

    performTick() {
        console.log(`HealBox tick ${this.ticksPerformed + 1}/${this.maxTicks}`);

        // 治療回調（讓 main.js 處理實際治療和特效）
        if (this.onHealTick) {
            this.onHealTick(this.position.clone(), this.healRadius, this.healAmount);
        }
    }

    /**
     * 檢查玩家是否在治療範圍內
     */
    isPlayerInRange(player) {
        if (!this.effectStarted) return false;
        const dx = player.position.x - this.position.x;
        const dz = player.position.z - this.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        return dist < this.healRadius;
    }

    die() {
        if (this.healRing) {
            this.scene.remove(this.healRing);
        }
        super.die();
    }
}
