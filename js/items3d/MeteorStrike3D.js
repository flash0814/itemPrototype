/**
 * MeteorStrike3D.js - 隕石打擊
 *
 * ACTIVE 道具：丟出後從天降下隕石，範圍傷害
 */

import * as THREE from 'three';
import { ItemBase3D } from './ItemBase3D.js';
import { COLORS_3D } from '../core3d/World3D.js';

export class MeteorStrike3D extends ItemBase3D {
    constructor(scene, x, z, config = {}) {
        super(scene, x, z, {
            type: 'ACTIVE',
            duration: config.duration || 0,
            size: 0.5,
            spawnHeight: config.spawnHeight || 3,
            ...config
        });

        // 瞄準參數
        this.minAimRadius = config.minAimRadius || 3;
        this.maxAimRadius = config.maxAimRadius || 12;

        // 傷害參數
        this.damage = config.damage || 150;
        this.explosionRadius = config.explosionRadius || 2.5;

        // 隕石狀態
        this.meteorFalling = false;
        this.meteorHeight = 15;
        this.meteorSpeed = 20;

        this.createMesh();
    }

    createMesh() {
        this.mesh = new THREE.Group();

        // 紅色圓球
        const sphereGeom = new THREE.SphereGeometry(0.2, 16, 16);
        const sphereMat = new THREE.MeshToonMaterial({ color: COLORS_3D.meteor });
        const sphere = new THREE.Mesh(sphereGeom, sphereMat);
        sphere.castShadow = true;
        this.mesh.add(sphere);

        // 火焰效果（小的橘色球）
        const flameMat = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.7
        });
        for (let i = 0; i < 4; i++) {
            const flame = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 8, 8),
                flameMat
            );
            const angle = (i / 4) * Math.PI * 2;
            flame.position.set(
                Math.cos(angle) * 0.15,
                -0.1,
                Math.sin(angle) * 0.15
            );
            this.mesh.add(flame);
        }

        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }

    activate(targetPos) {
        this.isActivated = true;
        this.isHeld = false;
        this.mesh.visible = true;

        // 隕石從高空落下
        this.position.set(targetPos.x, this.meteorHeight, targetPos.z);
        this.targetPos = targetPos.clone();
        this.meteorFalling = true;
        this.isGrounded = false;

        console.log(`MeteorStrike falling to (${targetPos.x.toFixed(1)}, ${targetPos.z.toFixed(1)})`);
    }

    update(dt) {
        if (this.isDead) return;
        if (this.isHeld) return;

        if (!this.isActivated) {
            super.update(dt);
            return;
        }

        if (this.meteorFalling) {
            // 隕石下落
            this.position.y -= this.meteorSpeed * dt;

            // 加速效果
            this.meteorSpeed += 30 * dt;

            if (this.mesh) {
                this.mesh.position.copy(this.position);
                this.mesh.rotation.x += dt * 5;
                this.mesh.rotation.z += dt * 3;

                // 增大效果
                const scale = 1 + (this.meteorHeight - this.position.y) * 0.1;
                this.mesh.scale.setScalar(Math.min(scale, 3));
            }

            // 撞擊地面
            if (this.position.y <= 0) {
                this.impact();
            }
        }
    }

    impact() {
        this.meteorFalling = false;

        // 撞擊回調（讓 main.js 處理傷害和特效）
        if (this.onImpact) {
            this.onImpact(this.position.clone(), this.explosionRadius, this.damage);
        }

        this.die();
    }
}
