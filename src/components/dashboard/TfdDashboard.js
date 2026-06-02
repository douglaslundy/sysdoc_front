import React, { useEffect, useMemo, useState } from 'react';
import { Grid, Box, Typography, Card, CardContent, ToggleButton, ToggleButtonGroup } from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import { api } from '../../services/api';
import BaseCard from '../baseCard/BaseCard';
import { DashboardLoading, DashboardErro, getDashboardErrorMessage } from './DashboardStatus';
import Chart from '../charts/ApexChartSafe';

function CardTotal({ icon, titulo, valor, cor }) {
    return (
        <Card className="dashboard-neon-kpi" sx={{ height: '100%', borderColor: `${cor}aa` }}>
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
    const [erro, setErro] = useState(null);
    const [periodo, setPeriodo] = useState('mes');

    useEffect(() => {
        setLoading(true);
        setErro(null);
        api.get('/dashboard/tfd', { params: { periodo } })
            .then(res => setDados(res.data))
            .catch((err) => setErro(err))
            .finally(() => setLoading(false));
    }, [periodo]);

    const chart = useMemo(() => {
        if (!dados) return null;

        const { viagens_por_dia, viagens_por_dia_agendadas, motoristas, rotas, viagens_por_mes, viagens_por_ano } = dados;

        const diasLabels = (viagens_por_dia || []).map(v => String(v.dia));
        const diasVals   = (viagens_por_dia || []).map(v => v.total || 0);

        const diasAgLabels = (viagens_por_dia_agendadas || []).map(v => String(v.dia));
        const diasAgVals   = (viagens_por_dia_agendadas || []).map(v => v.total || 0);

        const motoristaNomes = (motoristas || []).map(m => (m.nome ?? '').split(' ').slice(0, 2).join(' ')).reverse();
        const motoristaVals  = (motoristas || []).map(m => m.total || 0).reverse();

        const rotaNomes = (rotas || []).map(r => r.rota.substring(0, 25)).reverse();
        const rotaVals  = (rotas || []).map(r => r.total || 0).reverse();

        // Séries históricas mensais
        const mesMeses   = (viagens_por_mes || []).map(v => {
            const [ano, mes] = v.mes.split('-');
            const d = new Date(parseInt(ano), parseInt(mes) - 1, 1);
            return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase();
        });
        const mesViagens = (viagens_por_mes || []).map(v => v.viagens);
        const mesPessoas = (viagens_por_mes || []).map(v => v.pessoas);
        const mesKm      = (viagens_por_mes || []).map(v => v.km);

        // Séries históricas anuais
        const anoLabels  = (viagens_por_ano || []).map(v => v.ano);
        const anoViagens = (viagens_por_ano || []).map(v => v.viagens);
        const anoPessoas = (viagens_por_ano || []).map(v => v.pessoas);
        const anoKm      = (viagens_por_ano || []).map(v => v.km);

        const alturaMotoristaRotas = Math.max(300, Math.max(motoristaNomes.length, rotaNomes.length) * 32);

        return {
            diasLabels, diasVals,
            diasAgLabels, diasAgVals,
            motoristaNomes, motoristaVals,
            rotaNomes, rotaVals,
            alturaMotoristaRotas,
            mesMeses, mesViagens, mesPessoas, mesKm,
            anoLabels, anoViagens, anoPessoas, anoKm,
        };
    }, [dados]);

    if (loading) return <DashboardLoading />;
    if (erro || !dados || !chart) return <DashboardErro message={getDashboardErrorMessage('TFD', erro)} />;

    const { totais } = dados;
    const nomeMes = (() => {
        const s = new Date().toLocaleDateString('pt-BR', { month: 'long' });
        return s.charAt(0).toUpperCase() + s.slice(1);
    })();

    const chartFont = { fontFamily: "'DM Sans', sans-serif" };
    const toolbarOff = { toolbar: { show: false } };

    return (
        <Box className="dashboard-neon-home">
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

            <Box mb={2} display="flex" alignItems="center" gap={1}>
                <FeatherIcon icon="calendar" width={16} height={16} style={{ opacity: 0.6 }} />
                <Typography variant="caption" color="text.secondary">
                    Referência: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Viagens realizadas por dia do mês — linha */}
                <Grid item xs={12} md={6}>
                    <BaseCard title={`Viagens por Dia do Mês — ${nomeMes}`}>
                        {chart.diasLabels.length > 0 ? (
                            <Chart
                                type="line"
                                height={260}
                                options={{
                                    chart: { ...chartFont, ...toolbarOff },
                                    colors: ['#4caf50'],
                                    xaxis: {
                                        categories: chart.diasLabels,
                                        title: { text: 'DIA' },
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

                {/* Viagens agendadas por dia do mês — linha */}
                <Grid item xs={12} md={6}>
                    <BaseCard title={`Viagens Agendadas — ${nomeMes}`}>
                        {chart.diasAgLabels.length > 0 ? (
                            <Chart
                                type="line"
                                height={260}
                                options={{
                                    chart: { ...chartFont, ...toolbarOff },
                                    colors: ['#2196f3'],
                                    xaxis: {
                                        categories: chart.diasAgLabels,
                                        title: { text: 'DIA' },
                                    },
                                    stroke: { curve: 'smooth', width: 3 },
                                    markers: { size: 4 },
                                    dataLabels: { enabled: false },
                                    tooltip: { theme: 'dark' },
                                    grid: { borderColor: 'transparent' },
                                }}
                                series={[{ name: 'Agendadas', data: chart.diasAgVals }]}
                            />
                        ) : (
                            <Typography color="textSecondary" textAlign="center" mt={4}>Sem viagens agendadas</Typography>
                        )}
                    </BaseCard>
                </Grid>

                {/* Seletor de período para motoristas e rotas */}
                <Grid item xs={12}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="body2" color="text.secondary">Período (motoristas e rotas):</Typography>
                        <ToggleButtonGroup
                            value={periodo}
                            exclusive
                            onChange={(_, v) => v && setPeriodo(v)}
                            size="small"
                        >
                            <ToggleButton value="mes">Mês atual</ToggleButton>
                            <ToggleButton value="12meses">Últimos 12 meses</ToggleButton>
                            <ToggleButton value="ano">Este ano</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                </Grid>

                {/* Viagens por Motorista — barras horizontal */}
                <Grid item xs={12} md={6}>
                    <BaseCard title="Viagens por Motorista">
                        {chart.motoristaNomes.length > 0 ? (
                            <Chart
                                type="bar"
                                height={chart.alturaMotoristaRotas}
                                options={{
                                    chart: { ...chartFont, ...toolbarOff },
                                    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
                                    colors: ['#9c27b0'],
                                    xaxis: {
                                        categories: chart.motoristaNomes,
                                        labels: { style: { colors: '#b0bec5' } },
                                    },
                                    yaxis: {
                                        labels: {
                                            style: { colors: '#b0bec5', fontSize: '12px' },
                                            formatter: (val) => typeof val === 'string' ? val.toUpperCase() : val,
                                        },
                                    },
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
                                height={chart.alturaMotoristaRotas}
                                options={{
                                    chart: { ...chartFont, ...toolbarOff },
                                    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
                                    colors: ['#ff9800'],
                                    xaxis: {
                                        categories: chart.rotaNomes,
                                        labels: { style: { colors: '#b0bec5' } },
                                    },
                                    yaxis: {
                                        labels: {
                                            style: { colors: '#b0bec5', fontSize: '12px' },
                                            formatter: (val) => typeof val === 'string' ? val.toUpperCase() : val,
                                        },
                                    },
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

                {/* Viagens por Mês */}
                <Grid item xs={12} md={4}>
                    <BaseCard title="Viagens por Mês (Últimos 12 Meses)">
                        <Chart
                            type="bar"
                            height={280}
                            options={{
                                chart: { ...chartFont, ...toolbarOff },
                                colors: ['#4caf50'],
                                plotOptions: { bar: { borderRadius: 3, columnWidth: '55%' } },
                                xaxis: {
                                    categories: chart.mesMeses,
                                    labels: {
                                        style: { colors: '#b0bec5', fontSize: '11px' },
                                        formatter: (val) => typeof val === 'string' ? val.toUpperCase() : val,
                                    },
                                },
                                yaxis: { labels: { style: { colors: '#b0bec5' } } },
                                dataLabels: { enabled: false },
                                tooltip: { theme: 'dark' },
                                grid: { borderColor: 'transparent' },
                            }}
                            series={[{ name: 'Viagens', data: chart.mesViagens }]}
                        />
                    </BaseCard>
                </Grid>

                {/* Pessoas por Mês */}
                <Grid item xs={12} md={4}>
                    <BaseCard title="Pessoas por Mês (Últimos 12 Meses)">
                        <Chart
                            type="bar"
                            height={280}
                            options={{
                                chart: { ...chartFont, ...toolbarOff },
                                colors: ['#2196f3'],
                                plotOptions: { bar: { borderRadius: 3, columnWidth: '55%' } },
                                xaxis: {
                                    categories: chart.mesMeses,
                                    labels: {
                                        style: { colors: '#b0bec5', fontSize: '11px' },
                                        formatter: (val) => typeof val === 'string' ? val.toUpperCase() : val,
                                    },
                                },
                                yaxis: { labels: { style: { colors: '#b0bec5' } } },
                                dataLabels: { enabled: false },
                                tooltip: { theme: 'dark' },
                                grid: { borderColor: 'transparent' },
                            }}
                            series={[{ name: 'Pessoas', data: chart.mesPessoas }]}
                        />
                    </BaseCard>
                </Grid>

                {/* KM Rodados por Mês */}
                <Grid item xs={12} md={4}>
                    <BaseCard title="KM Rodados por Mês (Últimos 12 Meses)">
                        <Chart
                            type="bar"
                            height={280}
                            options={{
                                chart: { ...chartFont, ...toolbarOff },
                                colors: ['#ff9800'],
                                plotOptions: { bar: { borderRadius: 3, columnWidth: '55%' } },
                                xaxis: {
                                    categories: chart.mesMeses,
                                    labels: {
                                        style: { colors: '#b0bec5', fontSize: '11px' },
                                        formatter: (val) => typeof val === 'string' ? val.toUpperCase() : val,
                                    },
                                },
                                yaxis: { labels: { style: { colors: '#b0bec5' } } },
                                dataLabels: { enabled: false },
                                tooltip: { theme: 'dark' },
                                grid: { borderColor: 'transparent' },
                            }}
                            series={[{ name: 'KM Rodados', data: chart.mesKm }]}
                        />
                    </BaseCard>
                </Grid>

                {/* Viagens por Ano */}
                <Grid item xs={12} md={4}>
                    <BaseCard title="Viagens por Ano (Últimos 5 Anos)">
                        <Chart
                            type="bar"
                            height={280}
                            options={{
                                chart: { ...chartFont, ...toolbarOff },
                                colors: ['#4caf50'],
                                plotOptions: { bar: { borderRadius: 3, columnWidth: '50%' } },
                                xaxis: {
                                    categories: chart.anoLabels,
                                    labels: { style: { colors: '#b0bec5', fontSize: '13px' } },
                                },
                                yaxis: { labels: { style: { colors: '#b0bec5' } } },
                                dataLabels: { enabled: false },
                                tooltip: { theme: 'dark' },
                                grid: { borderColor: 'transparent' },
                            }}
                            series={[{ name: 'Viagens', data: chart.anoViagens }]}
                        />
                    </BaseCard>
                </Grid>

                {/* Pessoas por Ano */}
                <Grid item xs={12} md={4}>
                    <BaseCard title="Pessoas por Ano (Últimos 5 Anos)">
                        <Chart
                            type="bar"
                            height={280}
                            options={{
                                chart: { ...chartFont, ...toolbarOff },
                                colors: ['#2196f3'],
                                plotOptions: { bar: { borderRadius: 3, columnWidth: '50%' } },
                                xaxis: {
                                    categories: chart.anoLabels,
                                    labels: { style: { colors: '#b0bec5', fontSize: '13px' } },
                                },
                                yaxis: { labels: { style: { colors: '#b0bec5' } } },
                                dataLabels: { enabled: false },
                                tooltip: { theme: 'dark' },
                                grid: { borderColor: 'transparent' },
                            }}
                            series={[{ name: 'Pessoas', data: chart.anoPessoas }]}
                        />
                    </BaseCard>
                </Grid>

                {/* KM Rodados por Ano */}
                <Grid item xs={12} md={4}>
                    <BaseCard title="KM Rodados por Ano (Últimos 5 Anos)">
                        <Chart
                            type="bar"
                            height={280}
                            options={{
                                chart: { ...chartFont, ...toolbarOff },
                                colors: ['#ff9800'],
                                plotOptions: { bar: { borderRadius: 3, columnWidth: '50%' } },
                                xaxis: {
                                    categories: chart.anoLabels,
                                    labels: { style: { colors: '#b0bec5', fontSize: '13px' } },
                                },
                                yaxis: { labels: { style: { colors: '#b0bec5' } } },
                                dataLabels: { enabled: false },
                                tooltip: { theme: 'dark' },
                                grid: { borderColor: 'transparent' },
                            }}
                            series={[{ name: 'KM Rodados', data: chart.anoKm }]}
                        />
                    </BaseCard>
                </Grid>
            </Grid>
        </Box>
    );
}
