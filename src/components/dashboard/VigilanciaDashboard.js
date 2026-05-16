import React, { useEffect, useMemo, useState } from 'react';
import { Grid, Box, Typography, Card, CardContent, CircularProgress, Chip } from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import { api } from '../../services/api';
import BaseCard from '../baseCard/BaseCard';
import Chart from '../charts/ApexChartSafe';
import { DashboardErro, getDashboardErrorMessage } from './DashboardStatus';

const RISCO_COR = { '1': '#4caf50', '2': '#ff9800', '3': '#f44336', 'N/A': '#607d8b' };

function CardTotal({ icon, titulo, valor, cor, iconBoxWidth = 56 }) {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography color="textSecondary" variant="subtitle2">{titulo}</Typography>
                        <Typography variant="h3" fontWeight="bold" mt={0.5}>{valor ?? '—'}</Typography>
                    </Box>
                    <Box
                        sx={{
                            width: iconBoxWidth, height: 56,
                            borderRadius: '50%',
                            bgcolor: cor + '22',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <FeatherIcon icon={icon} color={cor} width="28" height="28" />
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}

function gerarMesesFromMap(mapa) {
    const meses = [];
    const valores = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        meses.push(label);
        valores.push((mapa && mapa[chave]) ? Number(mapa[chave]) : 0);
    }
    return { meses, valores };
}

export default function VigilanciaDashboard() {
    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        api.get('/dashboard/vigilancia')
            .then(res => setDados(res.data))
            .catch((err) => setErro(err))
            .finally(() => setLoading(false));
    }, []);

    const chart = useMemo(() => {
        if (!dados) return null;

        const porMes = gerarMesesFromMap(dados.por_mes || {});

        // por_status: { "Vigente": 5, "Vencido": 2, ... }
        const statusEntries = Object.entries(dados.por_status || {});
        const statusLabels = statusEntries.map(([s]) => s || 'Sem status');
        const statusValues = statusEntries.map(([, v]) => Number(v));

        // por_nivel_risco: { "1": 5, "2": 3, "N/A": 1, ... }
        const riscoEntries = Object.entries(dados.por_nivel_risco || {});
        const riscoLabels = riscoEntries.map(([r]) => `Risco ${r}`);
        const riscoValues = riscoEntries.map(([, v]) => Number(v));
        const riscoCores = riscoEntries.map(([r]) => RISCO_COR[r] || '#607d8b');

        const proximos = dados.proximos_vencimentos || [];

        return { porMes, statusLabels, statusValues, riscoLabels, riscoValues, riscoCores, proximos };
    }, [dados]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress />
            </Box>
        );
    }

    if (erro || !dados || !chart) return <DashboardErro message={getDashboardErrorMessage('Vigilancia Sanitaria', erro)} />;

    const { totais } = dados;
    const chartFont = { fontFamily: "'DM Sans', sans-serif" };
    const toolbarOff = { toolbar: { show: false } };

    const formatDate = (s) => {
        if (!s) return '—';
        const [y, m, d] = s.substring(0, 10).split('-');
        return `${d}/${m}/${y}`;
    };

    return (
        <Box>
            <Grid container spacing={3} mb={3}>
                <Grid item xs={6} sm={4} md={2}>
                    <CardTotal icon="home" titulo="Estabelecimentos" valor={totais.estabelecimentos} cor="#2196f3" iconBoxWidth={68} />
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <CardTotal icon="shield" titulo="Alvarás" valor={totais.alvaras} cor="#607d8b" />
                </Grid>
                <Grid item xs={6} sm={4} md={3}>
                    <CardTotal icon="check-circle" titulo="Vigentes (por data)" valor={totais.vigentes} cor="#4caf50" />
                </Grid>
                <Grid item xs={6} sm={4} md={3}>
                    <CardTotal icon="x-circle" titulo="Vencidos (por data)" valor={totais.vencidos} cor="#f44336" />
                </Grid>
                <Grid item xs={12} sm={4} md={2}>
                    <CardTotal icon="clock" titulo="Vencem em 30d" valor={totais.vencendo_em_30} cor="#ff5722" />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Alvarás por status */}
                <Grid item xs={12} md={5}>
                    <BaseCard title="Alvarás por Status">
                        {chart.statusLabels.length > 0 ? (
                            <Chart
                                type="bar"
                                height={300}
                                options={{
                                    chart: { ...chartFont, ...toolbarOff },
                                    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
                                    colors: ['#2196f3'],
                                    xaxis: {
                                        categories: chart.statusLabels,
                                        labels: { style: { colors: '#b0bec5' } },
                                    },
                                    yaxis: {
                                        labels: { style: { colors: '#b0bec5', fontSize: '11px' } },
                                    },
                                    dataLabels: { enabled: false },
                                    tooltip: { theme: 'dark' },
                                    grid: { borderColor: 'transparent' },
                                }}
                                series={[{ name: 'Alvarás', data: chart.statusValues }]}
                            />
                        ) : <Typography color="textSecondary" textAlign="center" mt={4}>Sem dados</Typography>}
                    </BaseCard>
                </Grid>

                {/* Alvarás por nível de risco */}
                <Grid item xs={12} md={3}>
                    <BaseCard title="Por Nível de Risco">
                        {chart.riscoLabels.length > 0 ? (
                            <Chart
                                type="donut"
                                height={300}
                                options={{
                                    chart: { ...chartFont },
                                    labels: chart.riscoLabels,
                                    colors: chart.riscoCores,
                                    legend: { labels: { colors: '#b0bec5' } },
                                    dataLabels: { enabled: true },
                                    tooltip: { theme: 'dark' },
                                }}
                                series={chart.riscoValues}
                            />
                        ) : <Typography color="textSecondary" textAlign="center" mt={4}>Sem dados</Typography>}
                    </BaseCard>
                </Grid>

                {/* Emissões por mês */}
                <Grid item xs={12} md={4}>
                    <BaseCard title="Alvarás Emitidos por Mês (últimos 12 meses)">
                        <Chart
                            type="area"
                            height={300}
                            options={{
                                chart: { ...chartFont, ...toolbarOff },
                                colors: ['#4caf50'],
                                xaxis: {
                                    categories: chart.porMes.meses,
                                    labels: {
                                        style: { colors: '#b0bec5', fontSize: '11px' },
                                        formatter: v => typeof v === 'string' ? v.toUpperCase() : v,
                                    },
                                },
                                yaxis: { labels: { style: { colors: '#b0bec5' } } },
                                fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05 } },
                                stroke: { curve: 'smooth', width: 3 },
                                dataLabels: { enabled: false },
                                tooltip: { theme: 'dark' },
                                grid: { borderColor: 'transparent' },
                            }}
                            series={[{ name: 'Alvarás', data: chart.porMes.valores }]}
                        />
                    </BaseCard>
                </Grid>

                {/* Próximos vencimentos */}
                {chart.proximos.length > 0 && (
                    <Grid item xs={12}>
                        <BaseCard title="Próximos Vencimentos">
                            <Box sx={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            {['Número', 'Estabelecimento', 'Risco', 'Status', 'Vencimento'].map(h => (
                                                <th key={h} style={{ textAlign: 'left', padding: '6px 12px', color: '#90a4ae', fontWeight: 600, fontSize: 12, borderBottom: '1px solid #2a3140' }}>
                                                    {h.toUpperCase()}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {chart.proximos.map((alv) => (
                                            <tr key={alv.id} style={{ borderBottom: '1px solid #1e2736' }}>
                                                <td style={{ padding: '8px 12px', fontWeight: 600 }}>{alv.numero_alvara}</td>
                                                <td style={{ padding: '8px 12px' }}>{alv.estabelecimento?.nome_estabelecimento?.toUpperCase() ?? '—'}</td>
                                                <td style={{ padding: '8px 12px' }}>
                                                    <Chip
                                                        label={`Risco ${alv.nivel_risco}`}
                                                        size="small"
                                                        sx={{ bgcolor: (RISCO_COR[alv.nivel_risco] || '#607d8b') + '33', color: RISCO_COR[alv.nivel_risco] || '#607d8b' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '8px 12px' }}>{alv.status || '—'}</td>
                                                <td style={{ padding: '8px 12px', color: '#ff9800', fontWeight: 600 }}>{formatDate(alv.vencimento_alvara)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Box>
                        </BaseCard>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
}
