const store = new Map();

async function withCache(key, ttlSeconds, fn) {
  const ttl = Number(process.env.MONITOR_APS_CACHE_TTL_SECONDS ?? ttlSeconds);
  if (ttl > 0) {
    const hit = store.get(key);
    if (hit && Date.now() - hit.at < ttl * 1000) return hit.data;
  }
  const data = await fn();
  store.set(key, { data, at: Date.now() });
  return data;
}

function clearCache() { store.clear(); }

module.exports = { withCache, clearCache };
