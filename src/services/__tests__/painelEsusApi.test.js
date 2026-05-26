jest.mock('../api', () => ({
    api: { get: jest.fn().mockResolvedValue({ data: { unidades: [] } }) },
}));

import { painelEsusApi } from '../painelEsusApi';

describe('painelEsusApi', () => {
    it('exposes an unidades method', () => {
        expect(typeof painelEsusApi.unidades).toBe('function');
    });

    it('calls /painel-esus/unidades', async () => {
        const { api } = require('../api');
        await painelEsusApi.unidades();
        expect(api.get).toHaveBeenCalledWith(
            '/painel-esus/unidades',
            expect.objectContaining({})
        );
    });
});
