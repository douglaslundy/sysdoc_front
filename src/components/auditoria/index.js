import React, { useEffect, useState } from 'react';
import {
    Box, Button, Chip, Collapse, FormControl, InputLabel, MenuItem,
    Select, Table, TableBody, TableCell, TableContainer, TableHead,
    TablePagination, TableRow, Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import { getAuditLogs } from '../../store/fetchActions/auditLogs';
import BaseCard from '../baseCard/BaseCard';
import { api } from '../../services/api';

const ACTION_COLORS = {
    LOGIN: 'info', LOGOUT: 'default', CREATE: 'success',
    UPDATE: 'warning', DELETE: 'error',
    VIEW: 'primary', VIEW_REPORT: 'secondary', LIBERAR: 'success', DOWNLOAD: 'info',
};

const RECURSOS = [
    'Client', 'User', 'Queue', 'PedidoExame', 'ResultadoExame',
    'Trip', 'LabConfig', 'AccessProfile',
];

const ACOES = [
    'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE',
    'VIEW', 'VIEW_REPORT', 'LIBERAR', 'DOWNLOAD',
];

const FORM_INICIAL = { action: '', model_type: '', user_name: '', date_from: '', date_to: '' };

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
        <BaseCard title={`Auditoria — ${total} registros`}>
            <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Ação</InputLabel>
                    <Select value={filters.action} label="Ação" onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}>
                        <MenuItem value=""><em>Todas</em></MenuItem>
                        {ACOES.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Recurso</InputLabel>
                    <Select value={filters.model_type} label="Recurso" onChange={e => setFilters(f => ({ ...f, model_type: e.target.value }))}>
                        <MenuItem value=""><em>Todos</em></MenuItem>
                        {RECURSOS.map(m => (
                            <MenuItem key={m} value={m}>{m.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Usuário</InputLabel>
                    <Select value={filters.user_name} label="Usuário" onChange={e => setFilters(f => ({ ...f, user_name: e.target.value }))}>
                        <MenuItem value=""><em>Todos</em></MenuItem>
                        {usuarios.map(u => (
                            <MenuItem key={u.user_id} value={u.user_name}>{u.user_name.toUpperCase()}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small">
                    <input
                        type="date"
                        value={filters.date_from}
                        onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))}
                        style={{ padding: '8px', borderRadius: 4, border: '1px solid #ccc', fontSize: 14 }}
                        title="De"
                    />
                </FormControl>
                <FormControl size="small">
                    <input
                        type="date"
                        value={filters.date_to}
                        onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))}
                        style={{ padding: '8px', borderRadius: 4, border: '1px solid #ccc', fontSize: 14 }}
                        title="Até"
                    />
                </FormControl>

                <Button variant="contained" onClick={handleFilter}>
                    <FeatherIcon icon="search" width="20" height="20" />
                </Button>
                <Button variant="outlined" onClick={handleReset}>
                    <FeatherIcon icon="x" width="20" height="20" />
                </Button>
            </Box>

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
                                        <Chip label={log.action} color={ACTION_COLORS[log.action] || 'default'} size="small" />
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
                                        {(log.old_values || log.new_values) && (
                                            <Button size="small" onClick={() => toggle(log.id)}
                                                endIcon={<FeatherIcon icon={expanded[log.id] ? 'chevron-up' : 'chevron-down'} width="14" height="14" />}>
                                                ver
                                            </Button>
                                        )}
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
    );
}
