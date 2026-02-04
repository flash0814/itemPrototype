/**
 * BuffManager3D.js - Buff 管理系統
 *
 * 統一管理所有 buff 的狀態、timer、icon 顯示
 * 移植自 2D 版本的 BuffManager.js
 */

// Buff 類型
export const BUFF_TYPE_3D = {
    INVINCIBLE: 'INVINCIBLE',
    ENERGY_HOT: 'ENERGY_HOT',
    REVIVE_FEATHER: 'REVIVE_FEATHER'
};

// Icon 類型
export const BUFF_ICON_3D = {
    SHIELD: 'SHIELD',
    ENERGY: 'ENERGY',
    REVIVE: 'REVIVE',
    FEATHER: 'FEATHER'
};

class BuffManager3D {
    constructor() {
        this.buffs = [];
        this._idCounter = 0;
    }

    /**
     * 新增一般 buff
     * @param {Object} config
     * @param {string} config.id - 唯一識別碼
     * @param {string} config.type - BUFF_TYPE_3D
     * @param {number} config.duration - 持續時間（秒）
     * @param {boolean} config.showIcon - 是否顯示 icon
     * @param {string} config.iconType - BUFF_ICON_3D
     * @param {string} config.iconColor - icon 顏色 (CSS color string)
     * @param {number} config.defendRatio - 防禦倍率（無敵用）
     * @param {Function} config.onExpire - 到期 callback
     */
    addBuff(config) {
        const buff = {
            id: config.id || `buff_${++this._idCounter}`,
            type: config.type,
            duration: config.duration,
            elapsed: 0,
            showIcon: config.showIcon ?? true,
            iconType: config.iconType || BUFF_ICON_3D.SHIELD,
            iconColor: config.iconColor || '#00f3ff',
            defendRatio: config.defendRatio ?? 1,
            onExpire: config.onExpire
        };
        this.buffs.push(buff);
        return buff;
    }

    /**
     * 新增或刷新 buff：同 type 已存在則移除舊的再加新的
     */
    addOrRefreshBuff(config) {
        // 移除同 type 的所有舊 buff
        for (let i = this.buffs.length - 1; i >= 0; i--) {
            if (this.buffs[i].type === config.type) {
                this.buffs.splice(i, 1);
            }
        }
        return this.addBuff(config);
    }

    /**
     * 移除指定 id 的 buff
     */
    removeBuff(id) {
        const idx = this.buffs.findIndex(b => b.id === id);
        if (idx !== -1) this.buffs.splice(idx, 1);
    }

    /**
     * 移除指定 type 的所有 buff
     */
    removeBuffByType(type) {
        for (let i = this.buffs.length - 1; i >= 0; i--) {
            if (this.buffs[i].type === type) {
                this.buffs.splice(i, 1);
            }
        }
    }

    /**
     * 檢查是否有指定類型的 buff
     */
    hasBuff(type) {
        return this.buffs.some(b => b.type === type);
    }

    /**
     * 取得指定類型的第一個 buff
     */
    getBuff(type) {
        return this.buffs.find(b => b.type === type) || null;
    }

    /**
     * 取得所有需要顯示 icon 的 buff
     */
    getVisibleBuffs() {
        return this.buffs.filter(b => b.showIcon && b.elapsed < b.duration);
    }

    /**
     * 每幀更新所有 buff
     */
    update(dt) {
        for (let i = this.buffs.length - 1; i >= 0; i--) {
            const buff = this.buffs[i];
            buff.elapsed += dt;

            // 到期移除
            if (buff.elapsed >= buff.duration) {
                if (buff.onExpire) buff.onExpire();
                this.buffs.splice(i, 1);
            }
        }
    }

    /**
     * 清除所有 buff（死亡時呼叫）
     */
    clearAll() {
        this.buffs.length = 0;
    }
}

// 單例
export const buffManager3D = new BuffManager3D();
