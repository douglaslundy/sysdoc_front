import { useEffect, useMemo, useRef, useState } from 'react';
import { equipeLabel } from '../../utils/equipeLabel';
import Chart from '../charts/ApexChartSafe';
import { isMonitorApsCanceled, monitorApsApi } from '../../services/monitorApsApi';
import { useMonitorApsAudit } from '../../services/monitorApsAudit';
import { useEquipesPermitidas } from '../../hooks/useEquipesPermitidas';
import { Banner } from '../ui/banner';
import { CabecalhoDePagina } from '../ui/cabecalho-de-pagina';
import { CampoSelecao } from '../ui/campos';
import { Carregando } from '../ui/carregando';
import { DataTable } from '../ui/data-table';
import { Dialogo, DialogoTitulo } from '../ui/dialogo';
import { EstadoVazio } from '../ui/estado-vazio';
import { Grade } from '../ui/grade';
import { SeloAps } from './pecas';

const COR = { otimo: '#168821', bom: '#1351B4', suficiente: '#FF8C00', regular: '#E52207' };
const LABEL = { otimo: 'Ótimo', bom: 'Bom', suficiente: 'Suficiente', regular: 'Regular' };

function ClassChip({ c }) {
    return <SeloAps cor={COR[c] || '#888'}>{LABEL[c] ?? '—'}</SeloAps>;
}

const COLUNAS_SUB = [
    { chave: 'nome', titulo: 'Subindicador', render: (s) => s.nome },
    { chave: 'valor', titulo: 'Valor', numerica: true, render: (s) => s.valor },
    { chave: 'total', titulo: 'Total', numerica: true, render: (s) => s.total },
];

function IndicadorCard({ indicador, onDetalhes }) {
    const { id, nome, bloco, resultado } = indicador;
    const { percentual = 0, classificacao, numerador, denominador, meta_suficiente, meta_bom, meta_otimo } = resultado ?? {};
    const cor = COR[classificacao] ?? '#888';

    const gaugeOptions = useMemo(() => ({
        chart: { type: 'radialBar', sparkline: { enabled: true }, fontFamily: "'DM Sans', sans-serif" },
        plotOptions: {
            radialBar: {
                startAngle: -90, endAngle: 90,
                hollow: { size: '55%' },
                dataLabels: {
                    name: { show: false },
                    value: { fontSize: '15px', fontWeight: 700, formatter: v => `${v}%`, color: cor, offsetY: -2 },
                },
                track: { background: '#e0e0e0', strokeWidth: '100%' },
            },
        },
        colors: [cor],
        stroke: { lineCap: 'round' },
    }), [cor]);

    return (
        <button
            type="button"
            onClick={() => onDetalhes(indicador)}
            className="monitor-aps-indicador-card block h-full w-full rounded-xl border border-border bg-card p-5 text-left transition-colors hover:bg-hover focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none"
        >
            <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                    <p className="text-xs font-semibold text-muted-foreground">IND {id} · {bloco}</p>
                    <p className="mt-1 text-sm font-bold">{nome}</p>
                </div>
                <ClassChip c={classificacao} />
            </div>

            <div className="flex justify-center">
                <Chart type="radialBar" height={120} options={gaugeOptions} series={[percentual ?? 0]} />
            </div>

            <p className="mb-2 text-center text-xs text-muted-foreground">{numerador} / {denominador}</p>

            {/* Barra de progresso com marcadores */}
            <div className="relative">
                <div
                    role="progressbar"
                    aria-label={`Indicador ${id}`}
                    aria-valuenow={Math.min(percentual, 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-2 overflow-hidden rounded-full bg-border"
                >
                    <div className="h-full rounded-full" style={{ width: `${Math.min(percentual, 100)}%`, backgroundColor: cor }} />
                </div>
                {[meta_suficiente, meta_bom, meta_otimo].filter(Boolean).map((meta, i) => (
                    <span key={i} className="absolute top-0 h-2 w-0.5 bg-foreground opacity-50" style={{ left: `${meta}%` }} title={`${['Suf.', 'Bom', 'Ótimo'][i]}: ${meta}%`} />
                ))}
            </div>
            <p className="mt-1 text-right text-xs font-semibold text-info">Ver detalhes →</p>
        </button>
    );
}

export default function IndicadoresQualidade() {
    const anoAtual  = new Date().getFullYear();
    const quadAtual = Math.ceil((new Date().getMonth() + 1) / 4);
    const [ano, setAno]     = useState(anoAtual);
    const [quad, setQuad]   = useState(quadAtual);
    const [ine, setIne]     = useState('');
    const [bloco, setBloco] = useState('');
    const [equipes, setEquipes] = useState([]);
    const [data, setData]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [detalhe, setDetalhe] = useState(null);
    const requestRef = useRef(0);

    const { isRestrito, equipes: minhasEquipes, loading: loadingPerms } = useEquipesPermitidas();

    useMonitorApsAudit('/monitor-aps/qualidade', 'Monitor APS - Indicadores de Qualidade', { ano, quadrimestre: quad, equipe: ine, bloco });

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
        const p = new URLSearchParams({ ano, quadrimestre: quad });
        if (ine)   p.set('ine', ine);
        if (bloco) p.set('bloco', bloco);
        const ctrl = new AbortController();
        const requestId = requestRef.current + 1;
        requestRef.current = requestId;
        setLoading(true);
        setErro(null);
        setData([]);
        monitorApsApi.get(`/indicadores/qualidade?${p}`, { signal: ctrl.signal })
            .then(d => {
                if (requestId !== requestRef.current || ctrl.signal.aborted) return;
                const ind = d.indicadores ?? [];
                setData(ind);
            })
            .catch(e => {
                if (requestId !== requestRef.current || isMonitorApsCanceled(e)) return;
                setErro(e.message || 'Erro no servidor ao consultar indicadores de qualidade.');
            })
            .finally(() => {
                if (requestId === requestRef.current && !ctrl.signal.aborted) setLoading(false);
            });
        return () => ctrl.abort();
    }, [ano, quad, ine, bloco]);

    // Deduplica por ID de indicador
    const lista = useMemo(() => {
        const seen = {};
        data.forEach(i => { const id = i.indicador?.id; if (!seen[id]) seen[id] = i; });
        return Object.values(seen).sort((a, b) => a.indicador.id - b.indicador.id);
    }, [data]);

    const filtros = (
        <>
            <CampoSelecao id="qual-ano" label="Ano" value={ano} onChange={e => setAno(Number(e.target.value))} className="min-w-[120px]">
                {Array.from({ length: anoAtual - 2020 }, (_, i) => 2021 + i).map(a => <option key={a} value={a}>{a}</option>)}
            </CampoSelecao>
            <CampoSelecao id="qual-quad" label="Quadrimestre" value={quad} onChange={e => setQuad(Number(e.target.value))} className="min-w-[120px]">
                {[1, 2, 3].map(q => <option key={q} value={q}>{q}° Quad.</option>)}
            </CampoSelecao>
            <CampoSelecao id="qual-equipe" label="Equipe" value={ine} onChange={e => setIne(e.target.value)} disabled={isRestrito && equipes.length === 1} className="min-w-[180px]">
                <option value="">{isRestrito && equipes.length > 1 ? 'Todas as minhas equipes' : 'Todas as equipes'}</option>
                {equipes.map(eq => <option key={eq.nu_ine} value={eq.nu_ine}>{equipeLabel(eq.no_equipe)}</option>)}
            </CampoSelecao>
            <CampoSelecao id="qual-bloco" label="Bloco" value={bloco} onChange={e => setBloco(e.target.value)} className="min-w-[120px]">
                <option value="">Todos</option>
                <option value="esf">eSF / eAP</option>
                <option value="esb">eSB</option>
            </CampoSelecao>
        </>
    );

    return (
        <div className="ui-reset monitor-aps-page">
            <CabecalhoDePagina titulo="Indicadores de Qualidade" acoes={filtros} />
            {isRestrito && !loadingPerms && equipes.length === 0 && (
                <div className="mb-4">
                    <Banner tom="alerta">Nenhuma equipe autorizada para o seu usuário. Entre em contato com o administrador.</Banner>
                </div>
            )}

            {erro && <div className="mb-4"><Banner tom="perigo">{erro}</Banner></div>}
            {loading ? (
                <Carregando className="min-h-[300px] justify-center">Carregando indicadores...</Carregando>
            ) : (
                <Grade container spacing={2}>
                    {lista.map(i => (
                        <Grade key={i.indicador.id} item xs={12} sm={6} md={4} lg={3}>
                            <IndicadorCard indicador={i.indicador} onDetalhes={setDetalhe} />
                        </Grade>
                    ))}
                    {!erro && lista.length === 0 && (
                        <Grade item xs={12}>
                            <EstadoVazio titulo="Nenhum indicador encontrado para os filtros selecionados." />
                        </Grade>
                    )}
                </Grade>
            )}

            {/* Modal de detalhes */}
            <Dialogo aberto={!!detalhe} aoFechar={() => setDetalhe(null)} tamanho="md">
                {detalhe && (
                    <>
                        <div className="mb-4 flex items-start justify-between gap-3 pr-8">
                            <div>
                                <DialogoTitulo>IND {detalhe.id} — {detalhe.nome}</DialogoTitulo>
                                <p className="text-xs text-muted-foreground">{detalhe.bloco}</p>
                            </div>
                            <ClassChip c={detalhe.resultado?.classificacao} />
                        </div>
                        <p className="mb-4 text-sm text-muted-foreground">
                            {detalhe.resultado?.numerador} / {detalhe.resultado?.denominador} — {detalhe.resultado?.percentual}%
                        </p>
                        {detalhe.subindicadores?.length > 0 && (
                            <DataTable rotulo="subindicadores" colunas={COLUNAS_SUB} linhas={detalhe.subindicadores} chaveDaLinha={(s) => s.nome} />
                        )}
                        <p className="mt-4 text-xs text-muted-foreground">Fonte: Fichas Técnicas MS — Portaria GM/MS nº 6.907/2025</p>
                    </>
                )}
            </Dialogo>
        </div>
    );
}
