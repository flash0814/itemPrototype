/**
 * Rocket3D.js - 火箭
 *
 * 卡通風格火箭 + 明顯尾焰 + 拖尾煙霧
 */

import * as THREE from 'three';

/**
 * 煙霧粒子（拖尾用）
 */
class SmokeParticle {
    constructor(scene, position) {
        this.scene = scene;
        this.life = 0.4 + Math.random() * 0.2;
        this.maxLife = this.life;
        this.isDead = false;

        // 初始大小
        this.size = 0.06 + Math.random() * 0.03;
        this.expandRate = 0.15;

        // 速度（輕微飄動）
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            0.2 + Math.random() * 0.2,
            (Math.random() - 0.5) * 0.3
        );

        // 創建 mesh
        const geometry = new THREE.SphereGeometry(this.size, 6, 6);
        const material = new THREE.MeshBasicMaterial({
            color: 0xaaaaaa,
            transparent: true,
            opacity: 0.6
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.scene.add(this.mesh);
    }

    update(dt) {
        if (this.isDead) return;

        this.life -= dt;

        // 移動
        this.mesh.position.x += this.velocity.x * dt;
        this.mesh.position.y += this.velocity.y * dt;
        this.mesh.position.z += this.velocity.z * dt;

        // 擴大
        const scale = 1 + (this.maxLife - this.life) * this.expandRate * 8;
        this.mesh.scale.setScalar(scale);

        // 淡出
        const progress = this.life / this.maxLife;
        this.mesh.material.opacity = 0.5 * progress;

        if (this.life <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}

export class Rocket3D {
    constructor(scene, startPos, direction, config = {}) {
        this.scene = scene;

        // 參數
        this.speed = config.speed || 7.5;
        this.damage = config.damage || 15;
        this.explosionRadius = config.radius || 2.2;
        this.lifetime = config.lifetime || 4;

        // 狀態
        this.position = startPos.clone();
        this.position.y = 0.3;
        this.direction = direction.clone().normalize();
        this.direction.y = 0;

        this.age = 0;
        this.isDead = false;

        // 拖尾煙霧
        this.smokeParticles = [];
        this.smokeTimer = 0;
        this.smokeInterval = 0.03;  // 每 0.03 秒生成一個

        // 建立 mesh
        this.createMesh();

        // 爆炸回調
        this.onExplode = null;
    }

    createMesh() {
        this.mesh = new THREE.Group();

        // 火箭尺寸
        const bodyLength = 0.45;
        const bodyRadius = 0.07;
        const noseLength = 0.2;

        // ===== 1. 尖頭（最前方，+Z 方向）=====
        const noseGeom = new THREE.ConeGeometry(bodyRadius, noseLength, 12);
        const noseMat = new THREE.MeshToonMaterial({ color: 0xe53935 });
        const nose = new THREE.Mesh(noseGeom, noseMat);
        nose.rotation.x = Math.PI / 2;  // 尖端朝 +Z（底部朝 -Z）
        nose.position.z = bodyLength / 2 + noseLength / 2;
        nose.castShadow = true;
        this.mesh.add(nose);

        // ===== 2. 身體（中間）=====
        // 主體圓柱（軍綠色/橄欖色）
        const bodyGeom = new THREE.CylinderGeometry(
            bodyRadius, bodyRadius, bodyLength, 12
        );
        const bodyMat = new THREE.MeshToonMaterial({ color: 0x6b8e23 });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.rotation.x = Math.PI / 2;
        body.castShadow = true;
        this.mesh.add(body);

        // 紅色警示條紋
        const stripeGeom = new THREE.CylinderGeometry(
            bodyRadius + 0.003, bodyRadius + 0.003, 0.04, 12
        );
        const stripeMat = new THREE.MeshToonMaterial({ color: 0xe53935 });

        const stripe1 = new THREE.Mesh(stripeGeom, stripeMat);
        stripe1.rotation.x = Math.PI / 2;
        stripe1.position.z = bodyLength * 0.2;
        this.mesh.add(stripe1);

        // ===== 3. 尾翼（後方，-Z 方向）=====
        const finLength = 0.1;
        const finHeight = 0.12;
        const finThickness = 0.015;

        // 梯形尾翼
        const finShape = new THREE.Shape();
        finShape.moveTo(0, 0);
        finShape.lineTo(finLength, 0);
        finShape.lineTo(finLength * 0.6, finHeight);
        finShape.lineTo(0, finHeight);
        finShape.closePath();

        const finGeom = new THREE.ExtrudeGeometry(finShape, {
            depth: finThickness,
            bevelEnabled: false
        });
        const finMat = new THREE.MeshToonMaterial({ color: 0xe53935 });

        for (let i = 0; i < 4; i++) {
            const fin = new THREE.Mesh(finGeom, finMat);

            // 旋轉到正確朝向
            fin.rotation.x = -Math.PI / 2;
            fin.rotation.y = (Math.PI / 2) * i;

            // 放置在尾部
            fin.position.z = -bodyLength / 2;

            // 偏移到圓柱外側
            const angle = (Math.PI / 2) * i + Math.PI / 4;
            fin.position.x = Math.cos(angle) * bodyRadius * 0.5;
            fin.position.y = Math.sin(angle) * bodyRadius * 0.5;

            this.mesh.add(fin);
        }

        // 尾部收口（小圓錐）
        const tailCapGeom = new THREE.CylinderGeometry(
            bodyRadius * 0.6, bodyRadius, 0.08, 12
        );
        const tailCapMat = new THREE.MeshToonMaterial({ color: 0x555555 });
        const tailCap = new THREE.Mesh(tailCapGeom, tailCapMat);
        tailCap.rotation.x = Math.PI / 2;
        tailCap.position.z = -bodyLength / 2 - 0.04;
        this.mesh.add(tailCap);

        // ===== 4. 尾焰系統（最後方）=====
        this.createFlameSystem(bodyLength);

        // 設定位置和方向
        this.mesh.position.copy(this.position);
        this.updateRotation();

        this.scene.add(this.mesh);
    }

    createFlameSystem(bodyLength) {
        // 火焰容器
        this.flameGroup = new THREE.Group();
        this.flameGroup.position.z = -bodyLength / 2 - 0.05;
        this.mesh.add(this.flameGroup);

        // 內焰（亮黃色，小而亮）
        const innerGeom = new THREE.SphereGeometry(0.05, 8, 8);
        innerGeom.scale(1, 1, 1.5);  // 拉長
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 1
        });
        this.innerFlame = new THREE.Mesh(innerGeom, innerMat);
        this.innerFlame.position.z = -0.02;
        this.flameGroup.add(this.innerFlame);

        // 中焰（橘黃色）
        const midGeom = new THREE.SphereGeometry(0.07, 8, 8);
        midGeom.scale(1, 1, 1.8);
        const midMat = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.85
        });
        this.midFlame = new THREE.Mesh(midGeom, midMat);
        this.midFlame.position.z = -0.06;
        this.flameGroup.add(this.midFlame);

        // 外焰（橘紅色，最大）
        const outerGeom = new THREE.SphereGeometry(0.09, 8, 8);
        outerGeom.scale(1, 1, 2);
        const outerMat = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.6
        });
        this.outerFlame = new THREE.Mesh(outerGeom, outerMat);
        this.outerFlame.position.z = -0.12;
        this.flameGroup.add(this.outerFlame);

        // 火焰尖端（錐形）
        const tipGeom = new THREE.ConeGeometry(0.04, 0.15, 8);
        const tipMat = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            transparent: true,
            opacity: 0.5
        });
        this.flameTip = new THREE.Mesh(tipGeom, tipMat);
        this.flameTip.rotation.x = Math.PI / 2;
        this.flameTip.position.z = -0.22;
        this.flameGroup.add(this.flameTip);

        // 點光源（照亮周圍）
        this.flameLight = new THREE.PointLight(0xff6600, 0.8, 2);
        this.flameLight.position.z = -0.1;
        this.flameGroup.add(this.flameLight);
    }

    updateRotation() {
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

        // ===== 火焰動畫 =====
        this.updateFlame(dt);

        // ===== 拖尾煙霧 =====
        this.updateSmoke(dt);

        // 邊界檢測
        const halfWorld = worldSize / 2;
        if (Math.abs(this.position.x) > halfWorld ||
            Math.abs(this.position.z) > halfWorld) {
            this.explode();
        }
    }

    updateFlame(dt) {
        const time = this.age * 20;

        // 內焰：快速閃爍
        const innerScale = 0.8 + Math.sin(time * 3) * 0.2 + Math.random() * 0.1;
        this.innerFlame.scale.setScalar(innerScale);

        // 中焰：中速脈動
        const midScale = 0.85 + Math.sin(time * 2) * 0.15 + Math.random() * 0.1;
        this.midFlame.scale.set(midScale, midScale, midScale * 1.2);

        // 外焰：慢速呼吸
        const outerScale = 0.9 + Math.sin(time * 1.5) * 0.1 + Math.random() * 0.15;
        this.outerFlame.scale.set(outerScale, outerScale, outerScale * 1.3);

        // 火焰尖端：抖動
        const tipScale = 0.7 + Math.random() * 0.5;
        this.flameTip.scale.set(tipScale, tipScale * (0.8 + Math.random() * 0.4), tipScale);
        this.flameTip.position.z = -0.22 - Math.random() * 0.05;

        // 光源強度
        this.flameLight.intensity = 0.6 + Math.random() * 0.4;
    }

    updateSmoke(dt) {
        // 生成煙霧
        this.smokeTimer += dt;
        if (this.smokeTimer >= this.smokeInterval) {
            this.smokeTimer = 0;

            // 計算煙霧生成位置（火箭後方）
            const smokePos = this.position.clone();
            smokePos.x -= this.direction.x * 0.35;
            smokePos.z -= this.direction.z * 0.35;
            smokePos.y += (Math.random() - 0.5) * 0.05;

            const smoke = new SmokeParticle(this.scene, smokePos);
            this.smokeParticles.push(smoke);
        }

        // 更新煙霧粒子
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const p = this.smokeParticles[i];
            p.update(dt);
            if (p.isDead) {
                this.smokeParticles.splice(i, 1);
            }
        }
    }

    checkCollision(targetPos, targetRadius) {
        const dx = this.position.x - targetPos.x;
        const dz = this.position.z - targetPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        return dist < targetRadius + 0.1;
    }

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

        // 清除煙霧粒子
        this.smokeParticles.forEach(p => p.die());
        this.smokeParticles = [];

        // 從場景移除
        this.scene.remove(this.mesh);

        // 釋放資源
        this.mesh.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });

        // 觸發爆炸回調
        if (this.onExplode) {
            this.onExplode(this.position.clone(), this.explosionRadius, this.damage);
        }
    }

    getPosition() {
        return this.position;
    }
}
