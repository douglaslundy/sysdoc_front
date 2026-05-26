import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Box, Card, CardContent, CircularProgress, FormControl,
    Grid, InputLabel, MenuItem, Select, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import { painelEsusApi } from '../../services/painelEsusApi';

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

export default function FilaEsus() {
    const [cnes,            setCnes]            = useState(null);
    const [unidades,        setUnidades]        = useState([]);
    const [loadingUnidades, setLoadingUnidades] = useState(true);
    const [erroUnidades,    setErroUnidades]    = useState('');
    const [equipes,         setEquipes]         = useState([]);
    const [profissionais,   setProfissionais]   = useState([]);
    const [equipeId,        setEquipeId]        = useState('');
    const [profId,          setProfId]          = useState('');
    const [dados,           setDados]           = useState(null);
    const [loading,         setLoading]         = useState(false);
    const [erro,            setErro]            = useState(null);
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

    // Carrega filtros quando CNES muda
    useEffect(() => {
        if (!cnes) return;
        const ac = new AbortController();
        painelEsusApi.filtros(cnes, { signal: ac.signal })
            .then(d => {
                setEquipes(d.equipes ?? []);
                setProfissionais(d.profissionais ?? []);
            })
            .catch(() => {});
        return () => ac.abort();
    }, [cnes]);

    const carregarFila = useCallback(() => {
        if (!cnes) return;
        if (abortRef.current) abortRef.current.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        setLoading(true);
        setErro(null);
        const params = { cnes };
        if (equipeId) params.equipe = equipeId;
        if (profId)   params.profissional = profId;
        painelEsusApi.fila(params, { signal: ac.signal })
            .then(d => setDados(d))
            .catch(e => {
                if (e.name === 'CanceledError' || e.name === 'AbortError') return;
                setErro('Erro ao carregar a fila. Tente novamente.');
            })
            .finally(() => setLoading(false));
    }, [cnes, equipeId, profId]);

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
            {/* Seletor de unidade — só exibido quando há mais de uma */}
            {unidades.length > 1 && (
                <Box mb={2} display="flex" alignItems="center" gap={2} flexWrap="wrap">
                    <FormControl size="small" sx={{ minWidth: 300, ...selSx }}>
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
                </Box>
            )}

            {/* Nome da unidade selecionada */}
            {unidadeAtual && (
                <Typography variant="subtitle2" sx={{ color: 'var(--lg-text-muted)', mb: 2 }}>
                    <span>{unidadeAtual.nome}</span>
                    {' — CNES '}
                    {cnes}
                </Typography>
            )}

            {/* Estado: aguardando seleção */}
            {!cnes && (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                    <Typography sx={{ color: 'var(--lg-text-muted)' }}>
                        Selecione uma unidade de saúde para visualizar a fila.
                    </Typography>
                </Box>
            )}

            {/* Conteúdo principal */}
            {cnes && (
                <>
                    {/* Filtros */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} sm={4}>
                                    <FormControl fullWidth size="small" sx={selSx}>
                                        <InputLabel>Equipe</InputLabel>
                                        <Select
                                            label="Equipe"
                                            value={equipeId}
                                            onChange={e => { setEquipeId(e.target.value); setProfId(''); }}
                                        >
                                            <MenuItem value=""><em>Todas</em></MenuItem>
                                            {equipes.map(eq => (
                                                <MenuItem key={eq.id} value={eq.id}>{eq.nome}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={4}>
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
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="caption" sx={{ color: 'var(--lg-text-muted)' }}>
                                        CNES: {cnes}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Contadores */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={4}>
                            <ContadorCard icon="clock" titulo="Em Espera" valor={dados?.contadores?.aguardando} cor="#1351B4" />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <ContadorCard icon="check-circle" titulo="Atendidos Hoje" valor={dados?.contadores?.atendidos} cor="#168821" />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <ContadorCard icon="user-x" titulo="Não Aguardaram" valor={dados?.contadores?.nao_aguardaram} cor="#E52207" />
                        </Grid>
                    </Grid>

                    {/* Lista de aguardando */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                                Aguardando Atendimento
                            </Typography>

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
                                                <TableCell sx={{ fontWeight: 700 }}>Chegada</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Equipe</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Profissional</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {dados?.aguardando?.length > 0 ? (
                                                dados.aguardando.map((row, i) => (
                                                    <TableRow key={row.id} hover>
                                                        <TableCell sx={{ color: 'var(--lg-text-muted)', fontSize: 12 }}>{i + 1}</TableCell>
                                                        <TableCell sx={{ fontWeight: 600 }}>{row.cidadao}</TableCell>
                                                        <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>{row.hr_chegada || '—'}</TableCell>
                                                        <TableCell>{row.equipe || '—'}</TableCell>
                                                        <TableCell>{row.profissional || '—'}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'var(--lg-text-muted)' }}>
                                                        Nenhum paciente aguardando no momento
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
        </Box>
    );
}
