import React, { useEffect, useRef, useState } from 'react';
import {
    Box, Button, Fab, FormControl, InputLabel, MenuItem, Select,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Typography, styled,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import BaseCard from '../baseCard/BaseCard';
import AlertModal from '../messagesModal';
import ConfirmDialog from '../confirmDialog';
import EstabelecimentoDialog from '../modal/estabelecimento';
import { getAllEstabelecimentos, removeEstabelecimentoFetch } from '../../store/fetchActions/estabelecimentos';
import { changeTitleAlert } from '../../store/ducks/Layout';

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

const StyledTableRow = styled(TableRow)(() => ({
    '&:nth-of-type(odd)': { backgroundColor: 'var(--lg-glass-row-hover)' },
    '&:last-child td, &:last-child th': { border: 0 },
}));

const formatDate = (s) => {
    if (!s) return '—';
    const [y, m, d] = s.substring(0, 10).split('-');
    return `${d}/${m}/${y}`;
};

const trunc = (s, n = 30) => {
    if (!s) return '—';
    return s.length > n ? s.substring(0, n) + '…' : s;
};

export default function ListaEstabelecimentos() {
    const dispatch = useDispatch();
    const { estabelecimentos, pagination } = useSelector(state => state.estabelecimentos);

    const [busca, setBusca] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const buscaRef = useRef(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editando, setEditando] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', subTitle: '', confirm: null });

    const buildParams = (overrides = {}) => ({
        page,
        per_page: perPage,
        busca: busca || undefined,
        ...overrides,
    });

    const carregar = (params = {}) => {
        dispatch(getAllEstabelecimentos(buildParams(params)));
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
            dispatch(getAllEstabelecimentos(buildParams({ busca: valor || undefined, page: 1 })));
        }, 400);
    };

    const handlePerPage = ({ target }) => {
        const valor = Number(target.value);
        setPerPage(valor);
        setPage(1);
        dispatch(getAllEstabelecimentos(buildParams({ per_page: valor, page: 1 })));
    };

    const handlePage = (delta) => {
        const novaPage = page + delta;
        setPage(novaPage);
        dispatch(getAllEstabelecimentos(buildParams({ page: novaPage })));
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, mt: 1, flexWrap: 'wrap' }}>
                <TextField
                    className="lg-search-field"
                    sx={{ flexGrow: 1 }}
                    placeholder="Pesquisar por nome, responsável ou CNAE"
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
                                    <Typography variant="h6" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                                        {trunc(est.nome_estabelecimento)}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{ textTransform: 'uppercase' }}>
                                        {trunc(est.nome_responsavel)}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{ textTransform: 'uppercase' }}>
                                        {trunc(est.endereco)}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{trunc(est.cnaes, 15)}</Typography>
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
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 110 }}>
                        <InputLabel>Por página</InputLabel>
                        <Select value={perPage} label="Por página" onChange={handlePerPage}>
                            {PER_PAGE_OPTIONS.map(n => (
                                <MenuItem key={n} value={n}>{n}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Typography variant="body2" color="textSecondary">
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

