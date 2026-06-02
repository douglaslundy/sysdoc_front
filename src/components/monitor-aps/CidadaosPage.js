import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { equipeLabel } from '../../utils/equipeLabel';
import {
    Box, Card, CardContent, Chip, CircularProgress,
    FormControl, InputLabel, MenuItem, Select, Table,
    TableBody, TableCell, TableHead, TablePagination, TableRow, Tooltip, Typography, IconButton, TextField,
} from '@mui/material';
import { monitorApsApi } from '../../services/monitorApsApi';
import { useEquipesPermitidas } from '../../hooks/useEquipesPermitidas';

const CHIP_CONDICOES = [
    { key: 'st_gestante', label: 'Gestante', cor: '#1351B4' },
    { key: 'st_has',      label: 'HAS',      cor: '#FF8C00' },
    { key: 'st_dm',       label: 'DM',       cor: '#7B2D8B' },
    { key: 'st_idoso',    label: 'Idoso',    cor: '#168821' },
    { key: 'st_obito',    label: 'Obito',    cor: '#DC2626' },
];

const FILTROS_CONDICOES = [
    { value: 'gestante', label: 'Gestante' },
    { value: 'has', label: 'HAS' },
    { value: 'dm', label: 'DM' },
    { value: 'idoso', label: 'Idoso' },
    { value: 'obito', label: 'Obito' },
];

const onlyDigits = (value) => String(value ?? '').replace(/\D/g, '');

const formatCpf = (value) => {
    const digits = onlyDigits(value);
    if (digits.length !== 11 || /^0+$/.test(digits)) return '--';
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const formatCns = (value) => {
    const digits = onlyDigits(value);
    if (digits.length !== 15 || /^0+$/.test(digits)) return '--';
    return digits;
};

const formatIdade = (value) => {
    if (value == null) return '--';
    const idade = Number(value);
    if (!Number.isFinite(idade)) return '--';
    return `${idade} ${idade === 1 ? 'ano' : 'anos'}`;
};

const truncateText = (value, limit = 20) => {
    const text = String(value ?? '--');
    if (text.length <= limit) return text;
    return `${text.slice(0, limit)}...`;
};

const formatEquipe = (value) => {
    const text = String(value ?? '--');
    const parts = text.split(' - ');
    return parts.length > 1 ? parts.slice(1).join(' - ') : text;
};

const parseDateLikeToTs = (value) => {
    if (!value) return null;
    const v = String(value).trim();
    if (!v) return null;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
        const [d, m, y] = v.split('/').map(Number);
        return new Date(y, m - 1, d).getTime();
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
        const iso = v.slice(0, 10);
        return new Date(`${iso}T00:00:00`).getTime();
    }
    const t = Date.parse(v);
    return Number.isNaN(t) ? null : t;
};

const isTruthyCondition = (value) => (
    value === 1 ||
    value === '1' ||
    value === true ||
    value === 'true' ||
    value === 't' ||
    value === 'S' ||
    value === 's' ||
    value === 'sim' ||
    value === 'yes' ||
    value === 'y'
);

const isFilledDateLike = (value) => {
    if (value == null) return false;
    const v = String(value).trim();
    if (!v) return false;
    return /^\d{4}-\d{2}-\d{2}/.test(v) || /^\d{2}\/\d{2}\/\d{4}/.test(v);
};

const hasTruthyByPattern = (obj, pattern) => Object.entries(obj || {}).some(([key, value]) => {
    if (!pattern.test(String(key))) return false;
    if (value == null) return false;
    if (typeof value === 'object') return hasTruthyByPattern(value, pattern);
    if (isFilledDateLike(value)) return true;
    return isTruthyCondition(String(value).toLowerCase());
});

const isObitoCondition = (cidadao) => (
    isTruthyCondition(cidadao?.st_obito) ||
    isTruthyCondition(cidadao?.st_falecido) ||
    isTruthyCondition(cidadao?.obito) ||
    isTruthyCondition(cidadao?.falecido) ||
    isFilledDateLike(cidadao?.data_obito) ||
    isFilledDateLike(cidadao?.dt_obito) ||
    isFilledDateLike(cidadao?.data_falecimento) ||
    isFilledDateLike(cidadao?.dt_falecimento) ||
    hasTruthyByPattern(cidadao, /(condic|classif).*(obit|falec)|(obit|falec).*(condic|classif)/i) ||
    hasTruthyByPattern(cidadao, /(obit|falec)/i)
);

export default function CidadaosPage() {
    const controlHeight = 48;
    const controlSx = {
        '& .MuiOutlinedInput-root': {
            height: controlHeight,
            minHeight: controlHeight,
            background: 'var(--lg-glass-input)',
        },
        '& .MuiInputBase-input': {
            height: controlHeight,
            boxSizing: 'border-box',
            backgroundColor: 'transparent !important',
            color: 'var(--lg-text-primary) !important',
            WebkitTextFillColor: 'var(--lg-text-primary) !important',
            caretColor: 'var(--lg-text-primary) !important',
        },
        '& input': {
            backgroundColor: 'transparent !important',
        },
        '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
            WebkitBoxShadow: '0 0 0 1000px var(--lg-glass-input) inset !important',
            WebkitTextFillColor: 'var(--lg-text-primary) !important',
            caretColor: 'var(--lg-text-primary) !important',
            transition: 'background-color 9999s ease-out 0s',
        },
    };
    const selectControlSx = {
        ...controlSx,
        '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            minHeight: 'unset',
            height: controlHeight,
            boxSizing: 'border-box',
        },
    };
    const [equipes,        setEquipes]        = useState([]);
    const [agentes,        setAgentes]        = useState([]);
    const [ine,            setIne]            = useState('');
    const [agenteSel,      setAgenteSel]      = useState('');
    const [condicao,       setCondicao]       = useState('');
    const [busca,          setBusca]          = useState('');
    const [multiDomicilio, setMultiDomicilio] = useState(false);
    const [cidadaos,  setCidadaos]  = useState([]);
    const [sortConfig, setSortConfig] = useState({ field: null, dir: 'asc' });
    const [meta,      setMeta]      = useState({ total: 0, page: 1, per_page: 50, pages: 0 });
    const [page,      setPage]      = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [loading,   setLoading]   = useState(false);
    const debounceRef = useRef(null);
    const ctrlRef     = useRef(null);

    const { isRestrito, equipes: minhasEquipes, loading: loadingPerms } = useEquipesPermitidas();

    // Carrega equipes conforme permissoes do usuario
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

        const params = new URLSearchParams({ page: overridePage + 1, per_page: rowsPerPage });
        if (ine)               params.set('ine', ine);
        if (agenteSel)         params.set('agente', agenteSel);
        if (condicao)          params.set('condicao', condicao);
        if (busca.length >= 3) params.set('busca', busca);
        if (multiDomicilio)    params.set('multi_domicilio', '1');
        if (sortConfig.field === 'idade') {
            params.set('sort', 'idade');
            params.set('dir', sortConfig.dir);
        }

        setLoading(true);
        monitorApsApi.get(`/cidadaos?${params}`, { signal: ctrl.signal })
            .then(d => {
                setCidadaos(d.cidadaos ?? []);
                setMeta(d.meta ?? { total: 0, page: 1, per_page: 50, pages: 0 });
            })
            .catch(e => { if (e?.code !== 'ERR_CANCELED') setCidadaos([]); })
            .finally(() => setLoading(false));
    }, [ine, agenteSel, condicao, busca, multiDomicilio, sortConfig.field, sortConfig.dir, rowsPerPage]);

    // Fetch com debounce de 400ms para campo de busca
    useEffect(() => {
        setPage(0);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchCidadaos(0), busca ? 400 : 0);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [ine, agenteSel, condicao, busca, multiDomicilio, sortConfig.field, sortConfig.dir, rowsPerPage]);

    const handlePageChange = (_, newPage) => {
        setPage(newPage);
        fetchCidadaos(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        const value = parseInt(event.target.value, 10);
        setRowsPerPage(value);
        setPage(0);
    };

    useEffect(() => {
        if (condicao === 'obito' && !sortConfig.field) {
            setSortConfig({ field: 'obito', dir: 'asc' });
        }
        if (condicao !== 'obito' && sortConfig.field === 'obito') {
            setSortConfig({ field: null, dir: 'asc' });
        }
    }, [condicao, sortConfig.field]);

    const toggleSort = (field) => {
        setPage(0);
        setSortConfig(prev => (
            prev.field === field
                ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                : { field, dir: 'asc' }
        ));
    };

    const cidadaosSorted = useMemo(() => {
        if (!sortConfig.field) return cidadaos;
        if (sortConfig.field !== 'obito') return cidadaos;
        const mult = sortConfig.dir === 'desc' ? -1 : 1;
        return [...cidadaos].sort((a, b) => {
            if (sortConfig.field === 'obito') {
                const ta = parseDateLikeToTs(a?.data_obito ?? a?.dt_obito);
                const tb = parseDateLikeToTs(b?.data_obito ?? b?.dt_obito);
                if (ta == null && tb == null) return 0;
                if (ta == null) return 1;
                if (tb == null) return -1;
                return (ta - tb) * mult;
            }
            return 0;
        });
    }, [cidadaos, sortConfig]);

    return (
        <Box className="dashboard-neon-page monitor-aps-page queue-page">
            <Box className="dashboard-neon-home monitor-aps-surface monitor-aps-cidadaos-page queue-page">
            <Box mb={3} mt="20px">
                <Typography variant="h5" fontWeight={700}>
                    Cidadaos ({meta.total.toLocaleString('pt-BR')})
                </Typography>
                <Box className="queue-page__toolbar" display="flex" gap={1.5} flexWrap="wrap" mt={2}>
                    <TextField
                        size="small"
                        className="lg-search-field"
                        placeholder="Buscar: Nome, CPF ou CNS"
                        autoComplete="off"
                        name="search"
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        sx={{
                            width: 430,
                            minWidth: 430,
                            flexShrink: 0,
                            '& .MuiInputBase-input': { fontSize: '25px !important' },
                        }}
                    />
                    <FormControl size="small" sx={{ minWidth: 220, ...selectControlSx }}>
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
                                Nenhuma equipe autorizada para o seu usuario. Entre em contato com o administrador.
                            </Typography>
                        </Box>
                    )}
                    <FormControl size="small" sx={{ minWidth: 200, ...selectControlSx }}>
                        <InputLabel>Agente</InputLabel>
                        <Select label="Agente" value={agenteSel}
                            onChange={e => { setAgenteSel(e.target.value); setPage(0); }}>
                            <MenuItem value="">Todos os agentes</MenuItem>
                            {agentes.map(a => (
                                <MenuItem key={a.nome} value={a.nome}>{a.nome}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 180, ...selectControlSx }}>
                        <InputLabel>Condicao</InputLabel>
                        <Select label="Condicao" value={condicao}
                            onChange={e => { setCondicao(e.target.value); setPage(0); }}>
                            <MenuItem value="">Todas</MenuItem>
                            {FILTROS_CONDICOES.map(item => (
                                <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Tooltip title="Exibe apenas cidadaos vinculados a mais de um domicilio e substitui a coluna Agente pelos domicilios">
                        <Chip
                            label="Multiplos domicilios"
                            clickable
                            onClick={() => { setMultiDomicilio(v => !v); setPage(0); }}
                            color={multiDomicilio ? 'primary' : 'default'}
                            variant={multiDomicilio ? 'filled' : 'outlined'}
                            sx={{
                                alignSelf: 'center',
                                fontWeight: 600,
                                height: controlHeight,
                                borderRadius: 1.2,
                                px: 1,
                            }}
                        />
                    </Tooltip>
                </Box>
            </Box>

            <Card className="monitor-aps-panel queue-page__table-wrap">
                <CardContent>
                    {loading ? (
                        <Box display="flex" justifyContent="center" py={6}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Box sx={{ overflowX: 'auto' }}>
                            <Table className="queue-page__table" size="small">
                                <TableHead>
                                    <TableRow sx={{
                                        '& th': {
                                            fontWeight: 700, fontSize: 11,
                                            color: 'var(--lg-text-muted)',
                                            textTransform: 'uppercase',
                                            borderBottom: '2px solid var(--lg-border)',
                                        },
                                    }}>
                                        <TableCell className="queue-page__th">#</TableCell>
                                        <TableCell>Nome / Ult. Atualizacao</TableCell>
                                        <TableCell>CPF / CNS</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                Idade
                                                <IconButton
                                                    size="small"
                                                    aria-label={`Ordenar idade ${sortConfig.field === 'idade' && sortConfig.dir === 'asc' ? 'decrescente' : 'crescente'}`}
                                                    onClick={() => toggleSort('idade')}
                                                >
                                                    <Typography component="span" sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1 }}>
                                                        {sortConfig.field === 'idade' && sortConfig.dir === 'desc' ? '↓' : '↑'}
                                                    </Typography>
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                        <TableCell>Equipe</TableCell>
                                        <TableCell>{multiDomicilio ? 'Domicilios' : 'Agente'}</TableCell>
                                        <TableCell>Condicoes</TableCell>
                                        {condicao === 'obito' && (
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    Data obito
                                                    <IconButton
                                                        size="small"
                                                        aria-label={`Ordenar data de obito ${sortConfig.field === 'obito' && sortConfig.dir === 'asc' ? 'decrescente' : 'crescente'}`}
                                                        onClick={() => toggleSort('obito')}
                                                    >
                                                        <Typography component="span" sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1 }}>
                                                            {sortConfig.field === 'obito' && sortConfig.dir === 'desc' ? '↓' : '↑'}
                                                        </Typography>
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        )}
                                        {condicao === 'obito' && <TableCell>Fonte obito</TableCell>}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {cidadaosSorted.map((c, i) => (
                                        <TableRow key={c.co_fat_cidadao_pec ?? i} hover sx={{ "& td": { background: "var(--queue-row-bg)", borderTop: "0.5px solid var(--lg-border)", borderBottom: "0.5px solid var(--lg-border)" }, "& td + td": { borderLeft: "0.5px solid rgba(114, 147, 222, 0.24)" }, "& td:first-of-type": { borderLeft: "0.5px solid var(--lg-border)", borderTopLeftRadius: 14, borderBottomLeftRadius: 14 }, "& td:last-of-type": { borderRight: "0.5px solid var(--lg-border)", borderTopRightRadius: 14, borderBottomRightRadius: 14 }, "&:hover td": { background: "var(--queue-row-hover)" } }}>
                                            <TableCell sx={{ fontSize: 11, color: 'var(--lg-text-muted)' }}>
                                                {(page * rowsPerPage) + i + 1}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600} noWrap title={c.nome ?? '--'}>
                                                    {truncateText(c.nome, 30)}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'var(--lg-text-muted)' }}>
                                                    {c.data_atualizacao ?? '--'}
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
                                                <Typography variant="body2" noWrap title={c.no_equipe ?? '--'}>
                                                    {truncateText(formatEquipe(c.no_equipe), 15)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {multiDomicilio ? (
                                                    <Tooltip title={c.domicilios ?? '--'} placement="top">
                                                        <Typography variant="body2" sx={{ fontSize: 11, maxWidth: 260, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                                            {c.domicilios
                                                                ? c.domicilios.split(' | ').map((d, i) => (
                                                                    <Box key={i} component="span" display="block">- {d}</Box>
                                                                ))
                                                                : '--'}
                                                        </Typography>
                                                    </Tooltip>
                                                ) : (
                                                    <Typography variant="body2" noWrap title={c.agente ?? '--'}>
                                                        {truncateText(c.agente, 25)}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" gap={0.5} flexWrap="wrap">
                                                    {CHIP_CONDICOES.map(({ key, label, cor }) =>
                                                        (key === 'st_obito' ? isObitoCondition(c) : isTruthyCondition(c[key])) ? (
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
                                            {condicao === 'obito' && (
                                                <TableCell sx={{ fontSize: 12 }}>
                                                    {isObitoCondition(c) ? (c.data_obito ?? c.dt_obito ?? '--') : '--'}
                                                </TableCell>
                                            )}
                                            {condicao === 'obito' && (
                                                <TableCell sx={{ fontSize: 12, color: 'var(--lg-text-muted)' }}>
                                                    {isObitoCondition(c) ? (c.fonte_obito ?? '--') : '--'}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                    {cidadaos.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={condicao === 'obito' ? 9 : 7} align="center"
                                                sx={{ py: 4, color: 'var(--lg-text-muted)' }}>
                                                Nenhum cidadao encontrado com os filtros aplicados.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Box>
                    )}

                    <TablePagination className="queue-page__pagination"
                        component="div"
                        count={meta.total}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelDisplayedRows={({ from, to, count }) =>
                            `${from}-${to} de ${count.toLocaleString('pt-BR')}`}
                    />
                </CardContent>
            </Card>
            </Box>
        </Box>
    );
}
