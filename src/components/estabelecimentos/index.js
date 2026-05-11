import React, { useEffect, useRef, useState } from 'react';
import {
    Box, Button, Fab, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Typography, styled,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import BaseCard from '../baseCard/BaseCard';
import AlertModal from '../messagesModal';
import ConfirmDialog from '../confirmDialog';
import EstabelecimentoDialog from '../modal/estabelecimento';
import { getAllEstabelecimentos, removeEstabelecimentoFetch } from '../../store/fetchActions/estabelecimentos';
import { changeTitleAlert } from '../../store/ducks/Layout';

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover },
    '&:last-child td, &:last-child th': { border: 0 },
}));

const formatDate = (s) => {
    if (!s) return '—';
    const [y, m, d] = s.substring(0, 10).split('-');
    return `${d}/${m}/${y}`;
};

export default function ListaEstabelecimentos() {
    const dispatch = useDispatch();
    const { estabelecimentos, pagination } = useSelector(state => state.estabelecimentos);

    const [busca, setBusca] = useState('');
    const [page, setPage] = useState(1);
    const buscaRef = useRef(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editando, setEditando] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', subTitle: '', confirm: null });

    const carregar = (params = {}) => {
        dispatch(getAllEstabelecimentos({ page, busca: busca || undefined, ...params }));
    };

    useEffect(() => {
        carregar({ page: 1 });
    }, []);

    const handleBusca = ({ target }) => {
        const valor = target.value;
        setBusca(valor);
        setPage(1);
        clearTimeout(buscaRef.current);
        buscaRef.current = setTimeout(() => {
            dispatch(getAllEstabelecimentos({ busca: valor || undefined, page: 1 }));
        }, 400);
    };

    const handlePage = (delta) => {
        const novaPage = page + delta;
        setPage(novaPage);
        dispatch(getAllEstabelecimentos({ busca: busca || undefined, page: novaPage }));
    };

    const handleNovo = () => {
        setEditando(null);
        setDialogOpen(true);
    };

    const handleEditar = (est) => {
        setEditando(est);
        setDialogOpen(true);
    };

    const handleExcluir = (est) => {
        dispatch(changeTitleAlert(`Estabelecimento ${est.nome_estabelecimento} excluído com sucesso!`));
        setConfirmDialog({
            isOpen: true,
            title: `Deseja excluir ${est.nome_estabelecimento}?`,
            subTitle: 'Esta ação não poderá ser desfeita',
            confirm: removeEstabelecimentoFetch(est.id),
        });
    };

    const handleSuccess = () => {
        setDialogOpen(false);
        carregar({ page });
    };

    return (
        <BaseCard title={`Estabelecimentos${pagination ? ` — ${pagination.total} registros` : ''}`}>
            <AlertModal />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, mt: 1 }}>
                <TextField
                    sx={{ flexGrow: 1 }}
                    label="Pesquisar por nome, responsável ou CNAE"
                    value={busca}
                    onChange={handleBusca}
                    inputProps={{ autoComplete: 'off' }}
                />
                <Fab color="primary" onClick={handleNovo} size="medium" title="Novo estabelecimento">
                    <FeatherIcon icon="plus" />
                </Fab>
            </Box>

            <TableContainer>
                <Table sx={{ mt: 2, whiteSpace: 'nowrap' }}>
                    <TableHead>
                        <TableRow>
                            <TableCell><Typography variant="h6" color="textSecondary">Estabelecimento</Typography></TableCell>
                            <TableCell><Typography variant="h6" color="textSecondary">Responsável</Typography></TableCell>
                            <TableCell><Typography variant="h6" color="textSecondary">Endereço</Typography></TableCell>
                            <TableCell><Typography variant="h6" color="textSecondary">CNAE</Typography></TableCell>
                            <TableCell><Typography variant="h6" color="textSecondary">Cadastro</Typography></TableCell>
                            <TableCell align="center"><Typography variant="h6" color="textSecondary">Ações</Typography></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {estabelecimentos.map((est) => (
                            <StyledTableRow key={est.id} hover>
                                <TableCell>
                                    <Typography variant="h6" fontWeight={600}>{est.nome_estabelecimento}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{est.nome_responsavel}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {est.endereco}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{est.cnaes}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{formatDate(est.created_at)}</Typography>
                                </TableCell>
                                <TableCell align="center">
                                    <Box sx={{ '& button': { mx: 0.5 } }}>
                                        <Button onClick={() => handleEditar(est)} color="primary" variant="contained" size="small" title="Editar">
                                            <FeatherIcon icon="edit" width="18" height="18" />
                                        </Button>
                                        <Button onClick={() => handleExcluir(est)} color="error" variant="contained" size="small" title="Excluir">
                                            <FeatherIcon icon="trash" width="18" height="18" />
                                        </Button>
                                    </Box>
                                </TableCell>
                            </StyledTableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {pagination && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, mt: 2 }}>
                    <Typography variant="body2">
                        Página {pagination.current_page} de {pagination.last_page}
                    </Typography>
                    <Button size="small" disabled={pagination.current_page <= 1} onClick={() => handlePage(-1)}>Anterior</Button>
                    <Button size="small" disabled={pagination.current_page >= pagination.last_page} onClick={() => handlePage(1)}>Próxima</Button>
                </Box>
            )}

            <EstabelecimentoDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                estabelecimento={editando}
                onSuccess={handleSuccess}
            />

            <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
        </BaseCard>
    );
}
