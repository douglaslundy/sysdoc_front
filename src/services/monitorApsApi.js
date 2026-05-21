import { api } from './api';

const BASE = '/monitor-aps';

const get = async (path, options = {}) => {
    const res = await api.get(BASE + path, { signal: options.signal });
    return res.data;
};

const post = async (path, body, options = {}) => {
    const res = await api.post(BASE + path, body, { signal: options.signal });
    return res.data;
};

export const monitorApsApi = { get, post };
