// 共享遊戲狀態
// 這個模組作為中央狀態容器，避免循環依賴

export const GAME_STATE_MODE = { ROAMING: 0, AIMING: 1 };

export const gameState = {
    currentMode: GAME_STATE_MODE.ROAMING,
    currentItemType: 'HealBox',
    currentPlayerSettingType: 'PlayerStatus',

    // 畫布尺寸（viewport）
    width: 0,
    height: 0,

    // 世界尺寸
    world: { width: 2500, height: 2500 },

    // 攝影機
    camera: {
        x: 0, y: 0, zoom: 1.0, targetZoom: 1.0
    },

    // 遊戲物件集合
    fieldObjects: [],
    activeItems: [],
    projectiles: [],
    floatingTexts: [],
    particles: [],
    deathEffect: null,

    // Inventory UI 動畫狀態
    inventoryAnim: {
        // 新道具進入動畫
        enterTimer: 0,
        enterDuration: 0.3,
        // 舊道具離開動畫
        exitTimer: 0,
        exitDuration: 0.4,
        exitIcon: null // 暫存舊道具的 drawIcon 引用
    }
};

export const editorState = {
    draggingObj: null,
    dragOffsetX: 0,
    dragOffsetY: 0
};

export const input = {
    keys: { w: false, a: false, s: false, d: false },
    mouse: { x: 0, y: 0, screenX: 0, screenY: 0, valid: false }
};
