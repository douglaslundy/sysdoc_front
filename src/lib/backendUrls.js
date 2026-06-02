const DEFAULT_BASES = [
    'http://127.0.0.1:8010/api',
    'http://localhost:8010/api',
];

function normalize(base) {
    return String(base || '').trim().replace(/\/+$/, '');
}

export function getApiBaseCandidates() {
    const envBase = normalize(process.env.NEXT_PUBLIC_API_URL);
    const all = [envBase, ...DEFAULT_BASES.map(normalize)].filter(Boolean);
    return [...new Set(all)];
}

export function buildEndpointCandidates(path) {
    const cleanPath = String(path || '').replace(/^\/+/, '');
    return getApiBaseCandidates().map((base) => `${base}/${cleanPath}`);
}

export async function fetchWithFallback(path, options = {}) {
    const urls = buildEndpointCandidates(path);
    let lastError = null;
    let lastResponse = null;

    for (const url of urls) {
        try {
            const res = await fetch(url, options);
            if (res.ok) return { res, url };
            lastResponse = { res, url };
            if (res.status !== 404) return { res, url };
        } catch (err) {
            lastError = err;
        }
    }

    if (lastResponse) return lastResponse;
    throw lastError || new Error('Nenhum backend disponível');
}
