import React, { useEffect, useState } from 'react';
import {
    Box, Card, CardContent, Chip, Fab, IconButton, Table, TableBody,
    TableCell, TableContainer, TableHead, TablePagination, TableRow,
    TextField, Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import { getAllCategorias, removeCategoriaFetch } from '../../../store/fetchActions/categoriasExame';
import { showCategoria } from '../../../store/ducks/categoriasExame';
import { turnModal } from '../../../store/ducks/Layout';
import CategoriaExameModal from '../../modal/categoriaExame';
import AlertModal from '../../messagesModal';

export default function CategoriasExame() {
    const dispatch = useDispatch();
    const { categorias } = useSelector(state => state.categoriasExame);

    const [busca, setBusca] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    useEffect(() => {
        dispatch(getAllCategorias());
    }, []);

    const filtradas = categorias.filter(c =>
        c.nome?.toLowerCase().includes(busca.toLowerCase())
    );

    const handleNova = () => {
        dispatch(showCategoria({}));
        dispatch(turnModal());
    };

    const handleEditar = (categoria) => {
        dispatch(showCategoria(categoria));
        dispatch(turnModal());
    };

    return (
        <CategoriaExameModal>
            <Card>
                <AlertModal />
                <Box p={2} display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                    <Typography variant="h4">Categorias de Exame</Typography>
                    <Box display="flex" gap={1} alignItems="center">
                        <TextField
                            size="small"
                            placeholder="Buscar categoria"
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                            inputProps={{ maxLength: 80 }}
                        />
                        <Fab color="primary" size="small" title="Nova Categoria" onClick={handleNova}>
                            <FeatherIcon icon="plus" size={18} />
                        </Fab>
                    </Box>
                </Box>
                <CardContent sx={{ pt: 0 }}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell><Typography variant="h6">Nome</Typography></TableCell>
                                    <TableCell align="center"><Typography variant="h6">Status</Typography></TableCell>
                                    <TableCell align="center"><Typography variant="h6">Ações</Typography></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filtradas
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map(categoria => (
                                        <TableRow key={categoria.id} hover>
                                            <TableCell>
                                                <Typography fontWeight="bold">{categoria.nome}</Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={categoria.ativo ? 'Ativa' : 'Inativa'}
                                                    color={categoria.ativo ? 'success' : 'error'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton size="small" title="Editar" onClick={() => handleEditar(categoria)}>
                                                    <FeatherIcon icon="edit-2" size={16} />
                                                </IconButton>
                                                <IconButton size="small" title="Remover" color="error" onClick={() => dispatch(removeCategoriaFetch(categoria.id))}>
                                                    <FeatherIcon icon="trash-2" size={16} />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                {filtradas.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center">
                                            <Typography color="text.secondary">Nenhuma categoria encontrada</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <TablePagination
                            component="div"
                            count={filtradas.length}
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
        </CategoriaExameModal>
    );
}
