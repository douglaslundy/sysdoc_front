import { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart2, GitCompare, Loader2, Printer } from 'lucide-react';
import { equipeLabel } from '../../utils/equipeLabel';
import VetorPanel from './VetorPanel';
import Chart from '../charts/ApexChartSafe';
import { isMonitorApsCanceled, monitorApsApi } from '../../services/monitorApsApi';
import { useMonitorApsAudit } from '../../services/monitorApsAudit';
import generateVisitasEvolucaoPDF from '../../reports/visitasEvolucao';
import { useEquipesPermitidas } from '../../hooks/useEquipesPermitidas';
import { Banner } from '../ui/banner';
import { Button } from '../ui/button';
import { CabecalhoDePagina } from '../ui/cabecalho-de-pagina';
import { CampoSelecao } from '../ui/campos';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Carregando } from '../ui/carregando';

const MESES  = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const CORES  = ['#1351B4', '#168821', '#FF8C00'];
const FONT   = { fontFamily: "'DM Sans', sans-serif" };

const DESFECHO_LABELS = { '1': 'Realizada', '2': 'Recusada', '3': 'Ausente' };
const GEO_LABELS      = { 'sim': 'Com geo', 'nao': 'Sem geo' };
const VETOR_VAZIO     = { ine: '', agente_cns: '', agente_nome: '', desfecho: '', geo: '' };

function labelVetor(vetor, nomeEquipe, fallback) {
    const partes = [];
    if (vetor.ine)      partes.push(nomeEquipe || 'Equipe');
    if (vetor.agente_nome) partes.push(vetor.agente_nome);
    if (vetor.desfecho) partes.push(DESFECHO_LABELS[vetor.desfecho]);
    if (vetor.geo)      partes.push(GEO_LABELS[vetor.geo]);
    return partes.length ? partes.join(' · ') : fallback;
}

function vetorConfigurado(v) {
    return !!(v.ine || v.agente_cns || v.desfecho || v.geo);
}

export function buildChartSeries(series, cores) {
    return series.map((s, i) => ({
        name:  String(s.ano),
        data:  s.meses,
        color: cores[i] ?? '#888',
    }));
}

export default function VisitasEvolucao() {
    const anoAtual = new Date().getFullYear();
    const mesAtual = new Date().getMonth() + 1;

    const [equipes,      setEquipes]      = useState([]);
    const [agenteOpcoes, setAgenteOpcoes] = useState([]);
    const [ine,          setIne]          = useState('');
    const [agenteCns,    setAgenteCns]    = useState('');
    const [desfecho,     setDesfecho]     = useState('');
    const [geo,          setGeo]          = useState('');
    const [series,       setSeries]       = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [erro,         setErro]         = useState(null);
    const ctrlRef = useRef(null);
    const requestRef = useRef(0);

    // ── modo comparação ──────────────────────────────────────────────
    const [modoComparacao,  setModoComparacao]  = useState(false);
    const [anosDisponiveis, setAnosDisponiveis] = useState([]);
    const [anoComparacao,   setAnoComparacao]   = useState('');
    const [vetor1,          setVetor1]          = useState(VETOR_VAZIO);
    const [nomeEquipe1,     setNomeEquipe1]     = useState('');
    const [vetor2,          setVetor2]          = useState(VETOR_VAZIO);
    const [nomeEquipe2,     setNomeEquipe2]     = useState('');
    const [seriesComp,      setSeriesComp]      = useState([]);
    const [loadingComp,     setLoadingComp]     = useState(false);
    const [erroComp,        setErroComp]        = useState(null);
    const [loadingAnos,     setLoadingAnos]     = useState(false);

    const { isRestrito, equipes: minhasEquipes, loading: loadingPerms } = useEquipesPermitidas();

    const agenteNomeSelecionado = useMemo(
        () => agenteOpcoes.find((item) => item.agente_cns === agenteCns)?.agente ?? '',
        [agenteOpcoes, agenteCns]
    );

    useMonitorApsAudit('/monitor-aps/visitas/evolucao', 'Monitor APS - Evolução de Visitas', {
        equipe: ine, agente: agenteNomeSelecionado, desfecho, geo,
    });

    useEffect(() => {
        if (loadingPerms) return;
        if (isRestrito) {
            setEquipes(minhasEquipes);
            if (minhasEquipes.length === 1) setIne(minhasEquipes[0].nu_ine);
            return;
        }
        monitorApsApi.get('/config/equipes')
            .then(d => setEquipes(d.equipes ?? []))
            .catch(e => { if (!isMonitorApsCanceled(e)) setErro(e.message || 'Erro no servidor ao carregar a lista de equipes.'); });
    }, [isRestrito, minhasEquipes, loadingPerms]);

    useEffect(() => {
        if (!ine) { setAgenteOpcoes([]); return; }
        const params = new URLSearchParams({ ano: anoAtual, mes: mesAtual, ine });
        monitorApsApi.get(`/visitas/agentes?${params}`)
            .then(d => setAgenteOpcoes(d.agentes ?? []))
            .catch(() => setAgenteOpcoes([]));
    }, [ine, anoAtual, mesAtual]);

    useEffect(() => { setAgenteCns(''); }, [ine]);

    useEffect(() => {
        const params = new URLSearchParams();
        if (ine)      params.set('ine',      ine);
        if (agenteCns) params.set('agente_cns', agenteCns);
        if (desfecho) params.set('desfecho', desfecho);
        if (geo)      params.set('has_geo',  geo);

        if (ctrlRef.current) ctrlRef.current.abort();
        ctrlRef.current = new AbortController();
        const requestId = requestRef.current + 1;
        requestRef.current = requestId;

        setLoading(true);
        setErro(null);
        setSeries([]);
        monitorApsApi.get(`/visitas/evolucao?${params}`, { signal: ctrlRef.current.signal })
            .then(d => {
                if (requestId !== requestRef.current || ctrlRef.current.signal.aborted) return;
                setSeries(d.series ?? []);
            })
            .catch(e => {
                if (requestId !== requestRef.current || isMonitorApsCanceled(e)) return;
                setErro(e.message || 'Erro no servidor ao consultar evolução de visitas.');
            })
            .finally(() => {
                if (requestId === requestRef.current && !ctrlRef.current.signal.aborted) setLoading(false);
            });
    }, [ine, agenteCns, desfecho, geo]);

    function ativarComparacao() {
        setModoComparacao(true);
        setAnoComparacao('');
        setVetor1(VETOR_VAZIO); setNomeEquipe1('');
        setVetor2(VETOR_VAZIO); setNomeEquipe2('');
        setSeriesComp([]); setErroComp(null);

        setLoadingAnos(true);

        monitorApsApi.get('/visitas/evolucao/anos')
            .then(d => setAnosDisponiveis(d.anos ?? []))
            .catch(() => setAnosDisponiveis([]))
            .finally(() => setLoadingAnos(false));
    }

    function desativarComparacao() {
        setModoComparacao(false);
        setSeriesComp([]);
        setErroComp(null);
    }

    async function handleComparar() {
        setLoadingComp(true);
        setErroComp(null);
        setSeriesComp([]);

        const buildParams = (v) => {
            const p = new URLSearchParams({ ano: anoComparacao });
            if (v.ine)      p.set('ine',      v.ine);
            if (v.agente_cns) p.set('agente_cns', v.agente_cns);
            if (v.desfecho) p.set('desfecho', v.desfecho);
            if (v.geo)      p.set('has_geo',  v.geo);
            return p.toString();
        };

        const fetchVetor = async (v) => (
            monitorApsApi.get(`/visitas/evolucao?${buildParams(v)}`)
        );

        try {
            const [res1, res2] = await Promise.all([
                fetchVetor(vetor1),
                fetchVetor(vetor2),
            ]);

            setSeriesComp([
                {
                    name:  labelVetor(vetor1, nomeEquipe1, 'Vetor 1'),
                    data:  res1.series?.[0]?.meses ?? Array(12).fill(0),
                    color: CORES[0],
                },
                {
                    name:  labelVetor(vetor2, nomeEquipe2, 'Vetor 2'),
                    data:  res2.series?.[0]?.meses ?? Array(12).fill(0),
                    color: CORES[1],
                },
            ]);
        } catch (e) {
            setErroComp(e.message ?? 'Erro no servidor ao comparar vetores.');
        } finally {
            setLoadingComp(false);
        }
    }

    const chartSeries = useMemo(() => buildChartSeries(series, CORES), [series]);

    // cor neutra que lê bem nos dois temas (opções do Apex não aceitam token CSS)
    const labelColor = '#8a94a6';
    const legendColor = '#8a94a6';

    const chartOptions = useMemo(() => ({
        chart:       { ...FONT, id: 'visitas-evolucao-chart', toolbar: { show: false }, zoom: { enabled: false } },
        xaxis:       { categories: MESES, labels: { style: { fontFamily: FONT.fontFamily, colors: labelColor } } },
        yaxis:       { labels: { formatter: v => v.toLocaleString('pt-BR'), style: { fontFamily: FONT.fontFamily, colors: labelColor } } },
        stroke:      { width: 2, curve: 'smooth' },
        markers:     { size: 4 },
        dataLabels:  {
            enabled:    true,
            formatter:  v => v != null ? v.toLocaleString('pt-BR') : '',
            offsetY:    -8,
            style:      { fontFamily: FONT.fontFamily, fontSize: '11px', fontWeight: '600' },
            background: { enabled: false },
        },
        legend:      { position: 'bottom', fontFamily: FONT.fontFamily, labels: { colors: legendColor } },
        tooltip:     { theme: 'dark', y: { formatter: v => v.toLocaleString('pt-BR') } },
        grid:        { borderColor: '#8a94a633' },
        colors:      series.map((_, i) => CORES[i] ?? '#888'),
    }), [series, labelColor, legendColor]);

    const [printLoading, setPrintLoading] = useState(false);

    const handlePrint = async () => {
        setPrintLoading(true);
        try {
            const equipeNome = equipes.find(e => e.nu_ine === ine)?.no_equipe ?? '';
            await generateVisitasEvolucaoPDF({
                series,
                filtros: { equipeNome, agente: agenteNomeSelecionado, desfecho, geo },
                anoAtual,
            });
        } finally {
            setPrintLoading(false);
        }
    };

    return (
        <div className="ui-reset monitor-aps-page monitor-aps-evolucao-page">
            <CabecalhoDePagina
                titulo="Evolução de Visitas ACS/TACS"
                acoes={(
                    <>
                        <Button variant="outline" size="sm" disabled={printLoading || loading || !series.length} onClick={handlePrint}>
                            {printLoading ? <Loader2 className="animate-spin" /> : <Printer />}
                            {printLoading ? 'Gerando...' : 'Imprimir PDF'}
                        </Button>
                        <Button
                            variant={modoComparacao ? 'default' : 'outline'}
                            size="sm"
                            aria-pressed={modoComparacao}
                            onClick={modoComparacao ? desativarComparacao : ativarComparacao}
                        >
                            <GitCompare /> {modoComparacao ? 'Sair da comparação' : 'Comparar'}
                        </Button>
                    </>
                )}
            />

            {!modoComparacao && (
                <div className="mb-4 flex flex-wrap items-end gap-3">
                    <CampoSelecao id="ev-equipe" label="Equipe" value={ine}
                        onChange={e => setIne(e.target.value)}
                        disabled={isRestrito && equipes.length === 1}
                        className="min-w-[200px]">
                        <option value="">{isRestrito && equipes.length > 1 ? 'Todas as minhas equipes' : 'Todas as equipes'}</option>
                        {equipes.map(eq => (
                            <option key={eq.nu_ine} value={eq.nu_ine}>{equipeLabel(eq.no_equipe)}</option>
                        ))}
                    </CampoSelecao>
                    {isRestrito && !loadingPerms && equipes.length === 0 && (
                        <Banner tom="alerta">Nenhuma equipe autorizada para o seu usuário. Entre em contato com o administrador.</Banner>
                    )}

                    {ine && (
                        <CampoSelecao id="ev-agente" label="Agente" value={agenteCns}
                            onChange={e => setAgenteCns(e.target.value)}
                            className="min-w-[200px]">
                            <option value="">Todos os agentes</option>
                            {agenteOpcoes.map((a, i) => (
                                <option key={a.agente_cns ?? i} value={a.agente_cns ?? ''}>{a.agente}</option>
                            ))}
                        </CampoSelecao>
                    )}

                    <CampoSelecao id="ev-desfecho" label="Desfecho" value={desfecho}
                        onChange={e => setDesfecho(e.target.value)}
                        className="min-w-[140px]">
                        <option value="">Todos</option>
                        <option value="1">Realizada</option>
                        <option value="2">Recusada</option>
                        <option value="3">Ausente</option>
                    </CampoSelecao>

                    <CampoSelecao id="ev-geo" label="Geolocalização" value={geo}
                        onChange={e => setGeo(e.target.value)}
                        className="min-w-[170px]">
                        <option value="">Todas</option>
                        <option value="sim">Com geolocalização</option>
                        <option value="nao">Sem geolocalização</option>
                    </CampoSelecao>
                </div>
            )}

            {modoComparacao && (
                <div className="mb-4">
                    {/* Seletor de Ano */}
                    <div className="mb-4 flex flex-wrap items-end gap-4">
                        <CampoSelecao id="ev-ano" label="Ano" value={anoComparacao}
                            onChange={e => setAnoComparacao(e.target.value)}
                            className="min-w-[140px]">
                            <option value="">Selecione o ano</option>
                            {anosDisponiveis.map(a => (
                                <option key={a} value={String(a)}>{a}</option>
                            ))}
                        </CampoSelecao>
                        {loadingAnos && (
                            <span className="pb-2 text-xs text-muted-foreground">Carregando anos disponíveis...</span>
                        )}
                        {!loadingAnos && anosDisponiveis.length === 0 && (
                            <span className="pb-2 text-xs text-danger-text">Nenhum ano com dados encontrado.</span>
                        )}
                    </div>

                    {/* Dois vetores lado a lado */}
                    <div className="mb-4 flex flex-wrap gap-4">
                        <VetorPanel
                            label="Vetor 1"
                            equipes={equipes}
                            vetor={vetor1}
                            onChange={(v, ne) => { setVetor1(v); setNomeEquipe1(ne); }}
                        />
                        <VetorPanel
                            label="Vetor 2"
                            equipes={equipes}
                            vetor={vetor2}
                            onChange={(v, ne) => { setVetor2(v); setNomeEquipe2(ne); }}
                        />
                    </div>

                    {/* Botão Comparar */}
                    {vetorConfigurado(vetor1) && vetorConfigurado(vetor2) && JSON.stringify(vetor1) === JSON.stringify(vetor2) && (
                        <p className="mb-2 text-center text-xs text-warning">
                            Os dois vetores estão com os mesmos filtros — configure filtros diferentes para comparar.
                        </p>
                    )}
                    <div className="flex justify-center">
                        <Button
                            disabled={
                                !anoComparacao ||
                                !vetorConfigurado(vetor1) ||
                                !vetorConfigurado(vetor2) ||
                                loadingComp ||
                                (vetorConfigurado(vetor1) && JSON.stringify(vetor1) === JSON.stringify(vetor2))
                            }
                            onClick={handleComparar}
                            className="px-8"
                        >
                            {loadingComp ? <Loader2 className="animate-spin" /> : <BarChart2 />}
                            {loadingComp ? 'Comparando...' : 'Comparar'}
                        </Button>
                    </div>
                </div>
            )}

            {modoComparacao ? (
                <Card>
                    <CardHeader><CardTitle>{`Comparação de Vetores — ${anoComparacao || '...'}`}</CardTitle></CardHeader>
                    <CardContent>
                        {loadingComp ? (
                            <Carregando className="justify-center py-12" />
                        ) : erroComp ? (
                            <Banner tom="perigo">Erro: {erroComp}</Banner>
                        ) : seriesComp.length === 0 ? (
                            <p className="p-6 text-center text-sm text-muted-foreground">
                                Configure os dois vetores e clique em Comparar.
                            </p>
                        ) : (
                            <Chart type="line" height={420}
                                options={{
                                    ...chartOptions,
                                    colors: [CORES[0], CORES[1]],
                                    chart: { ...chartOptions.chart, id: 'visitas-comparacao-chart' },
                                }}
                                series={seriesComp}
                            />
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader><CardTitle>{`Visitas por Mês — ${anoAtual - 2} a ${anoAtual}`}</CardTitle></CardHeader>
                    <CardContent>
                        {loading ? (
                            <Carregando className="justify-center py-12" />
                        ) : erro ? (
                            <Banner tom="perigo">Erro: {erro}</Banner>
                        ) : chartSeries.length === 0 ? (
                            <p className="p-6 text-center text-sm text-muted-foreground">Sem dados para exibir.</p>
                        ) : (
                            <Chart type="line" height={420}
                                options={chartOptions}
                                series={chartSeries}
                            />
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
