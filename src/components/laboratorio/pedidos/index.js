import React, { useEffect, useState } from 'react';
import {
    Box, Card, CardContent, Chip, Fab, IconButton, MenuItem, Select,
    Table, TableBody, TableCell, TableContainer, TableHead, TablePagination,
    TableRow, Typography, FormControl, InputLabel,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import FeatherIcon from 'feather-icons-react';
import { getAllPedidos, removePedidoFetch } from '../../../store/fetchActions/pedidosExame';
import { iniciarResultado } from '../../../store/fetchActions/resultadoExames';
import { turnModal } from '../../../store/ducks/Layout';
import PedidoModal from '../../modal/pedido';
import AlertModal from '../../messagesModal';

const STATUS_COR = {
    solicitado: 'default', coletado: 'info', em_analise: 'warning', liberado: 'success', cancelado: 'error',
};

export default function ListaPedidos() {
    const dispatch = useDispatch();
    const router = useRouter();
    const { pedidos } = useSelector(state => state.pedidosExame);

    const [filtroStatus, setFiltroStatus] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    useEffect(() => {
        dispatch(getAllPedidos());
    }, []);

    const filtrados = pedidos.filter(p => !filtroStatus || p.status === filtroStatus);

    const handleIrParaResultado = (pedido) => {
        if (pedido.resultado) {
            router.push(`/laboratorio/resultados/${pedido.resultado.id}`);
        } else {
            dispatch(iniciarResultado(pedido.id, (resultado) => {
                router.push(`/laboratorio/resultados/${resultado.id}`);
            }));
        }
    };

    return (
        <PedidoModal>
            <Card>
                <AlertModal />
                <Box p={2} display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                    <Typography variant="h4">Pedidos de Exame</Typography>
                    <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel>Status</InputLabel>
                            <Select value={filtroStatus} label="Status" onChange={e => setFiltroStatus(e.target.value)}>
                                <MenuItem value="">Todos</MenuItem>
                                {Object.keys(STATUS_COR).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <Fab color="primary" size="small" title="Novo Pedido" onClick={() => dispatch(turnModal())}>
                            <FeatherIcon icon="plus" size={18} />
                        </Fab>
                    </Box>
                </Box>
                <CardContent sx={{ pt: 0 }}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell><Typography variant="h6">Paciente</Typography></TableCell>
                                    <TableCell><Typography variant="h6">Data</Typography></TableCell>
                                    <TableCell><Typography variant="h6">Exames</Typography></TableCell>
                                    <TableCell align="center"><Typography variant="h6">Status</Typography></TableCell>
                                    <TableCell align="center"><Typography variant="h6">Ações</Typography></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filtrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(pedido => (
                                    <TableRow key={pedido.id} hover>
                                        <TableCell>
                                            <Typography fontWeight="bold">{pedido.cliente?.name || '—'}</Typography>
                                            {pedido.medico_solicitante && (
                                                <Typography variant="caption" color="text.secondary">Dr. {pedido.medico_solicitante}</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography>{pedido.data_pedido}</Typography>
                                            {pedido.data_coleta && <Typography variant="caption" color="text.secondary">Coleta: {pedido.data_coleta}</Typography>}
                                        </TableCell>
                                        <TableCell>
                                            {pedido.exames?.slice(0, 2).map(e => (
                                                <Chip key={e.id} label={e.codigo} size="small" sx={{ mr: 0.5 }} />
                                            ))}
                                            {pedido.exames?.length > 2 && <Typography variant="caption">+{pedido.exames.length - 2}</Typography>}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip label={pedido.status} color={STATUS_COR[pedido.status] || 'default'} size="small" />
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton size="small" title="Preencher resultado" onClick={() => handleIrParaResultado(pedido)}>
                                                <FeatherIcon icon="file-text" size={16} />
                                            </IconButton>
                                            <IconButton size="small" title="Remover" color="error" onClick={() => dispatch(removePedidoFetch(pedido.id))}>
                                                <FeatherIcon icon="trash-2" size={16} />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filtrados.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            <Typography color="text.secondary">Nenhum pedido encontrado</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <TablePagination
                            component="div"
                            count={filtrados.length}
                            page={page}
                            onPageChange={(_, p) => setPage(p)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                            rowsPerPageOptions={[10, 15, 25]}
                            labelRowsPerPage="Por página:"
                        />
                    </TableContainer>
                </CardContent>
            </Card>
        </PedidoModal>
    );
}
