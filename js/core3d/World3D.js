/**
 * World3D.js - 3D 場景管理器
 *
 * 負責：
 * - WebGL 渲染器初始化
 * - Scene 管理
 * - Overcooked 風格燈光設置
 */

import * as THREE from 'three';

// Overcooked 風格色板
export const COLORS_3D = {
    // 環境
    sky: 0x87ceeb,
    ground: 0xf5f0e6,
    wall: 0x8b7355,

    // 角色
    player: 0x4fc3f7,
    shield: 0xffd54f,

    // 場景物件
    obstacle: 0x8d6e63,
    fireTrap: 0xff9800,
    fireGlow: 0xffcc02,

    // 道具
    heal: 0x66bb6a,
    healPack: 0xffffff,
    invincible: 0xffd54f,
    energy: 0xffb74d,
    meteor: 0xef5350,
    bomb: 0x424242,
    revive: 0xf5f5f5,

    // 光影
    ambientLight: 0xfff8e1,
    mainLight: 0xfff5e6,
    fillLight: 0xe3f2fd,
};

export class World3D {
    constructor(container) {
        this.container = container;

        // 建立場景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(COLORS_3D.ground);

        // 建立渲染器
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 插入到 container 最前面（在 2D canvas 後面）
        this.container.insertBefore(this.renderer.domElement, this.container.firstChild);

        // 設置 3D canvas 樣式
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '0';

        // 設置燈光
        this.setupLights();

        // 監聽 resize
        window.addEventListener('resize', () => this.onResize());
    }

    setupLights() {
        // 環境光（強，整體明亮 — Overcooked 風格）
        this.ambientLight = new THREE.AmbientLight(COLORS_3D.ambientLight, 0.6);
        this.scene.add(this.ambientLight);

        // 主光（暖白，右上前方，投射陰影）
        this.mainLight = new THREE.DirectionalLight(COLORS_3D.mainLight, 1.0);
        this.mainLight.position.set(10, 15, 10);
        this.mainLight.castShadow = true;

        // 陰影設定
        this.mainLight.shadow.mapSize.width = 2048;
        this.mainLight.shadow.mapSize.height = 2048;
        this.mainLight.shadow.camera.near = 0.5;
        this.mainLight.shadow.camera.far = 50;
        this.mainLight.shadow.camera.left = -20;
        this.mainLight.shadow.camera.right = 20;
        this.mainLight.shadow.camera.top = 20;
        this.mainLight.shadow.camera.bottom = -20;
        this.mainLight.shadow.bias = -0.0001;

        this.scene.add(this.mainLight);

        // 補光（淺藍，左側）
        this.fillLight = new THREE.DirectionalLight(COLORS_3D.fillLight, 0.4);
        this.fillLight.position.set(-10, 8, 0);
        this.scene.add(this.fillLight);

        // 邊緣光（暖白，後方）
        this.rimLight = new THREE.DirectionalLight(0xfff8e1, 0.3);
        this.rimLight.position.set(0, 8, -15);
        this.scene.add(this.rimLight);
    }

    onResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render(camera) {
        if (camera) {
            this.renderer.render(this.scene, camera);
        }
    }

    // 將物件加入場景
    add(object) {
        this.scene.add(object);
    }

    // 從場景移除物件
    remove(object) {
        this.scene.remove(object);
    }

    // 取得場景（供外部使用）
    getScene() {
        return this.scene;
    }

    // 取得渲染器 DOM 元素
    getDomElement() {
        return this.renderer.domElement;
    }
}
