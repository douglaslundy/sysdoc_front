import { useCallback, useEffect, useState } from 'react';
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
    const [cnes,          setCnes]          = useState('');
    const [cnesInput,     setCnesInput]     = useState('');
    const [equipes,       setEquipes]       = useState([]);
    const [profissionais, setProfissionais] = useState([]);
    const [equipeId,      setEquipeId]      = useState('');
    const [profId,        setProfId]        = useState('');
    const [dados,         setDados]         = useState(null);
    const [loading,       setLoading]       = useState(false);
    const [erro,          setErro]          = useState(null);

    // Carrega filtros quando CNES muda
    useEffect(() => {
        if (!cnes) return;
        painelEsusApi.filtros(cnes)
            .then(d => {
                setEquipes(d.equipes ?? []);
                setProfissionais(d.profissionais ?? []);
            })
            .catch(() => {});
    }, [cnes]);

    const carregarFila = useCallback(() => {
        if (!cnes) return;
        setLoading(true);
        setErro(null);
        const params = { cnes };
        if (equipeId) params.equipe = equipeId;
        if (profId)   params.profissional = profId;
        painelEsusApi.fila(params)
            .then(d => setDados(d))
            .catch(e => setErro(e.message))
            .finally(() => setLoading(false));
    }, [cnes, equipeId, profId]);

    // Re-fetch quando qualquer filtro muda
    useEffect(() => { carregarFila(); }, [carregarFila]);

    const handleCnesSubmit = (e) => {
        e.preventDefault();
        if (cnesInput.trim()) setCnes(cnesInput.trim());
    };

    if (!cnes) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={400} gap={2}>
                <Typography variant="h6" sx={{ color: 'var(--lg-text-secondary)' }}>
                    Informe o CNES para visualizar a fila de atendimento
                </Typography>
                <Box component="form" onSubmit={handleCnesSubmit} display="flex" gap={1}>
                    <input
                        value={cnesInput}
                        onChange={e => setCnesInput(e.target.value)}
                        placeholder="CNES da unidade"
                        maxLength={10}
                        style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--lg-border-input)', background: 'var(--lg-glass-input)', color: 'var(--lg-text-primary)', fontSize: 15 }}
                    />
                    <button type="submit" style={{ padding: '10px 20px', background: 'var(--lg-primary, #1a56db)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15 }}>
                        Buscar
                    </button>
                </Box>
            </Box>
        );
    }

    return (
        <Box>
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
        </Box>
    );
}
