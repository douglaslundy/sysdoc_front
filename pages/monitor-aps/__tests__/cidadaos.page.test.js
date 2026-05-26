import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import CidadaosPageRoute from '../cidadaos';

jest.mock('../../../src/components/monitor-aps/CidadaosPage', () => {
    const MockCidadaosPage = () => <div>MockCidadaosPage</div>;
    MockCidadaosPage.displayName = 'MockCidadaosPage';
    return MockCidadaosPage;
});

describe('pages/monitor-aps/cidadaos', () => {
    it('renders the CidadaosPage component', () => {
        render(<CidadaosPageRoute />);
        expect(screen.getByText('MockCidadaosPage')).toBeInTheDocument();
    });
});
