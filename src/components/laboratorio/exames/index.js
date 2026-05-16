import React, { useEffect, useState } from 'react';
import {
    Box, Button, Chip, Fab, Table, TableBody, TableCell,
    TableContainer, TableHead, TablePagination, TableRow, TextField, Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import { getAllExames, removeExameFetch, editExameFetch } from '../../../store/fetchActions/exames';
import { showExame } from '../../../store/ducks/exames';
import { turnModal } from '../../../store/ducks/Layout';
import ExameModal from '../../modal/exame';
import AlertModal from '../../messagesModal';
import BaseCard from '../../baseCard/BaseCard';

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
            <BaseCard title={`Você possui ${exames.length} Exames Cadastrados`}>
                <AlertModal />
                <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mb={2}>
                    <TextField
                        className="lg-search-field"
                        placeholder="Buscar por nome ou código"
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        inputProps={{ maxLength: 60 }}
                        sx={{ minWidth: 280 }}
                    />
                    <Fab color="primary" title="Novo Exame" onClick={handleNovoExame}>
                        <FeatherIcon icon="plus" />
                    </Fab>
                </Box>
                <TableContainer>
                    <Table aria-label="exames" sx={{ mt: 1, whiteSpace: 'nowrap' }}>
                        <TableHead>
                            <TableRow>
                                <TableCell><Typography color="textSecondary" variant="h6">Nome / Código</Typography></TableCell>
                                <TableCell><Typography color="textSecondary" variant="h6">Categoria</Typography></TableCell>
                                <TableCell align="center"><Typography color="textSecondary" variant="h6">Status</Typography></TableCell>
                                <TableCell align="center"><Typography color="textSecondary" variant="h6">Ações</Typography></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(exame => (
                                <TableRow key={exame.id} hover>
                                    <TableCell>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>{exame.nome}</Typography>
                                        <Typography color="textSecondary" sx={{ fontSize: '12px' }}>{exame.codigo}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="h6">{exame.categoriaExame?.nome || '—'}</Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={exame.ativo ? 'Ativo' : 'Inativo'}
                                            color={STATUS_CORES[exame.ativo]}
                                            size="small"
                                            onClick={() => handleToggleAtivo(exame)}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ '& button': { mx: 1 } }}>
                                            <Button
                                                title="Editar exame"
                                                onClick={() => handleEditarExame(exame)}
                                                color="success"
                                                size="medium"
                                                variant="contained"
                                            >
                                                <FeatherIcon icon="edit" width="20" height="20" />
                                            </Button>
                                            <Button
                                                title="Gerenciar campos"
                                                onClick={() => { window.location.href = `/laboratorio/exames/${exame.id}/campos`; }}
                                                color="info"
                                                size="medium"
                                                variant="contained"
                                            >
                                                <FeatherIcon icon="list" width="20" height="20" />
                                            </Button>
                                            <Button
                                                title="Remover exame"
                                                onClick={() => dispatch(removeExameFetch(exame.id))}
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
                        rowsPerPageOptions={[10, 15, 25, 50]}
                        labelRowsPerPage="Por página:"
                    />
                </TableContainer>
            </BaseCard>
        </ExameModal>
    );
}

