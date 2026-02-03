# itemPrototype — Claude Code 開發筆記

## 專案概述

遊戲原型，原為 2D Canvas 版本，已重構為 **原生 3D**（Three.js + Overcooked 視覺風格）。
部署於 GitHub Pages: `https://flash0814.github.io/itemPrototype/`
本地開發使用 `npx serve .` (port 3000)。

**3D 重構狀態：Phase 1-12 完成**
- 原生 3D 座標系統（非 2D 邏輯 + 3D 渲染層）
- Overcooked 風格：明亮、圓潤、MeshToonMaterial
- 完整特效系統（粒子、爆炸波）
- 完整 UI 系統（血條、buff 圖示、浮動文字、道具欄）

## 技術架構

- **3D 引擎**：Three.js (ES Module CDN v0.160.0)
- **渲染風格**：MeshToonMaterial + 暖色調燈光
- 純前端：HTML5 + ES Modules（無打包工具）
- 入口：`index.html` → `js/main.js` → `init3D()` + `animate3D()`
- 遊戲迴圈：`requestAnimationFrame` → `update(dt)` → `world3d.render()`

### 檔案結構

```
css/
  main.css              — 畫布與容器樣式
  ui.css                — 設定面板樣式
js/
  main.js               — 3D 遊戲入口與主迴圈
  core/
    Game.js              — (2D 舊版，保留參考)
    GameState.js         — 共享狀態容器（currentItemType 等）
    Settings.js          — 常量與預設值
  core3d/
    World3D.js           — 場景、渲染器、燈光（含 COLORS_3D 色板）
    Camera3D.js          — 65° pitch 攝影機 + zoom 系統
    Ground3D.js          — 地面（奶白色）
    Wall3D.js            — 邊界牆（木質棕）
  entities3d/
    Player3D.js          — 玩家（膠囊體 + 眼睛）
    Obstacle3D.js        — 障礙物（圓角木箱 + 碰撞）
    FireTrap3D.js        — 火焰陷阱（卡通火焰 + 傷害）
  items3d/
    ItemBase3D.js        — 道具基類（物理、撿取、生命週期）
    HealBox3D.js         — ACTIVE：治療區域
    HealPack3D.js        — PASSIVE：即時補血
    InvincibleStar3D.js  — PASSIVE：無敵星
    EnergyDrink3D.js     — PASSIVE：能量飲料
    ReviveFeather3D.js   — PASSIVE：復活羽毛
    MeteorStrike3D.js    — ACTIVE：隕石打擊
    Bomb3D.js            — ACTIVE：拋物線炸彈
  projectiles3d/
    Rocket3D.js          — 火箭（卡通造型 + 爆炸）
  effects3d/
    Particle3D.js        — 3D 粒子（多種類型）
    ExplosionWave3D.js   — 地面爆炸波圈
    EffectsManager3D.js  — 特效管理器
  ui3d/
    AimingUI3D.js        — 地面瞄準圈
    HealthBar3D.js       — 3D 血條（billboard）
    EnergyBar3D.js       — 3D 能量條
    BuffIcons3D.js       — Buff 圖示
    FloatingText3D.js    — 浮動文字（傷害/治療數字）
    InventoryUI3D.js     — 道具欄（HTML overlay）
  ui/
    SettingsPanel.js     — 右側設定面板 DOM 綁定
```

## 3D 座標系統

### 世界設定

```js
WORLD_SIZE = 25  // 25×25 units
// Origin (0, 0, 0) 在世界中心地面
// X: 右為正
// Y: 上為正（高度）
// Z: 前為正（螢幕下方）
```

### 單位

- **1 unit ≈ 1 米**，支援 float（如 1.5m）
- 玩家半徑：0.3 unit
- 玩家高度：0.8 unit
- 玩家速度：8 unit/s
- 火箭速度：7.5 unit/s
- 道具撿取範圍：0.8 unit

### 攝影機

```js
// 65° pitch 固定高角度前視
FOV: 50
pitch: 65°
baseDistance: 20
zoom: 0.3 ~ 3.0（滾輪控制）
```

## 核心設計模式

### GameState 中央狀態

```js
import { gameState } from './core/GameState.js';
gameState.currentItemType  // 'HealBox' | 'HealPack' | ... (Settings Panel 連動)
```

### 回調模式

3D 物件通過回調與 main.js 通訊（解耦 + 特效整合）：

```js
// 道具
item.onPickup = (pos, type) => { ... }      // 撿起
item.onHealTick = (pos, radius, amount) => { ... }  // HealBox tick
item.onExplode = (pos, radius, damage) => { ... }   // Bomb 爆炸
item.onImpact = (pos, radius, damage) => { ... }    // MeteorStrike 撞擊
item.onActivate = (duration) => { ... }     // PASSIVE buff 激活

// 玩家
player3d.onTakeDamage = (pos, amount) => { ... }
player3d.onHeal = (pos, amount) => { ... }
player3d.onDeath = (pos) => { ... }
player3d.onRevive = (pos) => { ... }
player3d.onFeatherUsed = () => { ... }

// 火焰陷阱
fireTrap.onDamage = (playerPos, damage) => { ... }

// 火箭
rocket.onExplode = (pos, radius, damage) => { ... }
```

### 道具 Flag 控制

道具從生成到死亡始終在 `items[]` 陣列，靠 flag 控制行為：

| Flag | 說明 |
|------|------|
| `isGrounded` | 是否落地（落地後開始漂浮動畫） |
| `isHeld` | 是否被持有（ACTIVE 撿起後） |
| `isActivated` | 是否已啟動（丟出後） |
| `isDead` | 是否死亡（從陣列移除） |

## 道具系統

### 七種道具

| 道具 | 類型 | 效果 |
|------|------|------|
| HealBox | ACTIVE | 範圍治療（5 tick × 25 HP） |
| HealPack | PASSIVE | 即時補血 30 HP |
| InvincibleStar | PASSIVE | 無敵 5 秒 |
| EnergyDrink | PASSIVE | 能量 buff 10 秒 |
| ReviveFeather | PASSIVE | 死亡時自動復活（消耗） |
| MeteorStrike | ACTIVE | 隕石從天落下，範圍傷害 |
| Bomb | ACTIVE | 拋物線飛行，範圍爆炸 |

### ACTIVE 道具流程

1. R 鍵生成 → 從高處落下
2. 走近撿起 → `isHeld=true`，道具欄顯示
3. F 鍵 → 進入瞄準模式（顯示範圍圈）
4. 左鍵 → 丟出（`activate()`）
5. 效果結束 → `isDead=true`

### Bomb 特殊處理

```js
// Bomb 從玩家位置拋物線飛到目標
if (item.constructor.name === 'Bomb3D') {
    item.activate(targetPos, playerPos);  // 需要兩個位置
} else {
    item.activate(targetPos);  // 其他 ACTIVE 直接瞬移到目標上方
}
```

## 特效系統

### 粒子類型

| 類型 | 顏色 | 用途 |
|------|------|------|
| heal | 綠色十字 | 治療效果 |
| smoke | 灰色球 | 煙霧 puff |
| explosion | 橘色球 | 火箭爆炸 |
| bombExplosion | 紅色球 | 炸彈爆炸 |
| meteorImpact | 紅橘球 | 隕石撞擊 |
| damage | 紅色星 | 受傷 |
| energy | 金色星 | 能量效果 |
| invincible | 金色星 | 無敵激活 |
| revive | 青色菱形 | 復活 |
| confetti | 彩色方塊 | 慶祝碎紙 |

### 預設特效組合

```js
effects3d.rocketExplosion(x, z, radius)   // 橘色波 + 粒子 + 煙霧 + 碎紙
effects3d.bombExplosion(x, z, radius)     // 紅色波 + 粒子 + 黑煙 + 碎紙
effects3d.meteorImpact(x, z, radius)      // 雙重波 + 火焰碎片 + 煙霧
effects3d.healEffect(x, z, count)         // 綠色十字上升
effects3d.damageEffect(x, z, count)       // 紅色星星
effects3d.invincibleEffect(x, z)          // 金色光圈 + 星星
effects3d.reviveEffect(x, z)              // 青色光圈 + 菱形 + 金星
effects3d.deathEffect(x, z)               // 灰煙 + 紅星
effects3d.pickupEffect(x, z, color)       // 彩色星星上升
```

## UI 系統

### 世界空間 UI（billboard）

- **HealthBar3D**：玩家頭上，顏色隨 HP 變化（綠→黃→紅）
- **EnergyBar3D**：血條下方（預留）
- **BuffIcons3D**：血條上方，倒數閃爍動畫

### 螢幕空間 UI

- **InventoryUI3D**：底部中央，顯示持有的 ACTIVE 道具
- **FloatingText3D**：傷害/治療數字，bounce 動畫

### Buff 圖示

```js
BUFF_TYPE_3D = {
    INVINCIBLE: 'INVINCIBLE',      // 盾牌
    ENERGY_BUFF: 'ENERGY_BUFF',    // 菱形
    REVIVE_FEATHER: 'REVIVE_FEATHER'  // 橢圓
}
```

## 玩家狀態

```js
// Player3D.js
hp: 250, maxHp: 250
energy: 100, maxEnergy: 100
energyRegenRate: 15  // 每秒回復
speed: 8 unit/s
radius: 0.3

// Buff
isInvincible: false
invincibleTimer: 0
hasEnergyBuff: false      // true 時發射火箭不消耗 energy
energyBuffTimer: 0
hasReviveFeather: false

// 持有道具
heldItem: null  // ACTIVE 道具
```

### Energy 系統

- 火箭消耗：10 energy/發
- 自動回復：15 energy/秒
- EnergyDrink buff：發射不消耗 energy
- Energy 不足時無法發射火箭

### Buff 圖示注意

`BuffIcons3D` 和 `Player3D` 的 timer 是**分開獨立**倒數的，沒有統一的 BuffManager3D。
確保 `buffIcons.addBuff(type, duration)` 的 duration 和 `player3d.xxxTimer` 一致。

## Settings Panel 連動

```js
// SettingsPanel.js 更新 gameState.currentItemType
// main.js 的 spawnItem() 讀取 gameState.currentItemType
// R 鍵生成對應道具
```

支援七種道具：HealBox, HealPack, InvincibleStar, EnergyDrink, ReviveFeather, MeteorStrike, Bomb

## 色板（COLORS_3D）

```js
// js/core3d/World3D.js
COLORS_3D = {
    ground: 0xf5f0e6,      // 奶白地面
    wall: 0x8b7355,        // 木質棕牆
    player: 0x4fc3f7,      // 明亮天藍
    obstacle: 0x8d6e63,    // 木箱棕
    fireTrap: 0xff9800,    // 暖橘火焰
    fireGlow: 0xffcc02,    // 火焰高光
    heal: 0x66bb6a,        // 柔和綠
    invincible: 0xffd54f,  // 暖金黃
    energy: 0xffb74d,      // 柔橘金
    meteor: 0xef5350,      // 柔紅
    bomb: 0x333333,        // 黑色炸彈
    revive: 0xf5f5f5       // 亮白羽毛
}
```

## 重要注意事項

- **單位**：所有距離、速度、半徑使用 3D unit（1 unit ≈ 1m）
- **道具陣列**：道具始終在 `items[]`，靠 flag 控制，**不要重複 push**
- **回調設定**：在 `spawnItem()` 中創建道具後立即設定回調
- **攝影機**：使用 `camera3d.getCamera()` 取得 Three.js Camera
- **特效**：使用 `effects3d.xxx()` 呼叫預設特效組合
- 開發者為 solo developer，直接在 main 分支工作
- GitHub Pages 部署後約需 1-2 分鐘生效

## 2D 舊版參考

2D 相關代碼保留在 `js/core/`, `js/entities/`, `js/items/` 等目錄，可作為邏輯參考。
2D Canvas 在 CSS 中隱藏（`#gameCanvas { display: none; }`）。
