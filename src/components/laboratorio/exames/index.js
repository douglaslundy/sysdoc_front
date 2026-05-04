import React, { useEffect, useState } from 'react';
import {
    Box, Button, Chip, Fab, IconButton, Table, TableBody, TableCell,
    TableContainer, TableHead, TablePagination, TableRow, TextField,
    Typography, Card, CardContent,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import { getAllExames, removeExameFetch, editExameFetch } from '../../../store/fetchActions/exames';
import { showExame } from '../../../store/ducks/exames';
import { turnModal } from '../../../store/ducks/Layout';
import ExameModal from '../../modal/exame';
import AlertModal from '../../messagesModal';

const STATUS_CORES = { true: 'success', false: 'error' };

export default function ExameCatalogo() {
    const dispatch = useDispatch();
    const { exames } = useSelector(state => state.exames);

    const [busca, setBusca] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    useEffect(() => {
        dispatch(getAllExames());
    }, []);

    const filtrados = exames.filter(e =>
        e.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        e.codigo?.toLowerCase().includes(busca.toLowerCase())
    );

    const handleNovoExame = () => {
        dispatch(showExame({}));
        dispatch(turnModal());
    };

    const handleEditarExame = (exame) => {
        dispatch(showExame(exame));
        dispatch(turnModal());
    };

    const handleToggleAtivo = (exame) => {
        dispatch(editExameFetch(exame.id, { ...exame, ativo: !exame.ativo }));
    };

    return (
        <ExameModal>
            <Card>
                <AlertModal />
                <Box p={2} display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                    <Typography variant="h4">Catálogo de Exames</Typography>
                    <Box display="flex" gap={1} alignItems="center">
                        <TextField
                            size="small"
                            placeholder="Buscar por nome ou código"
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                            inputProps={{ maxLength: 60 }}
                        />
                        <Fab color="primary" size="small" title="Novo Exame" onClick={handleNovoExame}>
                            <FeatherIcon icon="plus" size={18} />
                        </Fab>
                    </Box>
                </Box>
                <CardContent sx={{ pt: 0 }}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell><Typography variant="h6">Nome / Código</Typography></TableCell>
                                    <TableCell><Typography variant="h6">Categoria</Typography></TableCell>
                                    <TableCell align="center"><Typography variant="h6">Status</Typography></TableCell>
                                    <TableCell align="center"><Typography variant="h6">Ações</Typography></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filtrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(exame => (
                                    <TableRow key={exame.id} hover>
                                        <TableCell>
                                            <Typography fontWeight="bold">{exame.nome}</Typography>
                                            <Typography variant="caption" color="text.secondary">{exame.codigo}</Typography>
                                        </TableCell>
                                        <TableCell>{exame.categoria || '—'}</TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={exame.ativo ? 'Ativo' : 'Inativo'}
                                                color={STATUS_CORES[exame.ativo]}
                                                size="small"
                                                onClick={() => handleToggleAtivo(exame)}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton size="small" title="Editar" onClick={() => handleEditarExame(exame)}>
                                                <FeatherIcon icon="edit-2" size={16} />
                                            </IconButton>
                                            <IconButton size="small" title="Gerenciar campos" onClick={() => {
                                                window.location.href = `/laboratorio/exames/${exame.id}/campos`;
                                            }}>
                                                <FeatherIcon icon="list" size={16} />
                                            </IconButton>
                                            <IconButton size="small" title="Remover" color="error" onClick={() => dispatch(removeExameFetch(exame.id))}>
                                                <FeatherIcon icon="trash-2" size={16} />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filtrados.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            <Typography color="text.secondary">Nenhum exame encontrado</Typography>
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
        </ExameModal>
    );
}
