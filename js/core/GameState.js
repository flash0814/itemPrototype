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

    // 瞄準輸入模式
    aimInputMode: 'MOUSE',  // 'MOUSE' | 'PAD'
    padAim: { x: 0, y: 0, moveHoldTime: 0 },

    // 攝影機
    camera: {
        x: 0, y: 0, zoom: 1.0, targetZoom: 1.0,
        edgePan: { offsetX: 0, offsetY: 0 },
        aimFollow: {
            state: 'FOLLOW_PLAYER',  // 'FOLLOW_PLAYER' | 'FOLLOW_AIM' | 'RETURNING'
            weight: 0,               // 混合權重（0=玩家, 1=準心）
            padCamX: 0,              // PAD mode 攝影機追蹤位置
            padCamY: 0,
            returnDelay: 0,          // 回歸延遲倒數
            returnTimer: 0,          // 回歸已過時間
            returnDuration: 0,       // 回歸總時間
            returnFromX: 0,          // 回歸起點 X
            returnFromY: 0           // 回歸起點 Y
        }
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
    keys: { w: false, a: false, s: false, d: false, arrowup: false, arrowdown: false, arrowleft: false, arrowright: false },
    mouse: { x: 0, y: 0, screenX: 0, screenY: 0, valid: false }
};
