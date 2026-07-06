import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Box, Button, Card, CardContent, CircularProgress, FormControl,
    Grid, InputLabel, MenuItem, Select, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import { painelEsusApi } from '../../services/painelEsusApi';
import generateFilaEsusPDF from '../../reports/filaEsus';

function ContadorCard({ icon, titulo, valor, cor }) {
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
                    </Box>
                    <Box sx={{ minWidth: 48, width: 48, height: 48, borderRadius: '50%', bgcolor: cor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FeatherIcon icon={icon} color={cor} width="22" height="22" />
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}

const selSx = {
    '& .MuiOutlinedInput-root': { background: 'var(--lg-glass-input)' },
};

const hojeIso = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const MAX_DIAS_INTERVALO = 30;

const addDiasIso = (iso, dias) => {
    const d = new Date(`${iso}T12:00:00`);
    d.setDate(d.getDate() + dias);
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const diffDias = (inicio, fim) =>
    Math.round((new Date(`${fim}T12:00:00`) - new Date(`${inicio}T12:00:00`)) / 86400000);

const normalizaTexto = (s) => (s ?? '').toString().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');

const somenteDigitos = (s) => (s ?? '').toString().replace(/\D/g, '');

export default function FilaEsus() {
    const [cnes,            setCnes]            = useState(null);
    const [unidades,        setUnidades]        = useState([]);
    const [loadingUnidades, setLoadingUnidades] = useState(true);
    const [erroUnidades,    setErroUnidades]    = useState('');
    const [equipes,         setEquipes]         = useState([]);
    const [restrito,        setRestrito]        = useState(false);
    const [profissionais,   setProfissionais]   = useState([]);
    const [equipeId,        setEquipeId]        = useState('');
    const [profId,          setProfId]          = useState('');
    const [dataInicio,      setDataInicio]      = useState(hojeIso());
    const [dataFim,         setDataFim]         = useState(hojeIso());
    const [busca,           setBusca]           = useState('');
    const [situacao,        setSituacao]        = useState('aguardando');
    const [dados,           setDados]           = useState(null);
    const [loading,         setLoading]         = useState(false);
    const [erro,            setErro]            = useState(null);
    const [printLoading,    setPrintLoading]    = useState(false);
    const abortRef = useRef(null);

    // Carrega unidades no mount — auto-seleciona se houver apenas 1
    useEffect(() => {
        const ac = new AbortController();
        setLoadingUnidades(true);
        painelEsusApi.unidades({ signal: ac.signal })
            .then(d => {
                const lista = d.unidades ?? [];
                setUnidades(lista);
                if (lista.length === 1) setCnes(lista[0].cnes);
            })
            .catch(e => {
                if (e?.code === 'ERR_CANCELED') return;
                setErroUnidades('Não foi possível carregar as unidades de saúde.');
            })
            .finally(() => setLoadingUnidades(false));
        return () => ac.abort();
    }, []);

    // Carrega filtros quando CNES ou data muda
    useEffect(() => {
        if (!cnes) return;
        const ac = new AbortController();
        const params = { cnes, data_inicio: dataInicio, data_fim: dataFim };
        if (equipeId) params.equipe = equipeId;
        painelEsusApi.filtros(params, { signal: ac.signal })
            .then(d => {
                const eqs = d.equipes ?? [];
                setEquipes(eqs);
                setProfissionais(d.profissionais ?? []);
                setRestrito(Boolean(d.restrito));
                // RT restrito a uma única equipe: pré-seleciona (select fica desabilitado)
                if (d.restrito && eqs.length === 1) setEquipeId(eqs[0].id);
            })
            .catch(e => {
                if (e?.code === 'ERR_CANCELED' || e?.message === 'canceled') return;
                setErro('Erro no servidor ao carregar os filtros de equipe e profissional.');
            });
        return () => ac.abort();
    }, [cnes, dataInicio, dataFim, equipeId]);

    // Intervalo máximo de 30 dias: ajusta a outra data quando o limite é excedido
    const handleDataInicio = (valor) => {
        const v = valor || hojeIso();
        setDataInicio(v);
        if (dataFim < v) setDataFim(v);
        else if (diffDias(v, dataFim) > MAX_DIAS_INTERVALO) setDataFim(addDiasIso(v, MAX_DIAS_INTERVALO));
        setEquipeId('');
        setProfId('');
    };

    const handleDataFim = (valor) => {
        const v = valor || hojeIso();
        setDataFim(v);
        if (v < dataInicio) setDataInicio(v);
        else if (diffDias(dataInicio, v) > MAX_DIAS_INTERVALO) setDataInicio(addDiasIso(v, -MAX_DIAS_INTERVALO));
        setEquipeId('');
        setProfId('');
    };

    // Busca local por nome, CPF ou CNS sobre a lista carregada
    const listaFiltrada = useMemo(() => {
        const rows = dados?.aguardando ?? [];
        const q = busca.trim();
        if (!q) return rows;
        const qTexto = normalizaTexto(q);
        const qDigitos = somenteDigitos(q);
        return rows.filter(r =>
            normalizaTexto(r.cidadao).includes(qTexto) ||
            (qDigitos && (
                somenteDigitos(r.cpf).includes(qDigitos) ||
                somenteDigitos(r.cns).includes(qDigitos)
            ))
        );
    }, [dados, busca]);

    const handlePrint = async () => {
        setPrintLoading(true);
        try {
            const equipeNome      = equipes.find(e => String(e.id) === String(equipeId))?.nome ?? '';
            const profissionalNome = profissionais.find(p => String(p.id) === String(profId))?.nome ?? '';
            await generateFilaEsusPDF({
                dados: { ...dados, aguardando: listaFiltrada },
                unidadeNome: unidades.find(u => u.cnes === cnes)?.nome ?? '',
                cnes,
                dataFiltro: dataInicio,
                dataFim,
                situacao,
                equipeNome,
                profissionalNome,
            });
        } finally {
            setPrintLoading(false);
        }
    };

    const carregarFila = useCallback(() => {
        if (!cnes) return;
        if (abortRef.current) abortRef.current.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        setLoading(true);
        setErro(null);
        const params = { cnes, data_inicio: dataInicio, data_fim: dataFim, situacao };
        if (equipeId) params.equipe = equipeId;
        if (profId)   params.profissional = profId;
        painelEsusApi.fila(params, { signal: ac.signal })
            .then(d => setDados(d))
            .catch(e => {
                if (e.name === 'CanceledError' || e.name === 'AbortError') return;
                setErro('Erro ao carregar a fila. Tente novamente.');
            })
            .finally(() => setLoading(false));
    }, [cnes, dataInicio, dataFim, equipeId, profId, situacao]);

    // Re-fetch quando qualquer filtro muda
    useEffect(() => {
        carregarFila();
        return () => { if (abortRef.current) abortRef.current.abort(); };
    }, [carregarFila]);

    if (loadingUnidades) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                <CircularProgress />
            </Box>
        );
    }

    if (erroUnidades) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                <Typography sx={{ color: '#E52207' }}>{erroUnidades}</Typography>
            </Box>
        );
    }

    const unidadeAtual = unidades.find(u => u.cnes === cnes);

    return (
        <Box>
            {/* Nome da unidade selecionada */}
            {unidadeAtual && (
                <Typography variant="subtitle2" sx={{ color: 'var(--lg-text-muted)', mb: 2 }}>
                    <span>{unidadeAtual.nome}</span>
                    {' — CNES '}
                    {cnes}
                </Typography>
            )}

            {/* Estado: aguardando seleção */}
            {!cnes && unidades.length <= 1 && (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                    <Typography sx={{ color: 'var(--lg-text-muted)' }}>
                        Selecione uma unidade de saúde para visualizar a fila.
                    </Typography>
                </Box>
            )}

            {/* Conteúdo principal */}
            {(cnes || unidades.length > 1) && (
                <>
                    {/* Filtros */}
                    <Card sx={{ mt: '10px', mb: 3 }}>
                        <CardContent>
                            <Grid container spacing={2} alignItems="center">
                                {unidades.length > 1 && (
                                    <Grid item xs={12} sm={unidades.length > 1 ? 2 : 2.4}>
                                        <FormControl fullWidth size="small" sx={selSx}>
                                            <InputLabel>Unidade de Saúde</InputLabel>
                                            <Select
                                                label="Unidade de Saúde"
                                                value={cnes ?? ''}
                                                MenuProps={{ keepMounted: true }}
                                                onChange={e => {
                                                    setCnes(e.target.value || null);
                                                    setEquipeId('');
                                                    setProfId('');
                                                    setDados(null);
                                                }}
                                            >
                                                <MenuItem value=""><em>Selecione uma unidade</em></MenuItem>
                                                {unidades.map(u => (
                                                    <MenuItem key={u.cnes} value={u.cnes}>{u.nome}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                )}
                                {cnes && (
                                <Grid item xs={12} sm={unidades.length > 1 ? 2 : 2.4}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Data inicial"
                                        type="date"
                                        value={dataInicio}
                                        onChange={e => handleDataInicio(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        sx={selSx}
                                    />
                                </Grid>
                                )}
                                {cnes && (
                                <Grid item xs={12} sm={unidades.length > 1 ? 2 : 2.4}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Data final"
                                        type="date"
                                        value={dataFim}
                                        onChange={e => handleDataFim(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        sx={selSx}
                                    />
                                </Grid>
                                )}
                                {cnes && (
                                <Grid item xs={12} sm={unidades.length > 1 ? 2 : 2.4}>
                                    <FormControl fullWidth size="small" sx={selSx}>
                                        <InputLabel>Situação</InputLabel>
                                        <Select
                                            label="Situação"
                                            value={situacao}
                                            onChange={e => setSituacao(e.target.value)}
                                        >
                                            <MenuItem value="aguardando">Em espera</MenuItem>
                                            <MenuItem value="atendidos">Atendidos</MenuItem>
                                            <MenuItem value="nao_aguardaram">Não aguardaram</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                )}
                                {cnes && (
                                <Grid item xs={12} sm={unidades.length > 1 ? 2 : 2.4}>
                                    <FormControl fullWidth size="small" sx={selSx}>
                                        <InputLabel>Equipe</InputLabel>
                                        <Select
                                            label="Equipe"
                                            value={equipeId}
                                            disabled={restrito && equipes.length === 1}
                                            onChange={e => { setEquipeId(e.target.value); setProfId(''); }}
                                        >
                                            {!(restrito && equipes.length === 1) && (
                                                <MenuItem value="">
                                                    <em>{restrito ? 'Todas as minhas equipes' : 'Todas'}</em>
                                                </MenuItem>
                                            )}
                                            {equipes.map(eq => (
                                                <MenuItem key={eq.id} value={eq.id}>{eq.nome}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                )}
                                {cnes && (
                                <Grid item xs={12} sm={unidades.length > 1 ? 2 : 2.4}>
                                    <FormControl fullWidth size="small" sx={selSx}>
                                        <InputLabel>Profissional</InputLabel>
                                        <Select
                                            label="Profissional"
                                            value={profId}
                                            onChange={e => setProfId(e.target.value)}
                                        >
                                            <MenuItem value=""><em>Todos</em></MenuItem>
                                            {profissionais.map(p => (
                                                <MenuItem key={p.id} value={p.id}>{p.nome}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                )}
                            </Grid>
                        </CardContent>
                    </Card>

                    {cnes && (
                    <>
                    {/* Contadores */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <ContadorCard icon="clock" titulo="Em Espera" valor={dados?.contadores?.aguardando} cor="#1351B4" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <ContadorCard icon="check-circle" titulo="Atendidos" valor={dados?.contadores?.atendidos} cor="#168821" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <ContadorCard icon="user-x" titulo="Não Aguardaram" valor={dados?.contadores?.nao_aguardaram} cor="#E52207" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <ContadorCard icon="activity" titulo="Tempo Médio" valor={dados?.contadores?.tempo_medio_espera} cor="#7A4CC2" />
                        </Grid>
                    </Grid>

                    {/* Lista de atendimentos */}
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} sx={{ mb: 2 }}>
                                <Typography variant="h6" fontWeight={700}>
                                    {situacao === 'atendidos' ? 'Cidadãos Atendidos' : situacao === 'nao_aguardaram' ? 'Não Aguardaram' : 'Aguardando Atendimento'}
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                                    <TextField
                                        size="small"
                                        placeholder="Buscar por nome, CPF ou CNS"
                                        value={busca}
                                        onChange={e => setBusca(e.target.value)}
                                        sx={{ ...selSx, minWidth: 260 }}
                                        InputProps={{
                                            startAdornment: (
                                                <Box component="span" sx={{ display: 'flex', mr: 1, color: 'var(--lg-text-muted)' }}>
                                                    <FeatherIcon icon="search" width={16} height={16} />
                                                </Box>
                                            ),
                                        }}
                                    />
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        disabled={printLoading || loading || !dados}
                                        onClick={handlePrint}
                                        startIcon={<FeatherIcon icon={printLoading ? 'loader' : 'printer'} width={15} height={15} />}
                                        sx={{ textTransform: 'none', borderRadius: 1.5 }}
                                    >
                                        {printLoading ? 'Gerando...' : 'Imprimir PDF'}
                                    </Button>
                                </Box>
                            </Box>

                            {loading && (
                                <Box display="flex" justifyContent="center" py={4}>
                                    <CircularProgress size={32} />
                                </Box>
                            )}

                            {erro && !loading && (
                                <Typography color="error" sx={{ py: 2 }}>Erro: {erro}</Typography>
                            )}

                            {!loading && !erro && (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Cidadão</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Data</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Chegada</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Tempo Espera</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Equipe</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Profissional</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {listaFiltrada.length > 0 ? (
                                                listaFiltrada.map((row, i) => (
                                                    <TableRow key={row.id} hover>
                                                        <TableCell sx={{ color: 'var(--lg-text-muted)', fontSize: 12 }}>{i + 1}</TableCell>
                                                        <TableCell sx={{ fontWeight: 600 }}>{row.cidadao}</TableCell>
                                                        <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>{row.data_atendimento || '—'}</TableCell>
                                                        <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                                            <Box>{row.hr_chegada || '—'}</Box>
                                                            <Box sx={{ color: 'var(--lg-text-muted)', fontSize: 12 }}>
                                                                Saída: {row.hr_saida || '—'}
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>{row.tempo_espera || '—'}</TableCell>
                                                        <TableCell>{row.equipe || '—'}</TableCell>
                                                        <TableCell>{row.profissional || '—'}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'var(--lg-text-muted)' }}>
                                                        Nenhum registro encontrado
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </CardContent>
                    </Card>
                    </>
                    )}
                </>
            )}
        </Box>
    );
}
