/**
 * ExplosionWave3D.js - 3D 爆炸波
 *
 * 地面環形擴散效果（Overcooked 風格）
 */

import * as THREE from 'three';

export class ExplosionWave3D {
    constructor(scene, x, z, maxRadius, config = {}) {
        this.scene = scene;
        this.position = new THREE.Vector3(x, 0.02, z);  // 略高於地面
        this.radius = 0.1;
        this.maxRadius = maxRadius;
        this.life = 1.0;
        this.isDead = false;

        // 配置
        this.color = config.color || 0xffaa00;
        this.expandSpeed = config.expandSpeed || 5;
        this.fadeSpeed = config.fadeSpeed || 2;

        this.createMesh();
    }

    createMesh() {
        // 環形（RingGeometry）
        const geometry = new THREE.RingGeometry(this.radius * 0.8, this.radius, 32);
        const material = new THREE.MeshBasicMaterial({
            color: this.color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;  // 平放
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }

    update(dt) {
        if (this.isDead) return;

        // 擴散
        this.radius += (this.maxRadius - this.radius) * this.expandSpeed * dt;

        // 更新 geometry
        this.mesh.geometry.dispose();
        this.mesh.geometry = new THREE.RingGeometry(
            this.radius * 0.7,
            this.radius,
            32
        );

        // 淡出
        this.life -= dt * this.fadeSpeed;
        this.mesh.material.opacity = Math.max(0, this.life * 0.8);

        // 死亡判定
        if (this.life <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
}
