import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Calendar, CheckCircle, Users } from 'lucide-react';
import { Grade } from '../ui/grade';
import { StatCard } from '../ui/stat-card';
import { api } from '../../services/api';
import BaseCard from '../baseCard/BaseCard';
import { DashboardLoading, DashboardErro, getDashboardErrorMessage } from './DashboardStatus';
import Chart from '../charts/ApexChartSafe';

const ICONES = { 'activity': Activity, 'calendar': Calendar, 'check-circle': CheckCircle, 'users': Users };

const TOMS = { '#2196f3': 'info', '#4caf50': 'sucesso', '#9c27b0': 'primario', '#ff9800': 'primario' };

function CardTotal({ icon, titulo, valor, cor }) {
    return <StatCard Icone={ICONES[icon]} tom={TOMS[cor] || 'primario'} titulo={titulo} valor={valor ?? '—'} />;
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

export default function FilaDashboard() {
    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        api.get('/dashboard/fila')
            .then(res => setDados(res.data))
            .catch((err) => setErro(err))
            .finally(() => setLoading(false));
    }, []);

    const chart = useMemo(() => {
        if (!dados) return null;

        const { especialidades, entradas_por_mes, especialidades_realizadas, realizadas_por_mes } = dados;

        const espNomes = (especialidades || []).map(e => e.nome);
        const espNormal = (especialidades || []).map(e => e.normal || 0);
        const espUrgente = (especialidades || []).map(e => e.urgente || 0);

        const porMes = gerarMeses(entradas_por_mes || {});

        const especialidadeRealizadaNomes = (especialidades_realizadas || []).map(e => e.nome).reverse();
        const especialidadeRealizadaVals = (especialidades_realizadas || []).map(e => e.total).reverse();
        const realizadasPorMes = gerarMeses(realizadas_por_mes || {});

        return { espNomes, espNormal, espUrgente, porMes, especialidadeRealizadaNomes, especialidadeRealizadaVals, realizadasPorMes };
    }, [dados]);

    if (loading) return <DashboardLoading />;
    if (erro || !dados || !chart) return <DashboardErro message={getDashboardErrorMessage('Fila', erro)} />;

    const { totais } = dados;

    const chartFont = { fontFamily: "'DM Sans', sans-serif" };
    const toolbarOff = { toolbar: { show: false } };

    return (
        <div className="ui-reset">
            {/* Totalizadores */}
            <Grade container spacing={3} mb={3}>
                <Grade item xs={6} sm={3}>
                    <CardTotal
                        icon="activity"
                        titulo="Especialidades Cadastradas"
                        valor={totais?.especialidades}
                        cor="#9c27b0"
                    />
                </Grade>
                <Grade item xs={6} sm={3}>
                    <CardTotal
                        icon="users"
                        titulo="Total na Fila"
                        valor={totais?.total_na_fila}
                        cor="#2196f3"
                    />
                </Grade>
                <Grade item xs={6} sm={3}>
                    <CardTotal
                        icon="calendar"
                        titulo="Fila Últimos 7 Dias"
                        valor={totais?.fila_7dias}
                        cor="#ff9800"
                    />
                </Grade>
                <Grade item xs={6} sm={3}>
                    <CardTotal
                        icon="check-circle"
                        titulo="Total Realizados"
                        valor={totais?.total_realizados}
                        cor="#4caf50"
                    />
                </Grade>
            </Grade>

            <Grade container spacing={3}>
                {/* Fila x Especialidades — barras empilhadas */}
                <Grade item xs={12} md={12}>
                    <BaseCard title="Fila x Especialidades">
                        {chart.espNomes.length > 0 ? (
                            <Chart
                                type="bar"
                                height={320}
                                options={{
                                    chart: { ...chartFont, ...toolbarOff, stacked: true },
                                    colors: ['#2196f3', '#f44336'],
                                    plotOptions: { bar: { horizontal: false, borderRadius: 3 } },
                                    xaxis: {
                                        categories: chart.espNomes,
                                        labels: {
                                            rotate: -30,
                                            style: { colors: '#b0bec5', fontSize: '11px' },
                                            formatter: (val) => typeof val === 'string' ? val.toUpperCase() : val,
                                        },
                                    },
                                    yaxis: { labels: { style: { colors: '#b0bec5' } } },
                                    legend: { position: 'top', labels: { colors: '#b0bec5' } },
                                    dataLabels: { enabled: false },
                                    tooltip: { theme: 'dark' },
                                    grid: { borderColor: 'transparent' },
                                }}
                                series={[
                                    { name: 'Normal', data: chart.espNormal },
                                    { name: 'Urgente', data: chart.espUrgente },
                                ]}
                            />
                        ) : (
                            <p className="mt-8 text-center text-muted-foreground">Sem dados</p>
                        )}
                    </BaseCard>
                </Grade>

                {/* Entradas na fila — últimos 12 meses */}
                <Grade item xs={12} md={12}>
                    <BaseCard title="Entradas na Fila — Últimos 12 Meses">
                        <Chart
                            type="area"
                            height={320}
                            options={{
                                chart: { ...chartFont, ...toolbarOff },
                                colors: ['#2196f3'],
                                xaxis: {
                                    categories: chart.porMes.meses,
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
                            series={[{ name: 'Entradas', data: chart.porMes.valores }]}
                        />
                    </BaseCard>
                </Grade>

                {/* Especialidades realizadas */}
                <Grade item xs={12} md={6}>
                    <BaseCard title="Especialidades Realizadas (total geral)">
                        {chart.especialidadeRealizadaNomes.length > 0 ? (
                            <Chart
                                type="bar"
                                height={300}
                                options={{
                                    chart: { ...chartFont, ...toolbarOff },
                                    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
                                    colors: ['#4caf50'],
                                    xaxis: {
                                        categories: chart.especialidadeRealizadaNomes,
                                        labels: { style: { colors: '#b0bec5' } },
                                    },
                                    yaxis: { labels: { style: { colors: '#b0bec5', fontSize: '12px' }, formatter: (val) => typeof val === 'string' ? val.toUpperCase() : val } },
                                    dataLabels: { enabled: false },
                                    tooltip: { theme: 'dark' },
                                }}
                                series={[{ name: 'Realizados', data: chart.especialidadeRealizadaVals }]}
                            />
                        ) : <p className="mt-8 text-center text-muted-foreground">Sem dados</p>}
                    </BaseCard>
                </Grade>

                {/* Realizados por mês */}
                <Grade item xs={12} md={6}>
                    <BaseCard title="Atendimentos Realizados por Mês (últimos 12 meses)">
                        <Chart
                            type="area"
                            height={300}
                            options={{
                                chart: { ...chartFont, ...toolbarOff },
                                colors: ['#4caf50'],
                                xaxis: {
                                    categories: chart.realizadasPorMes.meses,
                                    labels: { style: { colors: '#b0bec5', fontSize: '11px' }, formatter: v => typeof v === 'string' ? v.toUpperCase() : v },
                                },
                                yaxis: { labels: { style: { colors: '#b0bec5' } } },
                                fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05 } },
                                stroke: { curve: 'smooth', width: 3 },
                                dataLabels: { enabled: false },
                                tooltip: { theme: 'dark' },
                                grid: { borderColor: 'transparent' },
                            }}
                            series={[{ name: 'Realizados', data: chart.realizadasPorMes.valores }]}
                        />
                    </BaseCard>
                </Grade>
            </Grade>
        </div>
    );
}
