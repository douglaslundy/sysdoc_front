import { api } from './api';

const BASE = '/monitor-aps';

const get = async (path) => {
    const res = await api.get(BASE + path);
    return res.data;
};

const post = async (path, body) => {
    const res = await api.post(BASE + path, body);
    return res.data;
};

export const monitorApsApi = { get, post };
