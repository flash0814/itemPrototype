/**
 * EffectsManager3D.js - 特效管理器
 *
 * 統一管理粒子、爆炸波、特殊效果
 */

import { Particle3D } from './Particle3D.js';
import { ExplosionWave3D } from './ExplosionWave3D.js';

export class EffectsManager3D {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.waves = [];
        this.effects = [];

        // 粒子數量限制
        this.maxParticles = 300;
    }

    /**
     * 更新所有特效
     */
    update(dt) {
        // 更新粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(dt);
            if (p.isDead) {
                this.particles.splice(i, 1);
            }
        }

        // 更新爆炸波
        for (let i = this.waves.length - 1; i >= 0; i--) {
            const w = this.waves[i];
            w.update(dt);
            if (w.isDead) {
                this.waves.splice(i, 1);
            }
        }

        // 更新特殊效果
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const e = this.effects[i];
            e.update(dt);
            if (e.isDead) {
                this.effects.splice(i, 1);
            }
        }
    }

    /**
     * 生成單一粒子
     */
    spawnParticle(x, y, z, type, config = {}) {
        if (this.particles.length >= this.maxParticles) return;
        const p = new Particle3D(this.scene, x, y, z, type, config);
        this.particles.push(p);
        return p;
    }

    /**
     * 批量生成粒子
     */
    spawnParticles(x, y, z, type, count, config = {}) {
        for (let i = 0; i < count; i++) {
            this.spawnParticle(x, y, z, type, config);
        }
    }

    /**
     * 生成爆炸波
     */
    spawnWave(x, z, radius, config = {}) {
        const w = new ExplosionWave3D(this.scene, x, z, radius, config);
        this.waves.push(w);
        return w;
    }

    // ===== 預設特效組合 =====

    /**
     * 火箭爆炸
     */
    rocketExplosion(x, z, radius) {
        // 爆炸波（橘色）
        this.spawnWave(x, z, radius, { color: 0xffaa00 });

        // 爆炸粒子
        this.spawnParticles(x, 0.3, z, 'explosion', 15);

        // 煙霧
        this.spawnParticles(x, 0.2, z, 'smoke', 8);

        // 彩色碎紙（Overcooked 風）
        this.spawnParticles(x, 0.5, z, 'confetti', 10);
    }

    /**
     * 炸彈爆炸
     */
    bombExplosion(x, z, radius) {
        // 爆炸波（紅色）
        this.spawnWave(x, z, radius, { color: 0xff3322 });

        // 紅色爆炸粒子
        this.spawnParticles(x, 0.4, z, 'bombExplosion', 20);

        // 黑煙
        for (let i = 0; i < 10; i++) {
            const p = this.spawnParticle(x, 0.2, z, 'smoke');
            if (p) p.color = 0x555555;
        }

        // 彩色碎紙
        this.spawnParticles(x, 0.6, z, 'confetti', 12);
    }

    /**
     * 隕石撞擊
     */
    meteorImpact(x, z, radius) {
        // 爆炸波（紅橘色）
        this.spawnWave(x, z, radius, { color: 0xff6600 });
        this.spawnWave(x, z, radius * 0.6, { color: 0xff3300, fadeSpeed: 3 });

        // 火焰碎片
        this.spawnParticles(x, 0.5, z, 'meteorImpact', 25);

        // 煙霧
        this.spawnParticles(x, 0.3, z, 'smoke', 12);
    }

    /**
     * 治療效果
     */
    healEffect(x, z, count = 5) {
        this.spawnParticles(x, 0.2, z, 'heal', count);
    }

    /**
     * 傷害效果
     */
    damageEffect(x, z, count = 8) {
        this.spawnParticles(x, 0.3, z, 'damage', count);
    }

    /**
     * 能量效果
     */
    energyEffect(x, z, count = 6) {
        this.spawnParticles(x, 0.2, z, 'energy', count);
    }

    /**
     * 無敵激活效果
     */
    invincibleEffect(x, z) {
        this.spawnParticles(x, 0.3, z, 'invincible', 12);
        this.spawnWave(x, z, 1.5, { color: 0xffd54f, fadeSpeed: 3 });
    }

    /**
     * 復活效果
     */
    reviveEffect(x, z) {
        // 光圈
        this.spawnWave(x, z, 2, { color: 0x00ffff, fadeSpeed: 1.5 });

        // 青色菱形
        this.spawnParticles(x, 0.5, z, 'revive', 20);

        // 金色星星
        this.spawnParticles(x, 0.3, z, 'invincible', 8);
    }

    /**
     * 死亡效果
     */
    deathEffect(x, z) {
        // 灰色煙霧
        this.spawnParticles(x, 0.3, z, 'smoke', 15);

        // 紅色傷害
        this.spawnParticles(x, 0.4, z, 'damage', 10);
    }

    /**
     * 道具撿起效果
     */
    pickupEffect(x, z, color = 0xffffff) {
        // 上升的星星
        for (let i = 0; i < 6; i++) {
            const p = this.spawnParticle(x, 0.3, z, 'energy');
            if (p && p.mesh && p.mesh.material) {
                p.mesh.material.color.setHex(color);
            }
        }
    }

    /**
     * 清除所有特效
     */
    clear() {
        this.particles.forEach(p => p.die());
        this.waves.forEach(w => w.die());
        this.effects.forEach(e => e.die && e.die());
        this.particles = [];
        this.waves = [];
        this.effects = [];
    }
}
