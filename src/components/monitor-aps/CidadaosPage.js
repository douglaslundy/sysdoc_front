import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Box, Card, CardContent, Chip, CircularProgress,
    FormControl, InputLabel, MenuItem, Select, Table,
    TableBody, TableCell, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import { monitorApsApi } from '../../services/monitorApsApi';

const CHIP_CONDICOES = [
    { key: 'st_gestante', label: 'Gestante', cor: '#1351B4' },
    { key: 'st_has',      label: 'HAS',      cor: '#FF8C00' },
    { key: 'st_dm',       label: 'DM',       cor: '#7B2D8B' },
    { key: 'st_idoso',    label: 'Idoso',    cor: '#168821' },
];

const FILTROS_CONDICOES = [
    { value: 'gestante', label: 'Gestante' },
    { value: 'has', label: 'HAS' },
    { value: 'dm', label: 'DM' },
    { value: 'idoso', label: 'Idoso' },
];

const onlyDigits = (value) => String(value ?? '').replace(/\D/g, '');

const formatCpf = (value) => {
    const digits = onlyDigits(value);
    if (digits.length !== 11 || /^0+$/.test(digits)) return '—';
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const formatCns = (value) => {
    const digits = onlyDigits(value);
    if (digits.length !== 15 || /^0+$/.test(digits)) return '—';
    return digits;
};

const formatIdade = (value) => {
    if (value == null) return '—';
    const idade = Number(value);
    if (!Number.isFinite(idade)) return '—';
    return `${idade} ${idade === 1 ? 'ano' : 'anos'}`;
};

const truncateText = (value, limit = 20) => {
    const text = String(value ?? '—');
    if (text.length <= limit) return text;
    return `${text.slice(0, limit)}...`;
};

const formatEquipe = (value) => {
    const text = String(value ?? '—');
    const parts = text.split(' - ');
    return parts.length > 1 ? parts.slice(1).join(' - ') : text;
};

export default function CidadaosPage() {
    const [equipes,        setEquipes]        = useState([]);
    const [agentes,        setAgentes]        = useState([]);
    const [ine,            setIne]            = useState('');
    const [agenteSel,      setAgenteSel]      = useState('');
    const [condicao,       setCondicao]       = useState('');
    const [busca,          setBusca]          = useState('');
    const [multiDomicilio, setMultiDomicilio] = useState(false);
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
        const ctrl = new AbortController();
        const params = new URLSearchParams();
        if (ine) params.set('ine', ine);
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
        if (agenteSel)         params.set('agente', agenteSel);
        if (condicao)          params.set('condicao', condicao);
        if (busca.length >= 3) params.set('busca', busca);
        if (multiDomicilio)    params.set('multi_domicilio', '1');

        setLoading(true);
        monitorApsApi.get(`/cidadaos?${params}`, { signal: ctrl.signal })
            .then(d => {
                setCidadaos(d.cidadaos ?? []);
                setMeta(d.meta ?? { total: 0, page: 1, per_page: 50, pages: 0 });
            })
            .catch(e => { if (e?.code !== 'ERR_CANCELED') setCidadaos([]); })
            .finally(() => setLoading(false));
    }, [ine, agenteSel, condicao, busca, multiDomicilio]);

    // Fetch com debounce de 400ms para campo de busca
    useEffect(() => {
        setPage(0);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchCidadaos(0), busca ? 400 : 0);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [ine, agenteSel, condicao, busca, multiDomicilio]);

    const handlePageChange = (_, newPage) => {
        setPage(newPage);
        fetchCidadaos(newPage);
    };

    return (
        <Box>
            <Box mb={3} mt="20px">
                <Typography variant="h5" fontWeight={700}>
                    Cidadãos ({meta.total.toLocaleString('pt-BR')})
                </Typography>
                <Box display="flex" gap={1.5} flexWrap="wrap" mt={2}>
                    <TextField
                        size="small"
                        label="Busca"
                        placeholder="nome, CPF ou CNS"
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        sx={{ minWidth: 220 }}
                        helperText={busca.length > 0 && busca.length < 3 ? 'Mínimo 3 caracteres' : ''}
                    />
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel>Equipe</InputLabel>
                        <Select label="Equipe" value={ine}
                            onChange={e => { setIne(e.target.value); setPage(0); }}>
                            <MenuItem value="">Todas as equipes</MenuItem>
                            {equipes.map(eq => (
                                <MenuItem key={eq.nu_ine} value={eq.nu_ine}>{eq.no_equipe?.split(' - ').slice(1).join(' - ').trim() || eq.no_equipe}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Agente</InputLabel>
                        <Select label="Agente" value={agenteSel}
                            onChange={e => { setAgenteSel(e.target.value); setPage(0); }}>
                            <MenuItem value="">Todos os agentes</MenuItem>
                            {agentes.map(a => (
                                <MenuItem key={a.nome} value={a.nome}>{a.nome}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Condição</InputLabel>
                        <Select label="Condição" value={condicao}
                            onChange={e => { setCondicao(e.target.value); setPage(0); }}>
                            <MenuItem value="">Todas</MenuItem>
                            {FILTROS_CONDICOES.map(item => (
                                <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Tooltip title="Exibe apenas cidadãos vinculados a mais de um domicílio e substitui a coluna Agente pelos domicílios">
                        <Chip
                            label="Múltiplos domicílios"
                            clickable
                            onClick={() => { setMultiDomicilio(v => !v); setPage(0); }}
                            color={multiDomicilio ? 'primary' : 'default'}
                            variant={multiDomicilio ? 'filled' : 'outlined'}
                            sx={{ alignSelf: 'center', fontWeight: 600 }}
                        />
                    </Tooltip>
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
                                        <TableCell>Nome / Ult. Atualização</TableCell>
                                        <TableCell>CPF / CNS</TableCell>
                                        <TableCell>Idade</TableCell>
                                        <TableCell>Equipe</TableCell>
                                        <TableCell>{multiDomicilio ? 'Domicílios' : 'Agente'}</TableCell>
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
                                                <Typography variant="body2" fontWeight={600} noWrap title={c.nome ?? '—'}>
                                                    {truncateText(c.nome, 30)}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'var(--lg-text-muted)' }}>
                                                    {c.data_atualizacao ?? '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>
                                                <Box>{formatCpf(c.cpf)}</Box>
                                                <Box sx={{ color: 'var(--lg-text-muted)', mt: 0.25 }}>{formatCns(c.cns)}</Box>
                                            </TableCell>
                                            <TableCell sx={{ fontSize: 12 }}>
                                                {formatIdade(c.idade)}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" noWrap title={c.no_equipe ?? '—'}>
                                                    {truncateText(formatEquipe(c.no_equipe), 15)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {multiDomicilio ? (
                                                    <Tooltip title={c.domicilios ?? '—'} placement="top">
                                                        <Typography variant="body2" sx={{ fontSize: 11, maxWidth: 260, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                                            {c.domicilios
                                                                ? c.domicilios.split(' | ').map((d, i) => (
                                                                    <Box key={i} component="span" display="block">• {d}</Box>
                                                                ))
                                                                : '—'}
                                                        </Typography>
                                                    </Tooltip>
                                                ) : (
                                                    <Typography variant="body2" noWrap title={c.agente ?? '—'}>
                                                        {truncateText(c.agente, 25)}
                                                    </Typography>
                                                )}
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
                                            <TableCell colSpan={7} align="center"
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
