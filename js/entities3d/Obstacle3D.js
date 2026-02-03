/**
 * Obstacle3D.js - 障礙物
 *
 * 圓角木箱，Overcooked 風格
 */

import * as THREE from 'three';
import { COLORS_3D } from '../core3d/World3D.js';

export class Obstacle3D {
    constructor(scene, x, z, size = 2) {
        this.scene = scene;
        this.position = new THREE.Vector3(x, size / 2, z);
        this.size = size;

        this.createMesh();
    }

    createMesh() {
        // 木箱（使用基本 BoxGeometry，未來可換 RoundedBox）
        const geometry = new THREE.BoxGeometry(
            this.size,
            this.size,
            this.size
        );

        const material = new THREE.MeshToonMaterial({
            color: COLORS_3D.obstacle
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        this.scene.add(this.mesh);
    }

    /**
     * 檢查球體碰撞（玩家）
     * @returns {boolean} 是否碰撞
     */
    checkSphereCollision(spherePos, sphereRadius) {
        // AABB vs Sphere
        const halfSize = this.size / 2;
        const box = {
            minX: this.position.x - halfSize,
            maxX: this.position.x + halfSize,
            minZ: this.position.z - halfSize,
            maxZ: this.position.z + halfSize
        };

        // 找到球心到 box 最近的點
        const closestX = Math.max(box.minX, Math.min(spherePos.x, box.maxX));
        const closestZ = Math.max(box.minZ, Math.min(spherePos.z, box.maxZ));

        // 計算距離
        const dx = spherePos.x - closestX;
        const dz = spherePos.z - closestZ;
        const distSq = dx * dx + dz * dz;

        return distSq < sphereRadius * sphereRadius;
    }

    /**
     * 解決球體碰撞（將球體推出）
     */
    resolveSphereCollision(spherePos, sphereRadius) {
        const halfSize = this.size / 2;
        const box = {
            minX: this.position.x - halfSize,
            maxX: this.position.x + halfSize,
            minZ: this.position.z - halfSize,
            maxZ: this.position.z + halfSize
        };

        // 找到球心到 box 最近的點
        const closestX = Math.max(box.minX, Math.min(spherePos.x, box.maxX));
        const closestZ = Math.max(box.minZ, Math.min(spherePos.z, box.maxZ));

        // 計算距離
        const dx = spherePos.x - closestX;
        const dz = spherePos.z - closestZ;
        const distSq = dx * dx + dz * dz;
        const radiusSq = sphereRadius * sphereRadius;

        if (distSq >= radiusSq) {
            return false;  // 沒有碰撞
        }

        // 有碰撞，計算推出向量
        const dist = Math.sqrt(distSq);

        if (dist > 0.0001) {
            // 正常情況：從最近點推出
            const penetration = sphereRadius - dist;
            const nx = dx / dist;
            const nz = dz / dist;
            spherePos.x += nx * penetration;
            spherePos.z += nz * penetration;
        } else {
            // 球心在 box 內部：找最近的邊推出
            const distToLeft = spherePos.x - box.minX;
            const distToRight = box.maxX - spherePos.x;
            const distToTop = spherePos.z - box.minZ;
            const distToBottom = box.maxZ - spherePos.z;

            const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

            if (minDist === distToLeft) {
                spherePos.x = box.minX - sphereRadius;
            } else if (minDist === distToRight) {
                spherePos.x = box.maxX + sphereRadius;
            } else if (minDist === distToTop) {
                spherePos.z = box.minZ - sphereRadius;
            } else {
                spherePos.z = box.maxZ + sphereRadius;
            }
        }

        return true;
    }

    /**
     * 檢查點是否在障礙物內（火箭用）
     */
    containsPoint(x, z) {
        const halfSize = this.size / 2;
        return x >= this.position.x - halfSize &&
               x <= this.position.x + halfSize &&
               z >= this.position.z - halfSize &&
               z <= this.position.z + halfSize;
    }

    getPosition() {
        return this.position;
    }

    getSize() {
        return this.size;
    }
}
