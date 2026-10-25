import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Archive, CheckCircle, ShoppingCart } from 'lucide-react';
import { Abas } from '../ui/abas';
import { DataTable } from '../ui/data-table';
import { Grade } from '../ui/grade';
import { StatCard } from '../ui/stat-card';
import { api } from '../../services/api';
import BaseCard from '../baseCard/BaseCard';
import Chart from '../charts/ApexChartSafe';
import { DashboardErro, DashboardLoading, getDashboardErrorMessage } from './DashboardStatus';

const ICONES = { 'alert-triangle': AlertTriangle, 'archive': Archive, 'check-circle': CheckCircle, 'shopping-cart': ShoppingCart };

const TOMS = { '#1e88e5': 'info', '#43a047': 'sucesso', '#e53935': 'perigo', '#fb8c00': 'primario' };

function CardTotal({ icon, titulo, valor, cor }) {
    return <StatCard Icone={ICONES[icon]} tom={TOMS[cor] || 'primario'} titulo={titulo} valor={valor ?? '—'} />;
}

const COLUNAS_RISCO = [
    { chave: 'medicamento', titulo: 'Medicamento', render: (item) => item.nome },
    { chave: 'estoque', titulo: 'Estoque Atual', numerica: true, render: (item) => item.estoque_atual },
    { chave: 'consumo', titulo: 'Consumo/dia', numerica: true, render: (item) => item.consumo_medio_diario },
    {
        chave: 'dias',
        titulo: 'Dias Restantes',
        numerica: true,
        render: (item) => <span className={`font-bold ${item.dias_restantes < 5 ? 'text-danger' : 'text-primary-text'}`}>{item.dias_restantes}</span>,
    },
];

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
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
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

        const consumo = dados.consumo_ranking || [];
        const consumoNomes = consumo.map((c) => c.nome).reverse();
        const consumoValores = consumo.map((c) => Number(c.consumo_medio_mensal || 0)).reverse();

        return {
            statusLabels,
            disponiveisDia,
            indisponiveisDia,
            topNomes,
            topDias,
            fontesLabels,
            fontesValores,
            seriesMeses,
            consumoNomes,
            consumoValores,
        };
    }, [dados, janelaMeses]);

    if (loading) return <DashboardLoading />;
    if (erro || !dados || !chart) return <DashboardErro message={getDashboardErrorMessage('Farmacia', erro)} />;

    const chartFont = { fontFamily: "'DM Sans', sans-serif" };
    const toolbarOff = { toolbar: { show: false } };
    const totais = dados.totais || {};
    const alturaTop = Math.max(300, chart.topNomes.length * 36);

    return (
        <div>
            <Grade container spacing={3} mb={3}>
                <Grade item xs={12} sm={6} md={3}>
                    <CardTotal icon="archive" titulo="Medicamentos Ativos" valor={totais.medicamentos_ativos} cor="#1e88e5" />
                </Grade>
                <Grade item xs={12} sm={6} md={3}>
                    <CardTotal icon="check-circle" titulo="Disponibilidade Hoje" valor={`${totais.taxa_disponibilidade_hoje || 0}%`} cor="#43a047" />
                </Grade>
                <Grade item xs={12} sm={6} md={3}>
                    <CardTotal icon="alert-triangle" titulo="Indisponíveis Hoje" valor={totais.indisponiveis_hoje} cor="#e53935" />
                </Grade>
                <Grade item xs={12} sm={6} md={3}>
                    <CardTotal icon="shopping-cart" titulo="Qtd. Adquirida no Mês" valor={totais.qtd_adquirida_mes_atual} cor="#fb8c00" />
                </Grade>
            </Grade>

            <div className="mb-4 flex flex-wrap items-center gap-4">
                <p className="text-sm text-muted-foreground">Período de análise:</p>
                <Abas
                    rotulo="Período de análise"
                    valor={janelaDias}
                    aoMudar={setJanelaDias}
                    itens={[
                                { chave: 7, rotulo: '7 dias' },
                                { chave: 30, rotulo: '30 dias' },
                                { chave: 90, rotulo: '90 dias' },
                    ]}
                />
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-4">
                <p className="text-sm text-muted-foreground">Janela de aquisições:</p>
                <Abas
                    rotulo="Janela de aquisições"
                    valor={janelaMeses}
                    aoMudar={setJanelaMeses}
                    itens={[
                                { chave: 3, rotulo: '3 meses' },
                                { chave: 6, rotulo: '6 meses' },
                                { chave: 12, rotulo: '12 meses' },
                    ]}
                />
            </div>

            <Grade container spacing={3}>
                <Grade item xs={12} md={6}>
                    <BaseCard title={`Disponibilidade Diária (últimos ${janelaDias} dias)`}>
                        {chart.statusLabels.length > 0 ? (
                            <Chart
                                type="line"
                                height={280}
                                options={{
                                    chart: { ...chartFont, ...toolbarOff },
                                    colors: ['#43a047', '#e53935'],
                                    legend: { labels: { colors: isDarkMode ? '#ffffff' : '#546e7a' } },
                                    xaxis: {
                                        categories: chart.statusLabels,
                                        labels: { style: { colors: isDarkMode ? '#ffffff' : '#b0bec5' } },
                                    },
                                    yaxis: { labels: { style: { colors: isDarkMode ? '#ffffff' : '#b0bec5' } } },
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
                        ) : <p className="mt-8 text-center text-muted-foreground">Sem dados</p>}
                    </BaseCard>
                </Grade>

                <Grade item xs={12} md={6}>
                    <BaseCard title={`Aquisições por Mês (últimos ${janelaMeses} meses)`}>
                        <Chart
                            type="bar"
                            height={280}
                            options={{
                                chart: { ...chartFont, ...toolbarOff },
                                colors: ['#1e88e5', '#fb8c00'],
                                legend: { labels: { colors: isDarkMode ? '#ffffff' : '#546e7a' } },
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
                </Grade>

                <Grade item xs={12} md={6}>
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
                        ) : <p className="mt-8 text-center text-muted-foreground">Sem dados</p>}
                    </BaseCard>
                </Grade>

                <Grade item xs={12} md={6}>
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
                        ) : <p className="mt-8 text-center text-muted-foreground">Sem dados</p>}
                    </BaseCard>
                </Grade>

                <Grade item xs={12} md={6}>
                    <BaseCard title="Medicamentos Mais Consumidos (média mensal, últimos 3 meses)">
                        <p className="mb-2 text-xs text-muted-foreground">
                            Consumo estimado a partir do status diário de disponibilidade — depende de lançamento consistente.
                        </p>
                        {chart.consumoNomes.length > 0 ? (
                            <Chart
                                type="bar"
                                height={Math.max(300, chart.consumoNomes.length * 36)}
                                options={{
                                    chart: { ...chartFont, ...toolbarOff },
                                    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
                                    colors: ['#1e88e5'],
                                    xaxis: { categories: chart.consumoNomes, labels: { style: { colors: '#b0bec5' } } },
                                    yaxis: { labels: { style: { colors: '#b0bec5', fontSize: '11px' } } },
                                    dataLabels: { enabled: false },
                                    tooltip: { theme: 'dark' },
                                    grid: { borderColor: 'transparent' },
                                }}
                                series={[{ name: 'Consumo médio mensal', data: chart.consumoValores }]}
                            />
                        ) : <p className="mt-8 text-center text-muted-foreground">Sem dados suficientes</p>}
                    </BaseCard>
                </Grade>

                <Grade item xs={12} md={6}>
                    <BaseCard title="Risco de Falta (menos de 15 dias de estoque)">
                        <p className="mb-2 text-xs text-muted-foreground">
                            Consumo estimado a partir do status diário de disponibilidade — depende de lançamento consistente.
                        </p>
                        {(dados.risco_falta || []).length > 0 ? (
                            <DataTable
                                rotulo="risco de falta"
                                colunas={COLUNAS_RISCO}
                                linhas={dados.risco_falta || []}
                                chaveDaLinha={(item) => item.medicine_item_id}
                            />
                        ) : <p className="mt-8 text-center text-muted-foreground">Nenhum medicamento em risco de falta no momento</p>}
                    </BaseCard>
                </Grade>
            </Grade>
        </div>
    );
}
