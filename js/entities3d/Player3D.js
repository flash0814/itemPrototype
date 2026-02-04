/**
 * Player3D.js - 3D 玩家
 *
 * 膠囊體造型 + 眼睛，Overcooked 風格
 */

import * as THREE from 'three';
import { COLORS_3D } from '../core3d/World3D.js';

export class Player3D {
    constructor(scene, worldSize = 25) {
        this.scene = scene;
        this.worldSize = worldSize;

        // 物理參數
        this.radius = 0.3;
        this.height = 0.8;
        this.speed = 8;  // 8 unit/s

        // 狀態
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = 0;  // Y 軸旋轉（面向）
        this.targetRotation = 0;

        // 遊戲狀態
        this.hp = 250;
        this.maxHp = 250;
        this.energy = 100;
        this.maxEnergy = 100;
        this.energyRegenRate = 15;  // 每秒回復量
        this.maxEnergy = 100;
        this.isDead = false;
        this.heldItem = null;

        // Buff 狀態
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.hasEnergyBuff = false;
        this.energyBuffTimer = 0;
        this.hasReviveFeather = false;

        // 死亡/重生狀態
        this.deathTimer = 0;
        this.reviveTimer = 0;
        this.deathState = 'alive';  // 'alive', 'dying', 'waiting', 'reviving'

        // 輸入狀態
        this.moveInput = { x: 0, z: 0 };

        // 建立 mesh
        this.createMesh();
    }

    createMesh() {
        // 主體容器
        this.mesh = new THREE.Group();

        // 身體：膠囊體 (CapsuleGeometry)
        const bodyGeometry = new THREE.CapsuleGeometry(
            this.radius,      // 半徑
            this.height - this.radius * 2,  // 圓柱部分高度
            8,                // capSegments
            16                // radialSegments
        );
        const bodyMaterial = new THREE.MeshToonMaterial({
            color: COLORS_3D.player
        });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.y = this.height / 2;
        this.body.castShadow = true;
        this.mesh.add(this.body);

        // 眼睛
        this.createEyes();

        // 加入場景
        this.scene.add(this.mesh);
    }

    createEyes() {
        const eyeGeometry = new THREE.SphereGeometry(0.06, 8, 8);
        const eyeMaterial = new THREE.MeshToonMaterial({ color: 0x222222 });

        // 左眼
        this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.leftEye.position.set(-0.1, this.height * 0.65, this.radius * 0.85);
        this.mesh.add(this.leftEye);

        // 右眼
        this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.rightEye.position.set(0.1, this.height * 0.65, this.radius * 0.85);
        this.mesh.add(this.rightEye);
    }

    /**
     * 設定移動輸入（來自鍵盤）
     */
    setMoveInput(x, z) {
        this.moveInput.x = x;
        this.moveInput.z = z;
    }

    /**
     * 設定面向目標（來自滑鼠位置）
     */
    setFacingTarget(targetX, targetZ) {
        const dx = targetX - this.position.x;
        const dz = targetZ - this.position.z;
        if (dx !== 0 || dz !== 0) {
            this.targetRotation = Math.atan2(dx, dz);
        }
    }

    /**
     * 每幀更新
     */
    update(dt) {
        if (this.isDead) return;

        // Buff 計時器
        this.updateBuffs(dt);

        // 移動
        this.updateMovement(dt);

        // 旋轉（平滑追趕目標）
        this.updateRotation(dt);

        // 更新 mesh 位置
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation;
    }

    updateBuffs(dt) {
        // Buff 狀態由 BuffManager3D 管理，這裡不再處理 timer
        // isInvincible, hasEnergyBuff, hasReviveFeather 由 main.js 從 BuffManager3D 同步

        // Energy 自動回復
        if (this.energy < this.maxEnergy) {
            this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegenRate * dt);
        }
    }

    updateMovement(dt) {
        // 計算移動方向
        const inputLength = Math.sqrt(
            this.moveInput.x * this.moveInput.x +
            this.moveInput.z * this.moveInput.z
        );

        if (inputLength > 0) {
            // 正規化輸入
            const nx = this.moveInput.x / inputLength;
            const nz = this.moveInput.z / inputLength;

            // 計算速度
            this.velocity.x = nx * this.speed;
            this.velocity.z = nz * this.speed;

            // 更新位置
            this.position.x += this.velocity.x * dt;
            this.position.z += this.velocity.z * dt;

            // 邊界限制
            this.clampToBounds();
        } else {
            this.velocity.x = 0;
            this.velocity.z = 0;
        }
    }

    updateRotation(dt) {
        // 計算最短旋轉路徑
        let diff = this.targetRotation - this.rotation;

        // 處理 -PI 到 PI 的跨越
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        // 平滑插值（高速響應）
        const rotSpeed = 25;
        this.rotation += diff * Math.min(1, rotSpeed * dt);
    }

    clampToBounds() {
        const margin = this.radius;
        const halfWorld = this.worldSize / 2 - margin;

        this.position.x = Math.max(-halfWorld, Math.min(halfWorld, this.position.x));
        this.position.z = Math.max(-halfWorld, Math.min(halfWorld, this.position.z));
    }

    /**
     * 受傷
     */
    takeDamage(amount) {
        if (this.isDead) return;

        // 無敵時不受傷
        if (this.isInvincible) {
            console.log('Damage blocked by invincibility');
            return;
        }

        this.hp -= amount;
        console.log(`Player took ${amount} damage, HP: ${this.hp}/${this.maxHp}`);

        // 傷害回調（用於浮動數字）
        if (this.onTakeDamage) {
            this.onTakeDamage(this.position.clone(), amount);
        }

        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
    }

    /**
     * 治療
     */
    heal(amount) {
        const oldHp = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        const actualHeal = this.hp - oldHp;
        console.log(`Player healed ${actualHeal}, HP: ${this.hp}/${this.maxHp}`);

        // 治療回調（用於浮動數字）
        if (actualHeal > 0 && this.onHeal) {
            this.onHeal(this.position.clone(), actualHeal);
        }
    }

    /**
     * 死亡
     */
    die() {
        // 檢查復活羽毛（羽毛提供快速復活，不是免死）
        const hadFeather = this.hasReviveFeather;

        this.isDead = true;
        this.deathState = 'dying';
        this.mesh.visible = false;

        // 設定重生等待時間
        if (hadFeather) {
            this.deathTimer = 0;  // 有羽毛：立即開始重生
            console.log('Player died (has feather, instant revive)');
        } else {
            this.deathTimer = 3;  // 無羽毛：等待 3 秒
            console.log('Player died (waiting 3s to revive)');
        }

        // 清除持有道具
        if (this.heldItem) {
            this.heldItem.isDead = true;
            this.heldItem = null;
        }

        // 死亡特效回調
        if (this.onDeath) {
            this.onDeath(this.position.clone(), hadFeather);
        }
    }

    /**
     * 更新死亡狀態（由 main.js 呼叫）
     */
    updateDeath(dt) {
        if (!this.isDead) return false;

        if (this.deathState === 'dying') {
            // 死亡動畫播放中（短暫）
            this.deathState = 'waiting';
        }

        if (this.deathState === 'waiting') {
            this.deathTimer -= dt;
            if (this.deathTimer <= 0) {
                this.deathState = 'reviving';
                this.reviveTimer = 1.0;  // 復活動畫時間
                // 開始重生動畫
                if (this.onReviveStart) {
                    this.onReviveStart(this.position.clone());
                }
            }
        }

        if (this.deathState === 'reviving') {
            // 等待復活動畫完成
            this.reviveTimer -= dt;
            if (this.reviveTimer <= 0) {
                this.completeRevive();
                return true;  // 重生完成
            }
        }

        return false;
    }

    /**
     * 完成重生
     */
    completeRevive() {
        this.isDead = false;
        this.deathState = 'alive';
        this.hp = this.maxHp;
        this.energy = this.maxEnergy;
        this.mesh.visible = true;

        console.log('Player revived!');

        // 重生特效回調
        if (this.onRevive) {
            this.onRevive(this.position.clone());
        }
    }

    /**
     * 強制復活（外部呼叫）
     */
    revive(x = 0, z = 0) {
        this.position.set(x, 0, z);
        this.completeRevive();
    }

    /**
     * 取得位置（供攝影機等使用）
     */
    getPosition() {
        return this.position;
    }

    /**
     * 取得 mesh
     */
    getMesh() {
        return this.mesh;
    }
}
