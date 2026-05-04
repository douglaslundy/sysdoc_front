import React, { useEffect, useState } from 'react';
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

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress />
            </Box>
        );
    }

    if (!dados) {
        return (
            <Box p={4} textAlign="center">
                <Typography color="textSecondary">Não foi possível carregar o dashboard.</Typography>
            </Box>
        );
    }

    const { totais, pedidos_por_status, pedidos_por_mes, top_exames, pedidos_por_categoria, clientes_por_mes, resultados_status, top_medicos } = dados;

    // Pedidos por mês
    const { meses: mesesPedidos, valores: valoresPedidos } = gerarMeses(pedidos_por_mes || {});
    // Clientes por mês
    const { meses: mesesClientes, valores: valoresClientes } = gerarMeses(clientes_por_mes || {});

    // Pedidos por status (donut)
    const statusLabels = Object.keys(pedidos_por_status || {});
    const statusValues = Object.values(pedidos_por_status || {});
    const statusCores  = statusLabels.map(s => CORES_STATUS[s] || '#607d8b');

    // Top exames (barra horizontal)
    const topExameNomes  = (top_exames || []).map(e => e.codigo || e.nome).reverse();
    const topExameVals   = (top_exames || []).map(e => e.total).reverse();

    // Categorias (barra)
    const catNomes = (pedidos_por_categoria || []).map(c => c.nome.substring(0, 20));
    const catVals  = (pedidos_por_categoria || []).map(c => c.total);

    // Médicos (barra horizontal)
    const medicoNomes = (top_medicos || []).map(m => m.nome.split(' ').slice(0, 2).join(' ')).reverse();
    const medicoVals  = (top_medicos || []).map(m => m.total).reverse();

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
                        {statusLabels.length > 0 ? (
                            <Chart
                                type="donut"
                                height={280}
                                options={{
                                    labels: statusLabels,
                                    colors: statusCores,
                                    chart: { ...chartFont, ...toolbarOff },
                                    legend: { position: 'bottom' },
                                    dataLabels: { enabled: true },
                                    tooltip: { theme: 'dark' },
                                }}
                                series={statusValues}
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
                                resultados_status.liberados,
                                resultados_status.pendentes,
                            ]}
                        />
                    </BaseCard>
                </Grid>

                {/* Top médicos */}
                <Grid item xs={12} md={4}>
                    <BaseCard title="Top 5 Médicos Solicitantes">
                        {medicoNomes.length > 0 ? (
                            <Chart
                                type="bar"
                                height={280}
                                options={{
                                    chart: { ...chartFont, ...toolbarOff },
                                    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
                                    colors: ['#9c27b0'],
                                    xaxis: { categories: medicoNomes },
                                    dataLabels: { enabled: false },
                                    tooltip: { theme: 'dark' },
                                }}
                                series={[{ name: 'Pedidos', data: medicoVals }]}
                            />
                        ) : <Typography color="textSecondary" textAlign="center" mt={4}>Sem dados</Typography>}
                    </BaseCard>
                </Grid>

                {/* Pedidos por mês - linha */}
                <Grid item xs={12} md={6}>
                    <BaseCard title="Pedidos por Mês (últimos 12 meses)">
                        <Chart
                            type="area"
                            height={260}
                            options={{
                                chart: { ...chartFont, ...toolbarOff },
                                colors: ['#2196f3'],
                                xaxis: { categories: mesesPedidos },
                                fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05 } },
                                stroke: { curve: 'smooth', width: 3 },
                                dataLabels: { enabled: false },
                                tooltip: { theme: 'dark' },
                                grid: { borderColor: 'transparent' },
                            }}
                            series={[{ name: 'Pedidos', data: valoresPedidos }]}
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
                                xaxis: { categories: mesesClientes },
                                fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05 } },
                                stroke: { curve: 'smooth', width: 3 },
                                dataLabels: { enabled: false },
                                tooltip: { theme: 'dark' },
                                grid: { borderColor: 'transparent' },
                            }}
                            series={[{ name: 'Clientes', data: valoresClientes }]}
                        />
                    </BaseCard>
                </Grid>

                {/* Top 10 exames */}
                <Grid item xs={12} md={7}>
                    <BaseCard title="Top 10 Exames Mais Solicitados">
                        {topExameNomes.length > 0 ? (
                            <Chart
                                type="bar"
                                height={320}
                                options={{
                                    chart: { ...chartFont, ...toolbarOff },
                                    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
                                    colors: ['#ff9800'],
                                    xaxis: { categories: topExameNomes },
                                    dataLabels: { enabled: false },
                                    tooltip: { theme: 'dark' },
                                }}
                                series={[{ name: 'Solicitações', data: topExameVals }]}
                            />
                        ) : <Typography color="textSecondary" textAlign="center" mt={4}>Sem dados</Typography>}
                    </BaseCard>
                </Grid>

                {/* Pedidos por categoria */}
                <Grid item xs={12} md={5}>
                    <BaseCard title="Pedidos por Categoria de Exame">
                        {catNomes.length > 0 ? (
                            <Chart
                                type="bar"
                                height={320}
                                options={{
                                    chart: { ...chartFont, ...toolbarOff },
                                    plotOptions: { bar: { horizontal: false, borderRadius: 4 } },
                                    colors: ['#2196f3'],
                                    xaxis: {
                                        categories: catNomes,
                                        labels: { rotate: -30, style: { fontSize: '11px' } },
                                    },
                                    dataLabels: { enabled: false },
                                    tooltip: { theme: 'dark' },
                                }}
                                series={[{ name: 'Pedidos', data: catVals }]}
                            />
                        ) : <Typography color="textSecondary" textAlign="center" mt={4}>Sem dados</Typography>}
                    </BaseCard>
                </Grid>
            </Grid>
        </Box>
    );
}
