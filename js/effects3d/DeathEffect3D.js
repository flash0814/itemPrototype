/**
 * DeathEffect3D.js - 死亡/復活特效
 *
 * 玩家死亡時分裂成碎片，落地停留
 * 復活時碎片合回變成角色
 */

import * as THREE from 'three';
import { COLORS_3D } from '../core3d/World3D.js';

/**
 * 單一碎片
 */
class Shard {
    constructor(scene, position, velocity, size, color) {
        this.scene = scene;

        // 物理狀態
        this.position = position.clone();
        this.velocity = velocity.clone();
        this.angularVelocity = new THREE.Vector3(
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15
        );

        // 物理參數
        this.gravity = 18;
        this.bounciness = 0.4 + Math.random() * 0.2;  // 彈跳係數
        this.friction = 0.7;   // 地面摩擦
        this.groundY = size / 2;  // 地面高度（碎片半高）

        // 狀態
        this.isGrounded = false;
        this.bounceCount = 0;
        this.maxBounces = 2 + Math.floor(Math.random() * 2);

        // 復活用的目標位置（原始位置）
        this.originPosition = position.clone();
        this.targetPosition = null;
        this.assembleProgress = 0;

        // 建立 mesh
        this.createMesh(size, color);
    }

    createMesh(size, color) {
        // 不規則碎片（隨機比例的 box）
        const scaleX = 0.7 + Math.random() * 0.6;
        const scaleY = 0.7 + Math.random() * 0.6;
        const scaleZ = 0.7 + Math.random() * 0.6;

        const geometry = new THREE.BoxGeometry(
            size * scaleX,
            size * scaleY,
            size * scaleZ
        );

        // 實體材質（低透明度）
        const material = new THREE.MeshToonMaterial({
            color: color,
            transparent: true,
            opacity: 0.95
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;

        this.scene.add(this.mesh);
    }

    /**
     * 物理更新（死亡階段：落地彈跳）
     */
    updatePhysics(dt) {
        if (this.isGrounded) return;

        // 重力
        this.velocity.y -= this.gravity * dt;

        // 空氣阻力
        this.velocity.multiplyScalar(0.995);

        // 位置更新
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        this.position.z += this.velocity.z * dt;

        // 旋轉更新
        this.mesh.rotation.x += this.angularVelocity.x * dt;
        this.mesh.rotation.y += this.angularVelocity.y * dt;
        this.mesh.rotation.z += this.angularVelocity.z * dt;

        // 地面碰撞
        if (this.position.y <= this.groundY) {
            this.position.y = this.groundY;

            if (this.bounceCount < this.maxBounces && Math.abs(this.velocity.y) > 0.5) {
                // 彈跳
                this.velocity.y = -this.velocity.y * this.bounciness;
                this.velocity.x *= this.friction;
                this.velocity.z *= this.friction;
                this.angularVelocity.multiplyScalar(0.6);
                this.bounceCount++;
            } else {
                // 停止
                this.isGrounded = true;
                this.velocity.set(0, 0, 0);
                this.angularVelocity.set(0, 0, 0);
            }
        }

        // 更新 mesh
        this.mesh.position.copy(this.position);
    }

    /**
     * 復活動畫更新（碎片合回）
     */
    updateAssemble(dt, targetPos, progress) {
        this.targetPosition = targetPos;
        this.assembleProgress = progress;

        // 使用 easing 讓動畫更有彈性
        const eased = this.easeOutBack(progress);

        // 插值位置
        this.position.lerpVectors(
            this.mesh.position.clone(),  // 當前停留位置
            this.targetPosition,
            eased * 0.15  // 每幀移動一點
        );

        // 旋轉回正
        this.mesh.rotation.x *= 0.92;
        this.mesh.rotation.y *= 0.92;
        this.mesh.rotation.z *= 0.92;

        // 縮放動畫（後期縮小消失）
        if (progress > 0.7) {
            const shrink = 1 - (progress - 0.7) / 0.3;
            this.mesh.scale.setScalar(Math.max(0.01, shrink));
        }

        // 透明度（後期漸隱）
        if (progress > 0.8 && this.mesh.material) {
            this.mesh.material.opacity = Math.max(0, 1 - (progress - 0.8) / 0.2);
        }

        this.mesh.position.copy(this.position);
    }

    easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) this.mesh.material.dispose();
        }
    }
}

/**
 * 死亡特效管理器
 */
export class DeathEffect3D {
    constructor(scene) {
        this.scene = scene;

        // 狀態
        this.state = 'idle';  // 'idle', 'dying', 'waiting', 'reviving', 'done'
        this.shards = [];
        this.timer = 0;

        // 配置
        this.shardCount = 12;
        this.shardSize = 0.12;
        this.explosionForce = 4;
        this.reviveDuration = 0.8;

        // 位置
        this.deathPosition = new THREE.Vector3();
        this.revivePosition = new THREE.Vector3();

        // 回調
        this.onReviveComplete = null;

        // 復活光柱
        this.reviveBeam = null;
        this.reviveRing = null;
    }

    /**
     * 開始死亡效果
     */
    startDeath(position, playerColor = COLORS_3D.player) {
        this.deathPosition.copy(position);
        this.state = 'dying';
        this.timer = 0;

        // 清除舊碎片
        this.clearShards();

        // 生成碎片
        this.createShards(position, playerColor);
    }

    /**
     * 生成碎片
     */
    createShards(position, color) {
        for (let i = 0; i < this.shardCount; i++) {
            // 隨機爆炸方向
            const angle = (i / this.shardCount) * Math.PI * 2 + Math.random() * 0.3;
            const upAngle = Math.random() * Math.PI * 0.4 + 0.2;  // 向上偏移

            const speed = this.explosionForce * (0.7 + Math.random() * 0.6);

            const velocity = new THREE.Vector3(
                Math.cos(angle) * Math.cos(upAngle) * speed,
                Math.sin(upAngle) * speed * 1.5,  // 向上多一點
                Math.sin(angle) * Math.cos(upAngle) * speed
            );

            // 起始位置（從角色中心稍微偏移）
            const startPos = new THREE.Vector3(
                position.x + (Math.random() - 0.5) * 0.3,
                position.y + 0.3 + Math.random() * 0.4,  // 從身體中間爆開
                position.z + (Math.random() - 0.5) * 0.3
            );

            // 隨機稍微變化顏色
            const colorVariation = new THREE.Color(color);
            colorVariation.offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);

            const shard = new Shard(
                this.scene,
                startPos,
                velocity,
                this.shardSize,
                colorVariation
            );

            this.shards.push(shard);
        }
    }

    /**
     * 開始復活效果
     */
    startRevive(position) {
        this.revivePosition.copy(position);
        this.state = 'reviving';
        this.timer = 0;

        // 記錄碎片當前位置作為起點
        this.shards.forEach(shard => {
            shard.originPosition = shard.position.clone();
            shard.isGrounded = false;  // 解除地面狀態
        });

        // 創建復活光柱
        this.createReviveBeam(position);
    }

    /**
     * 創建復活光柱
     */
    createReviveBeam(position) {
        // 光柱
        const beamGeom = new THREE.CylinderGeometry(0.3, 0.5, 3, 16, 1, true);
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        this.reviveBeam = new THREE.Mesh(beamGeom, beamMat);
        this.reviveBeam.position.set(position.x, 1.5, position.z);
        this.scene.add(this.reviveBeam);

        // 地面光圈
        const ringGeom = new THREE.RingGeometry(0.3, 0.8, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        this.reviveRing = new THREE.Mesh(ringGeom, ringMat);
        this.reviveRing.rotation.x = -Math.PI / 2;
        this.reviveRing.position.set(position.x, 0.02, position.z);
        this.scene.add(this.reviveRing);
    }

    /**
     * 清除復活特效
     */
    clearReviveEffects() {
        if (this.reviveBeam) {
            this.scene.remove(this.reviveBeam);
            this.reviveBeam.geometry.dispose();
            this.reviveBeam.material.dispose();
            this.reviveBeam = null;
        }
        if (this.reviveRing) {
            this.scene.remove(this.reviveRing);
            this.reviveRing.geometry.dispose();
            this.reviveRing.material.dispose();
            this.reviveRing = null;
        }
    }

    /**
     * 更新
     */
    update(dt) {
        switch (this.state) {
            case 'dying':
                this.updateDying(dt);
                break;
            case 'waiting':
                // 碎片已落地，等待復活指令
                break;
            case 'reviving':
                this.updateReviving(dt);
                break;
        }
    }

    /**
     * 更新死亡動畫
     */
    updateDying(dt) {
        this.timer += dt;

        // 更新碎片物理
        let allGrounded = true;
        this.shards.forEach(shard => {
            shard.updatePhysics(dt);
            if (!shard.isGrounded) allGrounded = false;
        });

        // 所有碎片落地後進入等待狀態
        if (allGrounded || this.timer > 2) {
            this.state = 'waiting';
        }
    }

    /**
     * 更新復活動畫
     */
    updateReviving(dt) {
        this.timer += dt;
        const progress = Math.min(1, this.timer / this.reviveDuration);

        // 目標位置（角色中心）
        const targetPos = new THREE.Vector3(
            this.revivePosition.x,
            this.revivePosition.y + 0.4,
            this.revivePosition.z
        );

        // 更新碎片
        this.shards.forEach(shard => {
            shard.updateAssemble(dt, targetPos, progress);
        });

        // 更新光柱效果
        if (this.reviveBeam) {
            // 光柱旋轉
            this.reviveBeam.rotation.y += dt * 3;

            // 透明度脈衝
            const pulse = 0.3 + Math.sin(this.timer * 10) * 0.15;
            this.reviveBeam.material.opacity = pulse * (1 - progress * 0.5);

            // 縮小
            const scale = 1 + (1 - progress) * 0.5;
            this.reviveBeam.scale.set(scale, 1, scale);
        }

        if (this.reviveRing) {
            // 光圈旋轉
            this.reviveRing.rotation.z += dt * 2;

            // 透明度
            this.reviveRing.material.opacity = 0.6 * (1 - progress);

            // 擴大
            const scale = 1 + progress * 2;
            this.reviveRing.scale.set(scale, scale, 1);
        }

        // 完成
        if (progress >= 1) {
            this.state = 'done';
            this.clearShards();
            this.clearReviveEffects();

            if (this.onReviveComplete) {
                this.onReviveComplete();
            }
        }
    }

    /**
     * 清除碎片
     */
    clearShards() {
        this.shards.forEach(shard => shard.dispose());
        this.shards = [];
    }

    /**
     * 完全重置
     */
    reset() {
        this.clearShards();
        this.clearReviveEffects();
        this.state = 'idle';
        this.timer = 0;
    }

    /**
     * 是否處於死亡/等待狀態
     */
    isActive() {
        return this.state !== 'idle' && this.state !== 'done';
    }

    /**
     * 是否等待復活
     */
    isWaitingRevive() {
        return this.state === 'waiting';
    }
}
