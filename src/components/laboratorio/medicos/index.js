import React, { useEffect, useState } from 'react';
import {
    Box, Button, Chip, Fab, Table, TableBody, TableCell, TableContainer,
    TableHead, TablePagination, TableRow, TextField, Typography,
    styled,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import { getAllMedicos, removeMedicoFetch } from '../../../store/fetchActions/medicosSolicitantes';
import { showMedico } from '../../../store/ducks/medicosSolicitantes';
import { turnModal } from '../../../store/ducks/Layout';
import MedicoSolicitanteModal from '../../modal/medicoSolicitante';
import AlertModal from '../../messagesModal';
import BaseCard from '../../baseCard/BaseCard';
import { modalFormRootSx } from '../../modal/_shared/modalFormStyles';

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

export default function MedicosSolicitantes() {
    const dispatch = useDispatch();
    const { medicos } = useSelector(state => state.medicosSolicitantes);

    const [busca, setBusca] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    useEffect(() => {
        dispatch(getAllMedicos({ all: true }));
    }, []);

    const filtrados = medicos.filter(m =>
        m.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        m.crm?.toLowerCase().includes(busca.toLowerCase()) ||
        m.especialidade?.toLowerCase().includes(busca.toLowerCase())
    );

    const handleNovo = () => {
        dispatch(showMedico({}));
        dispatch(turnModal());
    };

    const handleEditar = (medico) => {
        dispatch(showMedico(medico));
        dispatch(turnModal());
    };

    return (
        <Box sx={modalFormRootSx} className="queue-page lab-medicos-page">
        <MedicoSolicitanteModal>
            <BaseCard title={`Você possui ${medicos.length} Médicos Cadastrados`}>
                <AlertModal />
                <Box className="queue-page__toolbar" display="flex" alignItems="center" justifyContent="space-between" flexWrap={{ xs: 'wrap', md: 'nowrap' }} gap={1} mb={2}>
                    <TextField
                        className="lg-search-field"
                        size="small"
                        placeholder="Buscar médico..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        inputProps={{ maxLength: 80 }}
                        sx={{ flex: 1, minWidth: { xs: '100%', md: 0 } }}
                    />
                    <Fab className="queue-page__fab queue-page__fab--add" color="primary" title="Novo Médico" onClick={handleNovo}>
                        <FeatherIcon icon="plus" />
                    </Fab>
                </Box>
                <TableContainer className="queue-page__table-wrap">
                    <Table className="queue-page__table" aria-label="medicos" sx={{ mt: 1, whiteSpace: 'nowrap', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                        <TableHead>
                            <TableRow>
                                <TableCell><Typography color="textSecondary" variant="h6">Nome</Typography></TableCell>
                                <TableCell><Typography color="textSecondary" variant="h6">CRM / UF</Typography></TableCell>
                                <TableCell><Typography color="textSecondary" variant="h6">Especialidade</Typography></TableCell>
                                <TableCell align="center"><Typography color="textSecondary" variant="h6">Status</Typography></TableCell>
                                <TableCell align="center"><Typography color="textSecondary" variant="h6">Ações</Typography></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtrados
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map(medico => (
                                    <StyledTableRow key={medico.id} hover>
                                        <TableCell>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>{medico.nome}</Typography>
                                            {medico.telefone && (
                                                <Typography color="textSecondary" sx={{ fontSize: '12px' }}>{medico.telefone}</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="h6">
                                                {medico.crm
                                                    ? `${medico.crm}${medico.uf_crm ? '/' + medico.uf_crm : ''}`
                                                    : '—'
                                                }
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="h6">{medico.especialidade || '—'}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={medico.ativo ? 'Ativo' : 'Inativo'}
                                                color={medico.ativo ? 'success' : 'error'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box className="queue-page__actions" sx={{ '& button': { mx: 1 } }}>
                                                <Button
                                                    title="Editar médico"
                                                    onClick={() => handleEditar(medico)}
                                                    className="queue-page__action queue-page__action--success"
                                                    color="primary"
                                                    size="medium"
                                                    variant="contained"
                                                >
                                                    <FeatherIcon icon="edit" width="20" height="20" />
                                                </Button>
                                                <Button
                                                    title="Remover médico"
                                                    onClick={() => dispatch(removeMedicoFetch(medico.id))}
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
                                    <TableCell colSpan={5} align="center">
                                        <Typography color="text.secondary">Nenhum médico encontrado</Typography>
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
                        rowsPerPageOptions={[10, 15, 25]}
                        labelRowsPerPage="Por página:"
                    />
                </TableContainer>
            </BaseCard>
        </MedicoSolicitanteModal>
        </Box>
    );
}
