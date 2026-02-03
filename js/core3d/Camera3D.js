/**
 * Camera3D.js - 3D 攝影機系統
 *
 * 65° 俯視角攝影機 + zoom 系統
 */

import * as THREE from 'three';

export class Camera3D {
    constructor(aspect) {
        // 攝影機參數
        this.fov = 50;
        this.pitch = 65 * Math.PI / 180;  // 65° 俯視角
        this.baseDistance = 20;

        // Zoom 系統
        this.zoom = 1.0;
        this.targetZoom = 1.0;
        this.zoomMin = 0.3;
        this.zoomMax = 3.0;
        this.zoomStep = 0.1;
        this.zoomLerpSpeed = 8;

        // Auto zoom（瞄準時用）
        this.autoZoom = {
            active: false,
            startZoom: 1,
            endZoom: 1,
            duration: 1,
            elapsed: 0
        };
        this.prevZoom = 1.0;  // 記錄 auto zoom 前的 zoom

        // 目標位置（跟隨玩家）
        this.target = new THREE.Vector3(0, 0, 0);

        // 建立 Three.js 攝影機
        this.camera = new THREE.PerspectiveCamera(
            this.fov,
            aspect,
            0.1,
            1000
        );

        // 初始位置
        this.updateCameraPosition();
    }

    /**
     * 設定跟隨目標
     */
    setTarget(x, y, z) {
        this.target.set(x, y, z);
    }

    /**
     * 計算並更新攝影機位置
     */
    updateCameraPosition() {
        const distance = this.baseDistance / this.zoom;

        // 計算攝影機位置（65° 俯視）
        const offsetY = Math.sin(this.pitch) * distance;
        const offsetZ = Math.cos(this.pitch) * distance;

        this.camera.position.set(
            this.target.x,
            this.target.y + offsetY,
            this.target.z + offsetZ
        );

        this.camera.lookAt(this.target);
    }

    /**
     * 滾輪縮放
     * @param {number} delta - 正值縮小，負值放大
     */
    applyZoom(delta) {
        if (this.autoZoom.active) return;

        if (delta > 0) {
            this.targetZoom = Math.max(this.zoomMin, this.targetZoom - this.zoomStep);
        } else {
            this.targetZoom = Math.min(this.zoomMax, this.targetZoom + this.zoomStep);
        }

        // 確保精確小數
        this.targetZoom = Math.round(this.targetZoom * 100) / 100;
    }

    /**
     * 每幀更新 zoom 動畫
     */
    updateZoom(dt) {
        // Auto zoom 動畫
        if (this.autoZoom.active) {
            this.autoZoom.elapsed += dt;
            const t = Math.min(this.autoZoom.elapsed / this.autoZoom.duration, 1);

            // Smoothstep ease-in-out
            const smoothT = t * t * (3 - 2 * t);
            this.zoom = this.autoZoom.startZoom +
                (this.autoZoom.endZoom - this.autoZoom.startZoom) * smoothT;

            if (t >= 1) {
                this.autoZoom.active = false;
            }
        } else {
            // 平滑追趕 targetZoom
            const lerpFactor = 1 - Math.exp(-this.zoomLerpSpeed * dt);
            this.zoom += (this.targetZoom - this.zoom) * lerpFactor;
        }
    }

    /**
     * 啟動 auto zoom（用於瞄準模式）
     */
    startAutoZoom(targetZoom, duration = 1.0) {
        this.prevZoom = this.targetZoom;
        this.autoZoom.active = true;
        this.autoZoom.startZoom = this.zoom;
        this.autoZoom.endZoom = targetZoom;
        this.autoZoom.duration = duration;
        this.autoZoom.elapsed = 0;
    }

    /**
     * 返回正常 zoom
     */
    returnToNormalZoom(duration = 1.0) {
        this.autoZoom.active = true;
        this.autoZoom.startZoom = this.zoom;
        this.autoZoom.endZoom = this.prevZoom;
        this.autoZoom.duration = duration;
        this.autoZoom.elapsed = 0;
    }

    /**
     * 計算讓指定半徑完全可見所需的 zoom
     */
    calcZoomForRadius(radius) {
        const vFov = this.fov * Math.PI / 180;
        const visibleHeight = 2 * Math.tan(vFov / 2) * this.baseDistance;
        const neededZoom = visibleHeight / (radius * 2.5);
        return Math.max(0.1, neededZoom);
    }

    /**
     * 每幀更新
     */
    update(dt) {
        this.updateZoom(dt);
        this.updateCameraPosition();
    }

    /**
     * 處理視窗 resize
     */
    onResize(aspect) {
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    }

    /**
     * 取得 Three.js 攝影機實例
     */
    getCamera() {
        return this.camera;
    }
}
