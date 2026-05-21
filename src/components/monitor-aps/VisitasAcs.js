import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCached, setCached } from '../../services/monitorApsCache';
import {
    Box, Button, Card, CardContent, Chip, CircularProgress,
    FormControl, Grid, InputLabel, MenuItem,
    Select, Table, TableBody, TableCell, TableHead, TableRow,
    TablePagination, Typography,
} from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import Chart from '../charts/ApexChartSafe';
import { monitorApsApi } from '../../services/monitorApsApi';
import VisitaDetalheModal from './VisitaDetalheModal';

const MapaVisitas = dynamic(() => import('./MapaVisitas'), { ssr: false });

const COR_DESFECHO   = { 1: '#168821', 2: '#E52207', 3: '#FF8C00', 4: '#888' };
const LABEL_DESFECHO = { 1: 'Realizada', 2: 'Recusada', 3: 'Ausente', 4: 'Não inf.' };
const MESES_LABEL    = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MESES_COMPLETO = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function MetricCard({ icon, titulo, valor, cor, sub }) {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent sx={{ px: 2.5, py: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ color: 'var(--lg-text-secondary)', fontWeight: 600 }}>
                            {titulo}
                        </Typography>
                        <Typography variant="h3" fontWeight="bold" mt={0.5} sx={{ color: cor }}>
                            {valor ?? '—'}
                        </Typography>
                        {sub && (
                            <Typography variant="caption" sx={{ color: 'var(--lg-text-muted)' }}>{sub}</Typography>
                        )}
                    </Box>
                    <Box sx={{
                        minWidth: 52, width: 52, height: 52, borderRadius: '50%',
                        bgcolor: cor + '22', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', flexShrink: 0,
                    }}>
                        <FeatherIcon icon={icon} color={cor} width="24" height="24" />
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}

function AbaBtn({ label, aba, atual, icon, onClick }) {
    const ativo = aba === atual;
    return (
        <Box onClick={onClick} sx={{
            px: 2, py: 0.8, cursor: 'pointer', borderRadius: 1,
            display: 'flex', alignItems: 'center', gap: 0.8,
            bgcolor: ativo ? '#1351B422' : 'transparent',
            color:   ativo ? '#1351B4' : 'var(--lg-text-secondary)',
            fontWeight: ativo ? 700 : 400, fontSize: 14,
            '&:hover': { bgcolor: '#1351B411' },
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

    const [resumo, setResumo]         = useState(null);
    const [agentes, setAgentes]       = useState([]);
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
    const [aba, setAba]               = useState('tabela');

    // Estado do modal de detalhe
    const [detalhe, setDetalhe]           = useState(null);
    const [loadingDetalhe, setLoadingDetalhe] = useState(false);
    const [modalAberto, setModalAberto]   = useState(false);

    // Carrega equipes uma única vez
    useEffect(() => {
        monitorApsApi.get('/config/equipes')
            .then(d => setEquipes(d.equipes ?? []))
            .catch(() => {});
    }, []);

    // Carrega resumo
    useEffect(() => {
        const params = new URLSearchParams({ ano, mes });
        if (ine) params.set('ine', ine);
        const key = `visitas_resumo_${params}`;
        const cached = getCached(key);
        if (cached) { setResumo(cached); return; }

        monitorApsApi.get(`/visitas/resumo?${params}`)
            .then(d => { setCached(key, d); setResumo(d); })
            .catch(() => {});
    }, [ano, mes, ine]);

    // Carrega estatísticas por agente
    useEffect(() => {
        const params = new URLSearchParams({ ano, mes });
        if (ine) params.set('ine', ine);
        const key = `visitas_agentes_${params}`;
        const cached = getCached(key);
        if (cached) { setAgentes(cached.agentes ?? []); return; }

        monitorApsApi.get(`/visitas/agentes?${params}`)
            .then(d => { setCached(key, d); setAgentes(d.agentes ?? []); })
            .catch(() => {});
    }, [ano, mes, ine]);

    // Carrega lista de visitas
    useEffect(() => {
        const params = new URLSearchParams({ ano, mes, page: page + 1, per_page: perPage });
        if (ine)            params.set('ine', ine);
        if (filtroAgente)   params.set('agente', filtroAgente);
        if (filtroDesfecho) params.set('desfecho', filtroDesfecho);
        if (filtroGeo)      params.set('has_geo', filtroGeo);

        setLoading(true);
        monitorApsApi.get(`/visitas/lista?${params}`)
            .then(d => { setVisitas(d.visitas ?? []); setTotalVisitas(d.total ?? 0); })
            .catch(() => setVisitas([]))
            .finally(() => setLoading(false));
    }, [ano, mes, ine, page, filtroAgente, filtroDesfecho, filtroGeo]);

    // Carrega pontos do mapa quando a aba muda para mapa
    useEffect(() => {
        if (aba !== 'mapa') return;
        const params = new URLSearchParams({ ano, mes });
        if (ine) params.set('ine', ine);
        const key = `visitas_mapa_${params}`;
        const cached = getCached(key);
        if (cached) { setPontosMapa(cached.pontos ?? []); return; }

        setLoadingMapa(true);
        monitorApsApi.get(`/visitas/mapa?${params}`)
            .then(d => { setCached(key, d); setPontosMapa(d.pontos ?? []); })
            .catch(() => setPontosMapa([]))
            .finally(() => setLoadingMapa(false));
    }, [aba, ano, mes, ine]);

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

    const totais = resumo?.totais ?? { total: 0, realizadas: 0, recusadas: 0, ausentes: 0, cidadaos: 0 };
    const pctReal = totais.total > 0 ? Math.round(totais.realizadas / totais.total * 100) : 0;

    const anosDisponiveis = useMemo(
        () => Array.from({ length: anoAtual - 2020 + 1 }, (_, i) => anoAtual - i),
        [anoAtual]
    );

    const selSx = { minWidth: 130 };

    return (
        <Box>
            {/* Header + Filtros */}
            <Box display="flex" justifyContent="space-between" alignItems="center"
                mb={3} mt="20px" flexWrap="wrap" gap={2}>
                <Typography variant="h5" fontWeight={700}>Visitas ACS / TACS</Typography>
                <Box display="flex" gap={1.5} flexWrap="wrap">
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Equipe</InputLabel>
                        <Select label="Equipe" value={ine}
                            onChange={e => { setIne(e.target.value); setPage(0); }}>
                            <MenuItem value="">Todas as equipes</MenuItem>
                            {equipes.map(eq => (
                                <MenuItem key={eq.nu_ine} value={eq.nu_ine}>{eq.no_equipe}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={selSx}>
                        <InputLabel>Ano</InputLabel>
                        <Select label="Ano" value={ano}
                            onChange={e => { setAno(Number(e.target.value)); setPage(0); }}>
                            {anosDisponiveis.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Mês</InputLabel>
                        <Select label="Mês" value={mes}
                            onChange={e => { setMes(Number(e.target.value)); setPage(0); }}>
                            {MESES_COMPLETO.slice(1).map((m, i) => (
                                <MenuItem key={i + 1} value={i + 1}>{m}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            {/* Cards de métricas */}
            <Grid container spacing={2} mb={3}>
                <Grid item xs={6} sm={3}>
                    <MetricCard icon="map-pin" titulo="Total de Visitas"
                        valor={totais.total.toLocaleString('pt-BR')} cor="#1351B4" />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <MetricCard icon="check-circle" titulo="Realizadas"
                        valor={`${totais.realizadas.toLocaleString('pt-BR')} (${pctReal}%)`} cor="#168821" />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <MetricCard icon="x-circle" titulo="Recusadas"
                        valor={totais.recusadas.toLocaleString('pt-BR')} cor="#E52207"
                        sub={totais.total > 0 ? `${Math.round(totais.recusadas / totais.total * 100)}%` : ''} />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <MetricCard icon="users" titulo="Cidadãos Distintos"
                        valor={totais.cidadaos.toLocaleString('pt-BR')} cor="#FF8C00" />
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
                        <Card>
                            <CardContent>
                                {/* Filtros inline da tabela */}
                                <Box display="flex" gap={1.5} mb={2} flexWrap="wrap">
                                    <FormControl size="small" sx={{ minWidth: 200 }}>
                                        <InputLabel>Agente</InputLabel>
                                        <Select label="Agente" value={filtroAgente}
                                            onChange={e => { setFiltroAgente(e.target.value); setPage(0); }}>
                                            <MenuItem value="">Todos os agentes</MenuItem>
                                            {agentes.map((a, i) => (
                                                <MenuItem key={i} value={a.agente}>{a.agente}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <FormControl size="small" sx={{ minWidth: 150 }}>
                                        <InputLabel>Desfecho</InputLabel>
                                        <Select label="Desfecho" value={filtroDesfecho}
                                            onChange={e => { setFiltroDesfecho(e.target.value); setPage(0); }}>
                                            <MenuItem value="">Todos</MenuItem>
                                            <MenuItem value="1">Realizada</MenuItem>
                                            <MenuItem value="2">Recusada</MenuItem>
                                            <MenuItem value="3">Ausente</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <FormControl size="small" sx={{ minWidth: 180 }}>
                                        <InputLabel>Geolocalização</InputLabel>
                                        <Select label="Geolocalização" value={filtroGeo}
                                            onChange={e => { setFiltroGeo(e.target.value); setPage(0); }}>
                                            <MenuItem value="">Todas</MenuItem>
                                            <MenuItem value="sim">Com geolocalização</MenuItem>
                                            <MenuItem value="nao">Sem geolocalização</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>

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
                                                            sx={{ fontSize: 10 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={LABEL_DESFECHO[v.desfecho_id] ?? '—'}
                                                            size="small"
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
                                                    <TableCell colSpan={7} align="center"
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
                        <Card>
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
                                            <TableCell align="right">Total</TableCell>
                                            <TableCell align="right">Realizadas</TableCell>
                                            <TableCell align="right">Recusadas</TableCell>
                                            <TableCell align="right">Ausentes</TableCell>
                                            <TableCell align="right">% Realiz.</TableCell>
                                            <TableCell align="right">Cidadãos</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {agentes.map((a, i) => (
                                            <TableRow key={i} hover>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600} noWrap>
                                                        {a.agente}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: 'var(--lg-text-muted)' }}>
                                                        {a.cbo_nome}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" noWrap>{a.equipe?.nome}</Typography>
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>
                                                    {a.total.toLocaleString('pt-BR')}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: '#168821' }}>
                                                    {a.realizadas.toLocaleString('pt-BR')}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: '#E52207' }}>
                                                    {a.recusadas.toLocaleString('pt-BR')}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: '#FF8C00' }}>
                                                    {a.ausentes.toLocaleString('pt-BR')}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Chip
                                                        label={`${a.pct_realizadas}%`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: a.pct_realizadas >= 70 ? '#16882122' : '#FF8C0022',
                                                            color:   a.pct_realizadas >= 70 ? '#168821' : '#FF8C00',
                                                            fontWeight: 700,
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">{a.cidadaos.toLocaleString('pt-BR')}</TableCell>
                                            </TableRow>
                                        ))}
                                        {agentes.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={8} align="center"
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
                        <Card>
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
                                    Exibindo até 2.000 pontos georreferenciados.
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
    );
}
