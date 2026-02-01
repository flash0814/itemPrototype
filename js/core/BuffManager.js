// Buff 管理系統
// 統一管理所有 buff 的狀態、timer、icon 顯示

// Buff 類型
export const BUFF_TYPE = {
    INVINCIBLE: 'INVINCIBLE',
    ENERGY_HOT: 'ENERGY_HOT',
    REVIVE_BLINK: 'REVIVE_BLINK'
};

// Icon 類型
export const BUFF_ICON = {
    SHIELD: 'SHIELD',
    ENERGY: 'ENERGY',
    REVIVE: 'REVIVE'
};

export const buffManager = {
    buffs: [],
    _idCounter: 0,

    /**
     * 新增一般 buff
     * @param {Object} config
     * @param {string} config.id - 唯一識別碼
     * @param {string} config.type - BUFF_TYPE
     * @param {number} config.duration - 持續時間（秒）
     * @param {boolean} config.showIcon - 是否顯示 icon
     * @param {string} config.iconType - BUFF_ICON
     * @param {string} config.iconColor - icon 顏色
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
            iconType: config.iconType || BUFF_ICON.SHIELD,
            iconColor: config.iconColor || '#00f3ff',
            defendRatio: config.defendRatio,
            onExpire: config.onExpire
        };
        this.buffs.push(buff);
        return buff;
    },

    /**
     * 新增 HoT (Heal over Time) buff
     * @param {Object} config
     * @param {string} config.type - BUFF_TYPE
     * @param {number} config.totalTicks - 總 tick 次數
     * @param {number} config.perTickValue - 每次 tick 的值
     * @param {number} config.tickRate - tick 間隔（秒）
     * @param {number} config.initialDelay - 首次 tick 前延遲
     * @param {boolean} config.showIcon - 是否顯示 icon
     * @param {string} config.iconType - BUFF_ICON
     * @param {string} config.iconColor - icon 顏色
     * @param {Function} config.onTick - 每次 tick callback
     * @param {Function} config.onExpire - 到期 callback
     */
    addHoTBuff(config) {
        const totalDuration = config.initialDelay + (config.totalTicks * config.tickRate);
        const buff = {
            id: config.id || `hot_${++this._idCounter}`,
            type: config.type,
            duration: totalDuration,
            elapsed: 0,
            showIcon: config.showIcon ?? true,
            iconType: config.iconType || BUFF_ICON.ENERGY,
            iconColor: config.iconColor || '#e8c828',
            ticksRemaining: config.totalTicks,
            perTickValue: config.perTickValue,
            tickRate: config.tickRate,
            tickTimer: config.initialDelay,
            onTick: config.onTick,
            onExpire: config.onExpire
        };
        this.buffs.push(buff);
        return buff;
    },

    /**
     * 移除指定 id 的 buff
     */
    removeBuff(id) {
        const idx = this.buffs.findIndex(b => b.id === id);
        if (idx !== -1) this.buffs.splice(idx, 1);
    },

    /**
     * 檢查是否有指定類型的 buff
     */
    hasBuff(type) {
        return this.buffs.some(b => b.type === type);
    },

    /**
     * 取得指定類型的第一個 buff
     */
    getBuff(type) {
        return this.buffs.find(b => b.type === type) || null;
    },

    /**
     * 取得所有需要顯示 icon 的 buff
     */
    getVisibleBuffs() {
        return this.buffs.filter(b => b.showIcon && b.elapsed < b.duration);
    },

    /**
     * 每幀更新所有 buff
     */
    update(dt) {
        for (let i = this.buffs.length - 1; i >= 0; i--) {
            const buff = this.buffs[i];
            buff.elapsed += dt;

            // HoT tick 處理
            if (buff.ticksRemaining !== undefined) {
                buff.tickTimer -= dt;
                if (buff.tickTimer <= 0 && buff.ticksRemaining > 0) {
                    if (buff.onTick) buff.onTick(buff.perTickValue);
                    buff.ticksRemaining--;
                    buff.tickTimer = buff.tickRate;
                }
            }

            // 到期移除
            if (buff.elapsed >= buff.duration) {
                if (buff.onExpire) buff.onExpire();
                this.buffs.splice(i, 1);
            }
        }
    },

    /**
     * 清除所有 buff（死亡時呼叫）
     */
    clearAll() {
        this.buffs.length = 0;
    }
};
