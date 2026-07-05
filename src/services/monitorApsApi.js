import { api } from './api';

const BASE = '/monitor-aps';
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

export const isMonitorApsCanceled = (error) => (
    error?.code === 'ERR_CANCELED' ||
    error?.name === 'CanceledError' ||
    error?.message === 'canceled'
);

export const getMonitorApsErrorMessage = (error, fallback = 'Erro no servidor ao consultar o Monitor APS.') => {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.error || error?.response?.data?.message;

    if (serverMessage) return serverMessage;
    if (status >= 500) return fallback;
    if (error?.message) return error.message;
    return fallback;
};

const shouldRetry = (error, attempt, retries) => {
    if (attempt >= retries || isMonitorApsCanceled(error)) return false;
    const status = error?.response?.status;
    return !status || RETRYABLE_STATUS.has(status);
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryDelay = (error, attempt) => {
    if (error?.response?.status === 429) {
        // Throttle do Laravel: aguarda o Retry-After (limitado a 3s por tentativa)
        const retryAfter = Number(error.response.headers?.['retry-after']);
        if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(retryAfter * 1000, 3000);
        return 1500 * (attempt + 1);
    }
    return 300 * (attempt + 1);
};

const withRetry = async (request, options = {}) => {
    const retries = options.retries ?? 2;

    for (let attempt = 0; ; attempt += 1) {
        try {
            const res = await request();
            return res.data;
        } catch (error) {
            if (!shouldRetry(error, attempt, retries)) {
                error.message = getMonitorApsErrorMessage(error);
                throw error;
            }
            await wait(retryDelay(error, attempt));
        }
    }
};

const get = async (path, options = {}) => (
    withRetry(() => api.get(BASE + path, { signal: options.signal }), options)
);

const post = async (path, body, options = {}) => (
    withRetry(() => api.post(BASE + path, body, { signal: options.signal }), { ...options, retries: options.retries ?? 0 })
);

export const monitorApsApi = { get, post };
