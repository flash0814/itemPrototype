/**
 * ItemBase3D.js - 道具基類
 *
 * 所有道具的共同行為：物理、撿取、生命週期
 */

import * as THREE from 'three';

export class ItemBase3D {
    constructor(scene, x, z, config = {}) {
        this.scene = scene;

        // 位置與物理
        this.position = new THREE.Vector3(x, config.spawnHeight || 3, z);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.gravity = 10;        // unit/s²
        this.bounciness = 0.4;
        this.groundY = config.groundY || 0.2;  // 落地高度

        // 道具屬性
        this.type = config.type || 'PASSIVE';  // 'PASSIVE' or 'ACTIVE'
        this.size = config.size || 0.4;
        this.pickupRange = config.pickupRange || 0.8;

        // 狀態
        this.isGrounded = false;
        this.isHeld = false;
        this.isActivated = false;
        this.isDead = false;

        // 持續時間（地上時）
        this.duration = config.duration || 0;  // 0 = 永久
        this.durationTimer = 0;

        // 動畫
        this.animTime = 0;
        this.bobSpeed = 2;
        this.bobAmount = 0.1;
        this.rotateSpeed = 1;

        // Mesh（子類覆寫 createMesh）
        this.mesh = null;
    }

    /**
     * 子類覆寫：建立 mesh
     */
    createMesh() {
        // 預設：簡單方塊
        const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);
        const material = new THREE.MeshToonMaterial({ color: 0xffffff });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }

    /**
     * 每幀更新
     */
    update(dt) {
        if (this.isDead) return;
        if (this.isHeld) return;  // 持有時不更新

        this.animTime += dt;

        // 物理（落下）
        if (!this.isGrounded) {
            this.updatePhysics(dt);
        } else {
            // 地上動畫（漂浮 + 旋轉）
            this.updateGroundedAnimation(dt);

            // Duration 計時（只有未啟動且 duration > 0 時）
            if (this.duration > 0 && !this.isActivated) {
                this.durationTimer += dt;
                if (this.durationTimer >= this.duration) {
                    this.die();
                }
            }
        }

        // 同步 mesh 位置
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }

    updatePhysics(dt) {
        // 重力
        this.velocity.y -= this.gravity * dt;

        // 更新位置
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        this.position.z += this.velocity.z * dt;

        // 落地檢測
        if (this.position.y <= this.groundY) {
            this.position.y = this.groundY;

            // 彈跳
            if (Math.abs(this.velocity.y) > 0.5) {
                this.velocity.y *= -this.bounciness;
                this.velocity.x *= 0.8;
                this.velocity.z *= 0.8;
            } else {
                // 停止
                this.velocity.set(0, 0, 0);
                this.isGrounded = true;
                this.onGrounded();
            }
        }
    }

    updateGroundedAnimation(dt) {
        // 上下漂浮
        const bob = Math.sin(this.animTime * this.bobSpeed) * this.bobAmount;
        this.position.y = this.groundY + bob;

        // 旋轉
        if (this.mesh) {
            this.mesh.rotation.y += this.rotateSpeed * dt;
        }
    }

    /**
     * 落地時觸發（子類可覆寫）
     */
    onGrounded() {
        // 子類覆寫
    }

    /**
     * 嘗試撿取
     */
    tryPickup(player) {
        if (this.isDead || this.isHeld || !this.isGrounded) return false;

        const dx = this.position.x - player.position.x;
        const dz = this.position.z - player.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < this.pickupRange) {
            // 撿起回調（用於特效）
            if (this.onPickup) {
                this.onPickup(this.position.clone(), this.type);
            }

            if (this.type === 'PASSIVE') {
                this.onPassiveEffect(player);
                this.die();
                return true;
            } else {
                // ACTIVE：持有
                if (player.heldItem) {
                    // 交換：舊道具掉落
                    player.heldItem.dropToGround(player.position);
                }
                this.isHeld = true;
                this.mesh.visible = false;
                player.heldItem = this;
                return true;
            }
        }
        return false;
    }

    /**
     * PASSIVE 效果（子類覆寫）
     */
    onPassiveEffect(player) {
        // 子類覆寫
    }

    /**
     * ACTIVE 啟動（子類覆寫）
     */
    activate(targetPos) {
        this.isActivated = true;
        this.isHeld = false;
        this.mesh.visible = true;

        // 預設：移動到目標位置上方落下
        this.position.set(targetPos.x, 3, targetPos.z);
        this.velocity.set(0, 0, 0);
        this.isGrounded = false;
    }

    /**
     * 掉落到地面（交換時）
     */
    dropToGround(fromPos) {
        this.isHeld = false;
        this.mesh.visible = true;

        // 從玩家位置拋出
        this.position.set(fromPos.x, 0.5, fromPos.z);

        // 隨機方向拋出
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 2;
        this.velocity.set(
            Math.cos(angle) * speed,
            3,  // 向上
            Math.sin(angle) * speed
        );

        this.isGrounded = false;
        this.gravity = 15;  // 快速落下
    }

    /**
     * 死亡（從場景移除）
     */
    die() {
        if (this.isDead) return;
        this.isDead = true;
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
    }

    /**
     * 取得位置
     */
    getPosition() {
        return this.position;
    }
}
