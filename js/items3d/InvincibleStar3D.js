/**
 * InvincibleStar3D.js - 無敵星
 *
 * PASSIVE 道具：撿起獲得無敵 buff
 */

import * as THREE from 'three';
import { ItemBase3D } from './ItemBase3D.js';
import { COLORS_3D } from '../core3d/World3D.js';

export class InvincibleStar3D extends ItemBase3D {
    constructor(scene, x, z, config = {}) {
        super(scene, x, z, {
            type: 'PASSIVE',
            duration: config.duration || 20,
            size: 0.5,
            ...config
        });

        this.buffDuration = config.buffDuration || 5;
        this.createMesh();
    }

    createMesh() {
        this.mesh = new THREE.Group();

        // 五角星（用多個三角形組成）
        const starShape = new THREE.Shape();
        const outerRadius = 0.25;
        const innerRadius = 0.1;
        const points = 5;

        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) {
                starShape.moveTo(x, y);
            } else {
                starShape.lineTo(x, y);
            }
        }
        starShape.closePath();

        const extrudeSettings = { depth: 0.15, bevelEnabled: false };
        const starGeom = new THREE.ExtrudeGeometry(starShape, extrudeSettings);

        const starMat = new THREE.MeshToonMaterial({ color: COLORS_3D.invincible });
        const star = new THREE.Mesh(starGeom, starMat);
        star.rotation.x = Math.PI / 2;
        star.position.y = 0.075;
        star.castShadow = true;
        this.mesh.add(star);

        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }

    onPassiveEffect(player) {
        // 設定無敵狀態
        player.invincibleTimer = this.buffDuration;
        player.isInvincible = true;
        console.log(`InvincibleStar: ${this.buffDuration}s invincibility`);

        // 回調（用於 buff 圖示）
        if (this.onActivate) {
            this.onActivate(this.buffDuration);
        }
    }
}
