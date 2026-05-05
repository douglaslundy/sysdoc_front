import React, { useEffect, useMemo, useState } from 'react';
import { Grid, Box, Typography, Card, CardContent, CircularProgress } from '@mui/material';
import dynamic from 'next/dynamic';
import FeatherIcon from 'feather-icons-react';
import { api } from '../../services/api';
import BaseCard from '../baseCard/BaseCard';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

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

export default function TfdDashboard() {
    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(false);

    useEffect(() => {
        api.get('/dashboard/tfd')
            .then(res => setDados(res.data))
            .catch(() => setErro(true))
            .finally(() => setLoading(false));
    }, []);

    const chart = useMemo(() => {
        if (!dados) return null;

        const { viagens_por_dia, motoristas, rotas } = dados;

        // Viagens por dia: array [{dia: 1, total: 5}, ...]
        const diasLabels = (viagens_por_dia || []).map(v => String(v.dia));
        const diasVals   = (viagens_por_dia || []).map(v => v.total || 0);

        // Motoristas: array [{nome, total}] — horizontal bar
        const motoristaNomes = (motoristas || []).map(m => m.nome.split(' ').slice(0, 2).join(' ')).reverse();
        const motoristaVals  = (motoristas || []).map(m => m.total || 0).reverse();

        // Rotas: array [{rota, total}] — horizontal bar
        const rotaNomes = (rotas || []).map(r => r.rota.substring(0, 25)).reverse();
        const rotaVals  = (rotas || []).map(r => r.total || 0).reverse();

        return { diasLabels, diasVals, motoristaNomes, motoristaVals, rotaNomes, rotaVals };
    }, [dados]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress />
            </Box>
        );
    }

    if (erro || !dados || !chart) {
        return (
            <Box p={4} textAlign="center">
                <Typography color="textSecondary">Dados não disponíveis.</Typography>
            </Box>
        );
    }

    const { totais } = dados;

    const chartFont = { fontFamily: "'DM Sans', sans-serif" };
    const toolbarOff = { toolbar: { show: false } };

    return (
        <Box>
            {/* Totalizadores */}
            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} sm={4}>
                    <CardTotal
                        icon="truck"
                        titulo="Total de Viagens (mês)"
                        valor={totais?.total_viagens}
                        cor="#4caf50"
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <CardTotal
                        icon="users"
                        titulo="Pessoas Transportadas (mês)"
                        valor={totais?.pessoas_transportadas}
                        cor="#2196f3"
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <CardTotal
                        icon="map-pin"
                        titulo="KM Rodados (mês)"
                        valor={totais?.km_rodados}
                        cor="#ff9800"
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Viagens por dia do mês — linha */}
                <Grid item xs={12}>
                    <BaseCard title="Viagens por Dia do Mês">
                        {chart.diasLabels.length > 0 ? (
                            <Chart
                                type="line"
                                height={260}
                                options={{
                                    chart: { ...chartFont, ...toolbarOff },
                                    colors: ['#4caf50'],
                                    xaxis: {
                                        categories: chart.diasLabels,
                                        title: { text: 'Dia' },
                                    },
                                    stroke: { curve: 'smooth', width: 3 },
                                    markers: { size: 4 },
                                    dataLabels: { enabled: false },
                                    tooltip: { theme: 'dark' },
                                    grid: { borderColor: 'transparent' },
                                }}
                                series={[{ name: 'Viagens', data: chart.diasVals }]}
                            />
                        ) : (
                            <Typography color="textSecondary" textAlign="center" mt={4}>Sem dados</Typography>
                        )}
                    </BaseCard>
                </Grid>

                {/* Viagens por Motorista — barras horizontal */}
                <Grid item xs={12} md={6}>
                    <BaseCard title="Viagens por Motorista">
                        {chart.motoristaNomes.length > 0 ? (
                            <Chart
                                type="bar"
                                height={300}
                                options={{
                                    chart: { ...chartFont, ...toolbarOff },
                                    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
                                    colors: ['#9c27b0'],
                                    xaxis: { categories: chart.motoristaNomes },
                                    dataLabels: { enabled: false },
                                    tooltip: { theme: 'dark' },
                                    grid: { borderColor: 'transparent' },
                                }}
                                series={[{ name: 'Viagens', data: chart.motoristaVals }]}
                            />
                        ) : (
                            <Typography color="textSecondary" textAlign="center" mt={4}>Sem dados</Typography>
                        )}
                    </BaseCard>
                </Grid>

                {/* Rotas mais utilizadas — barras horizontal */}
                <Grid item xs={12} md={6}>
                    <BaseCard title="Rotas Mais Utilizadas">
                        {chart.rotaNomes.length > 0 ? (
                            <Chart
                                type="bar"
                                height={300}
                                options={{
                                    chart: { ...chartFont, ...toolbarOff },
                                    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
                                    colors: ['#ff9800'],
                                    xaxis: { categories: chart.rotaNomes },
                                    dataLabels: { enabled: false },
                                    tooltip: { theme: 'dark' },
                                    grid: { borderColor: 'transparent' },
                                }}
                                series={[{ name: 'Viagens', data: chart.rotaVals }]}
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
