// 遊戲設定常量
export const SETTINGS = {
    aspectRatio: 16 / 9,
    playerSpeed: 300,
    rotationSpeed: 15,
    playerSize: 24,
    gridSize: 50,
    aimIndicatorRadius: 8,
    useItemHoldDelay: 0.2,

    colors: {
        bg: '#16161a',
        grid: '#23232a',
        player: '#00f3ff',
        playerShadow: 'rgba(0, 243, 255, 0.6)',
        obstacle: '#2a2a32',
        obstacleBorder: '#3e3e4a',
        obstacleHighlight: 'rgba(255, 255, 255, 0.04)',
        obstacleShadowInner: 'rgba(0, 0, 0, 0.3)',
        wallBase: '#33333d',
        wallBorder: '#4a4a56',
        wallHighlight: 'rgba(255, 255, 255, 0.05)',
        aimValid: '#00ff00',
        healBox: '#00ff00',
        healRange: 'rgba(0, 255, 0, 0.2)',
        healPack: '#ffffff',
        healPackBase: '#00aa00',
        star: '#ffd700',
        starGlow: 'rgba(255, 215, 0, 0.6)',
        shield: 'rgba(255, 215, 0, 0.3)',
        shieldBorder: '#ffd700',
        buffShield: '#00f3ff',
        buffBorder: '#00f3ff',
        textHeal: '#00ff00',
        textDmg: '#ff3333',
        shadow: 'rgba(0, 0, 0, 0.5)',
        fireTrap: 'rgba(255, 60, 0, 0.3)',
        energy: '#c8a832',
        energyDrink: '#e8c828',
        energyDrinkGlow: 'rgba(232, 200, 40, 0.6)',
        rocket: '#ffaa00',
        rocketExplosion: 'rgba(255, 100, 0, 0.8)',
        meteorStrike: '#cc3333',
        meteorGlow: 'rgba(255, 100, 30, 0.6)',
        bomb: '#aa44ff',
        bombDark: '#6622aa',
        bombExplosion: 'rgba(255, 50, 30, 0.8)',
        dashGauge: '#ff8c00',
        dashGaugeBg: 'rgba(255, 140, 0, 0.2)'
    },

    general: {
        maxPlayerHP: 200,
        fireTrapDmg: 50,
        fireTrapTick: 0.7,
        maxEnergy: 100,
        defEnergy: 100,
        energyRecoverRate: 20
    },

    dashConfig: {
        maxEnergy: 100,
        energyCost: 35,
        recoveryRate: 25,
        recoveryDelay: 0.35,
        dashCD: 0.15,
        speedRatio: 4,
        dashTime: 0.25,
        trailInterval: 0.03
    },

    deathRevive: {
        autoReviveTime: 3,
        reviveItemTime: 0,        // 有復活羽毛時的復活等待時間
        reviveInvincibleTime: 3,
        deathAnimTime: 0.8,
        reviveAnimTime: 1.0
    },

    itemDropRange: 250,

    attackRocket: { speed: 600, damage: 15, radius: 60, lifetime: 4, energyCost: 10 },

    itemHealBox: {
        maxAimRadius: 200,
        duration: 0,
        counts: 6,
        radius: 170,
        value: 25,
        tick: 0.8
    },

    itemEnergyDrink: {
        duration: 20,
        instantPlus: 0,
        effectDuration: 10
    },

    itemMeteorStrike: {
        duration: 0,
        maxAimRadius: 2000,
        damage: 200,
        radius: 250,
        meteorSpeed: 800,
        meteorAltitude: 600,
        meteorAngle: 45
    },

    itemHealPack: { duration: 20, value: 30, maxAimRadius: 0 },
    itemInvincibleStar: { duration: 20, effectDuration: 10, defendRatio: 0, maxAimRadius: 0 },
    itemReviveFeather: { duration: 0 },
    itemBomb: { duration: 0, maxAimRadius: 320, damage: 100, radius: 110, throwSpeed: 300 },

    // 跳字全域預設值
    floatingText: {
        life: 1.0,          // 持續時間（秒）
        speedY: 50,         // 上飄速度（px/s）
        font: 'bold 24px Arial',
        fadeStyle: 'linear', // 'linear' | 'late'（late = 前半段不透明，後半段快速淡出）
        scale: 1.0,          // 初始縮放
        spreadX: 0,          // 水平隨機散開範圍（px）
    },

    worldConfig: {
        width: 3400,
        height: 2000,
        wallThickness: 200,
        playerStart: { x: 500, y: 500 },
        obstacles: [{ x: 600, y: 600, size: 200 }],
        fireTraps: [{ x: 300, y: 300 }]
    },

    cameraConfig: {
        initialZoom: 1.0,
        zoomMin: 0.3,
        zoomMax: 3.0,
        zoomStep: 0.1,
        // Edge Pan (Mouse aim)
        edgePanMargin: 0.12,         // 螢幕外 12% 觸發捲動
        edgePanMaxSpeed: 600,        // 最大捲動速度 (world px/s, ÷zoom)

        // PAD Aim (WASD aim)
        padAimBaseSpeed: 200,        // 初始瞄準移動速度 (px/s)
        padAimMaxSpeed: 1000,        // 加速後最大速度
        padAimAccelDelay: 0.3,       // 按住多久開始加速 (s)
        padAimAccelTime: 0.8,        // 加速到 max 的時間 (s)
        padCamLerpSpeed: 12,          // camera 追蹤 aimpoint 的 lerp 速度

        // 回歸 (共用)
        camBackPlayerDelay: 1.2,     // 丟出道具後延遲幾秒才開始回歸玩家
        camBackPlayerTime: 1.0       // 攝影機回歸玩家的 tween 時間
    }
};
