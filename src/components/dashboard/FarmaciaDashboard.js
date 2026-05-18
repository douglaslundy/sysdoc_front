import React, { useEffect, useMemo, useState } from 'react';
import { Grid, Box, Typography, Card, CardContent, ToggleButton, ToggleButtonGroup } from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import { api } from '../../services/api';
import BaseCard from '../baseCard/BaseCard';
import Chart from '../charts/ApexChartSafe';
import { DashboardErro, DashboardLoading, getDashboardErrorMessage } from './DashboardStatus';

function CardTotal({ icon, titulo, valor, cor }) {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography color="textSecondary" variant="subtitle2">{titulo}</Typography>
                        <Typography variant="h3" fontWeight="bold" mt={0.5}>{valor ?? '-'}</Typography>
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

function normalizeMeses(aquisicoesPorMes = [], janelaMeses = 12) {
    const mapa = new Map((aquisicoesPorMes || []).map((row) => [row.mes, row]));
    const labels = [];
    const registros = [];
    const quantidade = [];

    for (let i = janelaMeses - 1; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase();
        const row = mapa.get(chave);
        labels.push(label);
        registros.push(row ? Number(row.registros || 0) : 0);
        quantidade.push(row ? Number(row.quantidade_total || 0) : 0);
    }

    return { labels, registros, quantidade };
}

export default function FarmaciaDashboard() {
    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [janelaDias, setJanelaDias] = useState(30);
    const [janelaMeses, setJanelaMeses] = useState(12);

    useEffect(() => {
        setLoading(true);
        setErro(null);
        api.get('/dashboard/farmacia', { params: { janela_dias: janelaDias, janela_meses: janelaMeses } })
            .then((res) => setDados(res.data))
            .catch((err) => setErro(err))
            .finally(() => setLoading(false));
    }, [janelaDias, janelaMeses]);

    const chart = useMemo(() => {
        if (!dados) return null;

        const statusPorDia = dados.status_por_dia || [];
        const statusLabels = statusPorDia.map((s) => {
            const raw = String(s.dia || '').substring(0, 10);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
            const [y, m, d] = raw.split('-');
            return `${d}/${m}`;
        });

        const disponiveisDia = statusPorDia.map((s) => Number(s.disponiveis || 0));
        const indisponiveisDia = statusPorDia.map((s) => Number(s.indisponiveis || 0));

        const top = dados.top_indisponiveis || [];
        const topNomes = top.map((m) => `${m.active_ingredient || 'Sem nome'}${m.concentration ? ' ' + m.concentration : ''}`).reverse();
        const topDias = top.map((m) => Number(m.dias_indisponivel || 0)).reverse();

        const fontes = dados.fontes_aquisicao_mes || [];
        const fontesLabels = fontes.map((f) => f.source_document || 'Sem origem');
        const fontesValores = fontes.map((f) => Number(f.total || 0));

        const seriesMeses = normalizeMeses(dados.aquisicoes_por_mes || [], janelaMeses);

        return {
            statusLabels,
            disponiveisDia,
            indisponiveisDia,
            topNomes,
            topDias,
            fontesLabels,
            fontesValores,
            seriesMeses,
        };
    }, [dados, janelaMeses]);

    if (loading) return <DashboardLoading />;
    if (erro || !dados || !chart) return <DashboardErro message={getDashboardErrorMessage('Farmacia', erro)} />;

    const chartFont = { fontFamily: "'DM Sans', sans-serif" };
    const toolbarOff = { toolbar: { show: false } };
    const totais = dados.totais || {};
    const alturaTop = Math.max(300, chart.topNomes.length * 36);

    return (
        <Box>
            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <CardTotal icon="archive" titulo="Medicamentos Ativos" valor={totais.medicamentos_ativos} cor="#1e88e5" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <CardTotal icon="check-circle" titulo="Disponibilidade Hoje" valor={`${totais.taxa_disponibilidade_hoje || 0}%`} cor="#43a047" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <CardTotal icon="alert-triangle" titulo="Indisponíveis Hoje" valor={totais.indisponiveis_hoje} cor="#e53935" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <CardTotal icon="shopping-cart" titulo="Qtd. Adquirida no Mês" valor={totais.qtd_adquirida_mes_atual} cor="#fb8c00" />
                </Grid>
            </Grid>

            <Box mb={2} display="flex" alignItems="center" gap={2}>
                <Typography variant="body2" color="text.secondary">Período de análise:</Typography>
                <ToggleButtonGroup
                    value={janelaDias}
                    exclusive
                    onChange={(_, v) => v && setJanelaDias(v)}
                    size="small"
                >
                    <ToggleButton value={7}>7 dias</ToggleButton>
                    <ToggleButton value={30}>30 dias</ToggleButton>
                    <ToggleButton value={90}>90 dias</ToggleButton>
                </ToggleButtonGroup>
            </Box>
            <Box mb={2} display="flex" alignItems="center" gap={2}>
                <Typography variant="body2" color="text.secondary">Janela de aquisições:</Typography>
                <ToggleButtonGroup
                    value={janelaMeses}
                    exclusive
                    onChange={(_, v) => v && setJanelaMeses(v)}
                    size="small"
                >
                    <ToggleButton value={3}>3 meses</ToggleButton>
                    <ToggleButton value={6}>6 meses</ToggleButton>
                    <ToggleButton value={12}>12 meses</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <BaseCard title={`Disponibilidade Diária (últimos ${janelaDias} dias)`}>
                        {chart.statusLabels.length > 0 ? (
                            <Chart
                                type="line"
                                height={280}
                                options={{
                                    chart: { ...chartFont, ...toolbarOff },
                                    colors: ['#43a047', '#e53935'],
                                    xaxis: { categories: chart.statusLabels },
                                    stroke: { curve: 'smooth', width: 3 },
                                    dataLabels: { enabled: false },
                                    tooltip: { theme: 'dark' },
                                    grid: { borderColor: 'transparent' },
                                }}
                                series={[
                                    { name: 'Disponíveis', data: chart.disponiveisDia },
                                    { name: 'Indisponíveis', data: chart.indisponiveisDia },
                                ]}
                            />
                        ) : <Typography color="textSecondary" textAlign="center" mt={4}>Sem dados</Typography>}
                    </BaseCard>
                </Grid>

                <Grid item xs={12} md={6}>
                    <BaseCard title={`Aquisições por Mês (últimos ${janelaMeses} meses)`}>
                        <Chart
                            type="bar"
                            height={280}
                            options={{
                                chart: { ...chartFont, ...toolbarOff },
                                colors: ['#1e88e5', '#fb8c00'],
                                xaxis: {
                                    categories: chart.seriesMeses.labels,
                                    labels: { style: { colors: '#b0bec5', fontSize: '11px' } },
                                },
                                yaxis: { labels: { style: { colors: '#b0bec5' } } },
                                dataLabels: { enabled: false },
                                tooltip: { theme: 'dark' },
                                grid: { borderColor: 'transparent' },
                            }}
                            series={[
                                { name: 'Registros', data: chart.seriesMeses.registros },
                                { name: 'Quantidade', data: chart.seriesMeses.quantidade },
                            ]}
                        />
                    </BaseCard>
                </Grid>

                <Grid item xs={12} md={6}>
                    <BaseCard title={`Top Medicamentos com Indisponibilidade (${janelaDias} dias)`}>
                        {chart.topNomes.length > 0 ? (
                            <Chart
                                type="bar"
                                height={alturaTop}
                                options={{
                                    chart: { ...chartFont, ...toolbarOff },
                                    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
                                    colors: ['#ef5350'],
                                    xaxis: { categories: chart.topNomes, labels: { style: { colors: '#b0bec5' } } },
                                    yaxis: { labels: { style: { colors: '#b0bec5', fontSize: '11px' } } },
                                    dataLabels: { enabled: false },
                                    tooltip: { theme: 'dark' },
                                    grid: { borderColor: 'transparent' },
                                }}
                                series={[{ name: 'Dias indisponível', data: chart.topDias }]}
                            />
                        ) : <Typography color="textSecondary" textAlign="center" mt={4}>Sem dados</Typography>}
                    </BaseCard>
                </Grid>

                <Grid item xs={12} md={6}>
                    <BaseCard title="Origem das Aquisições (mês atual)">
                        {chart.fontesLabels.length > 0 ? (
                            <Chart
                                type="donut"
                                height={320}
                                options={{
                                    chart: { ...chartFont, ...toolbarOff },
                                    labels: chart.fontesLabels,
                                    legend: { labels: { colors: '#b0bec5' } },
                                    dataLabels: { enabled: true },
                                    tooltip: { theme: 'dark' },
                                }}
                                series={chart.fontesValores}
                            />
                        ) : <Typography color="textSecondary" textAlign="center" mt={4}>Sem dados</Typography>}
                    </BaseCard>
                </Grid>
            </Grid>
        </Box>
    );
}
