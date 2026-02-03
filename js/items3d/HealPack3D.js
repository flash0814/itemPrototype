/**
 * HealPack3D.js - 補血包
 *
 * PASSIVE 道具：走近自動撿取，立即補血
 */

import * as THREE from 'three';
import { ItemBase3D } from './ItemBase3D.js';
import { COLORS_3D } from '../core3d/World3D.js';

export class HealPack3D extends ItemBase3D {
    constructor(scene, x, z, config = {}) {
        super(scene, x, z, {
            type: 'PASSIVE',
            duration: config.duration || 30,  // 30 秒後消失
            size: 0.4,
            ...config
        });

        this.healAmount = config.healAmount || 30;
        this.createMesh();
    }

    createMesh() {
        this.mesh = new THREE.Group();

        // 白色圓角盒子（用 BoxGeometry 模擬）
        const boxGeom = new THREE.BoxGeometry(0.35, 0.25, 0.35);
        const boxMat = new THREE.MeshToonMaterial({ color: COLORS_3D.healPack });
        const box = new THREE.Mesh(boxGeom, boxMat);
        box.castShadow = true;
        this.mesh.add(box);

        // 紅色十字
        const crossMat = new THREE.MeshToonMaterial({ color: 0xff0000 });

        // 橫條
        const crossH = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.06, 0.06),
            crossMat
        );
        crossH.position.y = 0.13;
        this.mesh.add(crossH);

        // 豎條
        const crossV = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.06, 0.2),
            crossMat
        );
        crossV.position.y = 0.13;
        this.mesh.add(crossV);

        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }

    onPassiveEffect(player) {
        player.heal(this.healAmount);
        console.log(`HealPack: +${this.healAmount} HP`);
        // TODO: Phase 11 加入治療粒子效果
    }
}
