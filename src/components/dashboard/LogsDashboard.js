import React, { useEffect, useMemo, useState } from 'react';
import { Link, Maximize2 } from 'lucide-react';
import { Grade } from '../ui/grade';
import { StatCard } from '../ui/stat-card';
import { api } from '../../services/api';
import BaseCard from '../baseCard/BaseCard';
import { DashboardLoading, DashboardErro, getDashboardErrorMessage } from './DashboardStatus';
import Chart from '../charts/ApexChartSafe';

const ICONES = { 'link': Link, 'maximize-2': Maximize2 };

const TOMS = { '#1565c0': 'info', '#2196f3': 'info', '#2e7d32': 'sucesso', '#4caf50': 'sucesso' };

function CardTotal({ icon, titulo, valor, cor }) {
    return <StatCard Icone={ICONES[icon]} tom={TOMS[cor] || 'primario'} titulo={titulo} valor={valor ?? '—'} />;
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
        <div className="ui-reset">
            {/* Totalizadores */}
            <Grade container spacing={3} mb={3}>
                <Grade item xs={6} sm={3}>
                    <CardTotal
                        icon="maximize-2"
                        titulo="Total QR CODE"
                        valor={totais?.total_qr}
                        cor="#2196f3"
                    />
                </Grade>
                <Grade item xs={6} sm={3}>
                    <CardTotal
                        icon="link"
                        titulo="Total Link Público"
                        valor={totais?.total_link}
                        cor="#4caf50"
                    />
                </Grade>
                <Grade item xs={6} sm={3}>
                    <CardTotal
                        icon="maximize-2"
                        titulo="QR CODE x Mês"
                        valor={totais?.qr_mes}
                        cor="#1565c0"
                    />
                </Grade>
                <Grade item xs={6} sm={3}>
                    <CardTotal
                        icon="link"
                        titulo="Link Público x Mês"
                        valor={totais?.link_mes}
                        cor="#2e7d32"
                    />
                </Grade>
            </Grade>

            <Grade container spacing={3}>
                {/* Acesso QR Code por dia — linha */}
                <Grade item xs={12} md={6}>
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
                            <p className="mt-8 text-center text-muted-foreground">Sem dados</p>
                        )}
                    </BaseCard>
                </Grade>

                {/* Acessos ao Link Público por dia — linha */}
                <Grade item xs={12} md={6}>
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
                            <p className="mt-8 text-center text-muted-foreground">Sem dados</p>
                        )}
                    </BaseCard>
                </Grade>
            </Grade>
        </div>
    );
}
