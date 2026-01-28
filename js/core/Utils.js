// ID 計數器
const _idCounters = {};

// 生成唯一 ID
export function generateId(prefix) {
    if (!_idCounters[prefix]) {
        _idCounters[prefix] = 0;
    }
    return `${prefix}_${++_idCounters[prefix]}`;
}

// 角度插值
export function lerpAngle(start, end, t) {
    const da = (end - start) % (2 * Math.PI);
    const distance = (2 * da) % (2 * Math.PI) - da;
    return start + distance * t;
}

// 檢測圓形與矩形碰撞
export function checkCollisionWithRect(cx, cy, radius, rect) {
    const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height));
    const distanceX = cx - closestX;
    const distanceY = cy - closestY;
    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    return distanceSquared < (radius * radius);
}
