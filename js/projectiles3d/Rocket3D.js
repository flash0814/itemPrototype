/**
 * Rocket3D.js - 火箭
 *
 * 卡通風格火箭 + 火焰尾跡
 */

import * as THREE from 'three';

export class Rocket3D {
    constructor(scene, startPos, direction, config = {}) {
        this.scene = scene;

        // 參數
        this.speed = config.speed || 7.5;         // 7.5 unit/s
        this.damage = config.damage || 15;
        this.explosionRadius = config.radius || 2.2;
        this.lifetime = config.lifetime || 4;     // 4 秒

        // 狀態
        this.position = startPos.clone();
        this.position.y = 0.3;  // 飛行高度
        this.direction = direction.clone().normalize();
        this.direction.y = 0;   // 水平飛行

        this.age = 0;
        this.isDead = false;

        // 建立 mesh
        this.createMesh();

        // 爆炸回調（由外部設定）
        this.onExplode = null;
    }

    createMesh() {
        this.mesh = new THREE.Group();

        // 火箭本體（圓錐 + 圓柱）
        const bodyLength = 0.4;
        const bodyRadius = 0.08;

        // 圓柱體（身體）
        const bodyGeom = new THREE.CylinderGeometry(
            bodyRadius, bodyRadius, bodyLength, 8
        );
        const bodyMat = new THREE.MeshToonMaterial({ color: 0xcccccc });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.rotation.x = Math.PI / 2;  // 橫放
        this.mesh.add(body);

        // 圓錐（頭部）
        const noseGeom = new THREE.ConeGeometry(bodyRadius, 0.15, 8);
        const noseMat = new THREE.MeshToonMaterial({ color: 0xff6b6b });
        const nose = new THREE.Mesh(noseGeom, noseMat);
        nose.rotation.x = -Math.PI / 2;
        nose.position.z = bodyLength / 2 + 0.075;
        this.mesh.add(nose);

        // 尾翼（小三角形）
        const finGeom = new THREE.BoxGeometry(0.02, 0.12, 0.1);
        const finMat = new THREE.MeshToonMaterial({ color: 0xff6b6b });

        for (let i = 0; i < 4; i++) {
            const fin = new THREE.Mesh(finGeom, finMat);
            fin.position.z = -bodyLength / 2 + 0.05;
            fin.rotation.z = (Math.PI / 2) * i;
            fin.position.x = Math.cos((Math.PI / 2) * i) * bodyRadius;
            fin.position.y = Math.sin((Math.PI / 2) * i) * bodyRadius;
            this.mesh.add(fin);
        }

        // 火焰尾跡（簡單的橘色球）
        const flameGeom = new THREE.SphereGeometry(0.06, 8, 8);
        const flameMat = new THREE.MeshBasicMaterial({ color: 0xff9800 });
        this.flame = new THREE.Mesh(flameGeom, flameMat);
        this.flame.position.z = -bodyLength / 2 - 0.05;
        this.mesh.add(this.flame);

        // 設定初始位置和方向
        this.mesh.position.copy(this.position);
        this.updateRotation();

        // 陰影
        body.castShadow = true;

        this.scene.add(this.mesh);
    }

    updateRotation() {
        // 讓火箭面向飛行方向
        const angle = Math.atan2(this.direction.x, this.direction.z);
        this.mesh.rotation.y = angle;
    }

    update(dt, worldSize = 25) {
        if (this.isDead) return;

        // 更新年齡
        this.age += dt;
        if (this.age >= this.lifetime) {
            this.explode();
            return;
        }

        // 移動
        this.position.x += this.direction.x * this.speed * dt;
        this.position.z += this.direction.z * this.speed * dt;

        // 更新 mesh 位置
        this.mesh.position.copy(this.position);

        // 火焰閃爍效果
        this.flame.scale.setScalar(0.8 + Math.random() * 0.4);

        // 邊界檢測
        const halfWorld = worldSize / 2;
        if (Math.abs(this.position.x) > halfWorld ||
            Math.abs(this.position.z) > halfWorld) {
            console.log(`Rocket hit boundary at (${this.position.x.toFixed(2)}, ${this.position.z.toFixed(2)})`);
            this.explode();
        }
    }

    /**
     * 檢查與圓形目標的碰撞
     */
    checkCollision(targetPos, targetRadius) {
        const dx = this.position.x - targetPos.x;
        const dz = this.position.z - targetPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        return dist < targetRadius + 0.1;  // 火箭碰撞半徑約 0.1
    }

    /**
     * 檢查與方形目標的碰撞
     */
    checkBoxCollision(boxPos, boxSize) {
        const halfSize = boxSize / 2;
        return this.position.x >= boxPos.x - halfSize &&
               this.position.x <= boxPos.x + halfSize &&
               this.position.z >= boxPos.z - halfSize &&
               this.position.z <= boxPos.z + halfSize;
    }

    explode() {
        if (this.isDead) return;

        this.isDead = true;

        // 從場景移除
        this.scene.remove(this.mesh);

        // 觸發爆炸回調
        if (this.onExplode) {
            this.onExplode(this.position.clone(), this.explosionRadius, this.damage);
        }
    }

    /**
     * 取得位置
     */
    getPosition() {
        return this.position;
    }
}
