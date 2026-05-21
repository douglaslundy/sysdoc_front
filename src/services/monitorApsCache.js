const _cache = {};
const TTL = 5 * 60 * 1000; // 5 minutos

export function getCached(key) {
    const entry = _cache[key];
    if (!entry) return null;
    if (Date.now() - entry.ts > TTL) { delete _cache[key]; return null; }
    return entry.data;
}

export function setCached(key, data) {
    _cache[key] = { data, ts: Date.now() };
}
