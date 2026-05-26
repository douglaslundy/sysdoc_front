import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Box, Card, CardContent, Chip, CircularProgress,
    FormControl, InputLabel, MenuItem, Select, Table,
    TableBody, TableCell, TableHead, TablePagination, TableRow, TextField, Typography,
} from '@mui/material';
import { monitorApsApi } from '../../services/monitorApsApi';

const CHIP_CONDICOES = [
    { key: 'st_gestante', label: 'Gestante', cor: '#1351B4' },
    { key: 'st_has',      label: 'HAS',      cor: '#FF8C00' },
    { key: 'st_dm',       label: 'DM',       cor: '#7B2D8B' },
    { key: 'st_idoso',    label: 'Idoso',    cor: '#168821' },
];

export default function CidadaosPage() {
    const [equipes,   setEquipes]   = useState([]);
    const [agentes,   setAgentes]   = useState([]);
    const [ine,       setIne]       = useState('');
    const [agenteSel, setAgenteSel] = useState('');
    const [busca,     setBusca]     = useState('');
    const [cidadaos,  setCidadaos]  = useState([]);
    const [meta,      setMeta]      = useState({ total: 0, page: 1, per_page: 50, pages: 0 });
    const [page,      setPage]      = useState(0);
    const [loading,   setLoading]   = useState(false);
    const debounceRef = useRef(null);
    const ctrlRef     = useRef(null);

    // Carrega equipes uma vez
    useEffect(() => {
        const ctrl = new AbortController();
        monitorApsApi.get('/config/equipes', { signal: ctrl.signal })
            .then(d => setEquipes(d.equipes ?? []))
            .catch(() => {});
        return () => ctrl.abort();
    }, []);

    // Carrega agentes quando equipe muda
    useEffect(() => {
        setAgenteSel('');
        if (!ine) { setAgentes([]); return; }
        const ctrl = new AbortController();
        const params = new URLSearchParams({ ine });
        monitorApsApi.get(`/cidadaos/agentes?${params}`, { signal: ctrl.signal })
            .then(d => setAgentes(d.agentes ?? []))
            .catch(() => {});
        return () => ctrl.abort();
    }, [ine]);

    const fetchCidadaos = useCallback((overridePage = 0) => {
        if (ctrlRef.current) ctrlRef.current.abort();
        const ctrl = new AbortController();
        ctrlRef.current = ctrl;

        const params = new URLSearchParams({ page: overridePage + 1, per_page: 50 });
        if (ine)               params.set('ine', ine);
        if (agenteSel)         params.set('profissional_id', agenteSel);
        if (busca.length >= 3) params.set('busca', busca);

        setLoading(true);
        monitorApsApi.get(`/cidadaos?${params}`, { signal: ctrl.signal })
            .then(d => {
                setCidadaos(d.cidadaos ?? []);
                setMeta(d.meta ?? { total: 0, page: 1, per_page: 50, pages: 0 });
            })
            .catch(e => { if (e?.code !== 'ERR_CANCELED') setCidadaos([]); })
            .finally(() => setLoading(false));
    }, [ine, agenteSel, busca]);

    // Fetch com debounce de 400ms para campo de busca
    useEffect(() => {
        setPage(0);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchCidadaos(0), busca ? 400 : 0);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [ine, agenteSel, busca]);

    const handlePageChange = (_, newPage) => {
        setPage(newPage);
        fetchCidadaos(newPage);
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center"
                mb={3} mt="20px" flexWrap="wrap" gap={2}>
                <Typography variant="h5" fontWeight={700}>Cidadãos</Typography>
                <Box display="flex" gap={1.5} flexWrap="wrap">
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel>Equipe</InputLabel>
                        <Select label="Equipe" value={ine}
                            onChange={e => { setIne(e.target.value); setPage(0); }}>
                            <MenuItem value="">Todas as equipes</MenuItem>
                            {equipes.map(eq => (
                                <MenuItem key={eq.nu_ine} value={eq.nu_ine}>{eq.no_equipe}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 200 }} disabled={!ine}>
                        <InputLabel>Agente</InputLabel>
                        <Select label="Agente" value={agenteSel}
                            onChange={e => { setAgenteSel(e.target.value); setPage(0); }}>
                            <MenuItem value="">Todos os agentes</MenuItem>
                            {agentes.map(a => (
                                <MenuItem key={a.id} value={a.id}>{a.nome}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        size="small"
                        label="Busca"
                        placeholder="nome, CPF ou CNS"
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        sx={{ minWidth: 220 }}
                        helperText={busca.length > 0 && busca.length < 3 ? 'Mínimo 3 caracteres' : ''}
                    />
                </Box>
            </Box>

            <Card>
                <CardContent>
                    {loading ? (
                        <Box display="flex" justifyContent="center" py={6}>
                            <CircularProgress />
                        </Box>
                    ) : (
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
                                        <TableCell>#</TableCell>
                                        <TableCell>Nome</TableCell>
                                        <TableCell>CPF</TableCell>
                                        <TableCell>CNS</TableCell>
                                        <TableCell>Idade</TableCell>
                                        <TableCell>Equipe</TableCell>
                                        <TableCell>Agente</TableCell>
                                        <TableCell>Condições</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {cidadaos.map((c, i) => (
                                        <TableRow key={c.co_fat_cidadao_pec ?? i} hover>
                                            <TableCell sx={{ fontSize: 11, color: 'var(--lg-text-muted)' }}>
                                                {(page * 50) + i + 1}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600} noWrap>
                                                    {c.nome ?? '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>
                                                {c.cpf
                                                    ? c.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                                                    : '—'}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>
                                                {c.cns ?? '—'}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: 12 }}>
                                                {c.idade != null ? `${c.idade} a` : '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" noWrap>{c.no_equipe ?? '—'}</Typography>
                                                <Typography variant="caption" sx={{ color: 'var(--lg-text-muted)' }}>
                                                    {c.nu_ine}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" noWrap>{c.agente ?? '—'}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" gap={0.5} flexWrap="wrap">
                                                    {CHIP_CONDICOES.map(({ key, label, cor }) =>
                                                        // eslint-disable-next-line eqeqeq
                                                        c[key] == 1 ? (
                                                            <Chip key={key} label={label} size="small"
                                                                sx={{
                                                                    bgcolor: cor + '22',
                                                                    color: cor,
                                                                    fontWeight: 700,
                                                                    fontSize: 10,
                                                                }} />
                                                        ) : null
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {cidadaos.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center"
                                                sx={{ py: 4, color: 'var(--lg-text-muted)' }}>
                                                Nenhum cidadão encontrado com os filtros aplicados.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Box>
                    )}

                    <TablePagination
                        component="div"
                        count={meta.total}
                        page={page}
                        rowsPerPage={50}
                        rowsPerPageOptions={[50]}
                        onPageChange={handlePageChange}
                        labelDisplayedRows={({ from, to, count }) =>
                            `${from}–${to} de ${count.toLocaleString('pt-BR')}`}
                    />
                </CardContent>
            </Card>
        </Box>
    );
}
