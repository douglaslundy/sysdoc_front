import React, { useEffect, useMemo, useState } from 'react';
import { Grid, Box, Typography, Card, CardContent, CircularProgress } from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import { api } from '../../services/api';
import BaseCard from '../baseCard/BaseCard';
import Chart from '../charts/ApexChartSafe';
import { DashboardErro, getDashboardErrorMessage } from './DashboardStatus';

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

function gerarMeses(mapa) {
    const meses = [];
    const valores = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        meses.push(label);
        valores.push(mapa[chave] || 0);
    }
    return { meses, valores };
}

export default function InicioDashboard() {
    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        api.get('/dashboard/inicio')
            .then(res => setDados(res.data))
            .catch((err) => setErro(err))
            .finally(() => setLoading(false));
    }, []);

    const chart = useMemo(() => {
        if (!dados) return null;
        return {
            clientes:   gerarMeses(dados.clientes_por_mes || {}),
            oficios:    gerarMeses(dados.oficios_por_mes || {}),
            portarias:  gerarMeses(dados.portarias_por_mes || {}),
        };
    }, [dados]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress />
            </Box>
        );
    }

    if (erro || !dados || !chart) return <DashboardErro message={getDashboardErrorMessage('Inicio', erro)} />;

    const { totais } = dados;
    const chartFont = { fontFamily: "'DM Sans', sans-serif" };
    const toolbarOff = { toolbar: { show: false } };

    return (
        <Box>
            <Grid container spacing={3} mb={3}>
                <Grid item xs={6} sm={6} md={3}>
                    <CardTotal icon="users" titulo="Clientes" valor={totais.clientes} cor="#2196f3" />
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                    <CardTotal icon="file-text" titulo="Ofícios" valor={totais.oficios} cor="#ff9800" />
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                    <CardTotal icon="book" titulo="Portarias" valor={totais.portarias} cor="#9c27b0" />
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                    <CardTotal icon="cpu" titulo="Modelos IA" valor={totais.modelos_ia} cor="#00bcd4" />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <BaseCard title="Clientes Cadastrados por Mês (últimos 12 meses)">
                        <Chart
                            type="area"
                            height={260}
                            options={{
                                chart: { ...chartFont, ...toolbarOff },
                                colors: ['#2196f3'],
                                xaxis: {
                                    categories: chart.clientes.meses,
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
                            series={[{ name: 'Clientes', data: chart.clientes.valores }]}
                        />
                    </BaseCard>
                </Grid>

                <Grid item xs={12} md={4}>
                    <BaseCard title="Ofícios por Mês (últimos 12 meses)">
                        <Chart
                            type="area"
                            height={260}
                            options={{
                                chart: { ...chartFont, ...toolbarOff },
                                colors: ['#ff9800'],
                                xaxis: {
                                    categories: chart.oficios.meses,
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
                            series={[{ name: 'Ofícios', data: chart.oficios.valores }]}
                        />
                    </BaseCard>
                </Grid>

                <Grid item xs={12} md={4}>
                    <BaseCard title="Portarias por Mês (últimos 12 meses)">
                        <Chart
                            type="area"
                            height={260}
                            options={{
                                chart: { ...chartFont, ...toolbarOff },
                                colors: ['#9c27b0'],
                                xaxis: {
                                    categories: chart.portarias.meses,
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
                            series={[{ name: 'Portarias', data: chart.portarias.valores }]}
                        />
                    </BaseCard>
                </Grid>
            </Grid>
        </Box>
    );
}
