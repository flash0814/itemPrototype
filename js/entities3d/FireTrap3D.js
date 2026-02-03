/**
 * FireTrap3D.js - 火焰陷阱
 *
 * 卡通風格火焰，週期性傷害
 */

import * as THREE from 'three';
import { COLORS_3D } from '../core3d/World3D.js';

export class FireTrap3D {
    constructor(scene, x, z, config = {}) {
        this.scene = scene;
        this.position = new THREE.Vector3(x, 0, z);

        // 參數
        this.size = config.size || 1;
        this.damage = config.damage || 50;
        this.damageInterval = config.damageInterval || 0.7;  // 秒

        // 狀態
        this.damageTimer = 0;
        this.animTime = 0;

        this.createMesh();
    }

    createMesh() {
        this.mesh = new THREE.Group();

        // 底座
        const baseGeom = new THREE.CylinderGeometry(
            this.size * 0.5,
            this.size * 0.55,
            0.1,
            16
        );
        const baseMat = new THREE.MeshToonMaterial({ color: 0x555555 });
        const base = new THREE.Mesh(baseGeom, baseMat);
        base.position.y = 0.05;
        this.mesh.add(base);

        // 火焰（多個錐形堆疊）
        this.flames = [];
        const flameColors = [COLORS_3D.fireTrap, COLORS_3D.fireGlow, 0xffee58];

        for (let i = 0; i < 5; i++) {
            const height = 0.3 + Math.random() * 0.4;
            const radius = 0.08 + Math.random() * 0.1;
            const flameGeom = new THREE.ConeGeometry(radius, height, 8);
            const flameMat = new THREE.MeshBasicMaterial({
                color: flameColors[i % flameColors.length],
                transparent: true,
                opacity: 0.9
            });

            const flame = new THREE.Mesh(flameGeom, flameMat);
            flame.position.x = (Math.random() - 0.5) * this.size * 0.4;
            flame.position.z = (Math.random() - 0.5) * this.size * 0.4;
            flame.position.y = 0.1 + height / 2;

            // 儲存原始值供動畫使用
            flame.userData = {
                baseY: flame.position.y,
                baseScale: 1,
                phaseOffset: Math.random() * Math.PI * 2,
                swaySpeed: 3 + Math.random() * 2
            };

            this.flames.push(flame);
            this.mesh.add(flame);
        }

        // 光源（暖橘色點光）
        this.light = new THREE.PointLight(COLORS_3D.fireTrap, 0.5, 3);
        this.light.position.y = 0.5;
        this.mesh.add(this.light);

        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }

    update(dt, player) {
        // 火焰動畫
        this.animTime += dt;
        this.animateFlames();

        // 傷害邏輯
        if (player && !player.isDead && this.isPlayerInRange(player)) {
            this.damageTimer += dt;
            if (this.damageTimer >= this.damageInterval) {
                player.takeDamage(this.damage);
                this.damageTimer = 0;
                // 傷害特效回調
                if (this.onDamage) {
                    this.onDamage(player.position.clone(), this.damage);
                }
            }
        } else {
            // 離開範圍時重置計時器
            this.damageTimer = 0;
        }
    }

    animateFlames() {
        this.flames.forEach(flame => {
            const data = flame.userData;
            const t = this.animTime * data.swaySpeed + data.phaseOffset;

            // 搖擺
            flame.rotation.x = Math.sin(t) * 0.2;
            flame.rotation.z = Math.cos(t * 0.7) * 0.2;

            // 縮放呼吸
            const scale = data.baseScale + Math.sin(t * 2) * 0.15;
            flame.scale.setScalar(scale);

            // 上下浮動
            flame.position.y = data.baseY + Math.sin(t * 1.5) * 0.05;
        });

        // 光源閃爍
        this.light.intensity = 0.4 + Math.sin(this.animTime * 10) * 0.2;
    }

    isPlayerInRange(player) {
        const dx = player.position.x - this.position.x;
        const dz = player.position.z - this.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        return dist < this.size * 0.6 + player.radius;
    }

    getPosition() {
        return this.position;
    }
}
