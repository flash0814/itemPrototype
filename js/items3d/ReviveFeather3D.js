/**
 * ReviveFeather3D.js - 復活羽毛
 *
 * PASSIVE 道具：撿起獲得復活保護（死亡時自動復活）
 */

import * as THREE from 'three';
import { ItemBase3D } from './ItemBase3D.js';
import { COLORS_3D } from '../core3d/World3D.js';

export class ReviveFeather3D extends ItemBase3D {
    constructor(scene, x, z, config = {}) {
        super(scene, x, z, {
            type: 'PASSIVE',
            duration: config.duration || 20,
            size: 0.4,
            ...config
        });

        this.createMesh();
    }

    createMesh() {
        this.mesh = new THREE.Group();

        // 羽毛形狀（橢圓 + 中軸）
        const featherShape = new THREE.Shape();
        featherShape.moveTo(0, -0.2);
        featherShape.quadraticCurveTo(0.12, 0, 0.08, 0.2);
        featherShape.quadraticCurveTo(0, 0.25, 0, 0.25);
        featherShape.quadraticCurveTo(0, 0.25, -0.08, 0.2);
        featherShape.quadraticCurveTo(-0.12, 0, 0, -0.2);

        const extrudeSettings = { depth: 0.03, bevelEnabled: false };
        const featherGeom = new THREE.ExtrudeGeometry(featherShape, extrudeSettings);

        const featherMat = new THREE.MeshToonMaterial({ color: COLORS_3D.revive });
        const feather = new THREE.Mesh(featherGeom, featherMat);
        feather.rotation.x = Math.PI / 2;
        feather.position.y = 0.15;
        feather.castShadow = true;
        this.mesh.add(feather);

        // 中軸
        const stemGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.35, 8);
        const stemMat = new THREE.MeshToonMaterial({ color: 0xcccccc });
        const stem = new THREE.Mesh(stemGeom, stemMat);
        stem.position.y = 0.1;
        this.mesh.add(stem);

        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }

    onPassiveEffect(player) {
        player.hasReviveFeather = true;
        console.log('ReviveFeather: Auto-revive enabled');

        // 回調
        if (this.onActivate) {
            this.onActivate();
        }
    }
}
