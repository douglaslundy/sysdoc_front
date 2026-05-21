const TTL = 5 * 60 * 1000; // 5 minutos
const PREFIX = 'aps_cache_';

function storageAvailable() {
    try { sessionStorage.setItem('__test', '1'); sessionStorage.removeItem('__test'); return true; }
    catch { return false; }
}

const _mem = {};

export function getCached(key) {
    if (storageAvailable()) {
        try {
            const raw = sessionStorage.getItem(PREFIX + key);
            if (!raw) return null;
            const entry = JSON.parse(raw);
            if (Date.now() - entry.ts > TTL) { sessionStorage.removeItem(PREFIX + key); return null; }
            return entry.data;
        } catch { return null; }
    }
    const entry = _mem[key];
    if (!entry) return null;
    if (Date.now() - entry.ts > TTL) { delete _mem[key]; return null; }
    return entry.data;
}

export function setCached(key, data) {
    if (storageAvailable()) {
        try {
            sessionStorage.setItem(PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
            return;
        } catch {}
    }
    _mem[key] = { data, ts: Date.now() };
}

export function clearCache() {
    if (storageAvailable()) {
        Object.keys(sessionStorage)
            .filter(k => k.startsWith(PREFIX))
            .forEach(k => sessionStorage.removeItem(k));
    }
    Object.keys(_mem).forEach(k => delete _mem[k]);
}
