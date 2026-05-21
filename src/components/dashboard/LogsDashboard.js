import React, { useEffect, useMemo, useState } from 'react';
import { Grid, Box, Typography, Card, CardContent } from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import { api } from '../../services/api';
import BaseCard from '../baseCard/BaseCard';
import { DashboardLoading, DashboardErro, getDashboardErrorMessage } from './DashboardStatus';
import Chart from '../charts/ApexChartSafe';

function CardTotal({ icon, titulo, valor, cor }) {
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
                            width: 56, height: 56,
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

export default function LogsDashboard() {
    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        api.get('/dashboard/logs')
            .then(res => setDados(res.data))
            .catch((err) => setErro(err))
            .finally(() => setLoading(false));
    }, []);

    const chart = useMemo(() => {
        if (!dados) return null;

        const { qr_por_dia, link_por_dia } = dados;

        // QR Code por dia: array [{dia: 1, total: 5}, ...]
        const qrDias  = (qr_por_dia   || []).map(v => String(v.dia));
        const qrVals  = (qr_por_dia   || []).map(v => v.total || 0);

        // Link público por dia
        const lkDias  = (link_por_dia || []).map(v => String(v.dia));
        const lkVals  = (link_por_dia || []).map(v => v.total || 0);

        return { qrDias, qrVals, lkDias, lkVals };
    }, [dados]);

    if (loading) return <DashboardLoading />;
    if (erro || !dados || !chart) return <DashboardErro message={getDashboardErrorMessage('Logs', erro)} />;

    const { totais } = dados;

    const chartFont = { fontFamily: "'DM Sans', sans-serif" };
    const toolbarOff = { toolbar: { show: false } };

    return (
        <Box>
            {/* Totalizadores */}
            <Grid container spacing={3} mb={3}>
                <Grid item xs={6} sm={3}>
                    <CardTotal
                        icon="maximize-2"
                        titulo="Total QR CODE"
                        valor={totais?.total_qr}
                        cor="#2196f3"
                    />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <CardTotal
                        icon="link"
                        titulo="Total Link Público"
                        valor={totais?.total_link}
                        cor="#4caf50"
                    />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <CardTotal
                        icon="maximize-2"
                        titulo="QR CODE x Mês"
                        valor={totais?.qr_mes}
                        cor="#1565c0"
                    />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <CardTotal
                        icon="link"
                        titulo="Link Público x Mês"
                        valor={totais?.link_mes}
                        cor="#2e7d32"
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Acesso QR Code por dia — linha */}
                <Grid item xs={12} md={6}>
                    <BaseCard title="Acesso QR Code por Dia do Mês">
                        {chart.qrDias.length > 0 ? (
                            <Chart
                                type="line"
                                height={280}
                                options={{
                                    chart: { ...chartFont, ...toolbarOff },
                                    colors: ['#2196f3'],
                                    xaxis: {
                                        categories: chart.qrDias,
                                        title: { text: 'DIA', style: { color: '#b0bec5' } },
                                        labels: { style: { colors: '#b0bec5' } },
                                    },
                                    yaxis: { labels: { style: { colors: '#b0bec5' } } },
                                    stroke: { curve: 'smooth', width: 3 },
                                    markers: { size: 4 },
                                    dataLabels: { enabled: false },
                                    tooltip: { theme: 'dark' },
                                    grid: { borderColor: 'transparent' },
                                }}
                                series={[{ name: 'QR Code', data: chart.qrVals }]}
                            />
                        ) : (
                            <Typography color="textSecondary" textAlign="center" mt={4}>Sem dados</Typography>
                        )}
                    </BaseCard>
                </Grid>

                {/* Acessos ao Link Público por dia — linha */}
                <Grid item xs={12} md={6}>
                    <BaseCard title="Acessos ao Link Público por Dia do Mês">
                        {chart.lkDias.length > 0 ? (
                            <Chart
                                type="line"
                                height={280}
                                options={{
                                    chart: { ...chartFont, ...toolbarOff },
                                    colors: ['#4caf50'],
                                    xaxis: {
                                        categories: chart.lkDias,
                                        title: { text: 'DIA', style: { color: '#b0bec5' } },
                                        labels: { style: { colors: '#b0bec5' } },
                                    },
                                    yaxis: { labels: { style: { colors: '#b0bec5' } } },
                                    stroke: { curve: 'smooth', width: 3 },
                                    markers: { size: 4 },
                                    dataLabels: { enabled: false },
                                    tooltip: { theme: 'dark' },
                                    grid: { borderColor: 'transparent' },
                                }}
                                series={[{ name: 'Link Público', data: chart.lkVals }]}
                            />
                        ) : (
                            <Typography color="textSecondary" textAlign="center" mt={4}>Sem dados</Typography>
                        )}
                    </BaseCard>
                </Grid>
            </Grid>
        </Box>
    );
}
