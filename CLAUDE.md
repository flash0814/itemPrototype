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
  entities/
    Player.js            — 玩家狀態（hp, trail, heldItem, invincible 等）
    FieldObject.js       — 場景物件基類
    Obstacle.js          — 障礙物（可拖曳/複製）
    FireTrap.js          — 火焰陷阱（週期性傷害）
  items/
    ItemBase.js          — 道具基類（物理、duration、pickup、dropToGround）
    HealBox.js           — 主動道具：治療區域（ACTIVE, 需瞄準丟出）
    HealPack.js          — 被動道具：即時補血（PASSIVE）
    InvincibleStar.js    — 被動道具：無敵星（PASSIVE）
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

## Camera / Viewport 系統

### 概念

- **World**：固定尺寸的遊戲世界（預設 2500x2500），origin (0,0) 在左上角
- **Viewport**：16:9 畫布填滿瀏覽器，作為觀看世界的「窗口」
- **Camera**：中心跟隨玩家，夾在世界邊界內，避免看到世界外

### 設定參數

```js
SETTINGS.worldConfig = {
    width: 2500, height: 2500,
    playerStart: { x: 300, y: 300 },
    obstacles: [{ x: 400, y: 400, size: 200 }],
    fireTraps: [{ x: 80, y: 80 }]
}

SETTINGS.cameraConfig = {
    initialZoom: 1.0,
    zoomMin: 0.3,      // 手動滾輪最遠（auto zoom 可突破）
    zoomMax: 3.0,      // 最近
    zoomStep: 0.1,     // 每次滾輪的線性步進量
    autoZoomTime: 1.0  // auto zoom 動畫時間（秒）
}
```

### 狀態（GameState）

- `gameState.world` — `{ width, height }` 世界尺寸
- `gameState.camera` — `{ x, y, zoom, targetZoom, autoZoom }` 攝影機中心位置、縮放與自動縮放狀態
- `input.mouse.screenX/screenY` — 螢幕座標（用於 HUD 互動）
- `input.mouse.x/y` — 世界座標（透過 `screenToWorld()` 自動轉換）

### Camera.js API

| 函式 | 用途 |
|------|------|
| `updateCamera(targetX, targetY)` | 每幀更新攝影機位置，跟隨目標並夾邊 |
| `applyCameraTransform(ctx)` | 繪製世界物件前呼叫，設置 ctx 變換 |
| `restoreCameraTransform(ctx)` | 繪製世界物件後呼叫，還原 ctx |
| `screenToWorld(sx, sy)` | 螢幕座標 → 世界座標 |
| `applyZoom(delta)` | 滾輪縮放（線性步進），delta>0 縮小 / delta<0 放大 |
| `updateZoom(dt)` | 每幀：auto zoom 動畫 / waitTimer 倒數 / lerp 追趕 targetZoom |
| `calcZoomForRadius(r)` | 計算讓半徑 r 的圈完全可見所需的 zoom 值 |
| `startAutoZoom(zoom, dur)` | 啟動 auto zoom 動畫（smoothstep ease-in-out） |

### 繪製順序

```
draw():
  fillRect 清除畫布
  applyCameraTransform(ctx)     ← 世界空間開始
    drawGrid / drawWorldBounds
    fieldObjects / items / projectiles / particles
    trail / player / HPBar / aimingUI / floatingTexts
  restoreCameraTransform(ctx)   ← 世界空間結束
  drawHeldItemUI(ctx)           ← 螢幕空間（HUD）
```

### 座標轉換

滑鼠移動時自動轉換：螢幕座標存入 `screenX/screenY`，世界座標存入 `x/y`。所有遊戲邏輯（射擊、瞄準、拖曳、碰撞）使用 `input.mouse.x/y`（世界座標），無需手動轉換。

### 攝影機夾邊

當視窗可見範圍小於世界時，攝影機中心被夾在 `[viewW/2, world.width - viewW/2]`，確保不超出世界邊界。當縮小到可見範圍大於世界時，攝影機居中。

### Zoom 系統

**手動縮放（滾輪）：**
- 線性步進：`targetZoom ± zoomStep`（def 0.1），`Math.round` 確保精確小數 2 位
- `cam.zoom` 每幀 lerp 追趕 `targetZoom`，產生平滑過渡
- 範圍限制：`zoomMin` (0.3) ~ `zoomMax` (3.0)

**Auto Zoom（ACTIVE 道具瞄準時）：**
- 按 F 進入 aiming → 記錄 `prevZoom`（滾輪乾淨值）→ 若當前視野看不到整個 `maxAimRadius` 綠圈，自動拉遠
- Auto zoom 可突破 `zoomMin`（手動滾輪仍受限）
- 動畫：smoothstep ease-in-out，固定 `autoZoomTime` 秒（def 1.0）
- 取消 aiming（再按 F）→ 1 秒回復 `prevZoom`
- LMB 丟出 → 等 `waitToBackZoom` 秒（每個 ACTIVE item 各自設定）→ 1 秒回復 `prevZoom`
- `targetZoom` 在 auto zoom 期間不被 sync，保持滾輪乾淨值，避免快速 FFF 造成 zoom 漂移

**設計要點：**
- `targetZoom` 永遠是精確的滾輪步進值，不受 auto zoom 動畫污染
- `prevZoom` 存的是 `targetZoom`（乾淨值），確保回復後完全一致
- Auto zoom 結束後 lerp 追趕 `targetZoom`，兩者匯合

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
    ENERGY_HOT: 'ENERGY_HOT',    // Energy HoT（EnergyDrink）
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

## 道具系統

### 分類

| 類型 | 行為 | 範例 |
|------|------|------|
| PASSIVE | 走近自動觸發，立即消失 | HealPack, InvincibleStar |
| ACTIVE | 撿起持有 → F 進瞄準 → 左鍵丟出啟動 | HealBox |

### 道具生命週期

1. **R 鍵生成** → 隨機位置落下（z=150, gravity=2500）
2. **地上狀態** → duration 倒數（0=永久）
3. **PASSIVE 撿起** → `onPassiveEffect()` → isDead
4. **ACTIVE 撿起** → `isHeld=true`, 存入 `player.heldItem`
5. **F 鍵** → 瞄準模式，顯示 maxAimRadius 範圍圈
6. **左鍵丟出** → `activate()`, 從 z=150 落下，落地後開始效果
7. **效果結束** → isDead

### HealBox 雙狀態

- **地上（未啟動）**：用 `duration` 計時，到期消失（0=永久）
- **丟出（已啟動 isActivated）**：ItemBase 自動跳過 duration 倒數（`!isActivated` 條件），改由 tick 完成 + pulse 結束判定死亡
- 落地前不計時：HealBox 覆寫 `update()`，未落地時只跑物理，不執行 `super.update()` 和 tick 邏輯

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

## Inventory UI

- 位置：畫布正上方中央
- 始終顯示（空狀態為半透明暗框）
- 交換時動畫：舊道具向上淡出（0.4s），新道具從下滑入+縮放（0.3s easeOutQuad）
- 動畫狀態存於 `gameState.inventoryAnim`

## Settings 面板

- Player Settings：PlayerStatus / RocketAttack 子群組
- General Settings：FireTrap 參數
- Items：HealBox / HealPack / InvincibleStar 三選一，各有獨立參數群組
- `gameState.currentItemType` 決定 R 鍵生成哪種道具

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
