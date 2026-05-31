import React, { useEffect, useState } from 'react';
import {
    Box, Button, Chip, Collapse, FormControl, InputLabel, MenuItem,
    Select, Table, TableBody, TableCell, TableContainer, TableHead,
    TablePagination, TableRow, TextField, Typography, Grid,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import { getAuditLogs } from '../../store/fetchActions/auditLogs';
import BaseCard from '../baseCard/BaseCard';
import { modalFormRootSx } from '../modal/_shared/modalFormStyles';
import { api } from '../../services/api';
import { auditoriaPDF } from '../../reports/auditoria';

const ACTION_COLORS = {
    LOGIN: 'info', LOGOUT: 'default', CREATE: 'success',
    UPDATE: 'warning', DELETE: 'error',
    READ: 'default',
    VIEW: 'primary', VIEW_REPORT: 'secondary', LIBERAR: 'success', DOWNLOAD: 'info',
};

const RECURSOS = [
    'Client', 'User', 'Queue', 'PedidoExame', 'ResultadoExame',
    'Trip', 'LabConfig', 'AccessProfile',
];

const ACOES = [
    'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE',
    'READ', 'VIEW', 'VIEW_REPORT', 'LIBERAR', 'DOWNLOAD',
];

const hoje = new Date().toISOString().slice(0, 10);
const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const FORM_INICIAL = { action: '', model_type: '', user_name: '', date_from: seteDiasAtras, date_to: hoje };
const PAGE_LABELS = {
    '/': 'Início',
    '/dashboard': 'Dashboard',
    '/auditoria': 'Auditoria',
    '/users': 'Usuários',
    '/clients': 'Clientes',
    '/client_report': 'Relatório de Clientes',
    '/laboratorio/exames': 'Laboratório - Exames',
    '/laboratorio/pedidos': 'Laboratório - Pedidos',
    '/laboratorio/resultados': 'Laboratório - Resultados',
    '/fila': 'Fila',
    '/tfd': 'TFD',
    '/estabelecimentos': 'Vigilância - Estabelecimentos',
    '/alvaras': 'Vigilância - Alvarás',
    '/pharmacy/medicines': 'Farmácia - Medicamentos',
    '/pharmacy/daily-status': 'Farmácia - Status Diário',
    '/pharmacy/monthly-acquisitions': 'Farmácia - Aquisições Mensais',
    '/pharmacy/compliance': 'Farmácia - Conformidade',
    // Monitor APS
    '/monitor-aps': 'Monitor APS - Resumo',
    '/monitor-aps/qualidade': 'Monitor APS - Indicadores de Qualidade',
    '/monitor-aps/vinculo': 'Monitor APS - Vínculo Territorial',
    '/monitor-aps/equipe': 'Monitor APS - Por Equipe',
    '/monitor-aps/visitas': 'Monitor APS - Visitas ACS',
    '/monitor-aps/visitas/evolucao': 'Monitor APS - Evolução de Visitas',
    '/monitor-aps/visitas/mapa': 'Monitor APS - Mapa de Visitas',
    '/monitor-aps/configuracoes': 'Monitor APS - Configurações',
};

const endpointLabel = (endpoint) => {
    if (!endpoint) return null;
    return endpoint
        .replace(/^api\//, '')        // remove prefixo api/
        .replace(/\/\d+$/, '')        // remove ID numérico final
        .replace(/\/\d+\//, '/')      // remove IDs intermediários
        .replace(/-/g, ' ');          // hífens → espaços
};

const pageViewFriendlyLabel = (log) => {
    // Prioridade 1: label explícito gravado pelo frontend (monitor-aps, etc.)
    if (log?.new_values?.label) return log.new_values.label;

    const path = log?.new_values?.path;
    if (!path) return null;

    // Prioridade 2: mapeamento estático de paths conhecidos
    const normalized = `/${String(path).replace(/^\/+/, '').replace(/\/\d+$/, '')}`;
    if (PAGE_LABELS[normalized]) return PAGE_LABELS[normalized];

    // Fallback: path legível
    const fallback = normalized
        .replace(/^\/+/, '')
        .replace(/-/g, ' ')
        .replace(/\//g, ' / ')
        .trim();

    return fallback ? fallback.toUpperCase() : '/';
};

export default function Auditoria() {
    const dispatch = useDispatch();
    const { logs, total, perPage } = useSelector(s => s.auditLogs);

    const [filters, setFilters]   = useState(FORM_INICIAL);
    const [page, setPage]         = useState(0);
    const [expanded, setExpanded] = useState({});
    const [usuarios, setUsuarios] = useState([]);

    useEffect(() => {
        dispatch(getAuditLogs({}, 1));
        api.get('/audit-logs/users')
            .then(res => setUsuarios(res.data))
            .catch(() => {});
    }, []);

    const load = (pg = 0) => {
        const active = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
        dispatch(getAuditLogs(active, pg + 1));
    };

    const handleFilter = () => { setPage(0); load(0); };
    const handleReset  = () => { setFilters(FORM_INICIAL); setPage(0); dispatch(getAuditLogs({}, 1)); };
    const handlePage   = (_, p) => { setPage(p); load(p); };
    const toggle       = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    const renderDiff = (log) => {
        if (log.action === 'UPDATE' && log.old_values && log.new_values) {
            const keys = Object.keys(log.new_values);
            return (
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell><b>Campo</b></TableCell>
                            <TableCell><b>Antes</b></TableCell>
                            <TableCell><b>Depois</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {keys.map(k => (
                            <TableRow key={k}>
                                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{k}</TableCell>
                                <TableCell sx={{ color: 'error.main', fontSize: 12 }}>{String(log.old_values[k] ?? '—')}</TableCell>
                                <TableCell sx={{ color: 'success.main', fontSize: 12 }}>{String(log.new_values[k] ?? '—')}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            );
        }

        const data = log.new_values || log.old_values;
        if (!data) return <Typography variant="body2" color="text.secondary">Sem dados registrados.</Typography>;

        return (
            <Box component="pre" sx={{ fontSize: 12, m: 0, overflow: 'auto', maxHeight: 200 }}>
                {JSON.stringify(data, null, 2)}
            </Box>
        );
    };

    return (
        <Box sx={modalFormRootSx}>
        <BaseCard title={`Auditoria — ${total} registros`}>
            <Grid container spacing={2} mb={2} alignItems="stretch">
                <Grid item xs={12} sm={6} md={2}>
                <FormControl className="lg-search-field" fullWidth size="small">
                    <InputLabel>Ação</InputLabel>
                    <Select value={filters.action} label="Ação" onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}>
                        <MenuItem value=""><em>Todas</em></MenuItem>
                        {ACOES.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                    </Select>
                </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                <FormControl className="lg-search-field" fullWidth size="small">
                    <InputLabel>Recurso</InputLabel>
                    <Select value={filters.model_type} label="Recurso" onChange={e => setFilters(f => ({ ...f, model_type: e.target.value }))}>
                        <MenuItem value=""><em>Todos</em></MenuItem>
                        {RECURSOS.map(m => (
                            <MenuItem key={m} value={m}>{m.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                <FormControl className="lg-search-field" fullWidth size="small">
                    <InputLabel>Usuário</InputLabel>
                    <Select value={filters.user_name} label="Usuário" onChange={e => setFilters(f => ({ ...f, user_name: e.target.value }))}>
                        <MenuItem value=""><em>Todos</em></MenuItem>
                        {usuarios.map(u => (
                            <MenuItem key={u.user_id} value={u.user_name}>{u.user_name.toUpperCase()}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                <TextField
                    className="lg-search-field"
                    fullWidth
                    size="small"
                    type="date"
                    value={filters.date_from}
                    onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))}
                    title="De"
                    InputLabelProps={{ shrink: true }}
                />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                <TextField
                    className="lg-search-field"
                    fullWidth
                    size="small"
                    type="date"
                    value={filters.date_to}
                    onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))}
                    title="Até"
                    InputLabelProps={{ shrink: true }}
                />
                </Grid>

                <Grid item xs={6} sm={3} md={1}>
                <Button
                    variant="contained"
                    onClick={handleFilter}
                    fullWidth
                    sx={{ height: 40, minWidth: 0 }}
                >
                    <FeatherIcon icon="search" width="20" height="20" />
                </Button>
                </Grid>
                <Grid item xs={6} sm={3} md={1}>
                <Button
                    variant="outlined"
                    onClick={handleReset}
                    fullWidth
                    sx={{ height: 40, minWidth: 0 }}
                >
                    <FeatherIcon icon="x" width="20" height="20" />
                </Button>
                </Grid>
            </Grid>

            <TableContainer>
                <Table size="small" sx={{ whiteSpace: 'nowrap' }}>
                    <TableHead>
                        <TableRow>
                            <TableCell><Typography variant="h6" color="textSecondary">Data/Hora</Typography></TableCell>
                            <TableCell><Typography variant="h6" color="textSecondary">Usuário</Typography></TableCell>
                            <TableCell><Typography variant="h6" color="textSecondary">Ação</Typography></TableCell>
                            <TableCell><Typography variant="h6" color="textSecondary">Recurso</Typography></TableCell>
                            <TableCell><Typography variant="h6" color="textSecondary">ID</Typography></TableCell>
                            <TableCell><Typography variant="h6" color="textSecondary">IP</Typography></TableCell>
                            <TableCell><Typography variant="h6" color="textSecondary">Detalhes</Typography></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {logs.map(log => (
                            <React.Fragment key={log.id}>
                                <TableRow hover>
                                    <TableCell sx={{ fontSize: 12 }}>
                                        {new Date(log.created_at).toLocaleString('pt-BR')}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600}>{log.user_name?.toUpperCase()}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
                                            <Chip label={log.action} color={ACTION_COLORS[log.action] || 'default'} size="small" />
                                            {['VIEW', 'VIEW_REPORT', 'READ'].includes(log.action) && (
                                                <Typography sx={{ fontSize: 11, color: 'text.secondary', fontFamily: 'monospace' }}>
                                                    {pageViewFriendlyLabel(log) ?? endpointLabel(log.endpoint) ?? ''}
                                                </Typography>
                                            )}
                                            {log.action === 'READ' && log.new_values?.filtros && (
                                                <Chip
                                                    label={Object.entries(log.new_values.filtros)
                                                        .filter(([, v]) => v !== '' && v != null)
                                                        .map(([k, v]) => `${k}: ${v}`)
                                                        .join(' · ')}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontSize: 10, maxWidth: 320 }}
                                                />
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        {log.model_type
                                            ? <Chip label={log.model_type.replace(/([A-Z])/g, ' $1').trim().toUpperCase()} size="small" variant="outlined" />
                                            : <Typography color="textSecondary" sx={{ fontSize: 12 }}>—</Typography>}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>
                                        {log.model_id ?? '—'}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>
                                        {log.ip_address}
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            {(log.old_values || log.new_values) && (
                                                <Button size="small" onClick={() => toggle(log.id)}
                                                    endIcon={<FeatherIcon icon={expanded[log.id] ? 'chevron-up' : 'chevron-down'} width="14" height="14" />}>
                                                    ver
                                                </Button>
                                            )}
                                            {log.action === 'UPDATE' && log.old_values && log.new_values && (
                                                <Button size="small" onClick={() => auditoriaPDF(log)} title="Baixar PDF desta alteração">
                                                    <FeatherIcon icon="download" width="14" height="14" />
                                                </Button>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                                {(log.old_values || log.new_values) && (
                                    <TableRow>
                                        <TableCell colSpan={7} sx={{ p: 0, borderBottom: 0 }}>
                                            <Collapse in={!!expanded[log.id]} timeout="auto" unmountOnExit>
                                                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1, m: 1 }}>
                                                    {renderDiff(log)}
                                                </Box>
                                            </Collapse>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        ))}
                        {logs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <Typography color="text.secondary">Nenhum registro encontrado</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={total}
                    page={page}
                    onPageChange={handlePage}
                    rowsPerPage={perPage}
                    rowsPerPageOptions={[50]}
                    labelRowsPerPage="Por página:"
                />
            </TableContainer>
        </BaseCard>
        </Box>
    );
}
