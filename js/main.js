// 遊戲入口點
import { initGame } from './core/Game.js';

// DOM 載入完成後啟動遊戲
document.addEventListener('DOMContentLoaded', () => {
    initGame();
});
