import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('../../../services/monitorApsApi', () => ({
    monitorApsApi: {
        get: jest.fn().mockResolvedValue({
            equipes: [], agentes: [], cidadaos: [],
            meta: { total: 0, page: 1, per_page: 50, pages: 0 },
        }),
    },
}));

import CidadaosPage from '../CidadaosPage';

describe('CidadaosPage', () => {
    it('renders the page title', () => {
        render(<CidadaosPage />);
        expect(screen.getByText('Cidadãos')).toBeInTheDocument();
    });

    it('renders Nome and Condições column headers', () => {
        render(<CidadaosPage />);
        expect(screen.getByText('Nome')).toBeInTheDocument();
        expect(screen.getByText('Condições')).toBeInTheDocument();
    });

    it('shows empty state message when no data', async () => {
        render(<CidadaosPage />);
        await screen.findByText(/nenhum cidadão encontrado/i);
    });
});
