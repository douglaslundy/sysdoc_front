// src/services/conformidadeCidadaoApi.js
import { api } from './api';

const BASE = '/conformidade-cidadao';

export const conformidadeCidadaoApi = {
    analisar: () =>
        api.post(`${BASE}/analisar`).then(r => r.data),

    status: (jobId, page = 1, perPage = 20) =>
        api.get(`${BASE}/status/${jobId}`, { params: { page, per_page: perPage } }).then(r => r.data),

    aplicar: (jobId) =>
        api.post(`${BASE}/aplicar/${jobId}`).then(r => r.data),

    historico: (page = 1, perPage = 15) =>
        api.get(`${BASE}/historico`, { params: { page, per_page: perPage } }).then(r => r.data),
};
