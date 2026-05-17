import React, { useEffect, useState } from 'react';
import {
    Box, Button, Chip, Fab, Table, TableBody, TableCell, TableContainer,
    TableHead, TablePagination, TableRow, TextField, Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import { getAllCategorias, removeCategoriaFetch } from '../../../store/fetchActions/categoriasExame';
import { showCategoria } from '../../../store/ducks/categoriasExame';
import { turnModal } from '../../../store/ducks/Layout';
import CategoriaExameModal from '../../modal/categoriaExame';
import AlertModal from '../../messagesModal';
import BaseCard from '../../baseCard/BaseCard';

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
            <BaseCard title={`Você possui ${categorias.length} Categorias Cadastradas`}>
                <AlertModal />
                <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mb={2}>
                    <TextField
                        className="lg-search-field"
                        size="small"
                        placeholder="Buscar categoria"
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        inputProps={{ maxLength: 80 }}
                        sx={{ minWidth: 280 }}
                    />
                    <Fab color="primary" title="Nova Categoria" onClick={handleNova}>
                        <FeatherIcon icon="plus" />
                    </Fab>
                </Box>
                <TableContainer>
                    <Table aria-label="categorias" sx={{ mt: 1, whiteSpace: 'nowrap' }}>
                        <TableHead>
                            <TableRow>
                                <TableCell><Typography color="textSecondary" variant="h6">Nome</Typography></TableCell>
                                <TableCell align="center"><Typography color="textSecondary" variant="h6">Status</Typography></TableCell>
                                <TableCell align="center"><Typography color="textSecondary" variant="h6">Ações</Typography></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtradas
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map(categoria => (
                                    <TableRow key={categoria.id} hover>
                                        <TableCell>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>{categoria.nome}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={categoria.ativo ? 'Ativa' : 'Inativa'}
                                                color={categoria.ativo ? 'success' : 'error'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ '& button': { mx: 1 } }}>
                                                <Button
                                                    title="Editar categoria"
                                                    onClick={() => handleEditar(categoria)}
                                                    color="primary"
                                                    size="medium"
                                                    variant="contained"
                                                >
                                                    <FeatherIcon icon="edit" width="20" height="20" />
                                                </Button>
                                                <Button
                                                    title="Remover categoria"
                                                    onClick={() => dispatch(removeCategoriaFetch(categoria.id))}
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
            </BaseCard>
        </CategoriaExameModal>
    );
}
