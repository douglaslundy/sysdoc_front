import { useEffect, useMemo, useRef, useState } from 'react';
import { equipeLabel } from '../../utils/equipeLabel';
import BaseCard from '../baseCard/BaseCard';
import Chart from '../charts/ApexChartSafe';
import { monitorApsApi, isMonitorApsCanceled } from '../../services/monitorApsApi';
import { useMonitorApsAudit } from '../../services/monitorApsAudit';
import { useEquipesPermitidas } from '../../hooks/useEquipesPermitidas';
import { Banner } from '../ui/banner';
import { CabecalhoDePagina } from '../ui/cabecalho-de-pagina';
import { CampoSelecao } from '../ui/campos';
import { Card, CardContent } from '../ui/card';
import { Carregando } from '../ui/carregando';
import { DataTable } from '../ui/data-table';
import { Grade } from '../ui/grade';
import { SeloAps } from './pecas';

const COR = { otimo: '#168821', bom: '#1351B4', suficiente: '#FF8C00', regular: '#E52207' };
const LABEL = { otimo: 'Ótimo', bom: 'Bom', suficiente: 'Suficiente', regular: 'Regular' };
const FONT = { fontFamily: "'DM Sans', sans-serif", toolbar: { show: false } };

function ClassCard({ titulo, classificacao, repasse }) {
    const cor = COR[classificacao] ?? '#888';
    return (
        <Card size="sm" className="h-full">
            <CardContent>
                <p className="mb-2 text-sm font-semibold text-muted-foreground">{titulo}</p>
                <SeloAps cor={cor}>{LABEL[classificacao] ?? '—'}</SeloAps>
                {repasse !== undefined && (
                    <p className="mt-2 text-xs text-muted-foreground">+ R$ {(repasse ?? 0).toLocaleString('pt-BR')}/mês</p>
                )}
            </CardContent>
        </Card>
    );
}
export default function PorEquipe() {
    const anoAtual  = new Date().getFullYear();
    const quadAtual = Math.ceil((new Date().getMonth() + 1) / 4);
    const [ano, setAno]       = useState(anoAtual);
    const [quad, setQuad]     = useState(quadAtual);
    const [equipes, setEquipes] = useState([]);
    const [ine, setIne]       = useState('');
    const [vinculo, setVinculo]   = useState(null);
    const [indicadores, setIndicadores] = useState([]);
    const [repasse, setRepasse]   = useState(null);
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState(null);
    const requestRef = useRef(0);

    const { isRestrito, equipes: minhasEquipes, loading: loadingPerms } = useEquipesPermitidas();

    useMonitorApsAudit('/monitor-aps/equipe', 'Monitor APS - Por Equipe', { ano, quadrimestre: quad, equipe: ine });

    useEffect(() => {
        if (loadingPerms) return;
        if (isRestrito) {
            setEquipes(minhasEquipes);
            if (minhasEquipes.length === 1) setIne(minhasEquipes[0].nu_ine);
            return;
        }
        monitorApsApi.get('/config/equipes').then(d => {
            const eq = d.equipes ?? [];
            setEquipes(eq);
            if (eq.length === 1) setIne(eq[0].nu_ine);
        }).catch(e => { if (!isMonitorApsCanceled(e)) setErro(e.message || 'Erro no servidor ao carregar a lista de equipes.'); });
    }, [isRestrito, minhasEquipes, loadingPerms]);

    useEffect(() => {
        if (!ine) return;
        const ctrl = new AbortController();
        const requestId = requestRef.current + 1;
        requestRef.current = requestId;

        setLoading(true);
        setErro(null);
        setVinculo(null);
        setIndicadores([]);
        setRepasse(null);
        setHistorico([]);

        Promise.all([
            monitorApsApi.get(`/indicadores/vinculo?ano=${ano}&quadrimestre=${quad}&ine=${ine}`, { signal: ctrl.signal }),
            monitorApsApi.get(`/indicadores/qualidade?ano=${ano}&quadrimestre=${quad}&ine=${ine}`, { signal: ctrl.signal }),
            monitorApsApi.get(`/indicadores/repasse?ano=${ano}&quadrimestre=${quad}`, { signal: ctrl.signal }),
            monitorApsApi.get(`/indicadores/historico?ine=${ine}&indicador_id=8&anos=${ano}`, { signal: ctrl.signal }),
        ]).then(([v, q, r, h]) => {
            if (requestId !== requestRef.current || ctrl.signal.aborted) return;
            setVinculo(v.equipes?.[0] ?? null);
            setIndicadores(q.indicadores ?? []);
            setRepasse(r.repasse?.find(x => x.ine === ine) ?? null);
            setHistorico(h.historico ?? []);
        }).catch(e => {
            if (requestId !== requestRef.current || isMonitorApsCanceled(e)) return;
            setErro(e.message || 'Erro no servidor ao consultar dados da equipe.');
        }).finally(() => {
            if (requestId === requestRef.current && !ctrl.signal.aborted) setLoading(false);
        });

        return () => ctrl.abort();
    }, [ine, ano, quad]);

    const radar = useMemo(() => {
        if (!indicadores.length) return null;
        return {
            categories: indicadores.map(i => `IND ${i.indicador?.id}`),
            resultados: indicadores.map(i => i.indicador?.resultado?.percentual ?? 0),
            metas:      indicadores.map(i => i.indicador?.resultado?.meta_bom ?? 60),
        };
    }, [indicadores]);

    const linha = useMemo(() => ({
        labels: historico.map(h => `${h.quadrimestre}°Q`),
        valores: historico.map(h => h.percentual ?? 0),
    }), [historico]);

    const classQ = useMemo(() => {
        if (!indicadores.length) return 'regular';
        const ordem = ['regular', 'suficiente', 'bom', 'otimo'];
        const media = Math.round(indicadores.reduce((s, i) => s + ordem.indexOf(i.indicador?.resultado?.classificacao ?? 'regular'), 0) / indicadores.length);
        return ordem[media] ?? 'regular';
    }, [indicadores]);

    const colunasInd = [
        { chave: 'ind', titulo: 'IND', render: (i) => <span className="font-bold">{i.indicador?.id}</span> },
        { chave: 'nome', titulo: 'Nome', render: (i) => i.indicador?.nome },
        { chave: 'num', titulo: 'Num.', numerica: true, render: (i) => i.indicador?.resultado?.numerador },
        { chave: 'den', titulo: 'Den.', numerica: true, render: (i) => i.indicador?.resultado?.denominador },
        {
            chave: 'pct',
            titulo: '%',
            numerica: true,
            render: (i) => {
                const r = i.indicador?.resultado ?? {};
                return <span className="font-bold" style={{ color: COR[r.classificacao] ?? '#888' }}>{r.percentual}%</span>;
            },
        },
        {
            chave: 'classificacao',
            titulo: 'Classificação',
            render: (i) => {
                const r = i.indicador?.resultado ?? {};
                return <SeloAps cor={COR[r.classificacao] ?? '#888'}>{LABEL[r.classificacao] ?? '—'}</SeloAps>;
            },
        },
    ];

    const filtros = (
        <>
            <CampoSelecao id="eq-equipe" label="Equipe" value={ine} onChange={e => setIne(e.target.value)} disabled={isRestrito && equipes.length === 1} className="min-w-[200px]">
                <option value="">{isRestrito && equipes.length > 1 ? 'Todas as minhas equipes' : 'Todas as equipes'}</option>
                {equipes.map(eq => <option key={eq.nu_ine} value={eq.nu_ine}>{equipeLabel(eq.no_equipe)}</option>)}
            </CampoSelecao>
            <CampoSelecao id="eq-ano" label="Ano" value={ano} onChange={e => setAno(Number(e.target.value))} className="min-w-[100px]">
                {Array.from({ length: anoAtual - 2020 }, (_, i) => 2021 + i).map(a => <option key={a} value={a}>{a}</option>)}
            </CampoSelecao>
            <CampoSelecao id="eq-quad" label="Quadrimestre" value={quad} onChange={e => setQuad(Number(e.target.value))} className="min-w-[130px]">
                {[1, 2, 3].map(q => <option key={q} value={q}>{q}° Quad.</option>)}
            </CampoSelecao>
        </>
    );

    return (
        <div className="ui-reset monitor-aps-page">
            <CabecalhoDePagina titulo="Desempenho por Equipe" acoes={filtros} />
            {isRestrito && !loadingPerms && equipes.length === 0 && (
                <div className="mb-4">
                    <Banner tom="alerta">Nenhuma equipe autorizada para o seu usuário. Entre em contato com o administrador.</Banner>
                </div>
            )}

            {erro && <div className="mb-4"><Banner tom="perigo">{erro}</Banner></div>}
            {loading ? (
                <Carregando className="min-h-[300px] justify-center">Carregando dados da equipe...</Carregando>
            ) : (
                <>
                    {/* Cards de classificação */}
                    <Grade container spacing={2} mb={3}>
                        <Grade item xs={12} sm={4}>
                            <ClassCard titulo="Vínculo Territorial" classificacao={vinculo?.classificacao} repasse={repasse?.componente_vinculo} />
                        </Grade>
                        <Grade item xs={12} sm={4}>
                            <ClassCard titulo="Qualidade dos Indicadores" classificacao={classQ} repasse={repasse?.componente_qualidade} />
                        </Grade>
                        <Grade item xs={12} sm={4}>
                            <Card size="sm" className="h-full">
                                <CardContent>
                                    <p className="mb-2 text-sm font-semibold text-muted-foreground">Repasse Estimado</p>
                                    <p className="font-mono text-3xl font-bold text-success">R$ {(repasse?.total_estimado ?? 0).toLocaleString('pt-BR')}</p>
                                    <p className="text-xs text-muted-foreground">/mês</p>
                                </CardContent>
                            </Card>
                        </Grade>
                    </Grade>

                    <Grade container spacing={3}>
                        {/* Radar */}
                        <Grade item xs={12} md={6}>
                            <BaseCard title="Radar dos Indicadores">
                                {radar ? (
                                    <Chart type="radar" height={300}
                                        options={{
                                            chart: { ...FONT },
                                            xaxis: { categories: radar.categories },
                                            yaxis: { show: false, min: 0, max: 100 },
                                            plotOptions: { radar: { size: 120, polygons: { strokeColors: 'var(--lg-border)', fill: { colors: ['transparent'] } } } },
                                            stroke: { width: 2 },
                                            fill: { opacity: 0.15 },
                                            markers: { size: 3 },
                                            legend: { position: 'bottom', labels: { colors: 'var(--lg-text-secondary)' } },
                                            colors: ['#1351B4', '#168821'],
                                            tooltip: { theme: 'dark' },
                                        }}
                                        series={[
                                            { name: 'Resultado', data: radar.resultados },
                                            { name: 'Meta Bom', data: radar.metas },
                                        ]}
                                    />
                                ) : <p className="py-8 text-center text-muted-foreground">Sem dados</p>}
                            </BaseCard>
                        </Grade>

                        {/* Histórico */}
                        <Grade item xs={12} md={6}>
                            <BaseCard title="Histórico — IND 8 (Visita ACS)">
                                {linha.valores.length > 0 ? (
                                    <Chart type="line" height={300}
                                        options={{
                                            chart: { ...FONT },
                                            stroke: { curve: 'smooth', width: 2 },
                                            xaxis: { categories: linha.labels, labels: { style: { colors: 'var(--lg-text-muted)' } } },
                                            yaxis: { min: 0, max: 100, labels: { formatter: v => `${v}%`, style: { colors: 'var(--lg-text-muted)' } } },
                                            markers: { size: 4 },
                                            colors: ['#1351B4'],
                                            tooltip: { theme: 'dark', y: { formatter: v => `${v}%` } },
                                            grid: { borderColor: 'var(--lg-border)' },
                                        }}
                                        series={[{ name: 'IND 8', data: linha.valores }]}
                                    />
                                ) : <p className="py-8 text-center text-muted-foreground">Histórico sem dados disponíveis</p>}
                            </BaseCard>
                        </Grade>

                        {/* Tabela de todos os indicadores */}
                        <Grade item xs={12}>
                            <BaseCard title="Todos os Indicadores">
                                <DataTable rotulo="todos os indicadores" colunas={colunasInd} linhas={indicadores} chaveDaLinha={(i) => i.indicador?.id} vazio="Selecione uma equipe." />
                            </BaseCard>
                        </Grade>
                    </Grade>
                </>
            )}
        </div>
    );
}