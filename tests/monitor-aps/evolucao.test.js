import { buildChartSeries } from '../../src/components/monitor-aps/VisitasEvolucao';

const CORES = ['#1351B4', '#168821', '#FF8C00'];

describe('buildChartSeries', () => {
    it('converte series da API para formato ApexCharts', () => {
        const input = [
            { ano: 2026, meses: [10, 20, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
            { ano: 2025, meses: [100, 200, 150, 180, 160, 170, 140, 130, 190, 175, 165, 155] },
            { ano: 2024, meses: [90, 110, 95, 105, 85, 100, 80, 75, 115, 98, 88, 78] },
        ];

        const result = buildChartSeries(input, CORES);

        expect(result).toHaveLength(3);
        expect(result[0]).toEqual({ name: '2026', data: input[0].meses, color: '#1351B4' });
        expect(result[1]).toEqual({ name: '2025', data: input[1].meses, color: '#168821' });
        expect(result[2]).toEqual({ name: '2024', data: input[2].meses, color: '#FF8C00' });
    });

    it('retorna array vazio quando series é vazio', () => {
        expect(buildChartSeries([], CORES)).toEqual([]);
    });

    it('usa #888 como cor fallback quando não há cor definida para o índice', () => {
        const input = [
            { ano: 2026, meses: Array(12).fill(0) },
            { ano: 2025, meses: Array(12).fill(0) },
            { ano: 2024, meses: Array(12).fill(0) },
            { ano: 2023, meses: Array(12).fill(0) },
        ];
        const result = buildChartSeries(input, CORES);
        expect(result[3].color).toBe('#888');
    });
});
