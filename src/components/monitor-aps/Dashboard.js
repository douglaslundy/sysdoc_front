import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertCircle, AlertTriangle, DollarSign, Users } from 'lucide-react';
import BaseCard from '../baseCard/BaseCard';
import Chart from '../charts/ApexChartSafe';
import { monitorApsApi, isMonitorApsCanceled } from '../../services/monitorApsApi';
import { useMonitorApsAudit } from '../../services/monitorApsAudit';
import { Banner } from '../ui/banner';
import { CabecalhoDePagina } from '../ui/cabecalho-de-pagina';
import { Carregando } from '../ui/carregando';
import { SelectNativo } from '../ui/campos';
import { Grade } from '../ui/grade';
import { DataTable } from '../ui/data-table';
import { MetricaAps, SeloAps } from './pecas';

const COR = { otimo: '#168821', bom: '#1351B4', suficiente: '#FF8C00', regular: '#E52207' };
const LABEL = { otimo: 'Ótimo', bom: 'Bom', suficiente: 'Suficiente', regular: 'Regular' };
const FONT = { fontFamily: "'DM Sans', sans-serif" };
export default function MonitorApsDashboard() {
    const anoAtual  = new Date().getFullYear();
    const quadAtual = Math.ceil((new Date().getMonth() + 1) / 4);
    const [ano, setAno]     = useState(anoAtual);
    const [quad, setQuad]   = useState(quadAtual);
    const [data, setData]   = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro]   = useState(null);
    const requestRef = useRef(0);

    useMonitorApsAudit('/monitor-aps', 'Monitor APS - Resumo', { ano, quadrimestre: quad });

    useEffect(() => {
        const ctrl = new AbortController();
        const requestId = requestRef.current + 1;
        requestRef.current = requestId;

        setLoading(true);
        setErro(null);
        setData(null);
        monitorApsApi.get(`/indicadores/resumo?ano=${ano}&quadrimestre=${quad}`, { signal: ctrl.signal })
            .then(d => {
                if (requestId !== requestRef.current) return;
                setData(d);
            })
            .catch(e => {
                if (requestId !== requestRef.current || isMonitorApsCanceled(e)) return;
                setErro(e.message || 'Erro no servidor ao consultar o resumo do Monitor APS.');
            })
            .finally(() => {
                if (requestId === requestRef.current) setLoading(false);
            });

        return () => ctrl.abort();
    }, [ano, quad]);

    const chart = useMemo(() => {
        if (!data) return null;
        const todos = [...(data.qualidade?.esf ?? []), ...(data.qualidade?.esb ?? [])];
        const cont = { otimo: 0, bom: 0, suficiente: 0, regular: 0 };
        // indicadores complementares (ind7-ind10) não entram na contagem do score oficial
        todos.forEach(i => { if (i.indicador?.complementar) return; const c = i.indicador?.resultado?.classificacao; if (c) cont[c]++; });
        return { cont, todos };
    }, [data]);

    const totalRepasse = data?.repasse?.reduce((s, e) => s + (e.total_estimado ?? 0), 0) ?? 0;
    const alertas = data?.vinculos?.filter(v => v.classificacao === 'regular') ?? [];

    if (loading) return <Carregando className="min-h-[300px] justify-center">Carregando resumo...</Carregando>;
    if (erro) return <div className="p-6"><Banner tom="perigo">Erro: {erro}</Banner></div>;

    const indicadores = chart?.todos ?? [];
    const equipes = data?.vinculos ?? [];
    const indIds = [...new Set(indicadores.map(i => i.indicador?.id))].sort((a, b) => a - b);

    const indPorId = {};
    indicadores.forEach(i => {
        const id = i.indicador?.id;
        const ine = i.indicador?.equipe?.ine;
        if (!indPorId[id]) indPorId[id] = {};
        indPorId[id][ine] = i.indicador?.resultado;
    });

    const colunasHeatmap = [
        { chave: 'ind', titulo: 'IND', render: (id) => <span className="text-xs font-bold">{id}</span> },
        ...equipes.map(v => ({
            chave: String(v.ine),
            titulo: v.nome?.split(' ').slice(-1)[0] ?? '',
            render: (id) => {
                const r = indPorId[id]?.[v.ine];
                const cor = COR[r?.classificacao] ?? '#ccc';
                return r ? <SeloAps cor={cor}>{`${r.percentual}%`}</SeloAps> : <span className="text-xs text-muted-foreground">—</span>;
            },
        })),
    ];

    return (
        <div className="ui-reset monitor-aps-page">
            <CabecalhoDePagina
                titulo="Monitor APS — Cofinanciamento Federal"
                acoes={(
                    <>
                        <div className="w-24">
                            <SelectNativo aria-label="Ano" value={ano} onChange={e => setAno(Number(e.target.value))}>
                                {Array.from({ length: anoAtual - 2020 }, (_, i) => 2021 + i).map(a => <option key={a}>{a}</option>)}
                            </SelectNativo>
                        </div>
                        <div className="w-44">
                            <SelectNativo aria-label="Quadrimestre" value={quad} onChange={e => setQuad(Number(e.target.value))}>
                                {[1, 2, 3].map(q => <option key={q} value={q}>{q}° Quadrimestre</option>)}
                            </SelectNativo>
                        </div>
                    </>
                )}
            />

            {/* Métricas */}
            <Grade container spacing={2} mb={3}>
                <Grade item xs={12} sm={6} md={3}>
                    <MetricaAps Icone={DollarSign} titulo="Repasse Estimado" valor={`R$ ${totalRepasse.toLocaleString('pt-BR')}`} sub="/mês estimado" cor="#168821" />
                </Grade>
                <Grade item xs={12} sm={6} md={3}>
                    <MetricaAps Icone={Users} titulo="Equipes Monitoradas" valor={data?.total_equipes ?? 0} sub="eSF/eAP ativas" cor="#1351B4" />
                </Grade>
                <Grade item xs={12} sm={6} md={3}>
                    <MetricaAps Icone={AlertTriangle} titulo="Alertas de Risco" valor={alertas.length} sub="equipes em regular" cor={alertas.length > 0 ? '#E52207' : '#168821'} />
                </Grade>
                <Grade item xs={12} sm={6} md={3}>
                    <MetricaAps Icone={Activity} titulo="Indicadores Avaliados" valor={indIds.length} sub="no quadrimestre" cor="#FF8C00" />
                </Grade>
            </Grade>

            <Grade container spacing={3}>
                {/* Heatmap de indicadores */}
                <Grade item xs={12} md={8}>
                    <BaseCard title="Indicadores por Equipe">
                        <DataTable rotulo="indicadores por equipe" colunas={colunasHeatmap} linhas={indIds} chaveDaLinha={(id) => id} vazio="Sem indicadores." />
                    </BaseCard>
                </Grade>

                {/* Donut + Repasse */}
                <Grade item xs={12} md={4}>
                    <div className="grid gap-4">
                        <BaseCard title="Distribuição de Classificações">
                            {chart && Object.values(chart.cont).some(v => v > 0) ? (
                                <Chart type="donut" height={220}
                                    options={{
                                        chart: { ...FONT },
                                        labels: ['Ótimo', 'Bom', 'Suficiente', 'Regular'],
                                        colors: [COR.otimo, COR.bom, COR.suficiente, COR.regular],
                                        legend: { position: 'bottom', fontSize: '12px', labels: { colors: 'var(--lg-text-secondary)' } },
                                        dataLabels: { enabled: false },
                                        tooltip: { theme: 'dark' },
                                        plotOptions: { pie: { donut: { size: '60%' } } },
                                    }}
                                    series={[chart.cont.otimo, chart.cont.bom, chart.cont.suficiente, chart.cont.regular]}
                                />
                            ) : <p className="py-8 text-center text-muted-foreground">Sem dados</p>}
                        </BaseCard>

                        <BaseCard title="Repasse por Equipe">
                            <ul className="divide-y divide-border">
                                {(data?.repasse ?? []).map(r => (
                                    <li key={r.ine} className="flex items-center justify-between gap-2 py-2">
                                        <span className="max-w-[140px] truncate text-sm">{r.nome}</span>
                                        <span className="text-sm font-bold text-success">R$ {(r.total_estimado ?? 0).toLocaleString('pt-BR')}</span>
                                    </li>
                                ))}
                            </ul>
                        </BaseCard>

                        {alertas.length > 0 && (
                            <BaseCard title="Alertas">
                                <ul className="divide-y divide-border">
                                    {alertas.map((a, i) => (
                                        <li key={i} className="flex items-center gap-2 py-2">
                                            <AlertCircle className="size-4 shrink-0 text-danger" aria-hidden />
                                            <div>
                                                <p className="text-sm font-semibold">{a.nome}</p>
                                                <p className="text-xs text-danger">Vínculo territorial em Regular</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </BaseCard>
                        )}
                    </div>
                </Grade>
            </Grade>
        </div>
    );
}
