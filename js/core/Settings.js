// 遊戲設定常量
export const SETTINGS = {
    aspectRatio: 16 / 9,
    playerSpeed: 300,
    rotationSpeed: 15,
    playerSize: 20,
    gridSize: 50,
    aimIndicatorRadius: 8,

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
        aimRange: 'rgba(50, 255, 100, 0.6)',
        aimValid: '#00ff00',
        aimInvalid: '#ff0000',
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
        meteorGlow: 'rgba(255, 100, 30, 0.6)'
    },

    general: {
        maxPlayerHP: 250,
        fireTrapDmg: 50,
        fireTrapTick: 0.7,
        maxEnergy: 100,
        defEnergy: 100,
        energyRecoverRate: 20
    },

    deathRevive: {
        autoReviveTime: 3,
        reviveInvincibleTime: 3,
        deathAnimTime: 0.8,
        reviveAnimTime: 1.0
    },

    itemDropRange: 300,

    attackRocket: { speed: 600, damage: 15, radius: 60, lifetime: 4, energyCost: 10 },

    itemHealBox: {
        maxAimRadius: 200,
        duration: 0,
        counts: 5,
        radius: 170,
        value: 25,
        tick: 1,
        waitToBackZoom: 2
    },

    itemEnergyDrink: {
        duration: 10,
        instantPlus: 0,
        totalTicks: 5,
        perTickPlus: 10,
        tickRate: 0.8,
        waitToFirstTick: 0.4
    },

    itemMeteorStrike: {
        duration: 0,
        maxAimRadius: 650,
        damage: 150,
        radius: 250,
        meteorSpeed: 800,
        meteorAltitude: 600,
        meteorAngle: 45,
        waitToBackZoom: 1.2
    },

    itemHealPack: { duration: 10, value: 30, maxAimRadius: 0 },
    itemInvincibleStar: { duration: 10, effectDuration: 10, defendRatio: 0, maxAimRadius: 0 },

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
        width: 2200,
        height: 1600,
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
        autoZoomTime: 1.0    // 自動 zoom 動畫時間（秒）
    }
};
