/**
 * EnergyDrink3D.js - 能量飲料
 *
 * PASSIVE 道具：撿起獲得能量不消耗 buff
 */

import * as THREE from 'three';
import { ItemBase3D } from './ItemBase3D.js';
import { COLORS_3D } from '../core3d/World3D.js';

export class EnergyDrink3D extends ItemBase3D {
    constructor(scene, x, z, config = {}) {
        super(scene, x, z, {
            type: 'PASSIVE',
            duration: config.duration || 20,
            size: 0.4,
            ...config
        });

        this.instantEnergy = config.instantEnergy || 0;
        this.buffDuration = config.buffDuration || 10;
        this.createMesh();
    }

    createMesh() {
        this.mesh = new THREE.Group();

        // 圓柱罐身
        const canGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.35, 16);
        const canMat = new THREE.MeshToonMaterial({ color: COLORS_3D.energy });
        const can = new THREE.Mesh(canGeom, canMat);
        can.position.y = 0.175;
        can.castShadow = true;
        this.mesh.add(can);

        // 閃電符號（簡化為兩條線）
        const boltMat = new THREE.MeshToonMaterial({ color: 0xffffff });

        const bolt1 = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.15, 0.02),
            boltMat
        );
        bolt1.position.set(0.02, 0.2, 0.11);
        bolt1.rotation.z = 0.3;
        this.mesh.add(bolt1);

        const bolt2 = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.12, 0.02),
            boltMat
        );
        bolt2.position.set(-0.02, 0.15, 0.11);
        bolt2.rotation.z = -0.3;
        this.mesh.add(bolt2);

        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }

    onPassiveEffect(player) {
        // 瞬間回復
        if (this.instantEnergy > 0) {
            player.energy = Math.min(player.maxEnergy, player.energy + this.instantEnergy);
        }

        // 能量不消耗 buff
        player.energyBuffTimer = this.buffDuration;
        player.hasEnergyBuff = true;
        console.log(`EnergyDrink: ${this.buffDuration}s energy buff`);

        // 回調
        if (this.onActivate) {
            this.onActivate(this.buffDuration);
        }
    }
}
