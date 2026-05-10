import React, { useEffect, useRef, useState } from 'react';
import {
    Box, Button, Chip, Fab, MenuItem, Select, Table, TableBody, TableCell,
    TableContainer, TableHead, TablePagination, TableRow, Typography,
    FormControl, InputLabel, TextField,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import { api } from '../../../services/api';
import { getAllPedidos, removePedidoFetch } from '../../../store/fetchActions/pedidosExame';
import { iniciarResultado, getResultado } from '../../../store/fetchActions/resultadoExames';
import { turnModal, turnResultadoModal } from '../../../store/ducks/Layout';
import PedidoModal from '../../modal/pedido';
import ResultadoModal from '../../modal/resultado';
import AlertModal from '../../messagesModal';
import BaseCard from '../../baseCard/BaseCard';
import EditarPedidoDialog from '../../modal/editarPedido';

const STATUS_COR = {
    solicitado: 'default', coletado: 'info', em_analise: 'warning', liberado: 'success', cancelado: 'error',
};

const formatDate = (s) => {
    if (!s) return '—';
    const [y, m, d] = s.substring(0, 10).split('-');
    return `${d}/${m}/${y}`;
};

export default function ListaPedidos() {
    const dispatch = useDispatch();
    const { pedidos } = useSelector(state => state.pedidosExame);

    const [filtroStatus, setFiltroStatus] = useState('');
    const [busca, setBusca] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const buscaRef = useRef(null);
    const [editarPedido, setEditarPedido] = useState(null);

    useEffect(() => {
        dispatch(getAllPedidos());
    }, []);

    const handleBusca = (valor) => {
        setBusca(valor);
        clearTimeout(buscaRef.current);
        buscaRef.current = setTimeout(() => {
            dispatch(getAllPedidos({ busca: valor || undefined }));
        }, 400);
    };

    const filtrados = pedidos.filter(p => !filtroStatus || p.status === filtroStatus);

    const handleDownloadPdf = async (resultadoId, protocolo) => {
        try {
            const res = await api.get(`/laboratorio/resultados/${resultadoId}/pdf`, { responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = `laudo-${protocolo || resultadoId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            // erro tratado pelo interceptor global do api.js
        }
    };

    const handleAbrirResultado = (pedido) => {
        if (pedido.resultado) {
            dispatch(getResultado(pedido.resultado.id));
            dispatch(turnResultadoModal());
        } else {
            dispatch(iniciarResultado(pedido.id, () => {
                dispatch(turnResultadoModal());
            }));
        }
    };

    return (
        <>
        <ResultadoModal>
        <PedidoModal>
            <BaseCard title={`Você possui ${pedidos.length} Pedidos Cadastrados`}>
                <AlertModal />
                <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mb={2}>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Status</InputLabel>
                        <Select value={filtroStatus} label="Status" onChange={e => setFiltroStatus(e.target.value)}>
                            <MenuItem value="">Todos</MenuItem>
                            {Object.keys(STATUS_COR).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <TextField
                        size="small"
                        placeholder="Buscar por nome, CNS, CPF ou protocolo"
                        value={busca}
                        onChange={e => handleBusca(e.target.value)}
                        sx={{ minWidth: 260 }}
                        InputProps={{
                            startAdornment: <FeatherIcon icon="search" width={16} height={16} style={{ marginRight: 8, opacity: 0.5 }} />,
                        }}
                    />
                    <Fab color="primary" title="Novo Pedido" onClick={() => dispatch(turnModal())}>
                        <FeatherIcon icon="plus" />
                    </Fab>
                </Box>
                <TableContainer>
                    <Table aria-label="pedidos" sx={{ mt: 1, whiteSpace: 'nowrap' }}>
                        <TableHead>
                            <TableRow>
                                <TableCell><Typography color="textSecondary" variant="h6">Protocolo</Typography></TableCell>
                                <TableCell><Typography color="textSecondary" variant="h6">Paciente</Typography></TableCell>
                                <TableCell><Typography color="textSecondary" variant="h6">Data</Typography></TableCell>
                                <TableCell><Typography color="textSecondary" variant="h6">Exames</Typography></TableCell>
                                <TableCell align="center"><Typography color="textSecondary" variant="h6">Status</Typography></TableCell>
                                <TableCell align="center"><Typography color="textSecondary" variant="h6">Ações</Typography></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(pedido => (
                                <TableRow key={pedido.id} hover>
                                    <TableCell>
                                        <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: 1 }}>
                                            {pedido.resultado?.protocolo ?? '—'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>{pedido.cliente?.name || '—'}</Typography>
                                        {pedido.medico_solicitante?.nome && (
                                            <Typography color="textSecondary" sx={{ fontSize: '12px' }}>Dr. {pedido.medico_solicitante.nome}</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="h6">{formatDate(pedido.data_pedido)}</Typography>
                                        {pedido.data_coleta && <Typography color="textSecondary" sx={{ fontSize: '12px' }}>Coleta: {formatDate(pedido.data_coleta)}</Typography>}
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
                                        <Box sx={{ '& button': { mx: 0.5 } }}>
                                            {!['liberado', 'cancelado'].includes(pedido.status) && (
                                                <Button
                                                    title="Editar pedido"
                                                    onClick={() => setEditarPedido(pedido)}
                                                    color="warning"
                                                    size="medium"
                                                    variant="contained"
                                                >
                                                    <FeatherIcon icon="edit-2" width="20" height="20" />
                                                </Button>
                                            )}
                                            <Button
                                                title="Preencher resultado"
                                                onClick={() => handleAbrirResultado(pedido)}
                                                color="info"
                                                size="medium"
                                                variant="contained"
                                            >
                                                <FeatherIcon icon="file-text" width="20" height="20" />
                                            </Button>
                                            {pedido.status === 'liberado' && pedido.resultado?.id && (
                                                <Button
                                                    title="Baixar laudo PDF"
                                                    onClick={() => handleDownloadPdf(pedido.resultado.id, pedido.resultado.protocolo)}
                                                    color="success"
                                                    size="medium"
                                                    variant="contained"
                                                >
                                                    <FeatherIcon icon="download" width="20" height="20" />
                                                </Button>
                                            )}
                                            <Button
                                                title="Remover pedido"
                                                onClick={() => dispatch(removePedidoFetch(pedido.id))}
                                                color="error"
                                                size="medium"
                                                variant="contained"
                                            >
                                                <FeatherIcon icon="trash" width="20" height="20" />
                                            </Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filtrados.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
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
            </BaseCard>
        </PedidoModal>
        </ResultadoModal>
        <EditarPedidoDialog
            open={!!editarPedido}
            onClose={() => setEditarPedido(null)}
            pedido={editarPedido}
        />
        </>
    );
}
