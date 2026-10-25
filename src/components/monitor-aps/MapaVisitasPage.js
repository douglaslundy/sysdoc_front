import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Printer, X } from 'lucide-react';
import { equipeLabel } from '../../utils/equipeLabel';
import { isMonitorApsCanceled, monitorApsApi } from '../../services/monitorApsApi';
import { useMonitorApsAudit } from '../../services/monitorApsAudit';
import VisitaDetalheModal from './VisitaDetalheModal';
import { useEquipesPermitidas } from '../../hooks/useEquipesPermitidas';
import { Banner } from '../ui/banner';
import { Button } from '../ui/button';
import { CabecalhoDePagina } from '../ui/cabecalho-de-pagina';
import { CampoDeBusca } from '../ui/campo-de-busca';
import { CampoSelecao } from '../ui/campos';
import { Card, CardContent } from '../ui/card';
import { Carregando } from '../ui/carregando';

const MapaVisitas = dynamic(() => import('./MapaVisitas'), { ssr: false });

const MESES_COMPLETO = [
    '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function MapaVisitasPage() {
    const anoAtual = new Date().getFullYear();
    const mesAtual = new Date().getMonth() + 1;

    const [filtroModo, setFiltroModo]   = useState('todos'); // 'todos' | 'equipe'
    const [equipeIne, setEquipeIne]     = useState('');
    const [agenteCns, setAgenteCns]     = useState('');
    const [filtroSearch, setFiltroSearch] = useState('');
    const [searchAtivo, setSearchAtivo]   = useState(''); // debounced
    const [ano, setAno]                 = useState(anoAtual);
    const [mes, setMes]                 = useState(mesAtual);
    const debounceRef = useRef(null);

    const [equipes, setEquipes]   = useState([]);
    const [agentes, setAgentes]   = useState([]);
    const [pontos, setPontos]     = useState([]);
    const [loading, setLoading]   = useState(false);
    const [erro, setErro]         = useState(null);
    const pontosCtrlRef = useRef(null);
    const pontosRequestRef = useRef(0);

    const { isRestrito, equipes: minhasEquipes, loading: loadingPerms } = useEquipesPermitidas();

    const [detalhe, setDetalhe]               = useState(null);
    const [loadingDetalhe, setLoadingDetalhe] = useState(false);
    const [modalAberto, setModalAberto]       = useState(false);

    const agenteNome = useMemo(
        () => agentes.find((item) => item.agente_cns === agenteCns)?.agente ?? '',
        [agentes, agenteCns]
    );

    useMonitorApsAudit('/monitor-aps/visitas/mapa', 'Monitor APS - Mapa de Visitas', {
        ano, mes, equipe: equipeIne, agente: agenteNome,
    });

    // Color mode is auto-determined by the filter state (no separate toggle needed)
    const modoExterno = useMemo(() => {
        if (filtroModo === 'todos' || !equipeIne) return 'todos'; // color by team
        if (!agenteCns)                           return 'equipe'; // color by agent
        return 'agente';                                           // color by outcome
    }, [filtroModo, equipeIne, agenteCns]);

    useEffect(() => {
        if (loadingPerms) return;
        if (isRestrito) {
            setEquipes(minhasEquipes);
            setFiltroModo('equipe');
            if (minhasEquipes.length === 1) setEquipeIne(minhasEquipes[0].nu_ine);
            return;
        }
        monitorApsApi.get('/config/equipes')
            .then(d => setEquipes(d.equipes ?? []))
            .catch(e => { if (!isMonitorApsCanceled(e)) setErro(e.message || 'Erro no servidor ao carregar a lista de equipes.'); });
    }, [isRestrito, minhasEquipes, loadingPerms]);

    // Força modo equipe quando isRestrito
    useEffect(() => {
        if (isRestrito) setFiltroModo('equipe');
    }, [isRestrito]);

    // Reload agent list whenever team or period changes
    useEffect(() => {
        if (!equipeIne) {
            setAgentes([]);
            setAgenteCns('');
            return;
        }
        const params = new URLSearchParams({ ano, mes, ine: equipeIne });
        monitorApsApi.get(`/visitas/agentes?${params}`)
            .then(d => setAgentes(d.agentes ?? []))
            .catch(() => setAgentes([]));
    }, [equipeIne, ano, mes]);

    // Debounce do campo de busca: dispara após 400 ms sem digitação
    function handleSearchChange(valor) {
        setFiltroSearch(valor);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            const v = valor.trim();
            setSearchAtivo(v.length >= 3 ? v : '');
        }, 400);
    }

    function limparSearch() {
        setFiltroSearch('');
        setSearchAtivo('');
        clearTimeout(debounceRef.current);
    }

    // Reload map points whenever any filter changes
    useEffect(() => {
        const params = new URLSearchParams({ ano, mes });
        if (equipeIne)    params.set('ine', equipeIne);
        if (agenteCns)    params.set('agente_cns', agenteCns);
        if (searchAtivo)  params.set('busca', searchAtivo);

        if (pontosCtrlRef.current) pontosCtrlRef.current.abort();
        const ctrl = new AbortController();
        const requestId = pontosRequestRef.current + 1;
        pontosCtrlRef.current = ctrl;
        pontosRequestRef.current = requestId;

        setLoading(true);
        setErro(null);
        setPontos([]);
        monitorApsApi.get(`/visitas/mapa?${params}`, { signal: ctrl.signal })
            .then(d => {
                if (requestId !== pontosRequestRef.current || ctrl.signal.aborted) return;
                setPontos(d.pontos ?? []);
            })
            .catch(e => {
                if (requestId !== pontosRequestRef.current || isMonitorApsCanceled(e)) return;
                setErro(e.message || 'Erro no servidor ao consultar o mapa de visitas.');
            })
            .finally(() => {
                if (requestId === pontosRequestRef.current && !ctrl.signal.aborted) setLoading(false);
            });

        return () => ctrl.abort();
    }, [ano, mes, equipeIne, agenteCns, searchAtivo]);

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

    const anosDisponiveis = useMemo(
        () => Array.from({ length: anoAtual - 2020 + 1 }, (_, i) => anoAtual - i),
        [anoAtual]
    );

    function handleFiltroModo(valor) {
        if (!valor) return;
        setFiltroModo(valor);
        if (valor === 'todos') {
            setEquipeIne('');
            setAgenteCns('');
        } else {
            // ao mudar para Por Equipe, limpa a busca por cidadão
            limparSearch();
        }
    }

    return (
        <div className="monitor-aps-page monitor-aps-mapa-page">
            {/* Cabeçalho — oculto na impressão (substituído pelo print-header abaixo) */}
            <div className="no-print">
                <CabecalhoDePagina
                    titulo="Mapa de Visitas ACS/TACS"
                    acoes={(
                        <>
                            {!loading && pontos.length > 0 && (
                                <span className="text-sm text-muted-foreground">
                                    {pontos.length.toLocaleString('pt-BR')} ponto{pontos.length !== 1 ? 's' : ''} no mapa
                                </span>
                            )}
                            <Button variant="outline" size="sm" onClick={() => window.print()} disabled={loading || pontos.length === 0}>
                                <Printer /> PDF
                            </Button>
                        </>
                    )}
                />
            </div>

            {/* Cabeçalho visível apenas na impressão */}
            <div className="print-only mb-4 hidden border-b border-border pb-3">
                <h1 className="mb-1 text-xl font-bold">Mapa de Visitas ACS/TACS</h1>
                <p className="text-sm">
                    Período: {MESES_COMPLETO[mes]} / {ano}
                    {filtroModo === 'equipe' && equipeIne && equipes.find(e => e.nu_ine === equipeIne)
                        ? ` • Equipe: ${equipes.find(e => e.nu_ine === equipeIne).no_equipe}`
                        : ''}
                    {agenteNome ? ` • Agente: ${agenteNome}` : ''}
                    {searchAtivo ? ` • Busca: "${searchAtivo}"` : ''}
                    {pontos.length > 0
                        ? ` • ${pontos.length.toLocaleString('pt-BR')} ponto${pontos.length !== 1 ? 's' : ''} georreferenciado${pontos.length !== 1 ? 's' : ''}`
                        : ''}
                </p>
                <span className="text-xs text-muted-foreground">Gerado em: {new Date().toLocaleString('pt-BR')}</span>
            </div>

            {/* Painel de filtros — oculto na impressão */}
            <Card className="no-print mb-4">
                <CardContent>
                    <div className="flex flex-wrap items-end gap-3">
                        {/* Todos / Por Equipe */}
                        <div role="group" aria-label="Modo de filtro" className="flex gap-1">
                            {!isRestrito && (
                                <Button variant={filtroModo === 'todos' ? 'default' : 'outline'} aria-pressed={filtroModo === 'todos'} onClick={() => handleFiltroModo('todos')}>
                                    Todos
                                </Button>
                            )}
                            <Button variant={filtroModo === 'equipe' ? 'default' : 'outline'} aria-pressed={filtroModo === 'equipe'} onClick={() => handleFiltroModo('equipe')}>
                                Por Equipe
                            </Button>
                        </div>

                        {/* Busca por cidadão — só no modo Todos */}
                        {filtroModo === 'todos' && (
                            <div className="monitor-aps-mapa-search relative min-w-[280px] flex-[1_1_280px]">
                                <CampoDeBusca
                                    rotulo="Buscar visita por cidadão"
                                    placeholder="CPF, CNS ou nome (mín. 3 letras)"
                                    value={filtroSearch}
                                    onChange={e => handleSearchChange(e.target.value)}
                                    className="pr-0"
                                />
                                {filtroSearch && (
                                    <button
                                        type="button"
                                        aria-label="Limpar busca"
                                        onClick={limparSearch}
                                        className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-hover focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none"
                                    >
                                        <X className="size-4" />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Equipe — habilitado apenas quando modo equipe */}
                        {filtroModo === 'equipe' && (
                            <CampoSelecao id="mapa-equipe" label="Equipe" value={equipeIne}
                                onChange={e => { setEquipeIne(e.target.value); setAgenteCns(''); }}
                                disabled={isRestrito && equipes.length === 1}
                                className="min-w-[220px]">
                                <option value="">{isRestrito && equipes.length > 1 ? 'Todas as minhas equipes' : 'Todas as equipes'}</option>
                                {equipes.map(eq => (
                                    <option key={eq.nu_ine} value={eq.nu_ine}>{equipeLabel(eq.no_equipe)}</option>
                                ))}
                            </CampoSelecao>
                        )}
                        {isRestrito && !loadingPerms && equipes.length === 0 && (
                            <Banner tom="alerta">Nenhuma equipe autorizada para o seu usuário. Entre em contato com o administrador.</Banner>
                        )}

                        {/* Agente — habilitado apenas quando equipe selecionada */}
                        {filtroModo === 'equipe' && equipeIne && (
                            <CampoSelecao id="mapa-agente" label="Agente" value={agenteCns}
                                onChange={e => setAgenteCns(e.target.value)}
                                className="min-w-[220px]">
                                <option value="">Todos os agentes</option>
                                {agentes.map((a, i) => (
                                    <option key={a.agente_cns ?? i} value={a.agente_cns ?? ''}>{a.agente}</option>
                                ))}
                            </CampoSelecao>
                        )}

                        <CampoSelecao id="mapa-ano" label="Ano" value={ano}
                            onChange={e => setAno(Number(e.target.value))}
                            className="min-w-[100px]">
                            {anosDisponiveis.map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </CampoSelecao>

                        <CampoSelecao id="mapa-mes" label="Mês" value={mes}
                            onChange={e => setMes(Number(e.target.value))}
                            className="min-w-[150px]">
                            {MESES_COMPLETO.slice(1).map((m, i) => (
                                <option key={i + 1} value={i + 1}>{m}</option>
                            ))}
                        </CampoSelecao>
                    </div>
                </CardContent>
            </Card>

            {/* Mapa */}
            <Card>
                <CardContent>
                    {erro && <div className="mb-4"><Banner tom="perigo">{erro}</Banner></div>}
                    {loading ? (
                        <Carregando className="justify-center py-16">Carregando mapa...</Carregando>
                    ) : (
                        <MapaVisitas
                            pontos={pontos}
                            zoom={13}
                            onPinClick={abrirDetalhe}
                            modoExterno={modoExterno}
                            showToggle={false}
                        />
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                        Exibindo todos os pontos georreferenciados dos filtros selecionados.
                        Visitas sem coordenadas não aparecem no mapa.
                    </p>
                </CardContent>
            </Card>

            <VisitaDetalheModal
                open={modalAberto}
                onClose={fecharModal}
                visita={loadingDetalhe ? null : detalhe}
            />
        </div>
    );
}
