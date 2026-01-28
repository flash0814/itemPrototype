// 共享遊戲狀態
// 這個模組作為中央狀態容器，避免循環依賴

export const GAME_STATE_MODE = { ROAMING: 0, AIMING: 1 };

export const gameState = {
    currentMode: GAME_STATE_MODE.ROAMING,
    currentPassiveType: 'HealPack',
    currentPlayerSettingType: 'PlayerStatus',

    // 畫布尺寸
    width: 0,
    height: 0,

    // 遊戲物件集合
    fieldObjects: [],
    activeItems: [],
    projectiles: [],
    floatingTexts: [],
    particles: []
};

export const editorState = {
    draggingObj: null,
    dragOffsetX: 0,
    dragOffsetY: 0
};

export const input = {
    keys: { w: false, a: false, s: false, d: false },
    mouse: { x: 0, y: 0, valid: false }
};
