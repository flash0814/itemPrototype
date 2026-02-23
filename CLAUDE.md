# itemPrototype — Claude Code 開發筆記

## 專案概述

2D Canvas 遊戲原型，原為 Gemini Canvas 單檔 HTML 專案，已重構為 ES Modules 架構。
部署於 GitHub Pages: `https://flash0814.github.io/itemPrototype/`
本地開發使用 `npx serve .` (port 3000)。

## 技術架構

- 純前端：HTML5 Canvas + ES Modules（無打包工具）
- 入口：`index.html` → `js/main.js` → `Game.initGame()`
- 遊戲迴圈：`requestAnimationFrame` → `update(dt)` → `draw()`

### 檔案結構

```
css/
  main.css              — 畫布與容器樣式
  ui.css                — 設定面板、HUD 樣式
js/
  main.js               — 入口，呼叫 initGame()
  core/
    Game.js              — 主迴圈、輸入事件、pickup/spawn/aim 邏輯
    GameState.js         — 共享狀態容器（避免循環依賴的中央 store）
    Camera.js            — 攝影機系統（跟隨、夾邊、縮放、座標轉換）
    Settings.js          — 所有常量與預設值（SETTINGS 物件）
    Utils.js             — 工具函式（lerpAngle, checkCollisionWithRect）
    BuffManager.js       — Buff 管理系統（統一管理所有 buff 狀態與 icon）
    DashSystem.js        — Dash 系統（獨立 energy gauge、速度倍率、拖尾粒子）
  entities/
    Player.js            — 玩家狀態（hp, trail, heldItem, invincible 等）
    FieldObject.js       — 場景物件基類
    Obstacle.js          — 障礙物（可拖曳/複製）
    FireTrap.js          — 火焰陷阱（週期性傷害，layer 1）
    WaterPond.js         — 水池（擋玩家、投射物穿越，layer 2）
  items/
    ItemBase.js          — 道具基類（物理、duration、pickup、dropToGround）
    HealBox.js           — 主動道具：治療區域（ACTIVE, 需瞄準丟出）
    HealPack.js          — 被動道具：即時補血（PASSIVE）
    InvincibleStar.js    — 被動道具：無敵星（PASSIVE）
    EnergyDrink.js       — 被動道具：能量飲料 HoT（PASSIVE）
    MeteorStrike.js      — 主動道具：隕石打擊（ACTIVE, 需瞄準丟出）
    ReviveFeather.js     — 被動道具：復活羽毛（PASSIVE, 死亡時消耗快速復活）
    Bomb.js              — 主動道具：炸彈（ACTIVE, 拋物線飛行+範圍爆炸）
  projectiles/
    Projectile.js        — 彈射物基類
    Rocket.js            — 火箭（含爆炸波）
  effects/
    FloatingText.js      — 浮動數字
    Particle.js          — 粒子效果
    ExplosionWave.js     — 爆炸波
  rendering/
    Renderer.js          — 所有繪製函式（grid, world bounds, player, aim UI, held item UI）
  ui/
    SettingsPanel.js     — 右側設定面板 DOM 綁定
```

### 核心設計模式

- **GameState.js 作為中央狀態容器**：所有模組 import 同一個 gameState 物件，避免循環依賴。Player.js 也是 export 一個 singleton 物件。
- **道具不從 activeItems 移除**：撿起時只設 `isHeld=true`，仍留在 `gameState.activeItems` 陣列中。draw/pickup 邏輯透過 flag 跳過。丟出時也不需 push 回去。
- **Camera/Viewport 分離**：世界（world）為固定尺寸，畫布（viewport）隨瀏覽器視窗大小調整。攝影機跟隨玩家並夾在世界邊界內。所有遊戲物件在世界空間繪製，HUD 在螢幕空間繪製。

## Collision System（統一 collisionLayer/Mask）

所有碰撞判斷統一使用 `collisionMask.has(obj.collisionLayer)`，已移除 `isSolid`。

### Collision Layer（場景物件側）

| Layer | 物件 | 說明 |
|:-----:|------|------|
| 0 | EdgeWall, Obstacle | 實體障礙，擋一切 |
| 1 | FireTrap | 環境危害，不擋玩家 |
| 2 | WaterPond | 地形障礙，擋玩家但不擋投射物 |

### Collision Mask（實體側）

| 實體 | Mask | 碰撞對象 |
|------|------|----------|
| Player（移動推擠） | `{0, 2}` | 牆、箱子、水池 |
| Rocket | `{0}` | 牆、箱子 |
| Bomb | `{0, 1}` | 牆、箱子、火焰陷阱 |
| 飛行路徑預測 | 讀持有道具的 mask | 自動與實際碰撞一致 |

### Detection 方式

- Rocket：尖端點判定（`obj.contains`）
- Bomb：圓形判定（`checkCollisionWithRect`）
- Player 移動：圓形判定（`checkCollisionWithRect`）
- 爆炸傷害：範圍內 `mask.has(layer)` 的物件呼叫 `takeDamage`
- 飛行路徑 clamp：`getFlightPathClamped()` 用 ray vs 膨脹矩形（Minkowski Sum）精確算交點，aimpoint 自動 clamp 到障礙物前最遠可達點（無離散取樣晃動）

## Camera / Viewport 系統

### 概念

- **World**：固定尺寸的遊戲世界（預設 3400x2000，內部可用 3000x1600），origin (0,0) 在左上角
- **Viewport**：畫布滿版填滿瀏覽器（無 margin、無固定比例），作為觀看世界的「窗口」
- **Camera**：中心跟隨玩家，夾在世界邊界內，避免看到世界外

### 設定參數

```js
SETTINGS.worldConfig = {
    width: 3400, height: 2000,
    wallThickness: 200,
    playerStart: { x: 500, y: 500 },
    obstacles: [{ x: 600, y: 600, size: 200 }],
    fireTraps: [{ x: 300, y: 300 }]
}

SETTINGS.cameraConfig = {
    initialZoom: 1.0,
    zoomMin: 0.3,           // 手動滾輪最遠
    zoomMax: 3.0,           // 最近
    zoomStep: 0.1,          // 每次滾輪的線性步進量

    // Edge Pan (Mouse aim)
    edgePanMargin: 0.12,    // 螢幕外 12% 觸發捲動
    edgePanMaxSpeed: 600,   // 最大捲動速度 (world px/s, ÷zoom)

    // PAD Aim (Arrow keys aim)
    padAimBaseSpeed: 200,   // 初始瞄準移動速度 (px/s)
    padAimMaxSpeed: 1000,   // 加速後最大速度
    padAimAccelDelay: 0.3,  // 按住多久開始加速 (s)
    padAimAccelTime: 0.8,   // 加速到 max 的時間 (s)
    padCamLerpSpeed: 8,     // camera 追蹤 aimpoint 的 lerp 速度

    // 回歸 (共用)
    camBackPlayerDelay: 1.2,  // 丟出後延遲回歸（秒）
    camBackPlayerTime: 1.0    // 回歸 tween 時間（秒）
}
```

### 狀態（GameState）

- `gameState.aimInputMode` — `'MOUSE'` | `'PAD'`（瞄準輸入模式）
- `gameState.padAim` — `{ x, y, moveHoldTime }`（PAD 模式虛擬瞄準點）
- `gameState.world` — `{ width, height }` 世界尺寸
- `gameState.camera` — `{ x, y, zoom, targetZoom, edgePan, aimFollow }`
- `gameState.camera.edgePan` — `{ offsetX, offsetY }`（Edge Pan 累積偏移）
- `gameState.camera.aimFollow` — `{ state, weight, padCamX, padCamY, returnDelay, returnTimer, returnDuration, returnFromX, returnFromY }`
- `input.mouse.screenX/screenY` — 螢幕座標（用於 Edge Pan 計算）
- `input.mouse.x/y` — 世界座標（透過 `screenToWorld()` 自動轉換；MOUSE aiming 時每幀重算）

### Camera.js API

| 函式 | 用途 |
|------|------|
| `updateCamera(targetX, targetY)` | 每幀更新攝影機位置，跟隨目標並夾邊 |
| `applyCameraTransform(ctx)` | 繪製世界物件前呼叫，設置 ctx 變換 |
| `restoreCameraTransform(ctx)` | 繪製世界物件後呼叫，還原 ctx |
| `screenToWorld(sx, sy)` | 螢幕座標 → 世界座標 |
| `applyZoom(delta)` | Ctrl+滾輪縮放（線性步進），delta>0 縮小 / delta<0 放大 |
| `updateZoom(dt)` | 每幀 lerp 追趕 targetZoom |
| `getAimFollowTarget(dt, pX, pY, aX, aY)` | 根據 aimFollow 狀態計算攝影機目標位置 |
| `startAimFollow()` | 進入 FOLLOW_AIM 狀態（enterAimMode 時呼叫） |
| `startCameraReturn(hasDelay)` | 開始回歸玩家（true=丟出有延遲，false=取消無延遲） |
| `resetAimCameraState()` | 重置 edgePan offset + padAim（離開 aiming 時呼叫） |

### 繪製順序

```
draw():
  fillRect 清除畫布
  applyCameraTransform(ctx)     ← 世界空間開始
    drawGrid / drawWorldBounds
    fieldObjects / items / projectiles / particles
    trail / player / HPBar / DashGauge / aimingUI / floatingTexts
  restoreCameraTransform(ctx)   ← 世界空間結束
  drawHeldItemUI(ctx)           ← 螢幕空間（HUD）
```

### 座標轉換

滑鼠移動時自動轉換：螢幕座標存入 `screenX/screenY`，世界座標存入 `x/y`。所有遊戲邏輯（射擊、瞄準、拖曳、碰撞）使用 `input.mouse.x/y`（世界座標），無需手動轉換。MOUSE aiming 時每幀額外重算 `screenToWorld`，確保 Edge Pan 捲動時 aimpoint 正確追蹤。

### 攝影機夾邊

當視窗可見範圍小於世界時，攝影機中心被夾在 `[viewW/2, world.width - viewW/2]`，確保不超出世界邊界。當縮小到可見範圍大於世界時，攝影機居中。

### Zoom 系統

- **Ctrl+滾輪** 縮放（普通滾輪保留給 panel 下拉高亮切換）
- 線性步進：`targetZoom ± zoomStep`（def 0.1），`Math.round` 確保精確小數 2 位
- `cam.zoom` 每幀 lerp 追趕 `targetZoom`，產生平滑過渡
- 範圍限制：`zoomMin` (0.3) ~ `zoomMax` (3.0)

### 瞄準攝影機系統（Dual Aim Input Mode）

瞄準時支援兩種輸入模式，中鍵切換：

**`aimInputMode: 'MOUSE'`（預設）— Edge Pan**
- cursor 進入螢幕邊緣外 12%（`edgePanMargin`）時，攝影機往該方向捲動
- 捲動速度與「深入邊緣的程度」成正比（線性 ramp），除以 zoom 保持螢幕空間速度一致
- 攝影機位置 = player + 累積 edgePan offset
- cursor 離開邊緣即停止
- MOUSE aiming 時每幀重算 `screenToWorld`（camera 捲動時 world coords 需更新）

**`aimInputMode: 'PAD'`（中鍵切換）— Arrow Keys Aimpoint Control**
- 隱藏 cursor（`canvas.style.cursor = 'none'`）
- 方向鍵（↑↓←→）移動虛擬瞄準點 `gameState.padAim`（8 方向）
- 速度加速曲線：前 0.3s baseSpeed(200) → 線性 ramp 0.8s → maxSpeed(1000)
- 攝影機用 exp lerp（`padCamLerpSpeed: 8`）追蹤 aimpoint 使其置中

**切換行為**：
- MOUSE→PAD：padAim 初始化為當前 aimpoint、padCam 從當前攝影機位置開始
- PAD→MOUSE：edgePan offset = 當前攝影機位移（避免跳動）
- 丟出/取消後：重置為 MOUSE、顯示 cursor、清除 offset

**三種攝影機狀態**（`gameState.camera.aimFollow.state`）：
- `FOLLOW_PLAYER` — 預設，攝影機跟隨玩家
- `FOLLOW_AIM` — 瞄準中，根據 aimInputMode 執行 Edge Pan 或 PAD 追蹤
- `RETURNING` — 離開瞄準後，延遲 + ease-out quad tween 回歸玩家

**回歸（共用）**：丟出道具後等待 `camBackPlayerDelay`(1.2s)，再以 `camBackPlayerTime`(1.0s) 的 ease-out quad tween 回歸。取消瞄準時無延遲直接回歸。

**Aiming 中 pointer-events**：瞄準模式下 `#settings-panel` 設為 `pointer-events: none`，防止游標移到 panel 上導致 canvas mousemove 停止觸發。離開瞄準後還原。

### 瀏覽器 resize

resize 只改變畫布像素尺寸（viewport），不影響世界物件的位置或大小。場景物件位置由 `worldConfig` 固定。

## Energy 系統

### 狀態（Player.js）

- `maxEnergy` / `currentEnergy` — 實際值
- `displayEnergy` — 每幀 lerp 追趕 `currentEnergy`，用於 gauge 繪製（smooth 增減）
- `energyRecoverRate` — 每秒回復量（存在 player 上，方便 buff/debuff 修改倍率）
- `energyRecoverCD` — 回復硬直倒數（秒），> 0 時暫停自動回復（未來 skill 用）
- `energyRecoverBlocked` — debuff 可暫停回復（未來用）

### API（Player.js export）

| 函式 | 用途 |
|------|------|
| `updateEnergy(dt)` | 每幀呼叫：CD 倒數 → 自動回復 → displayEnergy lerp |
| `consumeEnergy(amount, recoverCD?)` | 扣 energy，return bool；可選設回復硬直 |

### UI

- Energy gauge 在 HP bar 正下方（世界空間，跟隨玩家）
- 顏色：`SETTINGS.colors.energy`（金黃色）
- smooth 機制：`displayEnergy` 用 `lerp(display, current, 1 - e^(-10*dt))` 追趕

## Buff 系統

統一管理所有 buff 狀態（無敵、HoT、復活保護等），支援多 buff icon 顯示。

### 架構

- **BuffManager.js** — 中央 buff 容器與 API
- **buffManager.buffs[]** — 所有活躍 buff 陣列
- 每幀由 `Game.js` 呼叫 `buffManager.update(dt)` 更新

### Buff 類型

```js
BUFF_TYPE = {
    INVINCIBLE: 'INVINCIBLE',    // 無敵（InvincibleStar, AutoRevive）
    ENERGY_HOT: 'ENERGY_HOT',    // Energy 不扣減（EnergyDrink）
    REVIVE_BLINK: 'REVIVE_BLINK' // 復活保護（未來用）
}

BUFF_ICON = {
    SHIELD: 'SHIELD',  // 盾牌（無敵星）
    ENERGY: 'ENERGY',  // 閃電（能量飲料）
    REVIVE: 'REVIVE'   // 菱形（復活保護）
}
```

### Buff 物件結構

```js
{
    id: string,           // 唯一識別碼
    type: BUFF_TYPE,
    duration: number,     // 總時間（秒）
    elapsed: number,      // 已過時間
    showIcon: boolean,    // 是否顯示 icon
    iconType: BUFF_ICON,
    iconColor: string,
    defendRatio?: number, // 無敵用：受傷倍率
    // HoT 專用
    ticksRemaining?: number,
    perTickValue?: number,
    tickRate?: number,
    tickTimer?: number,
    onTick?: Function,
    onExpire?: Function
}
```

### API（BuffManager.js）

| 函式 | 用途 |
|------|------|
| `addBuff(config)` | 新增一般 buff，回傳 buff 物件 |
| `addOrRefreshBuff(config)` | 同 type 已存在則移除舊的再加新的（用於 unique buff 如無敵） |
| `addHoTBuff(config)` | 新增 HoT buff（自動計算 duration） |
| `removeBuff(id)` | 移除指定 id 的 buff |
| `hasBuff(type)` | 檢查是否有指定類型的 buff |
| `getBuff(type)` | 取得第一個符合類型的 buff |
| `getVisibleBuffs()` | 取得所有需顯示 icon 的 buff |
| `update(dt)` | 每幀更新：elapsed 累加、HoT tick、到期移除 |
| `clearAll()` | 清除所有 buff（死亡時呼叫） |

### Icon 顯示

- 位置：HP bar 正上方，多 buff 左至右排列，整體置中
- 邊框倒數：順時針減少，`progress = 1 - elapsed / duration`
- 閃爍：`progress <= 0.4` 時以 12.56 rad/s 閃爍
- 繪製：`Renderer.js` 的 `drawBuffIcons()` 函式

### 向後相容

BuffManager 會同步 `player.invincibleTimer`、`player.reviveBlinkTimer` 等變數，確保 `drawPlayer()` 中的護盾視覺效果正常運作。

### 來源整合

| 來源 | 觸發 | Buff 類型 | Icon |
|------|------|-----------|------|
| InvincibleStar | `onPassiveEffect()` | INVINCIBLE | SHIELD |
| EnergyDrink | `onPassiveEffect()` | ENERGY_HOT | ENERGY |
| AutoRevive | `onRevive()` | INVINCIBLE | REVIVE |
| ReviveFeather | `onPassiveEffect()` | REVIVE_FEATHER | FEATHER |

**EnergyDrink 邏輯：**
- 效果期間 `consumeEnergy()` 不扣減 energy（`hasBuff(ENERGY_HOT)` → return true）
- 使用 `addOrRefreshBuff`，重複撿取刷新時間
- 參數：`instantPlus`（瞬間回復）、`effectDuration`（不扣減持續時間，def 10）

**ReviveFeather 特殊邏輯：**
- Buff 永久存在直到死亡時消耗（duration=999999）
- 一次只能持有 1 個羽毛 buff，重複撿取不疊加
- 死亡時若有羽毛 buff → 使用 `reviveItemTime`（def 0）快速復活

## Dash 系統

### 操作

- **Space** — 往目前 WASD 方向 dash（靜止時往 `player.currentAngle` 面朝方向）
- **AIMING 中按 Space** — 中斷瞄準（不丟出 item，保持持有）→ 立即 dash
- Dash 中方向鎖定，不受 WASD 影響

### 架構

- **DashSystem.js** — 獨立 singleton module（同 BuffManager 模式）
- 狀態存於 `dashState`（不在 GameState 中），避免中央 store 膨脹
- 每幀由 `Game.js` 呼叫 `updateDash(dt)` 更新

### 設定參數

```js
SETTINGS.dashConfig = {
    maxEnergy: 100,        // dash gauge 最大值
    energyCost: 35,        // 每次 dash 消耗
    recoveryRate: 20,      // 每秒回復量
    recoveryDelay: 0.3,    // dash 結束後延遲回復（秒）
    speedRatio: 4,         // playerSpeed 倍率
    dashTime: 0.25,        // dash 持續時間（秒）
    trailInterval: 0.03    // 拖尾粒子生成間隔（秒）
}
```

### Dash Energy

- `dashEnergy` / `displayDashEnergy` — 實際值 / smooth 顯示值（lerp 追趕）
- `recoveryDelayTimer` — dash 結束後延遲倒數，歸零後開始自動回復
- 與 Player energy 完全獨立，不互相影響

### API（DashSystem.js）

| 函式 | 用途 |
|------|------|
| `canDash()` | 檢查條件：(ROAMING or AIMING) + 未死亡 + 未在 dash + energy 足夠 |
| `tryDash(dirX, dirY)` | 扣 energy、鎖定方向、啟動 dash timer |
| `updateDash(dt)` | 每幀：dash 計時 + 粒子生成 + 回復延遲 + energy 回復 + display lerp |
| `getDashSpeedMultiplier()` | dashing 中回傳 speedRatio，否則 1 |
| `resetDash()` | 完全重置（死亡時呼叫） |

### 移動整合

```
ROAMING block:
  if (isDashing) → dx,dy = locked dashDir（鎖定方向）
  else → dx,dy from WASD input

  moveDist = playerSpeed * getDashSpeedMultiplier() * dt
  碰撞判定不變（軸分離、同 collisionMask）
```

### HUD — Dash Gauge

- 位置：玩家左側（世界空間，跟隨玩家 + damage shake）
- 形狀：半橢圓弧（弧度朝左），x=-28，垂直 gaugeRY=18
- 顏色：底部暗橘 `#cc6600` → 頂部亮橘 `#ffaa00` 漸層
- 背景軌道：`dashGaugeBg`（半透明橘）
- 滿量或 dashing 時有 glow 效果（`shadowBlur: 8`）

### 拖尾粒子

- 類型：`'dash'`（Particle.js，需 `context` 參數傳入方向）
- 每 30ms 生成 3 顆，青色 `#00f3ff`，反向飄散
- 大小 5-10px，壽命 0.5-0.8s

## 道具系統

### 分類

| 類型 | 行為 | 範例 |
|------|------|------|
| PASSIVE | 走近自動觸發，立即消失 | HealPack, InvincibleStar |
| ACTIVE | 撿起持有 → Hold F 瞄準 → 放開 F 丟出啟動 | HealBox |

### 道具生命週期

1. **R 鍵生成** → 隨機位置落下（z=150, gravity=2500）
2. **地上狀態** → duration 倒數（0=永久）
3. **PASSIVE 撿起** → `onPassiveEffect()` → isDead
4. **ACTIVE 撿起** → `isHeld=true`, 存入 `player.heldItem`
5. **Hold F** → 瞄準模式（maxAimRadius 限制瞄準距離；準心不超出 edgeWall 內側；飛行路徑道具如 Bomb 會 clamp 到障礙物前最遠可達點；有 `aimPreview` 的道具會在瞄準點畫出作用範圍圈）
6. **放開 F** → `activate()` 丟出，可丟在任何位置（含 obstacle 上）；Hold 不足 `useItemHoldDelay`（def 0.2s）則取消不丟
7. **效果結束** → isDead

### HealBox 雙狀態

- **地上（未啟動）**：用 `duration` 計時，到期消失（0=永久）
- **丟出（已啟動 isActivated）**：ItemBase 自動跳過 duration 倒數（`!isActivated` 條件），改由 tick 完成 + pulse 結束判定死亡
- 落地前不計時：HealBox 覆寫 `update()`，未落地時只跑物理，不執行 `super.update()` 和 tick 邏輯

### Bomb 拋物線飛行

Bomb 是唯一從玩家位置飛到目標的 ACTIVE 道具（其他 ACTIVE 瞬移到目標上方垂直落下）：
- `tryThrowItem()` 中 `instanceof Bomb` 特殊分支，不設 `item.x/y` 到目標
- `activate(targetX, targetY)` 計算水平速度（`throwSpeed`）和初始 `vz`
- `vz` 根據飛行時間反算，讓炸彈自動落在目標點（距離近弧低，距離遠弧高）
- 飛行中 gravity=400，碰撞障礙物或落地時觸發 `explode()`
- 爆炸效果同 Rocket 但紅色（`bombExplosion` 粒子 + 紅色 `ExplosionWave`）
- 傷害判定同 MeteorStrike（含自傷 + 場景物件）
- `ExplosionWave` 支援可選顏色參數（向後相容，預設仍為 rocket 橘色）

### 瞄準範圍預覽（aimPreview）

ItemBase 預設 `aimPreview = null`，有作用範圍的道具在 constructor 設定：
- `HealBox` → `{ radius: this.radius }`
- `MeteorStrike` → `{ radius: SETTINGS.itemMeteorStrike.radius }`
- `Bomb` → `{ radius: SETTINGS.itemBomb.radius }`

`drawAimingUI()` 讀取 `player.heldItem.aimPreview`，有值就在瞄準點畫半透明圈。

### 道具交換（swap）

持有 ACTIVE 時撿新 ACTIVE：
- 舊道具 `dropToGround()` 拋出（低弧線水平為主，~1秒動畫）
- 新道具進入持有，inventory UI 播放進出動畫
- **不需 push 回 activeItems**（從未移除）

### dropToGround 物理參數

```js
z = 30, vz = -200, gravity = 500, bounciness = 0.3
水平 speed = 150~230, 落地後還原 gravity=2500, bounciness=0.4
```

grounding 閾值為 `|vz| < 50`（ItemBase），HealBox 自身物理閾值為 `|vz| < 100`。

## 視覺尺寸基準

所有視覺元素以 `SETTINGS.playerSize`（預設 24）為基準比例：

| 元素 | 尺寸 | 備註 |
|------|------|------|
| 玩家三角 | playerSize (24) | 頂點/翼展直接使用 |
| 無敵護盾 | playerSize * 1.5 = 36 | 六邊形半徑 |
| 火箭 | 20×10 | 固定值 |
| 煙霧粒子 | 4+rand*4, speed ±25 | |
| 爆炸粒子 | 5+rand*5, speed 60+rand*125 | |
| HP bar | 48×6 | 位於 y = -playerSize - 15 |
| Energy bar | 48×5 | HP 正下方 +3px |
| Buff icons | 22px (不隨 player 縮放) | HP bar 上方 -17px |
| Dash gauge | 半橢圓弧 RX=6, RY=18 | 玩家左側 x=-28，弧朝左 |
| 死亡碎片/復活效果 | 使用 playerSize | 自動等比縮放 |
| 地面道具 icon | perspectiveScale * 1.5 | 放大 50% |

## Inventory UI

- 位置：畫布底部中央（marginBottom=20px）
- 框大小 58px，icon 縮放 2.4x
- 始終顯示（空狀態為半透明暗框）
- 交換時動畫：舊道具向上淡出（0.4s），新道具從下滑入+縮放（0.3s easeOutQuad）
- 動畫狀態存於 `gameState.inventoryAnim`

## Settings 面板

- Player Settings：PlayerStatus / RocketAttack 子群組
- General Settings：FireTrap 參數
- Items：HealBox / HealPack / InvincibleStar / EnergyDrink / MeteorStrike / ReviveFeather 六選一，各有獨立參數群組
- `gameState.currentItemType` 決定 R 鍵生成哪種道具
- Panel 內 select/input 元素在 keydown 時自動 `preventDefault + blur`，防止原生鍵盤行為攔截遊戲按鍵
- **下拉高亮系統**：點擊 select 加上高亮（`.select-active`），點擊 panel 內其他區域取消。高亮中普通滾輪切換選項（非循環），Ctrl+滾輪保留給 zoom
- **Panel 點擊重置移動鍵**：點擊 panel 時以 capture phase 重置 WASD，防止按住移動中點 panel 導致 keyup 被 native dropdown 吞掉而卡方向

## 已知 Bug 與修復紀錄

### 1. 道具在 activeItems 中重複（嚴重）

**症狀**：tick rate 異常加速（如 1s 設定卻 0.5s 觸發），或掉出動畫越來越快。
**原因**：道具撿起時只設 `isHeld=true`，不從 `activeItems` 移除。但在 `tryThrowItem()` 或 swap 時又 `push` 到陣列 → 同物件存在多份引用 → `update(dt)` 每幀執行多次 → 物理/計時器倍速。
**修復**：移除所有多餘的 `gameState.activeItems.push()` — 在 `tryThrowItem()` 和 swap 邏輯中都不需要 push。
**教訓**：此專案中道具從生成到死亡始終留在 activeItems，靠 flag（isHeld/isDead/isActivated/isGrounded）控制行為。任何地方都不應再 push 同一物件。

### 2. HealBox tick 僅顯示 4 次（應為 5 次）

**症狀**：maxTicks=5 但只看到 4 次視覺 pulse。
**原因**：啟動時 `duration = counts * tickRate = 5s`，`onDurationEnd()` 在第 5 秒同時觸發 isDead，第 5 次 tick 的 pulse 動畫來不及播放。
**修復**：ItemBase 的 duration 倒數加入 `!isActivated` 條件，啟動後自動跳過。改用 `ticksPerformed >= maxTicks && pulseTime <= 0` 判定死亡。

### 3. HealBox tick 在飛行中就開始計時

**症狀**：丟出後 tick 治療的間隔比設定值短。
**原因**：`activate()` 後立刻開始 tickTimer 計時，但道具還在空中（拋物線落地動畫中）。
**修復**：HealBox 覆寫 `update()`，未落地時只執行物理、return，落地後才呼叫 `super.update()` 和 tick 邏輯。

### 4. R 鍵預設生成錯誤道具

**症狀**：重新整理後 panel 顯示 HealBox 但 R 鍵掉出 HealPack。
**原因**：`gameState.currentItemType` 預設為 `'HealPack'`，HTML dropdown 預設選項為 `'HealBox'`，不同步。
**修復**：GameState 預設值改為 `'HealBox'` 與 HTML 一致。

### 5. dropToGround 修改 gravity/bounciness 永久污染實例

**症狀**：掉出動畫速度不一致。
**原因**：`dropToGround()` 修改 `this.gravity` 和 `this.bounciness`，落地後未還原。
**修復**：在物理 grounding 時還原為建構子預設值（gravity=2500, bounciness=0.4）。

## 重要注意事項

- 所有道具共用 `gameState.activeItems` 陣列，**永遠不要對同一物件做重複 push**
- `duration=0` 代表永久存在（不倒數），`duration>0` 才會計時死亡
- HealBox 有自己的物理迴圈（在 `update()` 中），與 ItemBase 的物理邏輯重複但獨立 — 修改物理時兩邊都要注意
- 玩家移動和道具生成的邊界使用 `gameState.world.width/height`（世界尺寸），不是 `gameState.width/height`（畫布尺寸）
- 繪製世界物件必須在 `applyCameraTransform/restoreCameraTransform` 之間；HUD 元素在 restore 之後繪製（螢幕空間）
- 滑鼠的 `input.mouse.x/y` 已自動轉為世界座標，遊戲邏輯直接使用即可
- GitHub Pages 部署後約需 1-2 分鐘生效
- 開發者為 solo developer，直接在 main 分支工作
- `nul` 檔案是 Windows 保留名稱，無法被 git 追蹤，已加入 .gitignore
- `.claude/` 目錄不需推送
