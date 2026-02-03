/**
 * Bomb3D.js - 炸彈
 *
 * ACTIVE 道具：拋物線飛到目標，範圍爆炸
 */

import * as THREE from 'three';
import { ItemBase3D } from './ItemBase3D.js';
import { COLORS_3D } from '../core3d/World3D.js';

export class Bomb3D extends ItemBase3D {
    constructor(scene, x, z, config = {}) {
        super(scene, x, z, {
            type: 'ACTIVE',
            duration: config.duration || 0,
            size: 0.4,
            ...config
        });

        // 瞄準參數
        this.minAimRadius = config.minAimRadius || 1;
        this.maxAimRadius = config.maxAimRadius || 8;

        // 傷害參數
        this.damage = config.damage || 100;
        this.explosionRadius = config.explosionRadius || 2.2;

        // 飛行參數
        this.throwSpeed = 8;
        this.flyGravity = 15;
        this.flying = false;

        // 引線動畫
        this.fuseTime = 0;

        // 發射位置（用於計算拋物線）
        this.startPos = null;

        this.createMesh();
    }

    createMesh() {
        this.mesh = new THREE.Group();

        // 黑色球體
        const bombGeom = new THREE.SphereGeometry(0.18, 16, 16);
        const bombMat = new THREE.MeshToonMaterial({ color: COLORS_3D.bomb });
        const bomb = new THREE.Mesh(bombGeom, bombMat);
        bomb.castShadow = true;
        this.mesh.add(bomb);

        // 引線
        const fuseGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8);
        const fuseMat = new THREE.MeshToonMaterial({ color: 0x8b4513 });
        const fuse = new THREE.Mesh(fuseGeom, fuseMat);
        fuse.position.y = 0.2;
        fuse.rotation.z = 0.3;
        this.mesh.add(fuse);

        // 火花（引線頂端）
        const sparkGeom = new THREE.SphereGeometry(0.04, 8, 8);
        const sparkMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
        this.spark = new THREE.Mesh(sparkGeom, sparkMat);
        this.spark.position.set(0.03, 0.28, 0);
        this.mesh.add(this.spark);

        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }

    activate(targetPos, playerPos) {
        this.isActivated = true;
        this.isHeld = false;
        this.mesh.visible = true;

        // 從玩家位置開始
        this.startPos = playerPos.clone();
        this.position.copy(this.startPos);
        this.position.y = 0.5;

        // 計算拋物線
        const dx = targetPos.x - this.startPos.x;
        const dz = targetPos.z - this.startPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        // 飛行時間
        const flightTime = dist / this.throwSpeed;

        // 水平速度
        this.velocity.x = dx / flightTime;
        this.velocity.z = dz / flightTime;

        // 垂直速度（讓炸彈落在目標點）
        this.velocity.y = (0.5 * this.flyGravity * flightTime);

        this.flying = true;
        this.targetPos = targetPos.clone();

        console.log(`Bomb thrown to (${targetPos.x.toFixed(1)}, ${targetPos.z.toFixed(1)})`);
    }

    update(dt) {
        if (this.isDead) return;
        if (this.isHeld) return;

        // 引線火花閃爍
        this.fuseTime += dt;
        if (this.spark) {
            this.spark.scale.setScalar(0.8 + Math.sin(this.fuseTime * 20) * 0.4);
        }

        if (!this.isActivated) {
            super.update(dt);
            return;
        }

        if (this.flying) {
            // 拋物線飛行
            this.velocity.y -= this.flyGravity * dt;

            this.position.x += this.velocity.x * dt;
            this.position.y += this.velocity.y * dt;
            this.position.z += this.velocity.z * dt;

            if (this.mesh) {
                this.mesh.position.copy(this.position);
                this.mesh.rotation.x += dt * 8;
                this.mesh.rotation.z += dt * 5;
            }

            // 落地
            if (this.position.y <= 0) {
                this.explode();
            }
        }
    }

    explode() {
        this.flying = false;

        // 爆炸回調（讓 main.js 處理傷害和特效）
        if (this.onExplode) {
            this.onExplode(this.position.clone(), this.explosionRadius, this.damage);
        }

        this.die();
    }
}
