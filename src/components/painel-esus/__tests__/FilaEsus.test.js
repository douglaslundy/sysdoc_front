import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

jest.mock('../../../services/painelEsusApi', () => ({
    painelEsusApi: {
        unidades: jest.fn(),
        filtros:  jest.fn().mockResolvedValue({ equipes: [], profissionais: [] }),
        fila:     jest.fn().mockResolvedValue({
            contadores: { aguardando: 0, atendidos: 0, nao_aguardaram: 0 },
            aguardando: [],
        }),
    },
    painelEsusPublicApi: {},
}));

import FilaEsus from '../FilaEsus';

describe('FilaEsus (Bug 1)', () => {
    beforeEach(() => jest.clearAllMocks());

    it('does NOT render CNES text input on mount', () => {
        const { painelEsusApi } = require('../../../services/painelEsusApi');
        painelEsusApi.unidades.mockResolvedValue({ unidades: [] });
        render(<FilaEsus />);
        expect(screen.queryByPlaceholderText('CNES da unidade')).not.toBeInTheDocument();
    });

    it('auto-sets CNES and shows unit name when only one unit returned', async () => {
        const { painelEsusApi } = require('../../../services/painelEsusApi');
        painelEsusApi.unidades.mockResolvedValue({
            unidades: [{ cnes: '1234567', nome: 'UBS Central' }],
        });
        render(<FilaEsus />);
        await waitFor(() =>
            expect(screen.getByText('UBS Central')).toBeInTheDocument()
        );
    });

    it('shows select when multiple units returned', async () => {
        const { painelEsusApi } = require('../../../services/painelEsusApi');
        painelEsusApi.unidades.mockResolvedValue({
            unidades: [
                { cnes: '1111111', nome: 'UBS Norte' },
                { cnes: '2222222', nome: 'UBS Sul' },
            ],
        });
        render(<FilaEsus />);
        await waitFor(() =>
            expect(screen.getByText('UBS Norte')).toBeInTheDocument()
        );
    });
});
