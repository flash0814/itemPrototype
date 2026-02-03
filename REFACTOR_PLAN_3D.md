# 2D → 原生 3D 重構計畫（詳細版）

## 目標

將現有 2D Canvas 遊戲完全重構為 **原生 Three.js 3D 遊戲**。
- 遊戲邏輯使用 3D 座標系統（非 2D 邏輯 + 3D 渲染層）
- 視覺風格：**Overcooked 卡通風**（明亮、圓潤、玩具質感）
- 保留所有現有功能、系統、操作方式
- **最優化架構**：為未來開發奠定良好基礎

---

## 設計原則

### 原生 3D 架構
```
❌ 錯誤：2D 邏輯 (px) → 轉換 → 3D 渲染
✅ 正確：3D 邏輯 (unit) → 直接 → 3D 渲染
```

### 保留的設計模式
- **GameState 中央狀態容器**：所有模組共享狀態，避免循環依賴
- **Flag-based 實體生命週期**：實體留在陣列中，用 flag 控制行為
- **BuffManager 統一管理**：所有 buff 集中處理

### 忽略的 2D 遺留
- 現有 `ItemBase.js` 的半 3D 物理（z, vz, gravity）— 重新設計原生 3D 物理
- 所有 px 單位 — 全部換為 3D unit

---

## 座標系統定義

### 3D World Coordinate
```
Origin: 世界中心地面 (0, 0, 0)
X 軸: 右為正（東）
Y 軸: 上為正（高度）
Z 軸: 前為正（南，朝向攝影機）

世界範圍:
  X: -12.5 ~ +12.5 (25 unit 寬)
  Y: 0 ~ 無上限 (高度)
  Z: -12.5 ~ +12.5 (25 unit 深)
```

### 單位系統
```js
// 1 unit ≈ 1 公尺（概念上）
const UNIT = {
    // 世界
    worldSize: 25,           // 地面邊長
    wallHeight: 1.5,         // 邊界牆高度
    wallThickness: 0.3,      // 牆厚度

    // 玩家
    playerRadius: 0.3,       // 玩家碰撞球半徑
    playerHeight: 0.8,       // 玩家 mesh 高度
    playerSpeed: 8,          // 移動速度 unit/s

    // 道具
    itemSize: 0.4,           // 道具基準大小
    itemSpawnHeight: 3,      // 道具生成高度
    itemFallSpeed: 5,        // 落下速度
    pickupRange: 0.6,        // 撿取距離

    // 攻擊
    rocketSpeed: 15,         // 火箭速度 unit/s
    rocketSize: 0.3,         // 火箭長度
    explosionRadius: 2.2,    // 爆炸半徑

    // 瞄準
    minAimRadius: 4,         // 最小瞄準半徑
    maxAimRadius: 13,        // 最大瞄準半徑

    // 障礙物
    obstacleSize: 2,         // 障礙物邊長
    fireTrapSize: 1,         // 火焰陷阱邊長
};
```

---

## Overcooked 視覺風格

### 色板
```js
const COLORS_3D = {
    // 環境
    sky: 0x87ceeb,           // 淺藍天空
    ground: 0xf5f0e6,        // 奶白地面
    wall: 0x8b7355,          // 木質棕牆

    // 角色
    player: 0x4fc3f7,        // 明亮天藍
    shield: 0xffd54f,        // 金黃護盾

    // 場景物件
    obstacle: 0x8d6e63,      // 木箱棕
    fireTrap: 0xff9800,      // 暖橘火焰
    fireGlow: 0xffcc02,      // 火焰高光

    // 道具
    heal: 0x66bb6a,          // 柔和綠
    healPack: 0xffffff,      // 白色（紅十字）
    invincible: 0xffd54f,    // 暖金黃
    energy: 0xffb74d,        // 柔橘金
    meteor: 0xef5350,        // 柔紅
    bomb: 0x424242,          // 深灰黑
    revive: 0xf5f5f5,        // 亮白

    // 光影
    ambientLight: 0xfff8e1,  // 暖白環境光
    mainLight: 0xfff5e6,     // 暖白主光
    fillLight: 0xe3f2fd,     // 淺藍補光
};
```

### 造型原則
- **圓角**：所有邊角 bevel/fillet，無銳角
- **矮胖**：高度壓縮，寬度加大
- **Chunky**：有份量感，不薄片
- **極簡**：去除不必要細節

### 材質
```js
// 主要：MeshToonMaterial（卡通著色）
new THREE.MeshToonMaterial({
    color: 0x4fc3f7,
    gradientMap: threeStepGradient
});
```

---

## 檔案結構

```
js/
├── main.js                      # 入口（修改）
├── core/
│   ├── GameState.js             # 中央狀態（修改為 3D 結構）
│   ├── Settings.js              # 常量（改為 3D unit）
│   ├── Game.js                  # 主迴圈（大幅修改）
│   └── BuffManager.js           # Buff 管理（保留）
│
├── core3d/                      # 【新增】3D 核心
│   ├── World3D.js               # 場景、燈光、渲染器
│   ├── Camera3D.js              # 65° 攝影機 + zoom
│   ├── Physics3D.js             # 3D 碰撞系統
│   └── CoordinateSystem.js      # 座標工具函式
│
├── entities3d/                  # 【新增】3D 實體
│   ├── Player3D.js              # 玩家（狀態 + mesh）
│   ├── Obstacle3D.js            # 障礙物
│   ├── FireTrap3D.js            # 火焰陷阱
│   └── Wall3D.js                # 邊界牆
│
├── items3d/                     # 【新增】3D 道具
│   ├── ItemBase3D.js            # 道具基類
│   ├── HealBox3D.js
│   ├── HealPack3D.js
│   ├── InvincibleStar3D.js
│   ├── EnergyDrink3D.js
│   ├── MeteorStrike3D.js
│   ├── ReviveFeather3D.js
│   └── Bomb3D.js
│
├── projectiles3d/               # 【新增】3D 投射物
│   └── Rocket3D.js
│
├── effects3d/                   # 【新增】3D 特效
│   ├── ParticleSystem3D.js      # 統一粒子系統
│   ├── ExplosionWave3D.js       # 爆炸波
│   ├── TrailEffect3D.js         # 玩家軌跡
│   └── DeathReviveEffect3D.js   # 死亡/復活
│
├── ui3d/                        # 【新增】UI 系統
│   ├── UIManager.js             # UI 總管理
│   ├── HealthBar3D.js           # HP/Energy bar
│   ├── BuffIcons3D.js           # Buff 圖示
│   ├── AimingUI3D.js            # 瞄準圈
│   ├── InventoryUI.js           # 物品欄
│   └── FloatingText3D.js        # 跳字
│
└── rendering/                   # 【刪除】舊 2D 渲染
    └── Renderer.js              # 移除
```

---

# 實作階段（共 12 Phase）

---

## Phase 1：專案設置 + Three.js 整合

### 目標
建立 Three.js 基礎環境，確認可以顯示空白 3D 場景。

### 輸入
- 現有 index.html
- 無 Three.js 依賴

### 實作
1. **index.html 加入 importmap**
```html
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
  }
}
</script>
```

2. **建立 `js/core3d/World3D.js`**
```js
// 最基礎版本
export class World3D {
    constructor(container) {
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        // 設置大小、背景色
    }
    render(camera) { ... }
}
```

3. **修改 `js/main.js`**
```js
import { World3D } from './core3d/World3D.js';
const world3d = new World3D(document.body);
// 簡單測試 render
```

### 輸出
- Three.js 成功載入
- 顯示純色背景的 WebGL canvas

### 驗證
- [ ] 無 console 錯誤
- [ ] 畫布顯示暖白色背景 (0xf5f0e6)
- [ ] canvas 隨視窗 resize

---

## Phase 2：攝影機 + 燈光系統

### 目標
建立 65° 俯視攝影機與 Overcooked 風燈光。

### 輸入
- Phase 1 完成的 World3D

### 實作
1. **建立 `js/core3d/Camera3D.js`**
```js
export class Camera3D {
    constructor() {
        this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
        this.pitch = 65 * Math.PI / 180;
        this.distance = 20;
        this.zoom = 1.0;
        this.targetZoom = 1.0;
    }

    setTarget(x, y, z) { ... }      // 設定跟隨目標
    updatePosition() { ... }         // 計算攝影機位置
    applyZoom(delta) { ... }         // 滾輪縮放
    updateZoom(dt) { ... }           // 平滑 zoom 動畫
    startAutoZoom(zoom, dur) { ... } // 自動縮放
}
```

2. **World3D 加入燈光**
```js
// 環境光（強，整體明亮）
this.ambientLight = new THREE.AmbientLight(0xfff8e1, 0.6);

// 主光（暖白，右上前方，投射陰影）
this.mainLight = new THREE.DirectionalLight(0xfff5e6, 1.0);
this.mainLight.position.set(10, 15, 10);
this.mainLight.castShadow = true;

// 補光（淺藍，左側）
this.fillLight = new THREE.DirectionalLight(0xe3f2fd, 0.4);
this.fillLight.position.set(-10, 8, 0);
```

3. **滾輪事件綁定**

### 輸出
- 攝影機可以從 65° 俯視角度觀看
- 燈光設置完成

### 驗證
- [ ] 攝影機角度正確（65° 俯視）
- [ ] 燈光呈現暖色調
- [ ] 滾輪 zoom 平滑運作
- [ ] zoom 範圍限制正確 (0.3-3.0)

---

## Phase 3：地面 + 邊界牆

### 目標
建立遊戲世界的基礎場景：地面和四面圍牆。

### 輸入
- Phase 2 完成的 World3D + Camera3D

### 實作
1. **Ground mesh**
```js
// 地面：25x25 unit
const groundGeometry = new THREE.PlaneGeometry(25, 25);
groundGeometry.rotateX(-Math.PI / 2);
const groundMaterial = new THREE.MeshToonMaterial({ color: 0xf5f0e6 });
this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
this.ground.receiveShadow = true;
```

2. **Wall3D.js - 四面圍牆**
```js
// 圓角木質牆壁
// 高度 1.5 unit, 厚度 0.3 unit
// 放置於世界邊緣
export class Wall3D {
    constructor(scene) {
        this.createWalls(); // 東西南北四面
    }
}
```

### 輸出
- 可見的遊戲場景地面
- 四面木質圍牆

### 驗證
- [ ] 地面大小正確 (25x25)
- [ ] 地面顏色正確（奶白色）
- [ ] 四面牆可見且位置正確
- [ ] 牆壁有圓角效果
- [ ] 陰影投射到地面

---

## Phase 4：玩家基礎

### 目標
建立可移動的 3D 玩家角色。

### 輸入
- Phase 3 完成的場景
- 現有 2D Player.js（參考邏輯）

### 實作
1. **建立 `js/entities3d/Player3D.js`**
```js
export class Player3D {
    constructor(scene) {
        // 狀態
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3();
        this.rotation = 0;
        this.hp = 100;
        this.maxHp = 100;
        this.energy = 100;
        this.maxEnergy = 100;
        this.heldItem = null;
        this.isDead = false;

        // Mesh：膠囊體
        this.createMesh();
    }

    createMesh() {
        // 膠囊體 (CapsuleGeometry)
        const bodyGeom = new THREE.CapsuleGeometry(0.3, 0.4, 8, 16);
        const bodyMat = new THREE.MeshToonMaterial({ color: 0x4fc3f7 });
        this.mesh = new THREE.Mesh(bodyGeom, bodyMat);

        // 眼睛（兩個小球）
        this.addEyes();
    }

    update(dt, input) {
        // WASD 移動
        // 邊界限制
        // 面向更新
    }
}
```

2. **修改 GameState.js**
```js
// 從 2D 結構改為 3D 結構
export const gameState = {
    player: null,           // Player3D instance
    world: { width: 25, height: 25 },
    camera: null,           // Camera3D instance
    // ...
};
```

3. **Game.js 整合**
```js
// 主迴圈中更新玩家
player.update(dt, input);
camera.setTarget(player.position.x, player.position.y, player.position.z);
```

### 輸出
- 可見的玩家膠囊體
- WASD 控制移動

### 驗證
- [ ] 玩家 mesh 可見（天藍色膠囊）
- [ ] WASD 移動正常
- [ ] 玩家被牆壁邊界限制
- [ ] 攝影機跟隨玩家
- [ ] 移動時玩家面向正確

---

## Phase 5：輸入系統 + 滑鼠地面投影

### 目標
處理滑鼠在 3D 空間的位置，實現射擊方向。

### 輸入
- Phase 4 完成的玩家
- 現有 2D 滑鼠邏輯（參考）

### 實作
1. **InputManager3D.js 或直接在 Game.js**
```js
// Raycaster 投影到地面
this.raycaster = new THREE.Raycaster();
this.mouse = new THREE.Vector2();

onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);
    const intersects = this.raycaster.intersectObject(ground);
    if (intersects.length > 0) {
        this.mouseWorldPos = intersects[0].point;
    }
}
```

2. **玩家面向滑鼠**
```js
// 計算玩家到滑鼠位置的角度
const dx = mouseWorldPos.x - player.position.x;
const dz = mouseWorldPos.z - player.position.z;
player.targetRotation = Math.atan2(dx, dz);
```

### 輸出
- 滑鼠位置正確投影到地面
- 玩家面向滑鼠方向

### 驗證
- [ ] 滑鼠位置投影正確
- [ ] 玩家面向滑鼠位置
- [ ] 邊緣情況處理（滑鼠在場景外）

---

## Phase 6：火箭射擊

### 目標
實現左鍵發射火箭。

### 輸入
- Phase 5 完成的輸入系統
- 現有 2D Rocket.js（參考邏輯）

### 實作
1. **建立 `js/projectiles3d/Rocket3D.js`**
```js
export class Rocket3D {
    constructor(scene, startPos, direction) {
        this.position = startPos.clone();
        this.direction = direction.normalize();
        this.speed = 15; // unit/s
        this.isDead = false;

        // Mesh：卡通火箭
        this.createMesh();
    }

    update(dt) {
        this.position.addScaledVector(this.direction, this.speed * dt);
        this.mesh.position.copy(this.position);
        this.mesh.position.y = 0.3; // 飛行高度

        // 邊界檢測 → 爆炸
        // 障礙物碰撞 → 爆炸
    }

    explode() {
        this.isDead = true;
        // 觸發爆炸特效
    }
}
```

2. **Game.js 射擊邏輯**
```js
onMouseDown(event) {
    if (event.button === 0 && canShoot()) {
        const dir = new THREE.Vector3(
            mouseWorldPos.x - player.position.x,
            0,
            mouseWorldPos.z - player.position.z
        ).normalize();

        const rocket = new Rocket3D(scene, player.position, dir);
        gameState.rockets.push(rocket);
    }
}
```

3. **GameState 加入 rockets 陣列**

### 輸出
- 左鍵發射火箭
- 火箭向目標方向飛行
- 火箭碰壁爆炸

### 驗證
- [ ] 左鍵發射火箭
- [ ] 火箭方向正確
- [ ] 火箭速度正確
- [ ] 火箭碰壁消失
- [ ] 火箭 mesh 造型正確

---

## Phase 7：場景物件（障礙物 + 火焰陷阱）

### 目標
實現障礙物碰撞和火焰陷阱傷害。

### 輸入
- Phase 6 完成的基礎遊戲
- 現有 2D Obstacle.js, FireTrap.js（參考）

### 實作
1. **建立 `js/entities3d/Obstacle3D.js`**
```js
export class Obstacle3D {
    constructor(scene, x, z, size = 2) {
        this.position = new THREE.Vector3(x, size/2, z);
        this.size = size;

        // 圓角木箱 mesh
        this.createMesh();

        // 碰撞盒
        this.boundingBox = new THREE.Box3();
    }

    checkCollision(spherePos, sphereRadius) {
        // Sphere vs Box 碰撞
    }
}
```

2. **建立 `js/entities3d/FireTrap3D.js`**
```js
export class FireTrap3D {
    constructor(scene, x, z) {
        this.position = new THREE.Vector3(x, 0, z);
        this.damageTimer = 0;
        this.damageInterval = 0.5;

        // 卡通火焰 mesh（多個 cone 堆疊）
        this.createFlames();
    }

    update(dt, player) {
        // 火焰動畫（搖擺）
        this.animateFlames(dt);

        // 玩家在範圍內時造成傷害
        if (this.isPlayerInRange(player)) {
            this.damageTimer += dt;
            if (this.damageTimer >= this.damageInterval) {
                player.takeDamage(10);
                this.damageTimer = 0;
            }
        }
    }
}
```

3. **Physics3D.js 碰撞函式**
```js
export function sphereBoxCollision(sphere, box) { ... }
export function sphereSphereCollision(a, b) { ... }
export function resolveCollision(player, obstacle) { ... }
```

4. **玩家與障礙物碰撞處理**

### 輸出
- 障礙物阻擋玩家
- 火箭碰到障礙物爆炸
- 火焰陷阱對玩家造成傷害

### 驗證
- [ ] 障礙物可見（圓角木箱）
- [ ] 玩家被障礙物阻擋
- [ ] 火箭碰障礙物爆炸
- [ ] 火焰搖擺動畫
- [ ] 火焰造成週期傷害

---

## Phase 8：道具系統基礎

### 目標
建立道具基類和生成/撿取邏輯。

### 輸入
- Phase 7 完成的遊戲
- 現有 2D ItemBase.js（參考邏輯，重新設計物理）

### 實作
1. **建立 `js/items3d/ItemBase3D.js`**
```js
export class ItemBase3D {
    constructor(scene, x, z, config) {
        this.scene = scene;
        this.position = new THREE.Vector3(x, config.spawnHeight || 3, z);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.gravity = 10; // unit/s²

        this.isGrounded = false;
        this.isHeld = false;
        this.isActivated = false;
        this.isDead = false;

        this.type = config.type; // 'PASSIVE' or 'ACTIVE'
        this.duration = config.duration || 0; // 0 = 永久
        this.durationTimer = 0;

        this.createMesh();
    }

    update(dt) {
        if (this.isDead || this.isHeld) return;

        // 物理（落下）
        if (!this.isGrounded) {
            this.velocity.y -= this.gravity * dt;
            this.position.y += this.velocity.y * dt;

            if (this.position.y <= this.groundY) {
                this.position.y = this.groundY;
                this.velocity.y *= -this.bounciness;
                if (Math.abs(this.velocity.y) < 0.5) {
                    this.isGrounded = true;
                    this.velocity.y = 0;
                    this.onGrounded();
                }
            }
        }

        // Duration 計時
        if (this.isGrounded && this.duration > 0 && !this.isActivated) {
            this.durationTimer += dt;
            if (this.durationTimer >= this.duration) {
                this.isDead = true;
            }
        }

        this.mesh.position.copy(this.position);
        this.updateAnimation(dt);
    }

    tryPickup(player) {
        if (this.isDead || this.isHeld || !this.isGrounded) return false;

        const dist = this.position.distanceTo(player.position);
        if (dist < UNIT.pickupRange) {
            if (this.type === 'PASSIVE') {
                this.onPassiveEffect(player);
                this.isDead = true;
            } else {
                // ACTIVE: 持有
                if (player.heldItem) {
                    player.heldItem.dropToGround(player.position);
                }
                this.isHeld = true;
                player.heldItem = this;
            }
            return true;
        }
        return false;
    }

    // 子類覆寫
    onPassiveEffect(player) {}
    activate(targetPos) {}
}
```

2. **實作 HealPack3D.js（最簡單的 PASSIVE）**
```js
export class HealPack3D extends ItemBase3D {
    constructor(scene, x, z) {
        super(scene, x, z, {
            type: 'PASSIVE',
            duration: 30
        });
    }

    createMesh() {
        // 白色圓角盒 + 紅十字
    }

    onPassiveEffect(player) {
        player.heal(30);
        // 觸發治療粒子
    }
}
```

3. **Game.js 整合**
```js
// R 鍵生成道具
if (input.keys['r'] && !input.keysProcessed['r']) {
    spawnItem(currentItemType);
    input.keysProcessed['r'] = true;
}

// 每幀檢測撿取
gameState.items.forEach(item => item.tryPickup(player));
```

### 輸出
- R 鍵生成道具
- 道具從空中落下
- 走近自動撿起 PASSIVE 道具
- PASSIVE 效果觸發

### 驗證
- [ ] R 鍵生成道具
- [ ] 道具落下動畫自然
- [ ] 道具落地彈跳
- [ ] 走近撿起 HealPack
- [ ] 治療效果生效
- [ ] duration 到期道具消失

---

## Phase 9：ACTIVE 道具 + 瞄準系統

### 目標
實現 ACTIVE 道具的持有、瞄準、丟出。

### 輸入
- Phase 8 完成的道具基礎
- 現有 2D 瞄準邏輯（參考）

### 實作
1. **實作 HealBox3D.js（ACTIVE 道具）**
```js
export class HealBox3D extends ItemBase3D {
    constructor(scene, x, z) {
        super(scene, x, z, {
            type: 'ACTIVE',
            duration: 0  // 地上永久
        });
        this.minAimRadius = 2;
        this.maxAimRadius = 10;
        this.healRadius = 2;
        this.tickRate = 1;
        this.maxTicks = 5;
    }

    activate(targetPos) {
        this.isActivated = true;
        this.isHeld = false;

        // 設置到目標位置上方，讓它落下
        this.position.set(targetPos.x, 3, targetPos.z);
        this.velocity.set(0, 0, 0);
        this.isGrounded = false;
    }

    onGrounded() {
        if (this.isActivated) {
            this.startEffect();
        }
    }

    startEffect() {
        // 開始治療 tick
    }
}
```

2. **瞄準模式**
```js
// Game.js
if (input.keys['f'] && player.heldItem?.type === 'ACTIVE') {
    gameState.currentMode = MODE.AIMING;
}

// 瞄準時的 auto zoom
if (gameState.currentMode === MODE.AIMING) {
    const item = player.heldItem;
    const neededZoom = camera.calcZoomForRadius(item.maxAimRadius);
    if (neededZoom < camera.zoom) {
        camera.startAutoZoom(neededZoom, 1.0);
    }
}
```

3. **AimingUI3D.js**
```js
export class AimingUI3D {
    constructor(scene) {
        // 範圍圈 mesh（半透明圓環）
        this.rangeRing = this.createRangeRing();
        // 目標點指示器
        this.targetIndicator = this.createTargetIndicator();
    }

    update(player, mousePos, item) {
        if (!item) {
            this.hide();
            return;
        }

        // 計算目標位置（限制在範圍內）
        const toMouse = mousePos.clone().sub(player.position);
        toMouse.y = 0;
        const dist = toMouse.length();
        const clampedDist = Math.max(item.minAimRadius,
                            Math.min(item.maxAimRadius, dist));

        this.targetPos = player.position.clone()
            .add(toMouse.normalize().multiplyScalar(clampedDist));

        // 更新 UI 位置
        this.rangeRing.position.copy(player.position);
        this.rangeRing.scale.set(item.maxAimRadius, 1, item.maxAimRadius);

        this.targetIndicator.position.copy(this.targetPos);
    }
}
```

4. **丟出邏輯**
```js
// 左鍵丟出
if (input.mouseDown && gameState.currentMode === MODE.AIMING) {
    const item = player.heldItem;
    item.activate(aimingUI.targetPos);
    player.heldItem = null;
    gameState.currentMode = MODE.NORMAL;
    camera.returnToNormalZoom();
}
```

### 輸出
- ACTIVE 道具撿起後持有
- F 鍵進入瞄準模式
- 顯示範圍圈和目標點
- 左鍵丟出到目標位置
- Auto zoom 功能

### 驗證
- [ ] ACTIVE 道具撿起持有
- [ ] F 鍵切換瞄準模式
- [ ] 範圍圈正確顯示
- [ ] 目標點被限制在範圍內
- [ ] 左鍵成功丟出
- [ ] Auto zoom 正常運作
- [ ] 取消瞄準 zoom 回復

---

## Phase 10：完整道具 + Buff 整合

### 目標
實作所有 7 種道具和 Buff 系統整合。

### 輸入
- Phase 9 完成的道具系統
- 現有 2D BuffManager.js（保留邏輯）

### 實作
1. **PASSIVE 道具**
- **InvincibleStar3D.js**：觸發無敵 buff
- **EnergyDrink3D.js**：觸發 Energy HoT buff
- **ReviveFeather3D.js**：觸發 Revive Feather buff（死亡時消耗）

2. **ACTIVE 道具**
- **MeteorStrike3D.js**：在目標位置召喚隕石
- **Bomb3D.js**：拋物線飛到目標爆炸

3. **BuffManager 整合**
```js
// 保留現有 BuffManager.js 邏輯
// 只修改視覺效果觸發點

// InvincibleStar3D
onPassiveEffect(player) {
    buffManager.addOrRefreshBuff({
        type: BUFF_TYPE.INVINCIBLE,
        duration: 5,
        showIcon: true,
        iconType: BUFF_ICON.SHIELD
    });
    player.showShieldEffect(); // 觸發護盾視覺
}
```

4. **道具交換（swap）**
```js
// Player3D 或 Game.js
if (player.heldItem && newItem.type === 'ACTIVE') {
    player.heldItem.dropToGround(player.position);
    // 舊道具低弧線拋出動畫
}
```

5. **Bomb 特殊飛行邏輯**
```js
export class Bomb3D extends ItemBase3D {
    activate(targetPos) {
        this.isActivated = true;
        this.isHeld = false;

        // 從玩家位置開始
        this.position.copy(this.playerPos);

        // 計算拋物線
        const toTarget = targetPos.clone().sub(this.position);
        toTarget.y = 0;
        const dist = toTarget.length();
        const flightTime = dist / this.throwSpeed;

        this.velocity.x = toTarget.x / flightTime;
        this.velocity.z = toTarget.z / flightTime;
        this.velocity.y = (0.5 * this.gravity * flightTime); // 讓落點正好在 y=0
    }
}
```

### 輸出
- 7 種道具全部可用
- Buff 系統正常運作
- 道具交換功能

### 驗證
- [ ] HealPack 治療生效
- [ ] InvincibleStar 無敵 buff 生效
- [ ] EnergyDrink 能量 buff 生效
- [ ] ReviveFeather 死亡時消耗復活
- [ ] HealBox 區域治療生效
- [ ] MeteorStrike 隕石下落
- [ ] Bomb 拋物線飛行 + 爆炸
- [ ] 道具交換正常

---

## Phase 11：特效系統

### 目標
實現所有視覺特效。

### 輸入
- Phase 10 完成的遊戲邏輯
- 現有 2D 特效（參考視覺）

### 實作
1. **ParticleSystem3D.js（統一粒子系統）**
```js
export class ParticleSystem3D {
    constructor(scene, maxParticles = 1000) {
        // 使用 THREE.Points 實現 GPU 粒子
        this.geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(maxParticles * 3);
        this.colors = new Float32Array(maxParticles * 4);
        this.sizes = new Float32Array(maxParticles);
        this.lifetimes = new Float32Array(maxParticles);
        // ...
    }

    emit(type, position, config) {
        // 根據 type 發射不同粒子
        // heal: 綠色泡泡上升
        // smoke: 白色 puff 膨脹
        // explosion: 彩色碎紙
        // energy: 金色星星
        // damage: 紅色星星
    }
}
```

2. **ExplosionWave3D.js**
```js
export class ExplosionWave3D {
    constructor(scene, position, radius, color = 0xff9800) {
        // 地面擴散環
        this.ring = new THREE.Mesh(
            new THREE.RingGeometry(0.1, 0.5, 32),
            new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                side: THREE.DoubleSide
            })
        );
        this.ring.rotation.x = -Math.PI / 2;
        this.ring.position.copy(position);
        this.ring.position.y = 0.1;

        this.maxRadius = radius;
        this.duration = 0.5;
        this.timer = 0;
    }

    update(dt) {
        this.timer += dt;
        const progress = this.timer / this.duration;
        const scale = progress * this.maxRadius;
        this.ring.scale.set(scale, scale, 1);
        this.ring.material.opacity = 1 - progress;

        if (progress >= 1) this.isDead = true;
    }
}
```

3. **TrailEffect3D.js**
```js
export class TrailEffect3D {
    constructor(scene, player) {
        this.points = [];
        this.maxPoints = 50;
        // 使用 THREE.Line 或 Points
    }

    update(dt) {
        this.points.unshift(player.position.clone());
        if (this.points.length > this.maxPoints) {
            this.points.pop();
        }
        this.updateGeometry();
    }
}
```

4. **DeathReviveEffect3D.js**
```js
export class DeathReviveEffect3D {
    constructor(scene) {
        this.fragments = [];
        this.state = 'idle'; // 'death', 'revive'
    }

    playDeath(position) {
        this.state = 'death';
        // 碎片從中心散射
    }

    playRevive(position) {
        this.state = 'revive';
        // 碎片收斂到中心
    }
}
```

5. **FloatingText3D.js**
```js
export class FloatingText3D {
    constructor(text, position, color) {
        // 使用 CSS2DRenderer 或 canvas texture
        // bounce 動畫 + 上浮
    }
}
```

### 輸出
- 治療泡泡效果
- 爆炸波效果
- 玩家軌跡
- 死亡/復活動畫
- 跳字效果

### 驗證
- [ ] 治療時綠色粒子上升
- [ ] 火箭/炸彈/隕石爆炸波
- [ ] 玩家移動有軌跡
- [ ] 死亡碎片散射
- [ ] 復活碎片收斂
- [ ] 傷害/治療數字跳字

---

## Phase 12：UI + 最終整合

### 目標
完成所有 UI 並清理 2D 殘留。

### 輸入
- Phase 11 完成的特效
- 現有 2D UI（參考佈局）

### 實作
1. **UIManager.js（統一管理）**
```js
export class UIManager {
    constructor() {
        this.healthBar = new HealthBar3D();
        this.buffIcons = new BuffIcons3D();
        this.inventory = new InventoryUI();
    }

    update(dt, player, camera) {
        // 更新所有 UI 元素
    }
}
```

2. **HealthBar3D.js**
```js
// 使用 CSS2DRenderer 或獨立的 2D canvas overlay
// HP bar: 圓角漸層條（紅→黃→綠）
// Energy bar: 圓角金黃條
// 位於玩家上方，跟隨移動
```

3. **BuffIcons3D.js**
```js
// Buff icons 顯示在 HP bar 上方
// 進度邊框 + 閃爍效果
```

4. **InventoryUI.js**
```js
// 螢幕底部中央
// 顯示持有的 ACTIVE 道具
// 交換動畫
```

5. **清理 2D 程式碼**
- 刪除 `js/rendering/Renderer.js`
- 刪除 `js/entities/` 中的 2D 版本
- 刪除 `js/items/` 中的 2D 版本
- 刪除 `js/effects/` 中的 2D 版本

6. **Settings.js 更新**
```js
// 移除所有 px 單位設定
// 統一使用 3D unit
export const SETTINGS = {
    world: { size: 25 },
    player: {
        radius: 0.3,
        height: 0.8,
        speed: 8
    },
    // ...
};
```

7. **CLAUDE.md 更新**
- 更新為 3D 版本架構說明
- 新增 3D 座標系統文檔
- 更新檔案結構

### 輸出
- 完整的 UI 系統
- 無 2D 殘留程式碼
- 更新的文檔

### 驗證
- [ ] HP bar 正確顯示
- [ ] Energy bar 正確顯示
- [ ] Buff icons 正確顯示
- [ ] Inventory UI 正常
- [ ] Settings panel 仍可用
- [ ] 無 console 錯誤
- [ ] 60fps 效能
- [ ] 所有原有功能正常

---

## 數值轉換參考

| 項目 | 2D (px) | 3D (unit) |
|------|---------|-----------|
| 世界尺寸 | 2500 | 25 |
| 玩家大小 | 24 | 0.3 (radius) |
| 玩家速度 | 200 | 8 |
| 火箭速度 | 400 | 15 |
| 瞄準半徑 | 200-650 | 4-13 |
| 爆炸半徑 | 110 | 2.2 |
| 道具大小 | 20 | 0.4 |
| 撿取距離 | 30 | 0.6 |

---

## 風險與備案

| 風險 | 備案 |
|------|------|
| 3D 碰撞複雜 | 先用簡化 Sphere/Box |
| 效能問題 | 減少粒子、簡化陰影 |
| 圓角幾何困難 | 使用 bevel 或預製模型 |
| 卡通火焰難做 | 用 sprite billboard |

---

## 實作順序總覽

```
Phase 1: Three.js 設置 ─────────┐
Phase 2: 攝影機 + 燈光 ─────────┤
Phase 3: 地面 + 牆壁 ───────────┤ 基礎場景
Phase 4: 玩家基礎 ──────────────┘

Phase 5: 輸入 + 滑鼠投影 ───────┐
Phase 6: 火箭射擊 ──────────────┤ 核心操作
Phase 7: 場景物件 ──────────────┘

Phase 8: 道具基礎 ──────────────┐
Phase 9: ACTIVE + 瞄準 ─────────┤ 道具系統
Phase 10: 完整道具 + Buff ──────┘

Phase 11: 特效系統 ─────────────┐ 視覺效果
Phase 12: UI + 整合 ────────────┘ 最終整合
```

每個 Phase 完成後應該：
1. 功能測試通過
2. 無 console 錯誤
3. Git commit
