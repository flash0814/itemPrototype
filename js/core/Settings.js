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
        obstacle: '#2d2d35',
        obstacleBorder: '#4a4a55',
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
        rocket: '#ffaa00',
        rocketExplosion: 'rgba(255, 100, 0, 0.8)'
    },

    general: {
        maxPlayerHP: 250,
        fireTrapDmg: 50,
        fireTrapTick: 0.7
    },

    attackRocket: { speed: 600, damage: 15, radius: 60, lifetime: 4 },

    itemHealBox: {
        maxAimRadius: 200,
        counts: 5,
        radius: 170,
        value: 25,
        tick: 1
    },

    itemHealPack: { duration: 10, value: 30 },
    itemInvincibleStar: { duration: 10, effectDuration: 10, defendRatio: 0 }
};
