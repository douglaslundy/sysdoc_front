import React, { useEffect, useMemo, useState } from 'react';
import { Grid, Box, Typography, Card, CardContent, CircularProgress } from '@mui/material';
import dynamic from 'next/dynamic';
import FeatherIcon from 'feather-icons-react';
import { api } from '../../services/api';
import BaseCard from '../baseCard/BaseCard';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const CORES_STATUS = {
    solicitado: '#607d8b',
    coletado:   '#2196f3',
    em_analise: '#ff9800',
    liberado:   '#4caf50',
    cancelado:  '#f44336',
};

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

export default function LabDashboard() {
    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/laboratorio')
            .then(res => setDados(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // useMemo must be called before any conditional return (Rules of Hooks)
    const chart = useMemo(() => {
        if (!dados) return null;

        const { pedidos_por_status, pedidos_por_mes, top_exames, pedidos_por_categoria, clientes_por_mes, resultados_status, top_medicos } = dados;
        const statusLabels = Object.keys(pedidos_por_status || {});

        return {
            pedidos:       gerarMeses(pedidos_por_mes || {}),
            clientes:      gerarMeses(clientes_por_mes || {}),
            statusLabels,
            statusValues:  Object.values(pedidos_por_status || {}),
            statusCores:   statusLabels.map(s => CORES_STATUS[s] || '#607d8b'),
            topExameNomes: (top_exames || []).map(e => e.codigo || e.nome).reverse(),
            topExameVals:  (top_exames || []).map(e => e.total).reverse(),
            catNomes:      (pedidos_por_categoria || []).map(c => c.nome.substring(0, 20)),
            catVals:       (pedidos_por_categoria || []).map(c => c.total),
            medicoNomes:   (top_medicos || []).map(m => m.nome.split(' ').slice(0, 2).join(' ')).reverse(),
            medicoVals:    (top_medicos || []).map(m => m.total).reverse(),
            resultados:    resultados_status,
        };
    }, [dados]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress />
            </Box>
        );
    }

    if (!dados || !chart) {
        return (
            <Box p={4} textAlign="center">
                <Typography color="textSecondary">Não foi possível carregar o dashboard.</Typography>
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
                <Grid item xs={6} sm={4} md={2}>
                    <CardTotal icon="thermometer" titulo="Exames" valor={totais.exames} cor="#2196f3" />
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <CardTotal icon="clipboard" titulo="Pedidos" valor={totais.pedidos} cor="#ff9800" />
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <CardTotal icon="users" titulo="Clientes" valor={totais.clientes} cor="#4caf50" />
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <CardTotal icon="user-check" titulo="Médicos" valor={totais.medicos} cor="#9c27b0" />
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <CardTotal icon="tag" titulo="Categorias" valor={totais.categorias} cor="#f44336" />
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <CardTotal icon="user" titulo="Usuários" valor={totais.usuarios} cor="#607d8b" />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Pedidos por status - Donut */}
                <Grid item xs={12} md={4}>
                    <BaseCard title="Pedidos por Status">
                        {chart.statusLabels.length > 0 ? (
                            <Chart
                                type="donut"
                                height={280}
                                options={{
                                    labels: chart.statusLabels,
                                    colors: chart.statusCores,
                                    chart: { ...chartFont, ...toolbarOff },
                                    legend: { position: 'bottom' },
                                    dataLabels: { enabled: true },
                                    tooltip: { theme: 'dark' },
                                }}
                                series={chart.statusValues}
                            />
                        ) : <Typography color="textSecondary" textAlign="center" mt={4}>Sem dados</Typography>}
                    </BaseCard>
                </Grid>

                {/* Resultados liberados vs pendentes */}
                <Grid item xs={12} md={4}>
                    <BaseCard title="Resultados: Liberados vs Pendentes">
                        <Chart
                            type="radialBar"
                            height={280}
                            options={{
                                chart: { ...chartFont, ...toolbarOff },
                                labels: ['Liberados', 'Pendentes'],
                                colors: ['#4caf50', '#ff9800'],
                                plotOptions: {
                                    radialBar: {
                                        dataLabels: {
                                            name: { fontSize: '14px' },
                                            value: { fontSize: '18px', fontWeight: 'bold' },
                                        },
                                    },
                                },
                                legend: { show: true, position: 'bottom' },
                                tooltip: { theme: 'dark' },
                            }}
                            series={[
                                chart.resultados.liberados,
                                chart.resultados.pendentes,
                            ]}
                        />
                    </BaseCard>
                </Grid>

                {/* Top médicos */}
                <Grid item xs={12} md={4}>
                    <BaseCard title="Top 5 Médicos Solicitantes">
                        {chart.medicoNomes.length > 0 ? (
                            <Chart
                                type="bar"
                                height={280}
                                options={{
                                    chart: { ...chartFont, ...toolbarOff },
                                    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
                                    colors: ['#9c27b0'],
                                    xaxis: { labels: { style: { colors: '#b0bec5' } } },
                                    yaxis: {
                                        labels: {
                                            style: { colors: '#b0bec5', fontSize: '12px' },
                                            formatter: (val) => typeof val === 'string' ? val.toUpperCase() : val,
                                        },
                                    },
                                    dataLabels: { enabled: false },
                                    tooltip: { theme: 'dark' },
                                }}
                                series={[{ name: 'Pedidos', data: chart.medicoVals }]}
                            />
                        ) : <Typography color="textSecondary" textAlign="center" mt={4}>Sem dados</Typography>}
                    </BaseCard>
                </Grid>

                {/* Pedidos por mês */}
                <Grid item xs={12} md={6}>
                    <BaseCard title="Pedidos por Mês (últimos 12 meses)">
                        <Chart
                            type="area"
                            height={260}
                            options={{
                                chart: { ...chartFont, ...toolbarOff },
                                colors: ['#2196f3'],
                                xaxis: {
                                    categories: chart.pedidos.meses,
                                    labels: {
                                        style: { colors: '#b0bec5', fontSize: '11px' },
                                        formatter: (val) => typeof val === 'string' ? val.toUpperCase() : val,
                                    },
                                },
                                yaxis: { labels: { style: { colors: '#b0bec5' } } },
                                fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05 } },
                                stroke: { curve: 'smooth', width: 3 },
                                dataLabels: { enabled: false },
                                tooltip: { theme: 'dark' },
                                grid: { borderColor: 'transparent' },
                            }}
                            series={[{ name: 'Pedidos', data: chart.pedidos.valores }]}
                        />
                    </BaseCard>
                </Grid>

                {/* Clientes por mês */}
                <Grid item xs={12} md={6}>
                    <BaseCard title="Clientes Cadastrados por Mês (últimos 12 meses)">
                        <Chart
                            type="area"
                            height={260}
                            options={{
                                chart: { ...chartFont, ...toolbarOff },
                                colors: ['#4caf50'],
                                xaxis: {
                                    categories: chart.clientes.meses,
                                    labels: {
                                        style: { colors: '#b0bec5', fontSize: '11px' },
                                        formatter: (val) => typeof val === 'string' ? val.toUpperCase() : val,
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

                {/* Top 10 exames */}
                <Grid item xs={12} md={7}>
                    <BaseCard title="Top 10 Exames Mais Solicitados">
                        {chart.topExameNomes.length > 0 ? (
                            <Chart
                                type="bar"
                                height={320}
                                options={{
                                    chart: { ...chartFont, ...toolbarOff },
                                    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
                                    colors: ['#ff9800'],
                                    xaxis: { labels: { style: { colors: '#b0bec5' } } },
                                    yaxis: {
                                        labels: {
                                            style: { colors: '#b0bec5', fontSize: '12px' },
                                            formatter: (val) => typeof val === 'string' ? val.toUpperCase() : val,
                                        },
                                    },
                                    dataLabels: { enabled: false },
                                    tooltip: { theme: 'dark' },
                                }}
                                series={[{ name: 'Solicitações', data: chart.topExameVals }]}
                            />
                        ) : <Typography color="textSecondary" textAlign="center" mt={4}>Sem dados</Typography>}
                    </BaseCard>
                </Grid>

                {/* Pedidos por categoria */}
                <Grid item xs={12} md={5}>
                    <BaseCard title="Pedidos por Categoria de Exame">
                        {chart.catNomes.length > 0 ? (
                            <Chart
                                type="bar"
                                height={320}
                                options={{
                                    chart: { ...chartFont, ...toolbarOff },
                                    plotOptions: { bar: { horizontal: false, borderRadius: 4 } },
                                    colors: ['#2196f3'],
                                    xaxis: {
                                        categories: chart.catNomes,
                                        labels: {
                                            rotate: -30,
                                            style: { colors: '#b0bec5', fontSize: '11px' },
                                            formatter: (val) => typeof val === 'string' ? val.toUpperCase() : val,
                                        },
                                    },
                                    yaxis: { labels: { style: { colors: '#b0bec5' } } },
                                    dataLabels: { enabled: false },
                                    tooltip: { theme: 'dark' },
                                }}
                                series={[{ name: 'Pedidos', data: chart.catVals }]}
                            />
                        ) : <Typography color="textSecondary" textAlign="center" mt={4}>Sem dados</Typography>}
                    </BaseCard>
                </Grid>
            </Grid>
        </Box>
    );
}
