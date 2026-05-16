import React, { useEffect, useMemo, useState } from 'react';
import { Grid, Box, Typography, Card, CardContent, CircularProgress, Chip } from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import { api } from '../../services/api';
import BaseCard from '../baseCard/BaseCard';
import { DashboardLoading, DashboardErro, getDashboardErrorMessage } from './DashboardStatus';
import Chart from '../charts/ApexChartSafe';

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
    const [erro, setErro] = useState(null);

    useEffect(() => {
        api.get('/dashboard/laboratorio')
            .then(res => setDados(res.data))
            .catch((err) => setErro(err))
            .finally(() => setLoading(false));
    }, []);

    // useMemo must be called before any conditional return (Rules of Hooks)
    const chart = useMemo(() => {
        if (!dados) return null;

        const { pedidos_por_status, pedidos_por_mes, top_exames, pedidos_por_categoria, clientes_por_mes, resultados_status, top_medicos, realizados_por_mes, realizados_por_ano } = dados;
        const statusLabels = Object.keys(pedidos_por_status || {});
        const statusValues = Object.values(pedidos_por_status || {});
        const totalPedidos = statusValues.reduce((s, v) => s + v, 0);
        const pctPedidosLiberados = totalPedidos > 0
            ? Math.round(((pedidos_por_status?.liberado ?? 0) / totalPedidos) * 100)
            : 0;
        const totalResultados = (resultados_status?.liberados ?? 0) + (resultados_status?.pendentes ?? 0);
        const pctResultadosLiberados = totalResultados > 0
            ? Math.round(((resultados_status?.liberados ?? 0) / totalResultados) * 100)
            : 0;

        return {
            pedidos:                gerarMeses(pedidos_por_mes || {}),
            clientes:               gerarMeses(clientes_por_mes || {}),
            statusLabels,
            statusValues,
            statusCores:            statusLabels.map(s => CORES_STATUS[s] || '#607d8b'),
            statusCounts:           statusLabels.map((s, i) => ({ label: s, value: statusValues[i], cor: CORES_STATUS[s] || '#607d8b' })),
            pctPedidosLiberados,
            pctResultadosLiberados,
            topExameNomes:          (top_exames || []).map(e => e.nome || e.codigo).reverse(),
            topExameVals:           (top_exames || []).map(e => e.total).reverse(),
            catNomes:               (pedidos_por_categoria || []).map(c => c.nome.substring(0, 20)),
            catVals:                (pedidos_por_categoria || []).map(c => c.total),
            medicoNomes:            (top_medicos || []).map(m => (m.nome ?? '').split(' ').slice(0, 2).join(' ')).reverse(),
            medicoVals:             (top_medicos || []).map(m => m.total).reverse(),
            resultados:             resultados_status,
            realizadosMes:          gerarMeses(realizados_por_mes || {}),
            realizadosAno:          Object.entries(realizados_por_ano || {}).map(([ano, total]) => ({ ano: String(ano), total: Number(total) })),
        };
    }, [dados]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress />
            </Box>
        );
    }

    if (erro || !dados || !chart) return <DashboardErro message={getDashboardErrorMessage('Laboratorio', erro)} />;

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
                {/* Pedidos por status - Velocímetro */}
                <Grid item xs={12} md={4}>
                    <BaseCard title="Pedidos por Status">
                        {chart.statusLabels.length > 0 ? (
                            <>
                                <Chart
                                    type="radialBar"
                                    height={240}
                                    options={{
                                        chart: { ...chartFont, ...toolbarOff },
                                        plotOptions: {
                                            radialBar: {
                                                startAngle: -135,
                                                endAngle: 135,
                                                hollow: { size: '52%' },
                                                track: { background: '#333', strokeWidth: '97%' },
                                                dataLabels: {
                                                    name: { show: true, fontSize: '11px', color: '#b0bec5', offsetY: 20 },
                                                    value: { fontSize: '26px', fontWeight: 'bold', color: '#fff', offsetY: -15 },
                                                },
                                            },
                                        },
                                        fill: {
                                            type: 'gradient',
                                            gradient: {
                                                shade: 'dark',
                                                type: 'horizontal',
                                                colorStops: [
                                                    { offset: 0,   color: '#f44336', opacity: 1 },
                                                    { offset: 35,  color: '#ff9800', opacity: 1 },
                                                    { offset: 65,  color: '#9e9e9e', opacity: 1 },
                                                    { offset: 100, color: '#4caf50', opacity: 1 },
                                                ],
                                            },
                                        },
                                        labels: ['Concluídos'],
                                        tooltip: { theme: 'dark' },
                                    }}
                                    series={[chart.pctPedidosLiberados]}
                                />
                                <Box display="flex" flexWrap="wrap" gap={0.5} justifyContent="center" mt={-1} mb={1}>
                                    {chart.statusCounts.map(s => (
                                        <Chip
                                            key={s.label}
                                            label={`${s.label}: ${s.value}`}
                                            size="small"
                                            sx={{ bgcolor: s.cor + '33', color: s.cor, fontWeight: 600, fontSize: '11px' }}
                                        />
                                    ))}
                                </Box>
                            </>
                        ) : <Typography color="textSecondary" textAlign="center" mt={4}>Sem dados</Typography>}
                    </BaseCard>
                </Grid>

                {/* Resultados liberados vs pendentes - Gauge semicircular */}
                <Grid item xs={12} md={4}>
                    <BaseCard title="Resultados: Liberados vs Pendentes">
                        <Chart
                            type="radialBar"
                            height={280}
                            options={{
                                chart: { ...chartFont, ...toolbarOff },
                                plotOptions: {
                                    radialBar: {
                                        startAngle: -90,
                                        endAngle: 90,
                                        hollow: { size: '58%' },
                                        track: { background: '#333', strokeWidth: '97%' },
                                        dataLabels: {
                                            name: { fontSize: '13px', color: '#b0bec5', offsetY: -8 },
                                            value: { fontSize: '28px', fontWeight: 'bold', color: '#b0bec5', offsetY: -40 },
                                        },
                                    },
                                },
                                colors: ['#4caf50'],
                                labels: ['Liberados'],
                                tooltip: { theme: 'dark' },
                            }}
                            series={[chart.pctResultadosLiberados]}
                        />
                        <Box display="flex" justifyContent="center" gap={1} mt={1}>
                            <Chip size="small" label={`Liberados: ${dados?.resultados_status?.liberados ?? 0}`} sx={{ bgcolor: '#4caf50', color: '#fff' }} />
                            <Chip size="small" label={`Pendentes: ${dados?.resultados_status?.pendentes ?? 0}`} sx={{ bgcolor: '#607d8b', color: '#fff' }} />
                        </Box>
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
                                    xaxis: {
                                        categories: chart.medicoNomes,
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

                {/* Resultados liberados por mês */}
                <Grid item xs={12} md={6}>
                    <BaseCard title="Resultados Liberados por Mês (últimos 12 meses)">
                        <Chart
                            type="area"
                            height={260}
                            options={{
                                chart: { ...chartFont, ...toolbarOff },
                                colors: ['#4caf50'],
                                xaxis: {
                                    categories: chart.realizadosMes.meses,
                                    labels: { style: { colors: '#b0bec5', fontSize: '11px' }, formatter: v => typeof v === 'string' ? v.toUpperCase() : v },
                                },
                                yaxis: { labels: { style: { colors: '#b0bec5' } } },
                                fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05 } },
                                stroke: { curve: 'smooth', width: 3 },
                                dataLabels: { enabled: false },
                                tooltip: { theme: 'dark' },
                                grid: { borderColor: 'transparent' },
                            }}
                            series={[{ name: 'Liberados', data: chart.realizadosMes.valores }]}
                        />
                    </BaseCard>
                </Grid>

                {/* Resultados liberados por ano */}
                <Grid item xs={12} md={6}>
                    <BaseCard title="Resultados Liberados por Ano">
                        {chart.realizadosAno.length > 0 ? (
                            <Chart
                                type="bar"
                                height={260}
                                options={{
                                    chart: { ...chartFont, ...toolbarOff },
                                    colors: ['#009688'],
                                    xaxis: {
                                        categories: chart.realizadosAno.map(r => r.ano),
                                        labels: { style: { colors: '#b0bec5', fontSize: '11px' } },
                                    },
                                    yaxis: { labels: { style: { colors: '#b0bec5' } } },
                                    dataLabels: { enabled: false },
                                    tooltip: { theme: 'dark' },
                                    grid: { borderColor: 'transparent' },
                                }}
                                series={[{ name: 'Liberados', data: chart.realizadosAno.map(r => r.total) }]}
                            />
                        ) : <Typography color="textSecondary" textAlign="center" mt={4}>Sem dados</Typography>}
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
                                    xaxis: {
                                        categories: chart.topExameNomes,
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
