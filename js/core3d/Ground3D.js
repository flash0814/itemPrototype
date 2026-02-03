/**
 * Ground3D.js - 地面
 *
 * 25x25 unit 奶白色地面
 */

import * as THREE from 'three';
import { COLORS_3D } from './World3D.js';

export class Ground3D {
    constructor(scene, size = 25) {
        this.scene = scene;
        this.size = size;

        this.createGround();
    }

    createGround() {
        // 地面幾何體
        const geometry = new THREE.PlaneGeometry(this.size, this.size);

        // Toon 材質 - Overcooked 風格
        const material = new THREE.MeshToonMaterial({
            color: COLORS_3D.ground,
            side: THREE.FrontSide
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;  // 水平放置
        this.mesh.position.y = 0;
        this.mesh.receiveShadow = true;

        this.scene.add(this.mesh);
    }

    // 取得地面 mesh（用於 raycasting）
    getMesh() {
        return this.mesh;
    }
}
