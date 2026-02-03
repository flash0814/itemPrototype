/**
 * Wall3D.js - 邊界牆
 *
 * 四面木質圍牆，Overcooked 風格（圓角）
 */

import * as THREE from 'three';
import { COLORS_3D } from './World3D.js';

export class Wall3D {
    constructor(scene, worldSize = 25) {
        this.scene = scene;
        this.worldSize = worldSize;
        this.wallHeight = 1.5;
        this.wallThickness = 0.4;
        this.cornerRadius = 0.1;

        this.walls = [];
        this.createWalls();
    }

    createWalls() {
        const halfWorld = this.worldSize / 2;
        const material = this.createWallMaterial();

        // 四面牆的配置: [位置X, 位置Z, 旋轉Y, 長度]
        const wallConfigs = [
            // 北牆 (Z-)
            { x: 0, z: -halfWorld - this.wallThickness / 2, rotY: 0, length: this.worldSize + this.wallThickness * 2 },
            // 南牆 (Z+)
            { x: 0, z: halfWorld + this.wallThickness / 2, rotY: 0, length: this.worldSize + this.wallThickness * 2 },
            // 西牆 (X-)
            { x: -halfWorld - this.wallThickness / 2, z: 0, rotY: Math.PI / 2, length: this.worldSize },
            // 東牆 (X+)
            { x: halfWorld + this.wallThickness / 2, z: 0, rotY: Math.PI / 2, length: this.worldSize },
        ];

        wallConfigs.forEach(config => {
            const wall = this.createWall(config.length, material);
            wall.position.set(config.x, this.wallHeight / 2, config.z);
            wall.rotation.y = config.rotY;
            this.scene.add(wall);
            this.walls.push(wall);
        });
    }

    createWallMaterial() {
        return new THREE.MeshToonMaterial({
            color: COLORS_3D.wall
        });
    }

    createWall(length, material) {
        // 使用圓角 BoxGeometry（簡化版：用 segments 模擬）
        // Three.js 原生沒有 RoundedBox，這裡用基本 Box
        // 未來可換成 RoundedBoxGeometry from three/addons
        const geometry = new THREE.BoxGeometry(
            length,
            this.wallHeight,
            this.wallThickness,
            1, 1, 1
        );

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return mesh;
    }

    // 取得所有牆壁（用於碰撞檢測）
    getWalls() {
        return this.walls;
    }

    // 檢查點是否在世界邊界內
    isInsideBounds(x, z, margin = 0) {
        const halfWorld = this.worldSize / 2 - margin;
        return x >= -halfWorld && x <= halfWorld &&
               z >= -halfWorld && z <= halfWorld;
    }

    // 將位置限制在世界邊界內
    clampToBounds(position, margin = 0.3) {
        const halfWorld = this.worldSize / 2 - margin;
        position.x = Math.max(-halfWorld, Math.min(halfWorld, position.x));
        position.z = Math.max(-halfWorld, Math.min(halfWorld, position.z));
        return position;
    }
}
