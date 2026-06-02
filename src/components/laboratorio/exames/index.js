import React, { useEffect, useState } from 'react';
import {
    Box, Button, Chip, Fab, Table, TableBody, TableCell,
    TableContainer, TableHead, TablePagination, TableRow, TextField, Typography,
    styled,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import { getAllExames, removeExameFetch, editExameFetch } from '../../../store/fetchActions/exames';
import { showExame } from '../../../store/ducks/exames';
import { turnModal } from '../../../store/ducks/Layout';
import ExameModal from '../../modal/exame';
import AlertModal from '../../messagesModal';
import BaseCard from '../../baseCard/BaseCard';
import { modalFormRootSx } from '../../modal/_shared/modalFormStyles';

const STATUS_CORES = { true: 'success', false: 'error' };
const StyledTableRow = styled(TableRow)(() => ({
    '& td': {
        background: 'var(--queue-row-bg)',
        borderTop: '0.5px solid var(--lg-border)',
        borderBottom: '0.5px solid var(--lg-border)',
        paddingTop: 12,
        paddingBottom: 12,
        color: 'var(--queue-text-primary)',
    },
    '& td:first-of-type': { borderLeft: '0.5px solid var(--lg-border)', borderTopLeftRadius: 14, borderBottomLeftRadius: 14 },
    '& td:last-of-type': { borderRight: '0.5px solid var(--lg-border)', borderTopRightRadius: 14, borderBottomRightRadius: 14 },
    '&:hover td': { background: 'var(--queue-row-hover)' },
}));

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
        <Box sx={modalFormRootSx} className="queue-page lab-exames-page">
        <ExameModal>
            <BaseCard title={`Você possui ${exames.length} Exames Cadastrados`}>
                <AlertModal />
                <Box className="queue-page__toolbar" display="flex" alignItems="center" justifyContent="space-between" flexWrap={{ xs: 'wrap', md: 'nowrap' }} gap={1} mb={2}>
                    <TextField
                        className="lg-search-field"
                        placeholder="Buscar por nome ou código"
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        inputProps={{ maxLength: 60 }}
                        sx={{ flex: 1, minWidth: { xs: '100%', md: 0 } }}
                    />
                    <Fab className="queue-page__fab queue-page__fab--add" color="primary" title="Novo Exame" onClick={handleNovoExame}>
                        <FeatherIcon icon="plus" />
                    </Fab>
                </Box>
                <TableContainer className="queue-page__table-wrap">
                    <Table className="queue-page__table" aria-label="exames" sx={{ mt: 1, whiteSpace: 'nowrap', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
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
                                <StyledTableRow key={exame.id} hover>
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
                                        <Box className="queue-page__actions" sx={{ '& button': { mx: 1 } }}>
                                            <Button
                                                title="Editar exame"
                                                onClick={() => handleEditarExame(exame)}
                                                className="queue-page__action queue-page__action--success"
                                                color="success"
                                                size="medium"
                                                variant="contained"
                                            >
                                                <FeatherIcon icon="edit" width="20" height="20" />
                                            </Button>
                                            <Button
                                                title="Gerenciar campos"
                                                onClick={() => { window.location.href = `/laboratorio/exames/${exame.id}/campos`; }}
                                                className="queue-page__action queue-page__action--info"
                                                color="info"
                                                size="medium"
                                                variant="contained"
                                            >
                                                <FeatherIcon icon="list" width="20" height="20" />
                                            </Button>
                                            <Button
                                                title="Remover exame"
                                                onClick={() => dispatch(removeExameFetch(exame.id))}
                                                className="queue-page__action queue-page__action--danger"
                                                color="error"
                                                size="medium"
                                                variant="contained"
                                            >
                                                <FeatherIcon icon="trash" width="20" height="20" />
                                            </Button>
                                        </Box>
                                    </TableCell>
                                </StyledTableRow>
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
                        className="queue-page__pagination"
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
        </Box>
    );
}
