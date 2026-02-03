/**
 * Particle3D.js - 3D 粒子
 *
 * 單一粒子物件，支援多種類型（Overcooked 風格）
 */

import * as THREE from 'three';

export class Particle3D {
    constructor(scene, x, y, z, type = 'heal', config = {}) {
        this.scene = scene;
        this.type = type;
        this.life = 0.5 + Math.random() * 0.5;
        this.maxLife = this.life;
        this.isDead = false;

        // 位置（加點隨機偏移）
        this.position = new THREE.Vector3(
            x + (Math.random() - 0.5) * 0.5,
            y + (Math.random() - 0.5) * 0.5,
            z + (Math.random() - 0.5) * 0.5
        );

        // 速度
        this.velocity = new THREE.Vector3(0, 0, 0);

        // 初始化（依類型設定速度、大小、顏色）
        this.initByType(type, config);

        // 建立 mesh
        this.createMesh();
    }

    initByType(type, config) {
        switch (type) {
            case 'heal':
                // 綠色十字上升
                this.velocity.set(
                    (Math.random() - 0.5) * 0.5,
                    1.5 + Math.random() * 1.5,
                    (Math.random() - 0.5) * 0.5
                );
                this.size = 0.12 + Math.random() * 0.04;
                this.color = 0x66ff66;
                this.shape = 'cross';
                this.life = 0.8 + Math.random() * 0.4;
                break;

            case 'smoke':
                // 灰色煙霧（Puff 風格）
                this.velocity.set(
                    (Math.random() - 0.5) * 0.8,
                    0.5 + Math.random() * 0.5,
                    (Math.random() - 0.5) * 0.8
                );
                this.size = 0.15 + Math.random() * 0.1;
                this.color = 0xcccccc;
                this.shape = 'sphere';
                this.life = 0.4 + Math.random() * 0.2;
                this.expandRate = 2;
                break;

            case 'explosion':
                // 橘色爆炸碎片
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 3;
                this.velocity.set(
                    Math.cos(angle) * speed,
                    1 + Math.random() * 2,
                    Math.sin(angle) * speed
                );
                this.size = 0.08 + Math.random() * 0.06;
                this.color = 0xffaa00;
                this.shape = 'sphere';
                this.life = 0.5 + Math.random() * 0.3;
                this.gravity = 8;
                break;

            case 'bombExplosion':
                // 紅色爆炸碎片
                const bAngle = Math.random() * Math.PI * 2;
                const bSpeed = 2.5 + Math.random() * 3.5;
                this.velocity.set(
                    Math.cos(bAngle) * bSpeed,
                    1.5 + Math.random() * 2.5,
                    Math.sin(bAngle) * bSpeed
                );
                this.size = 0.1 + Math.random() * 0.08;
                this.color = 0xff3322;
                this.shape = 'sphere';
                this.life = 0.6 + Math.random() * 0.3;
                this.gravity = 8;
                break;

            case 'meteorImpact':
                // 紅橘火焰碎片
                const mAngle = Math.random() * Math.PI * 2;
                const mSpeed = 3 + Math.random() * 4;
                this.velocity.set(
                    Math.cos(mAngle) * mSpeed,
                    2 + Math.random() * 3,
                    Math.sin(mAngle) * mSpeed
                );
                this.size = 0.12 + Math.random() * 0.1;
                this.color = Math.random() > 0.5 ? 0xff6600 : 0xff3300;
                this.shape = 'sphere';
                this.life = 0.7 + Math.random() * 0.4;
                this.gravity = 6;
                break;

            case 'energy':
                // 金色閃電上升
                this.velocity.set(
                    (Math.random() - 0.5) * 0.4,
                    1.2 + Math.random() * 1.0,
                    (Math.random() - 0.5) * 0.4
                );
                this.size = 0.06 + Math.random() * 0.03;
                this.color = 0xffd700;
                this.shape = 'star';
                this.life = 0.5 + Math.random() * 0.3;
                break;

            case 'damage':
                // 紅色傷害星星
                this.velocity.set(
                    (Math.random() - 0.5) * 0.5,
                    0.8 + Math.random() * 1.2,
                    (Math.random() - 0.5) * 0.5
                );
                this.size = 0.08 + Math.random() * 0.05;
                this.color = 0xff4444;
                this.shape = 'star';
                this.life = 0.4 + Math.random() * 0.2;
                break;

            case 'revive':
                // 青色菱形
                this.velocity.set(
                    (Math.random() - 0.5) * 0.6,
                    (Math.random() - 0.5) * 0.6,
                    (Math.random() - 0.5) * 0.6
                );
                this.size = 0.05 + Math.random() * 0.04;
                this.color = 0x00ffff;
                this.shape = 'diamond';
                this.life = 0.5 + Math.random() * 0.3;
                break;

            case 'invincible':
                // 金色星星環繞
                this.velocity.set(
                    (Math.random() - 0.5) * 0.3,
                    0.5 + Math.random() * 0.5,
                    (Math.random() - 0.5) * 0.3
                );
                this.size = 0.06 + Math.random() * 0.04;
                this.color = 0xffd54f;
                this.shape = 'star';
                this.life = 0.6 + Math.random() * 0.3;
                break;

            case 'confetti':
                // 彩色碎紙
                const cAngle = Math.random() * Math.PI * 2;
                const cSpeed = 1.5 + Math.random() * 2;
                this.velocity.set(
                    Math.cos(cAngle) * cSpeed,
                    2 + Math.random() * 2,
                    Math.sin(cAngle) * cSpeed
                );
                this.size = 0.06 + Math.random() * 0.04;
                // 隨機彩色
                const colors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e1d3, 0xf38181];
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.shape = 'box';
                this.life = 0.8 + Math.random() * 0.4;
                this.gravity = 5;
                this.rotSpeed = 5 + Math.random() * 5;
                break;

            default:
                this.velocity.set(0, 1, 0);
                this.size = 0.1;
                this.color = 0xffffff;
                this.shape = 'sphere';
        }

        this.maxLife = this.life;
    }

    createMesh() {
        let geometry;
        const material = new THREE.MeshBasicMaterial({
            color: this.color,
            transparent: true,
            opacity: 1
        });

        switch (this.shape) {
            case 'cross':
                // 十字（兩個扁盒子）
                this.mesh = new THREE.Group();
                const barGeom = new THREE.BoxGeometry(this.size * 2, this.size * 0.4, this.size * 0.4);
                const bar1 = new THREE.Mesh(barGeom, material);
                const bar2 = new THREE.Mesh(barGeom, material);
                bar2.rotation.z = Math.PI / 2;
                this.mesh.add(bar1);
                this.mesh.add(bar2);
                break;

            case 'star':
                // 簡化星星（八面體）
                geometry = new THREE.OctahedronGeometry(this.size);
                this.mesh = new THREE.Mesh(geometry, material);
                break;

            case 'diamond':
                // 菱形（八面體壓扁）
                geometry = new THREE.OctahedronGeometry(this.size);
                this.mesh = new THREE.Mesh(geometry, material);
                this.mesh.scale.y = 1.5;
                break;

            case 'box':
                geometry = new THREE.BoxGeometry(this.size, this.size * 0.3, this.size);
                this.mesh = new THREE.Mesh(geometry, material);
                break;

            case 'sphere':
            default:
                geometry = new THREE.SphereGeometry(this.size, 8, 8);
                this.mesh = new THREE.Mesh(geometry, material);
                break;
        }

        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }

    update(dt) {
        if (this.isDead) return;

        // 重力
        if (this.gravity) {
            this.velocity.y -= this.gravity * dt;
        }

        // 阻力（爆炸類）
        if (this.type === 'explosion' || this.type === 'bombExplosion' || this.type === 'meteorImpact') {
            this.velocity.multiplyScalar(0.95);
        }

        // 位置更新
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        this.position.z += this.velocity.z * dt;

        // 尺寸變化
        if (this.expandRate) {
            this.size += this.expandRate * dt * 0.1;
            this.mesh.scale.setScalar(1 + (this.maxLife - this.life) * this.expandRate);
        }

        // 旋轉
        if (this.rotSpeed) {
            this.mesh.rotation.x += this.rotSpeed * dt;
            this.mesh.rotation.z += this.rotSpeed * dt * 0.7;
        }

        // 生命倒數
        this.life -= dt;

        // 透明度漸減
        const progress = this.life / this.maxLife;
        if (this.mesh.material) {
            this.mesh.material.opacity = Math.max(0, progress);
        } else if (this.mesh.children) {
            this.mesh.children.forEach(child => {
                if (child.material) child.material.opacity = Math.max(0, progress);
            });
        }

        // 更新位置
        this.mesh.position.copy(this.position);

        // 死亡判定
        if (this.life <= 0 || this.position.y < -1) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        if (this.mesh) {
            this.scene.remove(this.mesh);
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) this.mesh.material.dispose();
        }
    }
}
