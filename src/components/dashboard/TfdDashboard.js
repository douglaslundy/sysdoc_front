import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, MapPin, Truck, Users } from 'lucide-react';
import { Abas } from '../ui/abas';
import { Grade } from '../ui/grade';
import { StatCard } from '../ui/stat-card';
import { api } from '../../services/api';
import BaseCard from '../baseCard/BaseCard';
import { DashboardLoading, DashboardErro, getDashboardErrorMessage } from './DashboardStatus';
import Chart from '../charts/ApexChartSafe';

const ICONES = { 'calendar': Calendar, 'map-pin': MapPin, 'truck': Truck, 'users': Users };

const TOMS = { '#2196f3': 'info', '#4caf50': 'sucesso', '#ff9800': 'primario' };

function CardTotal({ icon, titulo, valor, cor }) {
    return <StatCard Icone={ICONES[icon]} tom={TOMS[cor] || 'primario'} titulo={titulo} valor={valor ?? '—'} />;
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
        <div className="ui-reset">
            {/* Totalizadores */}
            <Grade container spacing={3} mb={3}>
                <Grade item xs={12} sm={4}>
                    <CardTotal
                        icon="truck"
                        titulo="Total de Viagens (mês)"
                        valor={totais?.total_viagens}
                        cor="#4caf50"
                    />
                </Grade>
                <Grade item xs={12} sm={4}>
                    <CardTotal
                        icon="users"
                        titulo="Pessoas Transportadas (mês)"
                        valor={totais?.pessoas_transportadas_mes}
                        cor="#2196f3"
                    />
                </Grade>
                <Grade item xs={12} sm={4}>
                    <CardTotal
                        icon="map-pin"
                        titulo="KM Rodados (mês)"
                        valor={totais?.km_rodados}
                        cor="#ff9800"
                    />
                </Grade>
            </Grade>

            <p className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="size-4 opacity-60" aria-hidden />
                Referência: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>

            <Grade container spacing={3}>
                {/* Viagens realizadas por dia do mês — linha */}
                <Grade item xs={12} md={6}>
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
                            <p className="mt-8 text-center text-muted-foreground">Sem dados</p>
                        )}
                    </BaseCard>
                </Grade>

                {/* Viagens agendadas por dia do mês — linha */}
                <Grade item xs={12} md={6}>
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
                            <p className="mt-8 text-center text-muted-foreground">Sem viagens agendadas</p>
                        )}
                    </BaseCard>
                </Grade>

                {/* Seletor de período para motoristas e rotas */}
                <Grade item xs={12}>
                    <div className="flex flex-wrap items-center gap-4">
                        <p className="text-sm text-muted-foreground">Período (motoristas e rotas):</p>
                        <Abas
                            rotulo="Período"
                            valor={periodo}
                            aoMudar={setPeriodo}
                            itens={[
                                { chave: 'mes', rotulo: 'Mês atual' },
                                { chave: '12meses', rotulo: 'Últimos 12 meses' },
                                { chave: 'ano', rotulo: 'Este ano' },
                            ]}
                        />
                    </div>
                </Grade>

                {/* Viagens por Motorista — barras horizontal */}
                <Grade item xs={12} md={6}>
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
                            <p className="mt-8 text-center text-muted-foreground">Sem dados</p>
                        )}
                    </BaseCard>
                </Grade>

                {/* Rotas mais utilizadas — barras horizontal */}
                <Grade item xs={12} md={6}>
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
                            <p className="mt-8 text-center text-muted-foreground">Sem dados</p>
                        )}
                    </BaseCard>
                </Grade>

                {/* Viagens por Mês */}
                <Grade item xs={12} md={4}>
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
                </Grade>

                {/* Pessoas por Mês */}
                <Grade item xs={12} md={4}>
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
                </Grade>

                {/* KM Rodados por Mês */}
                <Grade item xs={12} md={4}>
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
                </Grade>

                {/* Viagens por Ano */}
                <Grade item xs={12} md={4}>
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
                </Grade>

                {/* Pessoas por Ano */}
                <Grade item xs={12} md={4}>
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
                </Grade>

                {/* KM Rodados por Ano */}
                <Grade item xs={12} md={4}>
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
                </Grade>
            </Grade>
        </div>
    );
}
