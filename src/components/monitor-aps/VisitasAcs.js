import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCached, setCached } from '../../services/monitorApsCache';
import { equipeLabel } from '../../utils/equipeLabel';
import {
    Box, Button, Card, CardContent, Chip, CircularProgress,
    FormControl, Grid, InputLabel, MenuItem,
    Select, Table, TableBody, TableCell, TableHead, TableRow,
    TablePagination, Typography,
} from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import { monitorApsApi } from '../../services/monitorApsApi';
import { useMonitorApsAudit } from '../../services/monitorApsAudit';
import VisitaDetalheModal from './VisitaDetalheModal';
import generateVisitasAcsPDF from '../../reports/visitasAcs';
import { useEquipesPermitidas } from '../../hooks/useEquipesPermitidas';

const MapaVisitas = dynamic(() => import('./MapaVisitas'), { ssr: false });

const COR_DESFECHO   = { 1: '#168821', 2: '#E52207', 3: '#FF8C00', 4: '#888' };
const LABEL_DESFECHO = { 1: 'Realizada', 2: 'Recusada', 3: 'Ausente', 4: 'Não inf.' };
const MESES_LABEL    = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MESES_COMPLETO = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const hexToRgb = (hex) => {
    const s = (hex || '').replace('#', '');
    if (s.length !== 6) return '79,142,247';
    const n = Number.parseInt(s, 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};

function MetricCard({ icon, titulo, valor, cor, sub, subFamily, subDestacado = false, glowSide = 'left' }) {
    return (
        <Card
            className="monitor-visitas-metric-card"
            sx={{
                height: '100%',
                borderRadius: 2.2,
                '--mv-accent': cor,
                '--mv-rgb': hexToRgb(cor),
                '--mv-glow-side': glowSide === 'left' ? '0%' : '100%',
                '--mv-glow-far': glowSide === 'left' ? '-22%' : '122%',
                '--mv-glow-opp': glowSide === 'left' ? '100%' : '0%',
            }}
        >
            <CardContent sx={{ px: '12px', py: 2 }}>
                <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                    <Box sx={{
                        minWidth: 52, width: 52, height: 52, borderRadius: '50%',
                        bgcolor: cor + '22', display: 'flex', alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <FeatherIcon icon={icon} color={cor} width="24" height="24" />
                    </Box>
                    <Box sx={{ minWidth: 0, width: '100%', textAlign: 'center' }}>
                        <Typography variant="subtitle2" sx={{ color: 'var(--lg-text-secondary)', fontWeight: 600 }}>
                            {titulo}
                        </Typography>
                        <Typography variant="h3" fontWeight="bold" mt={0.5} sx={{ color: cor }}>
                            {valor ?? '—'}
                        </Typography>
                        {sub && (
                            <Typography
                                display="block"
                                sx={{
                                    fontSize: subDestacado ? 14 : 12,
                                    fontWeight: subDestacado ? 700 : 400,
                                    color: subDestacado ? '#42A5F5' : 'var(--lg-text-muted)',
                                    borderBottom: '1px solid var(--lg-border)',
                                    pb: 0.5,
                                    mb: 0.5,
                                }}
                            >
                                {sub}
                            </Typography>
                        )}
                        {subFamily && (
                            <Typography
                                variant="caption"
                                display="block"
                                sx={{
                                    color: 'var(--lg-text-muted)',
                                    borderBottom: '1px solid var(--lg-border)',
                                    pb: 0.5,
                                }}
                            >
                                {subFamily}
                            </Typography>
                        )}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}

function AbaBtn({ label, aba, atual, icon, onClick }) {
    const ativo = aba === atual;
    return (
        <Box onClick={onClick} className={`monitor-visitas-tab${ativo ? ' is-active' : ''}`} sx={{
            px: 2, py: 0.8, cursor: 'pointer', borderRadius: 1,
            display: 'flex', alignItems: 'center', gap: 0.8,
            bgcolor: ativo ? 'rgba(var(--lg-accent-rgb),0.18)' : 'transparent',
            color:   ativo ? 'var(--lg-text-accent)' : 'var(--lg-text-secondary)',
            fontWeight: ativo ? 700 : 400, fontSize: 14,
            borderBottom: ativo ? '2px solid var(--lg-accent)' : '2px solid transparent',
            '&:hover': { bgcolor: 'rgba(var(--lg-accent-rgb),0.08)' },
        }}>
            <FeatherIcon icon={icon} width="16" height="16" />
            {label}
        </Box>
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
    const [agenteOpcoes, setAgenteOpcoes] = useState([]);
    const [visitas, setVisitas]        = useState([]);
    const [pontosMapa, setPontosMapa]  = useState([]);
    const [totalVisitas, setTotalVisitas] = useState(0);
    const [page, setPage]             = useState(0);
    const [perPage]                   = useState(50);
    const [filtroAgente, setFiltroAgente]     = useState('');
    const [filtroDesfecho, setFiltroDesfecho] = useState('');
    const [filtroGeo, setFiltroGeo]           = useState('');
    const [loading, setLoading]       = useState(false);
    const [loadingMapa, setLoadingMapa] = useState(false);
    const [printLoading, setPrintLoading] = useState(false);
    const [aba, setAba]               = useState('tabela');

    // Estado do modal de detalhe
    const [detalhe, setDetalhe]           = useState(null);
    const [loadingDetalhe, setLoadingDetalhe] = useState(false);
    const [modalAberto, setModalAberto]   = useState(false);

    useMonitorApsAudit('/monitor-aps/visitas', 'Monitor APS - Visitas ACS', {
        ano, mes, equipe: ine, agente: filtroAgente, desfecho: filtroDesfecho, geo: filtroGeo,
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
            .catch(() => {});
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

    useEffect(() => {
        setFiltroAgente('');
    }, [ine, ano, mes]);

    // Carrega resumo
    useEffect(() => {
        const params = new URLSearchParams({ ano, mes });
        if (ine)            params.set('ine', ine);
        if (filtroAgente)   params.set('agente', filtroAgente);
        if (filtroDesfecho) params.set('desfecho', filtroDesfecho);
        if (filtroGeo)      params.set('has_geo', filtroGeo);
        const key = `visitas_resumo_${params}`;
        const cached = getCached(key);
        if (cached) { setResumo(cached); return; }

        const ctrl = new AbortController();
        monitorApsApi.get(`/visitas/resumo?${params}`, { signal: ctrl.signal })
            .then(d => { setCached(key, d); setResumo(d); })
            .catch(() => {});
        return () => ctrl.abort();
    }, [ano, mes, ine, filtroAgente, filtroDesfecho, filtroGeo]);

    // Carrega estatísticas por agente (filtrado para a aba "Por Agente")
    useEffect(() => {
        const params = new URLSearchParams({ ano, mes });
        if (ine)            params.set('ine', ine);
        if (filtroAgente)   params.set('agente', filtroAgente);
        if (filtroDesfecho) params.set('desfecho', filtroDesfecho);
        if (filtroGeo)      params.set('has_geo', filtroGeo);
        const key = `visitas_agentes_${params}`;
        const cached = getCached(key);
        if (cached) { setAgentes(cached.agentes ?? []); return; }

        const ctrl = new AbortController();
        monitorApsApi.get(`/visitas/agentes?${params}`, { signal: ctrl.signal })
            .then(d => { setCached(key, d); setAgentes(d.agentes ?? []); })
            .catch(() => {});
        return () => ctrl.abort();
    }, [ano, mes, ine, filtroAgente, filtroDesfecho, filtroGeo]);

    // Carrega lista de visitas
    useEffect(() => {
        const params = new URLSearchParams({ ano, mes, page: page + 1, per_page: perPage });
        if (ine)            params.set('ine', ine);
        if (filtroAgente)   params.set('agente', filtroAgente);
        if (filtroDesfecho) params.set('desfecho', filtroDesfecho);
        if (filtroGeo)      params.set('has_geo', filtroGeo);

        const ctrl = new AbortController();
        setLoading(true);
        monitorApsApi.get(`/visitas/lista?${params}`, { signal: ctrl.signal })
            .then(d => { setVisitas(d.visitas ?? []); setTotalVisitas(d.total ?? 0); })
            .catch(e => { if (e?.code !== 'ERR_CANCELED') setVisitas([]); })
            .finally(() => setLoading(false));
        return () => ctrl.abort();
    }, [ano, mes, ine, page, filtroAgente, filtroDesfecho, filtroGeo]);

    // Carrega pontos do mapa quando a aba muda para mapa
    useEffect(() => {
        if (aba !== 'mapa') return;
        const params = new URLSearchParams({ ano, mes });
        if (ine)            params.set('ine', ine);
        if (filtroAgente)   params.set('agente', filtroAgente);
        if (filtroDesfecho) params.set('desfecho', filtroDesfecho);
        if (filtroGeo)      params.set('has_geo', filtroGeo);
        const key = `visitas_mapa_all_${params}`;
        const cached = getCached(key);
        if (cached) { setPontosMapa(cached.pontos ?? []); return; }

        const ctrl = new AbortController();
        setLoadingMapa(true);
        monitorApsApi.get(`/visitas/mapa?${params}`, { signal: ctrl.signal })
            .then(d => { setCached(key, d); setPontosMapa(d.pontos ?? []); })
            .catch(e => { if (e?.code !== 'ERR_CANCELED') setPontosMapa([]); })
            .finally(() => setLoadingMapa(false));
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
                const params = new URLSearchParams({ ano, mes, page: 1, per_page: Math.min(totalVisitas, 5000) });
                if (ine)            params.set('ine', ine);
                if (filtroAgente)   params.set('agente', filtroAgente);
                if (filtroDesfecho) params.set('desfecho', filtroDesfecho);
                if (filtroGeo)      params.set('has_geo', filtroGeo);
                const d = await monitorApsApi.get(`/visitas/lista?${params}`);
                allVisitas = d.visitas ?? [];
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
                    filtroAgente,
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

    const selSx = {
        minWidth: 130,
        '& .MuiOutlinedInput-root': {
            color: 'var(--lg-text-primary)',
            background: 'var(--lg-glass-input)',
            borderRadius: 1.5,
            '& fieldset': { borderColor: 'var(--lg-border-input)' },
            '&:hover fieldset': { borderColor: 'var(--lg-border-input-focus)' },
            '&.Mui-focused fieldset': { borderColor: 'var(--lg-border-input-focus)', boxShadow: 'var(--lg-focus-ring)' },
        },
        '& .MuiInputLabel-root': { color: 'var(--lg-text-secondary)' },
        '& .MuiSvgIcon-root': { color: 'var(--lg-text-secondary)' },
    };

    return (
        <Box className="dashboard-neon-page monitor-visitas-page">
            <Box className="dashboard-neon-home monitor-visitas-surface">
            {/* Header + Filtros */}
            <Box display="flex" justifyContent="space-between" alignItems="center"
                mb={3} mt="20px" flexWrap="wrap" gap={2}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Typography variant="h5" fontWeight={700}>Visitas ACS / TACS</Typography>
                    <Button
                        variant="outlined"
                        size="small"
                        disabled={printLoading || !resumo}
                        onClick={handlePrint}
                        startIcon={<FeatherIcon icon={printLoading ? 'loader' : 'printer'} width={15} height={15} />}
                        sx={{
                            textTransform: 'none',
                            borderRadius: 1.5,
                            whiteSpace: 'nowrap',
                            borderColor: 'var(--lg-border-input-focus)',
                            color: 'var(--lg-text-accent)',
                            background: 'var(--lg-glass-input)',
                            '&:hover': { borderColor: 'var(--lg-accent)', background: 'var(--lg-glass-input-focus)' },
                        }}
                    >
                        {printLoading ? 'Gerando...' : `PDF — ${aba === 'tabela' ? 'Visitas' : aba === 'agentes' ? 'Por Agente' : 'Mapa'}`}
                    </Button>
                </Box>
                <Box display="flex" gap={1.5} flexWrap="wrap">
                    <FormControl size="small" sx={{ ...selSx, minWidth: 200 }}>
                        <InputLabel>Equipe</InputLabel>
                        <Select label="Equipe" value={ine}
                            onChange={e => { setIne(e.target.value); setPage(0); }}
                            disabled={isRestrito && equipes.length === 1}
                            renderValue={(val) => {
                                if (!val) return '';
                                const eq = equipes.find(e => e.nu_ine === val);
                                return eq ? equipeLabel(eq.no_equipe) : val;
                            }}>
                            <MenuItem value="">
                                {isRestrito && equipes.length > 1 ? 'Todas as minhas equipes' : 'Todas as equipes'}
                            </MenuItem>
                            {equipes.map(eq => (
                                <MenuItem key={eq.nu_ine} value={eq.nu_ine}>{equipeLabel(eq.no_equipe)}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {isRestrito && !loadingPerms && equipes.length === 0 && (
                        <Box sx={{ p: 2, border: '1px solid #FF8C00', borderRadius: 2, bgcolor: '#FF8C0011' }}>
                            <Typography variant="body2" color="warning.dark">
                                Nenhuma equipe autorizada para o seu usuário. Entre em contato com o administrador.
                            </Typography>
                        </Box>
                    )}
                    <FormControl size="small" sx={selSx}>
                        <InputLabel>Ano</InputLabel>
                        <Select label="Ano" value={ano}
                            onChange={e => { setAno(Number(e.target.value)); setPage(0); }}>
                            {anosDisponiveis.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ ...selSx, minWidth: 140 }}>
                        <InputLabel>Mês</InputLabel>
                        <Select label="Mês" value={mes}
                            onChange={e => { setMes(Number(e.target.value)); setPage(0); }}>
                            {MESES_COMPLETO.slice(1).map((m, i) => (
                                <MenuItem key={i + 1} value={i + 1}>{m}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ ...selSx, minWidth: 160 }}>
                        <InputLabel>Agente</InputLabel>
                        <Select label="Agente" value={filtroAgente}
                            onChange={e => { setFiltroAgente(e.target.value); setPage(0); }}>
                            <MenuItem value="">Todos os agentes</MenuItem>
                            {agenteOpcoes.map((a, i) => (
                                <MenuItem key={i} value={a.agente}>{a.agente}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ ...selSx, minWidth: 140 }}>
                        <InputLabel>Desfecho</InputLabel>
                        <Select label="Desfecho" value={filtroDesfecho}
                            className="monitor-visitas-select-desfecho"
                            onChange={e => { setFiltroDesfecho(e.target.value); setPage(0); }}>
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="1">Realizada</MenuItem>
                            <MenuItem value="2">Recusada</MenuItem>
                            <MenuItem value="3">Ausente</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ ...selSx, minWidth: 170 }}>
                        <InputLabel>Geolocalização</InputLabel>
                        <Select label="Geolocalização" value={filtroGeo}
                            onChange={e => { setFiltroGeo(e.target.value); setPage(0); }}>
                            <MenuItem value="">Todas</MenuItem>
                            <MenuItem value="sim">Com geolocalização</MenuItem>
                            <MenuItem value="nao">Sem geolocalização</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            {/* Cards de métricas */}
            <Grid container columnSpacing={0.0625} rowSpacing={1} mb={3}>
                <Grid item xs={6} sm={4} md={3} lg={2}>
                    <MetricCard icon="map-pin" titulo="Total de Visitas"
                        valor={totais.total.toLocaleString('pt-BR')} cor="#1351B4" glowSide="left"
                        sub={temDomicilios && totais.domicilios_visitados != null
                            ? `${totais.domicilios_visitados.toLocaleString('pt-BR')} domicílios visitados`
                            : null} />
                </Grid>
                <Grid item xs={6} sm={4} md={3} lg={2}>
                    <MetricCard icon="check-circle" titulo="Realizadas"
                        valor={`${totais.realizadas.toLocaleString('pt-BR')} (${pctReal}%)`} cor="#168821" glowSide="right"
                        sub={temDomicilios && totais.domicilios_acompanhados != null
                            ? `${totais.domicilios_acompanhados.toLocaleString('pt-BR')} (${pctDomAcomp}%) - domicílios acompanhados`
                            : null}
                        subDestacado
                        subFamily={temDomiciliosComMoradores
                            ? `${domiciliosPendentes.toLocaleString('pt-BR')} (${pctDomPendentes}%) - domicílios pendentes`
                            : null} />
                </Grid>
                <Grid item xs={6} sm={4} md={3} lg={2}>
                    <MetricCard icon="x-circle" titulo="Recusadas"
                        valor={`${totais.recusadas.toLocaleString('pt-BR')} (${pctRecusadas}%)`} cor="#E52207" glowSide="left"
                        subFamily={temDomicilios && totais.domicilios_recusados != null
                            ? `${totais.domicilios_recusados.toLocaleString('pt-BR')} (${pctDomRecus}%) - domicílios`
                            : null} />
                </Grid>
                <Grid item xs={6} sm={4} md={3} lg={2}>
                    <MetricCard icon="user-x" titulo="Ausentes"
                        valor={`${totais.ausentes.toLocaleString('pt-BR')} (${pctAusentes}%)`} cor="#FF8C00" glowSide="left"
                        subFamily={temDomicilios && totais.domicilios_ausentes != null
                            ? `${totais.domicilios_ausentes.toLocaleString('pt-BR')} (${pctDomAusent}%) - domicílios`
                            : null} />
                </Grid>
                <Grid item xs={6} sm={4} md={3} lg={2}>
                    <MetricCard icon="home" titulo="Domicílios Cadastrados"
                        valor={(totais.domicilios_total ?? 0).toLocaleString('pt-BR')} cor="#7B2D8B" glowSide="left"
                        sub={temDomicilios ? `${(totais.domicilios_com_moradores ?? 0).toLocaleString('pt-BR')} (${pctDomMoradores}%) - com moradores` : null}
                        subFamily={temDomicilios ? `${(totais.domicilios_casa_vazia ?? 0).toLocaleString('pt-BR')} (${pctDomCasaVazia}%) - casa vazia` : null} />
                </Grid>
                <Grid item xs={6} sm={4} md={3} lg={2}>
                    <MetricCard icon="home" titulo="Domicílios FA"
                        valor={(totais.domicilios_fa ?? 0).toLocaleString('pt-BR')} cor="#555" glowSide="right"
                        sub="Fora de Área" />
                </Grid>
            </Grid>

            {/* Abas */}
            <Box display="flex" gap={0.5} mb={2}
                sx={{ borderBottom: '1px solid var(--lg-border)', pb: 0.5 }}>
                <AbaBtn label="Visitas"    aba="tabela"  atual={aba} icon="list"  onClick={() => setAba('tabela')} />
                <AbaBtn label="Por Agente" aba="agentes" atual={aba} icon="user"  onClick={() => setAba('agentes')} />
                <AbaBtn label="Mapa"       aba="mapa"    atual={aba} icon="map"   onClick={() => setAba('mapa')} />
            </Box>

            {loading && aba !== 'mapa' ? (
                <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
            ) : (
                <>
                    {/* ── ABA: Tabela de visitas ── */}
                    {aba === 'tabela' && (
                        <Card className="monitor-visitas-panel">
                            <CardContent>
                                <Box sx={{ overflowX: 'auto' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{
                                                '& th': {
                                                    fontWeight: 700, fontSize: 11,
                                                    color: 'var(--lg-text-muted)',
                                                    textTransform: 'uppercase',
                                                    borderBottom: '2px solid var(--lg-border)',
                                                },
                                            }}>
                                                <TableCell>Data / Hora</TableCell>
                                                <TableCell>Cidadão</TableCell>
                                                <TableCell>Agente</TableCell>
                                                <TableCell>Equipe</TableCell>
                                                <TableCell>Instrumento</TableCell>
                                                <TableCell align="center">Geolocalização</TableCell>
                                                <TableCell align="center">Desfecho</TableCell>
                                                <TableCell align="center">Ação</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {visitas.map(v => (
                                                <TableRow key={v.id} hover>
                                                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                                                        {v.data ? (() => {
                                                            const d = new Date(v.data.length === 10 ? v.data + 'T12:00:00' : v.data).toLocaleDateString('pt-BR');
                                                            const h = v.hora != null ? ` ${String(v.hora).padStart(2, '0')}:00` : '';
                                                            return d + h;
                                                        })() : '—'}
                                                    </TableCell>
                                                    <TableCell sx={{ maxWidth: 200 }}>
                                                        <Typography variant="body2" noWrap title={v.cidadao ?? ''}>
                                                            {v.cidadao ?? '—'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={600} noWrap>
                                                            {v.agente}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: 'var(--lg-text-muted)' }}>
                                                            {v.cbo}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" noWrap>
                                                            {v.equipe?.nome}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: 12, maxWidth: 160 }}>
                                                        <Typography variant="caption" noWrap display="block">
                                                            {v.instrumento}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={v.has_geo ? 'Sim' : 'Não'}
                                                            size="small"
                                                            color={v.has_geo ? 'success' : 'default'}
                                                            icon={<FeatherIcon icon={v.has_geo ? 'map-pin' : 'map-pin'} width="12" height="12" />}
                                                            className={`monitor-visitas-chip-geo ${v.has_geo ? 'is-yes' : 'is-no'}`}
                                                            sx={{ fontSize: 10 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={LABEL_DESFECHO[v.desfecho_id] ?? '—'}
                                                            size="small"
                                                            className="monitor-visitas-chip-status"
                                                            sx={{
                                                                bgcolor: (COR_DESFECHO[v.desfecho_id] ?? '#888') + '22',
                                                                color:   COR_DESFECHO[v.desfecho_id] ?? '#888',
                                                                fontWeight: 700, fontSize: 11,
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => abrirDetalhe(v.id)}
                                                            sx={{ minWidth: 48, fontSize: 11 }}
                                                        >
                                                            Ver
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {visitas.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={8} align="center"
                                                        sx={{ py: 4, color: 'var(--lg-text-muted)' }}>
                                                        Nenhuma visita encontrada para os filtros selecionados.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </Box>

                                <TablePagination
                                    component="div"
                                    count={totalVisitas}
                                    page={page}
                                    rowsPerPage={perPage}
                                    rowsPerPageOptions={[perPage]}
                                    onPageChange={(_, p) => setPage(p)}
                                    labelDisplayedRows={({ from, to, count }) =>
                                        `${from}–${to} de ${count.toLocaleString('pt-BR')}`}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* ── ABA: Por agente ── */}
                    {aba === 'agentes' && (
                        <Card className="monitor-visitas-panel">
                            <CardContent>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{
                                            '& th': {
                                                fontWeight: 700, fontSize: 11,
                                                color: 'var(--lg-text-muted)',
                                                textTransform: 'uppercase',
                                                borderBottom: '2px solid var(--lg-border)',
                                            },
                                        }}>
                                            <TableCell>Agente</TableCell>
                                            <TableCell>Equipe</TableCell>
                                            <TableCell align="right">Cidadãos</TableCell>
                                            <TableCell align="right">Realizadas</TableCell>
                                            <TableCell align="right">Recusadas</TableCell>
                                            <TableCell align="right">Ausentes</TableCell>
                                            <TableCell align="right">Total</TableCell>
                                            <TableCell align="right">Domicílios</TableCell>
                                            <TableCell align="right">Com moradores</TableCell>
                                            <TableCell align="right">Casa vazia</TableCell>
                                            <TableCell align="right">Dom. Visitados</TableCell>
                                            <TableCell align="right">Dom. Ausentes</TableCell>
                                            <TableCell align="right">Dom. Recusados</TableCell>
                                            <TableCell align="right">% Domicílios Acomp.</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {agentes.map((a, i) => (
                                            <TableRow key={i} hover>
                                                <TableCell sx={{ maxWidth: 240 }}>
                                                    <Typography variant="body2" fontWeight={600} noWrap
                                                        title={a.agente}
                                                        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 }}>
                                                        {(a.agente ?? '').length > 30 ? (a.agente ?? '').slice(0, 30) + '…' : a.agente}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: 'var(--lg-text-muted)' }}>
                                                        {a.cbo_nome}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" noWrap title={equipeLabel(a.equipe?.nome)}>{(() => { const equipeNome = equipeLabel(a.equipe?.nome) ?? ''; const equipeVisivel = equipeNome.includes(' - ') ? equipeNome.split(' - ').slice(1).join(' - ') : equipeNome; return equipeVisivel.length > 20 ? equipeVisivel.slice(0, 20) + '…' : equipeVisivel; })()}</Typography>
                                                </TableCell>
                                                <TableCell align="right">{a.cidadaos.toLocaleString('pt-BR')}</TableCell>
                                                <TableCell align="right" sx={{ color: '#168821' }}>
                                                    {a.realizadas.toLocaleString('pt-BR')}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: '#E52207' }}>
                                                    {a.recusadas.toLocaleString('pt-BR')}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: '#FF8C00' }}>
                                                    {a.ausentes.toLocaleString('pt-BR')}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>
                                                    {a.total.toLocaleString('pt-BR')}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {a.domicilios_total != null ? a.domicilios_total.toLocaleString('pt-BR') : '—'}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {a.domicilios_com_moradores != null ? a.domicilios_com_moradores.toLocaleString('pt-BR') : '—'}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {a.domicilios_casa_vazia != null ? a.domicilios_casa_vazia.toLocaleString('pt-BR') : '—'}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {a.domicilios_visitados != null ? a.domicilios_visitados.toLocaleString('pt-BR') : '—'}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: '#FF8C00' }}>
                                                    {a.domicilios_ausentes_visita != null ? a.domicilios_ausentes_visita.toLocaleString('pt-BR') : '—'}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: '#E52207' }}>
                                                    {a.domicilios_recusados_visita != null ? a.domicilios_recusados_visita.toLocaleString('pt-BR') : '—'}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {a.domicilios_acompanhados != null ? (
                                                        <Box display="inline-flex" alignItems="center" gap={0.5} justifyContent="flex-end">
                                                            <Typography variant="body2" fontWeight={700}>
                                                                {a.domicilios_acompanhados.toLocaleString('pt-BR')}
                                                            </Typography>
                                                            {a.pct_dom_acompanhados != null && (
                                                                <Chip
                                                                    label={`${a.pct_dom_acompanhados}%`}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: a.pct_dom_acompanhados >= 70 ? '#16882122' : '#FF8C0022',
                                                                        color:   a.pct_dom_acompanhados >= 70 ? '#168821'   : '#FF8C00',
                                                                        fontWeight: 700,
                                                                    }}
                                                                />
                                                            )}
                                                        </Box>
                                                    ) : '—'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {agentes.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={14} align="center"
                                                    sx={{ py: 4, color: 'var(--lg-text-muted)' }}>
                                                    Nenhum agente encontrado para o período.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {/* ── ABA: Mapa ── */}
                    {aba === 'mapa' && (
                        <Card className="monitor-visitas-panel">
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                                    <Typography variant="subtitle1" fontWeight={700}>
                                        Mapa de Visitas{pontosMapa.length > 0
                                            ? ` — ${pontosMapa.length.toLocaleString('pt-BR')} pontos`
                                            : ''}
                                    </Typography>
                                </Box>

                                {loadingMapa ? (
                                    <Box display="flex" justifyContent="center" py={6}>
                                        <CircularProgress />
                                    </Box>
                                ) : (
                                    <MapaVisitas
                                        pontos={pontosMapa}
                                        zoom={13}
                                        equipes={equipes}
                                        ineAtiva={ine}
                                        onPinClick={abrirDetalhe}
                                    />
                                )}

                                <Typography variant="caption"
                                    sx={{ color: 'var(--lg-text-muted)', display: 'block', mt: 1 }}>
                                    Exibindo todos os pontos georreferenciados dos filtros selecionados.
                                    Visitas sem coordenadas não aparecem no mapa.
                                </Typography>
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
            </Box>
        </Box>
    );
}
