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
    Settings.js          — 所有常量與預設值（SETTINGS 物件）
    Utils.js             — 工具函式（lerpAngle, checkCollisionWithRect）
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
    Renderer.js          — 所有繪製函式（grid, player, aim UI, held item UI）
  ui/
    SettingsPanel.js     — 右側設定面板 DOM 綁定
```

### 核心設計模式

- **GameState.js 作為中央狀態容器**：所有模組 import 同一個 gameState 物件，避免循環依賴。Player.js 也是 export 一個 singleton 物件。
- **道具不從 activeItems 移除**：撿起時只設 `isHeld=true`，仍留在 `gameState.activeItems` 陣列中。draw/pickup 邏輯透過 flag 跳過。丟出時也不需 push 回去。

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

- **地上（未啟動）**：用 `groundDuration` 計時，到期消失
- **丟出（已啟動 isActivated）**：`duration=0` 停止倒數，改用 tick 完成 + pulse 結束判定死亡
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
**修復**：啟動後設 `duration=0`（停止 duration 倒數），改用 `ticksPerformed >= maxTicks && pulseTime <= 0` 判定死亡。

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
- GitHub Pages 部署後約需 1-2 分鐘生效
- 開發者為 solo developer，直接在 main 分支工作
- `nul` 檔案是 Windows 保留名稱，無法被 git 追蹤，已加入 .gitignore
- `.claude/` 目錄不需推送
