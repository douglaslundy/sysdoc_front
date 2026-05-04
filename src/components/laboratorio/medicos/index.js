import React, { useEffect, useState } from 'react';
import {
    Box, Card, CardContent, Chip, Fab, IconButton, Table, TableBody,
    TableCell, TableContainer, TableHead, TablePagination, TableRow,
    TextField, Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import { getAllMedicos, removeMedicoFetch } from '../../../store/fetchActions/medicosSolicitantes';
import { showMedico } from '../../../store/ducks/medicosSolicitantes';
import { turnModal } from '../../../store/ducks/Layout';
import MedicoSolicitanteModal from '../../modal/medicoSolicitante';
import AlertModal from '../../messagesModal';

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
        <MedicoSolicitanteModal>
            <Card>
                <AlertModal />
                <Box p={2} display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                    <Typography variant="h4">Médicos Solicitantes</Typography>
                    <Box display="flex" gap={1} alignItems="center">
                        <TextField
                            size="small"
                            placeholder="Buscar médico..."
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                            inputProps={{ maxLength: 80 }}
                        />
                        <Fab color="primary" size="small" title="Novo Médico" onClick={handleNovo}>
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
                                    <TableCell><Typography variant="h6">CRM / UF</Typography></TableCell>
                                    <TableCell><Typography variant="h6">Especialidade</Typography></TableCell>
                                    <TableCell align="center"><Typography variant="h6">Status</Typography></TableCell>
                                    <TableCell align="center"><Typography variant="h6">Ações</Typography></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filtrados
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map(medico => (
                                        <TableRow key={medico.id} hover>
                                            <TableCell>
                                                <Typography fontWeight="bold">{medico.nome}</Typography>
                                                {medico.telefone && (
                                                    <Typography variant="caption" color="text.secondary">{medico.telefone}</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {medico.crm
                                                    ? `${medico.crm}${medico.uf_crm ? '/' + medico.uf_crm : ''}`
                                                    : <Typography color="text.secondary" variant="caption">—</Typography>
                                                }
                                            </TableCell>
                                            <TableCell>
                                                {medico.especialidade || <Typography color="text.secondary" variant="caption">—</Typography>}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={medico.ativo ? 'Ativo' : 'Inativo'}
                                                    color={medico.ativo ? 'success' : 'error'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton size="small" title="Editar" onClick={() => handleEditar(medico)}>
                                                    <FeatherIcon icon="edit-2" size={16} />
                                                </IconButton>
                                                <IconButton size="small" title="Remover" color="error"
                                                    onClick={() => dispatch(removeMedicoFetch(medico.id))}>
                                                    <FeatherIcon icon="trash-2" size={16} />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
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
        </MedicoSolicitanteModal>
    );
}
