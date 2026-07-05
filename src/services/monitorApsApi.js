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

const withRetry = async (request, options = {}) => {
    const retries = options.retries ?? 1;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            const res = await request();
            return res.data;
        } catch (error) {
            if (!shouldRetry(error, attempt, retries)) {
                error.message = getMonitorApsErrorMessage(error);
                throw error;
            }
            await wait(250 * (attempt + 1));
        }
    }

    return null;
};

const get = async (path, options = {}) => (
    withRetry(() => api.get(BASE + path, { signal: options.signal }), options)
);

const post = async (path, body, options = {}) => (
    withRetry(() => api.post(BASE + path, body, { signal: options.signal }), { ...options, retries: options.retries ?? 0 })
);

export const monitorApsApi = { get, post };
