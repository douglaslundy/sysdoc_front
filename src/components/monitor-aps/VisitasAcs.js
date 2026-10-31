import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CircleCheck, CircleX, Home, List, Loader2, Map as IconeMapa, MapPin, Printer, User, UserX } from 'lucide-react';
import { equipeLabel } from '../../utils/equipeLabel';
import { isMonitorApsCanceled, monitorApsApi } from '../../services/monitorApsApi';
import { useMonitorApsAudit } from '../../services/monitorApsAudit';
import VisitaDetalheModal from './VisitaDetalheModal';
import generateVisitasAcsPDF from '../../reports/visitasAcs';
import { useEquipesPermitidas } from '../../hooks/useEquipesPermitidas';
import { Banner } from '../ui/banner';
import { Button } from '../ui/button';
import { CabecalhoDePagina } from '../ui/cabecalho-de-pagina';
import { CampoSelecao } from '../ui/campos';
import { Card, CardContent } from '../ui/card';
import { Carregando } from '../ui/carregando';
import { DataTable } from '../ui/data-table';
import { Paginacao } from '../ui/paginacao';
import { Pilula } from '../ui/pilula';
import { SeloAps } from './pecas';

const MapaVisitas = dynamic(() => import('./MapaVisitas'), { ssr: false });

const COR_DESFECHO   = { 1: '#168821', 2: '#E52207', 3: '#FF8C00', 4: '#888' };
const LABEL_DESFECHO = { 1: 'Realizada', 2: 'Recusada', 3: 'Ausente', 4: 'Não inf.' };
const MESES_LABEL    = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MESES_COMPLETO = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const ABAS = [
    { chave: 'tabela', rotulo: 'Visitas', Icone: List },
    { chave: 'agentes', rotulo: 'Por Agente', Icone: User },
    { chave: 'mapa', rotulo: 'Mapa', Icone: IconeMapa },
];

function MetricCard({ Icone, titulo, valor, cor, sub, subFamily, subDestacado = false }) {
    return (
        <Card size="sm" className="h-full">
            <CardContent className="flex flex-col items-center gap-2 text-center">
                <span className="flex size-[52px] shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${cor}22`, color: cor }}>
                    <Icone className="size-6" aria-hidden />
                </span>
                <div className="w-full min-w-0">
                    <p className="text-sm font-semibold text-muted-foreground">{titulo}</p>
                    <p className="mt-1 font-mono text-2xl font-bold" style={{ color: cor }}>{valor ?? '—'}</p>
                    {sub && (
                        <p className={`mt-1 border-b border-border pb-1 ${subDestacado ? 'text-sm font-bold text-info-text' : 'text-xs text-muted-foreground'}`}>
                            {sub}
                        </p>
                    )}
                    {subFamily && (
                        <p className="mt-1 border-b border-border pb-1 text-xs text-muted-foreground">{subFamily}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function AbaBtn({ label, aba, atual, Icone, onClick }) {
    const ativo = aba === atual;
    return (
        <button
            type="button"
            role="tab"
            aria-selected={ativo}
            onClick={onClick}
            className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm whitespace-nowrap outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-primary/25 ${ativo ? 'border-primary font-semibold text-primary-text' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
            <Icone className="size-4" aria-hidden />
            {label}
        </button>
    );
}

export default function VisitasAcs() {
    const anoAtual = new Date().getFullYear();
    const mesAtual = new Date().getMonth() + 1;

    const [ano, setAno]     = useState(anoAtual);
    const [mes, setMes]     = useState(mesAtual);
    const [ine, setIne]     = useState('');
    const [equipes, setEquipes] = useState([]);

    const { isRestrito, equipes: minhasEquipes, loading: loadingPerms } = useEquipesPermitidas();

    const [resumo, setResumo]         = useState(null);
    const [agentes, setAgentes]       = useState([]);
    const [responsabilidade, setResponsabilidade] = useState([]);
    const [agenteOpcoes, setAgenteOpcoes] = useState([]);
    const [visitas, setVisitas]        = useState([]);
    const [pontosMapa, setPontosMapa]  = useState([]);
    const [totalVisitas, setTotalVisitas] = useState(0);
    const [page, setPage]             = useState(0);
    const [perPage]                   = useState(50);
    const [filtroAgente, setFiltroAgente]     = useState('');
    const [filtroDesfecho, setFiltroDesfecho] = useState('');
    const [filtroGeo, setFiltroGeo]           = useState('');
    const [loadingResumo, setLoadingResumo] = useState(false);
    const [loadingAgentes, setLoadingAgentes] = useState(false);
    const [loadingVisitas, setLoadingVisitas] = useState(false);
    const [loading, setLoading]       = useState(false);
    const [loadingMapa, setLoadingMapa] = useState(false);
    const [erros, setErros] = useState({});
    const [printLoading, setPrintLoading] = useState(false);
    const [aba, setAba]               = useState('tabela');
    const resumoRequestRef = useRef(0);
    const agentesRequestRef = useRef(0);
    const visitasRequestRef = useRef(0);
    const mapaRequestRef = useRef(0);

    // Estado do modal de detalhe
    const [detalhe, setDetalhe]           = useState(null);
    const [loadingDetalhe, setLoadingDetalhe] = useState(false);
    const [modalAberto, setModalAberto]   = useState(false);
    const anySectionLoading = loadingResumo || loadingAgentes || loadingVisitas;

    const filtroAgenteNome = useMemo(
        () => agenteOpcoes.find((item) => item.agente_cns === filtroAgente)?.agente ?? '',
        [agenteOpcoes, filtroAgente]
    );

    useMonitorApsAudit('/monitor-aps/visitas', 'Monitor APS - Visitas ACS', {
        ano, mes, equipe: ine, agente: filtroAgenteNome, desfecho: filtroDesfecho, geo: filtroGeo,
    });

    // Carrega equipes conforme permissões do usuário
    useEffect(() => {
        if (loadingPerms) return;
        if (isRestrito) {
            setEquipes(minhasEquipes);
            if (minhasEquipes.length === 1) setIne(minhasEquipes[0].nu_ine);
            return;
        }
        const ctrl = new AbortController();
        monitorApsApi.get('/config/equipes', { signal: ctrl.signal })
            .then(d => setEquipes(d.equipes ?? []))
            .catch(e => {
                if (isMonitorApsCanceled(e)) return;
                setErros(prev => ({ ...prev, equipes: e.message || 'Erro no servidor ao carregar a lista de equipes.' }));
            });
        return () => ctrl.abort();
    }, [isRestrito, minhasEquipes, loadingPerms]);

    // Opções do select Agente — sempre sem filtros adicionais
    useEffect(() => {
        const params = new URLSearchParams({ ano, mes });
        if (ine) params.set('ine', ine);
        const ctrl = new AbortController();
        monitorApsApi.get(`/visitas/agentes?${params}`, { signal: ctrl.signal })
            .then(d => setAgenteOpcoes((d.agentes ?? []).slice().sort((a, b) => (a.agente ?? '').localeCompare(b.agente ?? '', 'pt-BR', { sensitivity: 'base' }))))
            .catch(() => {});
        return () => ctrl.abort();
    }, [ano, mes, ine]);

    // Cidadaos cadastrados (responsabilidade) por ACS, para a coluna "Cadastrados"
    useEffect(() => {
        const params = new URLSearchParams();
        if (ine) params.set('ine', ine);
        const ctrl = new AbortController();
        setResponsabilidade([]);
        monitorApsApi.get(`/visitas/responsabilidade?${params}`, { signal: ctrl.signal })
            .then(d => setResponsabilidade(d.responsabilidade ?? []))
            .catch(() => {});
        return () => ctrl.abort();
    }, [ine]);

    const cadastradosPorAgente = useMemo(() => {
        const porCns = new Map();
        const porNome = new Map();
        responsabilidade.forEach((r) => {
            const total = Number(r.cadastrados) || 0;
            if (r.cns) porCns.set(String(r.cns).trim(), (porCns.get(String(r.cns).trim()) ?? 0) + total);
            const nome = (r.agente ?? '').trim().toLowerCase();
            if (nome) porNome.set(nome, (porNome.get(nome) ?? 0) + total);
        });
        return (agente) => {
            const cns = String(agente?.agente_cns ?? '').trim();
            if (cns && porCns.has(cns)) return porCns.get(cns);
            const nome = (agente?.agente ?? '').trim().toLowerCase();
            return porNome.has(nome) ? porNome.get(nome) : null;
        };
    }, [responsabilidade]);

    const handleEquipeChange = useCallback((event) => {
        setIne(event.target.value);
        setFiltroAgente('');
        setPage(0);
    }, []);

    const handleAnoChange = useCallback((event) => {
        setAno(Number(event.target.value));
        setFiltroAgente('');
        setPage(0);
    }, []);

    const handleMesChange = useCallback((event) => {
        setMes(Number(event.target.value));
        setFiltroAgente('');
        setPage(0);
    }, []);

    // Carrega resumo
    useEffect(() => {
        const params = new URLSearchParams({ ano, mes });
        if (ine)            params.set('ine', ine);
        if (filtroAgente)   params.set('agente_cns', filtroAgente);
        if (filtroDesfecho) params.set('desfecho', filtroDesfecho);
        if (filtroGeo)      params.set('has_geo', filtroGeo);
        const requestId = ++resumoRequestRef.current;
        setLoadingResumo(true);
        setResumo(null);
        setErros(prev => ({ ...prev, resumo: null }));

        const ctrl = new AbortController();
        monitorApsApi.get(`/visitas/resumo?${params}`, { signal: ctrl.signal })
            .then(d => {
                if (requestId !== resumoRequestRef.current || ctrl.signal.aborted) return;
                setResumo(d);
            })
            .catch(e => {
                if (requestId !== resumoRequestRef.current || isMonitorApsCanceled(e)) return;
                setErros(prev => ({ ...prev, resumo: e.message || 'Erro no servidor ao consultar o resumo de visitas.' }));
            })
            .finally(() => {
                if (requestId === resumoRequestRef.current) setLoadingResumo(false);
            });
        return () => ctrl.abort();
    }, [ano, mes, ine, filtroAgente, filtroDesfecho, filtroGeo]);

    // Carrega estatísticas por agente (filtrado para a aba "Por Agente")
    useEffect(() => {
        const params = new URLSearchParams({ ano, mes });
        if (ine)            params.set('ine', ine);
        if (filtroAgente)   params.set('agente_cns', filtroAgente);
        if (filtroDesfecho) params.set('desfecho', filtroDesfecho);
        if (filtroGeo)      params.set('has_geo', filtroGeo);
        const requestId = ++agentesRequestRef.current;
        setLoadingAgentes(true);
        setAgentes([]);
        setErros(prev => ({ ...prev, agentes: null }));

        const ctrl = new AbortController();
        monitorApsApi.get(`/visitas/agentes?${params}`, { signal: ctrl.signal })
            .then(d => {
                if (requestId !== agentesRequestRef.current || ctrl.signal.aborted) return;
                setAgentes(d.agentes ?? []);
            })
            .catch(e => {
                if (requestId !== agentesRequestRef.current || isMonitorApsCanceled(e)) return;
                setErros(prev => ({ ...prev, agentes: e.message || 'Erro no servidor ao consultar agentes.' }));
            })
            .finally(() => {
                if (requestId === agentesRequestRef.current) setLoadingAgentes(false);
            });
        return () => ctrl.abort();
    }, [ano, mes, ine, filtroAgente, filtroDesfecho, filtroGeo]);

    // Carrega lista de visitas
    useEffect(() => {
        const params = new URLSearchParams({ ano, mes, page: page + 1, per_page: perPage });
        if (ine)            params.set('ine', ine);
        if (filtroAgente)   params.set('agente_cns', filtroAgente);
        if (filtroDesfecho) params.set('desfecho', filtroDesfecho);
        if (filtroGeo)      params.set('has_geo', filtroGeo);

        const ctrl = new AbortController();
        const requestId = ++visitasRequestRef.current;
        setLoading(true);
        setLoadingVisitas(true);
        setVisitas([]);
        setTotalVisitas(0);
        setErros(prev => ({ ...prev, visitas: null }));
        monitorApsApi.get(`/visitas/lista?${params}`, { signal: ctrl.signal })
            .then(d => {
                if (requestId !== visitasRequestRef.current || ctrl.signal.aborted) return;
                setVisitas(d.visitas ?? []);
                setTotalVisitas(d.total ?? 0);
            })
            .catch(e => {
                if (requestId !== visitasRequestRef.current || isMonitorApsCanceled(e)) return;
                setErros(prev => ({ ...prev, visitas: e.message || 'Erro no servidor ao consultar visitas.' }));
            })
            .finally(() => {
                if (requestId === visitasRequestRef.current) {
                    setLoading(false);
                    setLoadingVisitas(false);
                }
            });
        return () => ctrl.abort();
    }, [ano, mes, ine, page, filtroAgente, filtroDesfecho, filtroGeo]);

    // Carrega pontos do mapa quando a aba muda para mapa
    useEffect(() => {
        if (aba !== 'mapa') return;
        const params = new URLSearchParams({ ano, mes });
        if (ine)            params.set('ine', ine);
        if (filtroAgente)   params.set('agente_cns', filtroAgente);
        if (filtroDesfecho) params.set('desfecho', filtroDesfecho);
        if (filtroGeo)      params.set('has_geo', filtroGeo);
        const requestId = ++mapaRequestRef.current;

        const ctrl = new AbortController();
        setLoadingMapa(true);
        setPontosMapa([]);
        setErros(prev => ({ ...prev, mapa: null }));
        monitorApsApi.get(`/visitas/mapa?${params}`, { signal: ctrl.signal })
            .then(d => {
                if (requestId !== mapaRequestRef.current || ctrl.signal.aborted) return;
                setPontosMapa(d.pontos ?? []);
            })
            .catch(e => {
                if (requestId !== mapaRequestRef.current || isMonitorApsCanceled(e)) return;
                setErros(prev => ({ ...prev, mapa: e.message || 'Erro no servidor ao consultar o mapa.' }));
            })
            .finally(() => {
                if (requestId === mapaRequestRef.current) setLoadingMapa(false);
            });
        return () => ctrl.abort();
    }, [aba, ano, mes, ine, filtroAgente, filtroDesfecho, filtroGeo]);

    const abrirDetalhe = useCallback(async (id) => {
        setLoadingDetalhe(true);
        setModalAberto(true);
        setDetalhe(null);
        try {
            const data = await monitorApsApi.get(`/visitas/${id}`);
            setDetalhe(data);
        } catch {
            setModalAberto(false);
        } finally {
            setLoadingDetalhe(false);
        }
    }, []);

    const fecharModal = useCallback(() => {
        setModalAberto(false);
        setDetalhe(null);
    }, []);

    const erroAtivo = erros.equipes || erros.resumo || erros.agentes || erros.visitas || erros.mapa;

    const totais = resumo?.totais ?? {
        total: 0, realizadas: 0, recusadas: 0, ausentes: 0, cidadaos: 0,
        domicilios_total: null, domicilios_com_moradores: null, domicilios_casa_vazia: null,
        domicilios_fa: null,
        domicilios_visitados: null, domicilios_acompanhados: null, domicilios_recusados: null, domicilios_ausentes: null,
    };
    const pctReal          = totais.total > 0 ? Math.round(totais.realizadas / totais.total * 100) : 0;
    const pctRecusadas     = totais.total > 0 ? Math.round(totais.recusadas / totais.total * 100) : 0;
    const pctAusentes      = totais.total > 0 ? Math.round(totais.ausentes / totais.total * 100) : 0;
    const totalDomicilios  = totais.domicilios_total ?? 0;
    const temDomicilios    = totalDomicilios > 0;
    const domiciliosComMoradores = totais.domicilios_com_moradores ?? 0;
    const temDomiciliosComMoradores = domiciliosComMoradores > 0;
    const pctDomAcomp      = temDomiciliosComMoradores ? Math.round((totais.domicilios_acompanhados ?? 0) / domiciliosComMoradores * 100) : 0;
    const pctDomRecus      = temDomiciliosComMoradores ? Math.round((totais.domicilios_recusados   ?? 0) / domiciliosComMoradores * 100) : 0;
    const pctDomAusent     = temDomiciliosComMoradores ? Math.round((totais.domicilios_ausentes    ?? 0) / domiciliosComMoradores * 100) : 0;
    const pctDomMoradores  = temDomicilios ? Math.round((totais.domicilios_com_moradores ?? 0) / totalDomicilios * 100) : 0;
    const pctDomCasaVazia  = temDomicilios ? Math.round((totais.domicilios_casa_vazia ?? 0) / totalDomicilios * 100) : 0;
    const domiciliosPendentes = Math.max(domiciliosComMoradores - (totais.domicilios_acompanhados ?? 0), 0);
    const pctDomPendentes = temDomiciliosComMoradores ? Math.round(domiciliosPendentes / domiciliosComMoradores * 100) : 0;

    const handlePrint = async () => {
        setPrintLoading(true);
        try {
            let allVisitas = visitas;
            if (aba === 'tabela' && totalVisitas > perPage) {
                const chunkSize = 100;
                const totalPages = Math.ceil(totalVisitas / chunkSize);
                const paramsBase = new URLSearchParams({ ano, mes, per_page: chunkSize });
                if (ine)            paramsBase.set('ine', ine);
                if (filtroAgente)   paramsBase.set('agente_cns', filtroAgente);
                if (filtroDesfecho) paramsBase.set('desfecho', filtroDesfecho);
                if (filtroGeo)      paramsBase.set('has_geo', filtroGeo);

                const pages = [];
                for (let currentPage = 1; currentPage <= totalPages; currentPage += 1) {
                    const params = new URLSearchParams(paramsBase);
                    params.set('page', currentPage);
                    const d = await monitorApsApi.get(`/visitas/lista?${params}`);
                    pages.push(...(d.visitas ?? []));
                }
                allVisitas = pages;
            }
            const equipeNome = equipes.find(e => e.nu_ine === ine)?.no_equipe ?? '';
            await generateVisitasAcsPDF({
                aba,
                totais,
                pcts: {
                    pctReal, pctRecusadas, pctAusentes,
                    pctDomAcomp, pctDomPendentes, pctDomMoradores,
                    pctDomCasaVazia, pctDomRecus, pctDomAusent,
                    domiciliosPendentes,
                },
                visitas: allVisitas,
                agentes,
                filtros: {
                    ano, mes,
                    mesLabel: MESES_COMPLETO[mes],
                    equipeNome,
                    filtroAgente: filtroAgenteNome,
                    filtroDesfecho,
                    filtroGeo,
                },
                totalVisitas,
            });
        } finally {
            setPrintLoading(false);
        }
    };

    const anosDisponiveis = useMemo(
        () => Array.from({ length: anoAtual - 2020 + 1 }, (_, i) => anoAtual - i),
        [anoAtual]
    );
    const dataHora = (v) => {
        if (!v.data) return '—';
        const d = new Date(v.data.length === 10 ? v.data + 'T12:00:00' : v.data).toLocaleDateString('pt-BR');
        const h = v.hora != null ? ` ${String(v.hora).padStart(2, '0')}:00` : '';
        return d + h;
    };
    const numero = (n) => (n != null ? n.toLocaleString('pt-BR') : '—');

    const colunasVisitas = [
        { chave: 'data', titulo: 'Data / Hora', render: (v) => <span className="text-xs whitespace-nowrap">{dataHora(v)}</span> },
        { chave: 'cidadao', titulo: 'Cidadão', render: (v) => <span className="block max-w-[200px] truncate text-sm" title={v.cidadao ?? ''}>{v.cidadao ?? '—'}</span> },
        {
            chave: 'agente',
            titulo: 'Agente',
            render: (v) => (
                <>
                    <span className="block max-w-[200px] truncate text-sm font-semibold">{v.agente}</span>
                    <span className="block text-xs text-muted-foreground">{v.cbo}</span>
                </>
            ),
        },
        { chave: 'equipe', titulo: 'Equipe', render: (v) => <span className="block max-w-[200px] truncate text-sm">{v.equipe?.nome}</span> },
        { chave: 'instrumento', titulo: 'Instrumento', render: (v) => <span className="block max-w-[160px] truncate text-xs">{v.instrumento}</span> },
        { chave: 'geo', titulo: 'Geolocalização', render: (v) => <Pilula tom={v.has_geo ? 'sucesso' : 'neutro'}>{v.has_geo ? 'Sim' : 'Não'}</Pilula> },
        { chave: 'desfecho', titulo: 'Desfecho', render: (v) => <SeloAps cor={COR_DESFECHO[v.desfecho_id] ?? '#888'}>{LABEL_DESFECHO[v.desfecho_id] ?? '—'}</SeloAps> },
        {
            chave: 'acao',
            titulo: 'Ação',
            render: (v) => <Button variant="outline" size="xs" onClick={() => abrirDetalhe(v.id)} aria-label={`Ver visita de ${v.cidadao ?? 'cidadão'}`}>Ver</Button>,
        },
    ];

    const nomeEquipeCurto = (a) => {
        const equipeNome = equipeLabel(a.equipe?.nome) ?? '';
        const equipeVisivel = equipeNome.includes(' - ') ? equipeNome.split(' - ').slice(1).join(' - ') : equipeNome;
        return equipeVisivel.length > 20 ? equipeVisivel.slice(0, 20) + '…' : equipeVisivel;
    };

    const colunasAgentes = [
        {
            chave: 'agente',
            titulo: 'Agente',
            render: (a) => (
                <>
                    <span className="block max-w-[170px] truncate text-sm font-semibold" title={a.agente}>
                        {(a.agente ?? '').length > 30 ? (a.agente ?? '').slice(0, 30) + '…' : a.agente}
                    </span>
                    <span className="block text-xs text-muted-foreground">{a.cbo_nome}</span>
                </>
            ),
        },
        { chave: 'equipe', titulo: 'Equipe', render: (a) => <span className="block text-sm whitespace-nowrap" title={equipeLabel(a.equipe?.nome)}>{nomeEquipeCurto(a)}</span> },
        { chave: 'cadastrados', titulo: 'Cadastrados', numerica: true, render: (a) => numero(cadastradosPorAgente(a)) },
        { chave: 'cidadaos', titulo: 'Cidadãos', numerica: true, render: (a) => a.cidadaos.toLocaleString('pt-BR') },
        { chave: 'realizadas', titulo: 'Realizadas', numerica: true, render: (a) => <span style={{ color: COR_DESFECHO[1] }}>{a.realizadas.toLocaleString('pt-BR')}</span> },
        { chave: 'recusadas', titulo: 'Recusadas', numerica: true, render: (a) => <span style={{ color: COR_DESFECHO[2] }}>{a.recusadas.toLocaleString('pt-BR')}</span> },
        { chave: 'ausentes', titulo: 'Ausentes', numerica: true, render: (a) => <span style={{ color: COR_DESFECHO[3] }}>{a.ausentes.toLocaleString('pt-BR')}</span> },
        { chave: 'total', titulo: 'Total', numerica: true, render: (a) => <strong>{a.total.toLocaleString('pt-BR')}</strong> },
        { chave: 'dom', titulo: 'Domicílios', numerica: true, render: (a) => numero(a.domicilios_total) },
        { chave: 'domMor', titulo: 'Com moradores', numerica: true, render: (a) => numero(a.domicilios_com_moradores) },
        { chave: 'domVaz', titulo: 'Casa vazia', numerica: true, render: (a) => numero(a.domicilios_casa_vazia) },
        { chave: 'domVis', titulo: 'Dom. Visitados', numerica: true, render: (a) => numero(a.domicilios_visitados) },
        { chave: 'domAus', titulo: 'Dom. Ausentes', numerica: true, render: (a) => <span style={{ color: COR_DESFECHO[3] }}>{numero(a.domicilios_ausentes_visita)}</span> },
        { chave: 'domRec', titulo: 'Dom. Recusados', numerica: true, render: (a) => <span style={{ color: COR_DESFECHO[2] }}>{numero(a.domicilios_recusados_visita)}</span> },
        {
            chave: 'domAcomp',
            titulo: '% Domicílios Acomp.',
            numerica: true,
            render: (a) => (a.domicilios_acompanhados != null ? (
                <span className="inline-flex flex-wrap items-center justify-end gap-1">
                    <strong>{a.domicilios_acompanhados.toLocaleString('pt-BR')}</strong>
                    {a.pct_dom_acompanhados != null && (
                        <SeloAps cor={a.pct_dom_acompanhados >= 70 ? '#168821' : '#FF8C00'}>{`${a.pct_dom_acompanhados}%`}</SeloAps>
                    )}
                </span>
            ) : '—'),
        },
    ];

    return (
        <div className="monitor-visitas-page">
            <CabecalhoDePagina
                titulo="Visitas ACS / TACS"
                acoes={(
                    <Button variant="outline" size="sm" disabled={printLoading || !resumo} onClick={handlePrint}>
                        {printLoading ? <Loader2 className="animate-spin" /> : <Printer />}
                        {printLoading ? 'Gerando...' : `PDF — ${aba === 'tabela' ? 'Visitas' : aba === 'agentes' ? 'Por Agente' : 'Mapa'}`}
                    </Button>
                )}
            />

            <div className="mb-4 flex flex-wrap items-end gap-3">
                <CampoSelecao id="va-equipe" label="Equipe" value={ine}
                    onChange={handleEquipeChange}
                    disabled={isRestrito && equipes.length === 1}
                    className="min-w-[200px]">
                    <option value="">{isRestrito && equipes.length > 1 ? 'Todas as minhas equipes' : 'Todas as equipes'}</option>
                    {equipes.map(eq => (
                        <option key={eq.nu_ine} value={eq.nu_ine}>{equipeLabel(eq.no_equipe)}</option>
                    ))}
                </CampoSelecao>
                <CampoSelecao id="va-ano" label="Ano" value={ano} onChange={handleAnoChange} className="min-w-[110px]">
                    {anosDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
                </CampoSelecao>
                <CampoSelecao id="va-mes" label="Mês" value={mes} onChange={handleMesChange} className="min-w-[140px]">
                    {MESES_COMPLETO.slice(1).map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                </CampoSelecao>
                <CampoSelecao id="va-agente" label="Agente" value={filtroAgente}
                    onChange={e => { setFiltroAgente(e.target.value); setPage(0); }}
                    className="min-w-[160px]">
                    <option value="">Todos os agentes</option>
                    {agenteOpcoes.map((a, i) => (
                        <option key={a.agente_cns ?? i} value={a.agente_cns ?? ''}>{a.agente}</option>
                    ))}
                </CampoSelecao>
                <CampoSelecao id="va-desfecho" label="Desfecho" value={filtroDesfecho}
                    className="monitor-visitas-select-desfecho min-w-[140px]"
                    onChange={e => { setFiltroDesfecho(e.target.value); setPage(0); }}>
                    <option value="">Todos</option>
                    <option value="1">Realizada</option>
                    <option value="2">Recusada</option>
                    <option value="3">Ausente</option>
                </CampoSelecao>
                <CampoSelecao id="va-geo" label="Geolocalização" value={filtroGeo}
                    onChange={e => { setFiltroGeo(e.target.value); setPage(0); }}
                    className="min-w-[170px]">
                    <option value="">Todas</option>
                    <option value="sim">Com geolocalização</option>
                    <option value="nao">Sem geolocalização</option>
                </CampoSelecao>
            </div>
            {isRestrito && !loadingPerms && equipes.length === 0 && (
                <div className="mb-4">
                    <Banner tom="alerta">Nenhuma equipe autorizada para o seu usuário. Entre em contato com o administrador.</Banner>
                </div>
            )}

            {anySectionLoading ? (
                <div role="progressbar" aria-label="Carregando dados" className="mb-4 h-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-1/3 animate-[pulse-suave_1.5s_ease-in-out_infinite] rounded-full bg-primary" />
                </div>
            ) : null}

            {/* Cards de métricas */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <MetricCard Icone={MapPin} titulo="Total de Visitas"
                    valor={totais.total.toLocaleString('pt-BR')} cor="#1351B4"
                    sub={temDomicilios && totais.domicilios_visitados != null
                        ? `${totais.domicilios_visitados.toLocaleString('pt-BR')} domicílios visitados`
                        : null} />
                <MetricCard Icone={CircleCheck} titulo="Realizadas"
                    valor={`${totais.realizadas.toLocaleString('pt-BR')} (${pctReal}%)`} cor="#168821"
                    sub={temDomicilios && totais.domicilios_acompanhados != null
                        ? `${totais.domicilios_acompanhados.toLocaleString('pt-BR')} (${pctDomAcomp}%) - domicílios acompanhados`
                        : null}
                    subDestacado
                    subFamily={temDomiciliosComMoradores
                        ? `${domiciliosPendentes.toLocaleString('pt-BR')} (${pctDomPendentes}%) - domicílios pendentes`
                        : null} />
                <MetricCard Icone={CircleX} titulo="Recusadas"
                    valor={`${totais.recusadas.toLocaleString('pt-BR')} (${pctRecusadas}%)`} cor="#E52207"
                    subFamily={temDomicilios && totais.domicilios_recusados != null
                        ? `${totais.domicilios_recusados.toLocaleString('pt-BR')} (${pctDomRecus}%) - domicílios`
                        : null} />
                <MetricCard Icone={UserX} titulo="Ausentes"
                    valor={`${totais.ausentes.toLocaleString('pt-BR')} (${pctAusentes}%)`} cor="#FF8C00"
                    subFamily={temDomicilios && totais.domicilios_ausentes != null
                        ? `${totais.domicilios_ausentes.toLocaleString('pt-BR')} (${pctDomAusent}%) - domicílios`
                        : null} />
                <MetricCard Icone={Home} titulo="Domicílios Cadastrados"
                    valor={(totais.domicilios_total ?? 0).toLocaleString('pt-BR')} cor="#7B2D8B"
                    sub={temDomicilios ? `${(totais.domicilios_com_moradores ?? 0).toLocaleString('pt-BR')} (${pctDomMoradores}%) - com moradores` : null}
                    subFamily={temDomicilios ? `${(totais.domicilios_casa_vazia ?? 0).toLocaleString('pt-BR')} (${pctDomCasaVazia}%) - casa vazia` : null} />
                <MetricCard Icone={Home} titulo="Domicílios FA"
                    valor={(totais.domicilios_fa ?? 0).toLocaleString('pt-BR')} cor="#555"
                    sub="Fora de Área" />
            </div>

            {/* Abas */}
            <div role="tablist" aria-label="Visões de visitas" className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
                {ABAS.map(({ chave, rotulo, Icone }) => (
                    <AbaBtn key={chave} label={rotulo} aba={chave} atual={aba} Icone={Icone} onClick={() => setAba(chave)} />
                ))}
            </div>

            {erroAtivo && <div className="mb-4"><Banner tom="perigo">{erroAtivo}</Banner></div>}
            {loading && aba !== 'mapa' ? (
                <Carregando className="justify-center py-12" />
            ) : (
                <>
                    {/* ── ABA: Tabela de visitas ── */}
                    {aba === 'tabela' && (
                        <>
                            <DataTable
                                rotulo="visitas"
                                colunas={colunasVisitas}
                                linhas={visitas}
                                chaveDaLinha={(v) => v.id}
                                vazio={erros.visitas ? '' : 'Nenhuma visita encontrada para os filtros selecionados.'}
                            />
                            <Paginacao
                                total={totalVisitas}
                                pagina={page}
                                porPagina={perPage}
                                aoMudarPagina={setPage}
                            />
                        </>
                    )}

                    {/* ── ABA: Por agente ── */}
                    {aba === 'agentes' && (
                        <DataTable
                            rotulo="visitas por agente"
                            colunas={colunasAgentes}
                            linhas={agentes}
                            chaveDaLinha={(a) => `${a.agente_cns ?? a.agente}-${a.equipe?.nome ?? ''}`}
                            vazio={erros.agentes ? '' : 'Nenhum agente encontrado para o período.'}
                        />
                    )}

                    {/* ── ABA: Mapa ── */}
                    {aba === 'mapa' && (
                        <Card>
                            <CardContent>
                                <h2 className="mb-3 text-base font-bold">
                                    Mapa de Visitas{pontosMapa.length > 0
                                        ? ` — ${pontosMapa.length.toLocaleString('pt-BR')} pontos`
                                        : ''}
                                </h2>

                                {loadingMapa ? (
                                    <Carregando className="justify-center py-12" />
                                ) : (
                                    <MapaVisitas
                                        pontos={pontosMapa}
                                        zoom={13}
                                        equipes={equipes}
                                        ineAtiva={ine}
                                        onPinClick={abrirDetalhe}
                                    />
                                )}

                                <p className="mt-2 text-xs text-muted-foreground">
                                    Exibindo todos os pontos georreferenciados dos filtros selecionados.
                                    Visitas sem coordenadas não aparecem no mapa.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {/* Modal de detalhe da visita */}
            <VisitaDetalheModal
                open={modalAberto}
                onClose={fecharModal}
                visita={loadingDetalhe ? null : detalhe}
            />
        </div>
    );
}
