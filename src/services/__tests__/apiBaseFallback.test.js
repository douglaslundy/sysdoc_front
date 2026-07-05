import { api } from '../api';

// Acessa o handler de rejeição do interceptor de resposta registrado em api.js
const getRejected = () => api.interceptors.response.handlers
    .map(h => h && h.rejected)
    .filter(Boolean)[0];

describe('api response interceptor', () => {
    it('não troca o baseURL global quando a requisição foi cancelada (AbortController)', async () => {
        const baseBefore = api.defaults.baseURL;
        const rejected = getRejected();

        // axios 0.26: cancelamento rejeita com um objeto Cancel (__CANCEL__),
        // sem config e sem response — não pode ser tratado como erro de rede.
        const cancelError = { __CANCEL__: true, message: 'canceled' };

        let caught = null;
        try { await rejected(cancelError); } catch (e) { caught = e; }

        expect(caught === cancelError).toBe(true);
        expect(api.defaults.baseURL).toBe(baseBefore);
    });

    it('não refaz a requisição cancelada contra outro backend', async () => {
        const rejected = getRejected();
        const cancelError = { __CANCEL__: true, message: 'canceled', config: { url: '/monitor-aps/indicadores/resumo' } };

        let caught = null;
        try { await rejected(cancelError); } catch (e) { caught = e; }

        expect(caught === cancelError).toBe(true);
    });
});
