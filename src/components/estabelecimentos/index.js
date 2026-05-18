import React, { useEffect, useRef, useState } from 'react';
import {
    Box, Button, Fab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, TextField, Typography, styled,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import BaseCard from '../baseCard/BaseCard';
import AlertModal from '../messagesModal';
import ConfirmDialog from '../confirmDialog';
import EstabelecimentoDialog from '../modal/estabelecimento';
import { getAllEstabelecimentos, removeEstabelecimentoFetch } from '../../store/fetchActions/estabelecimentos';
import { changeTitleAlert } from '../../store/ducks/Layout';
import { modalFormRootSx } from '../modal/_shared/modalFormStyles';

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover },
    '&:last-child td, &:last-child th': { border: 0 },
}));

const formatDate = (s) => {
    if (!s) return '-';
    const [y, m, d] = s.substring(0, 10).split('-');
    return `${d}/${m}/${y}`;
};

const trunc = (s, n = 30) => {
    if (!s) return '-';
    return s.length > n ? s.substring(0, n) + '...' : s;
};

export default function ListaEstabelecimentos() {
    const dispatch = useDispatch();
    const { estabelecimentos, pagination } = useSelector((state) => state.estabelecimentos);

    const [busca, setBusca] = useState('');
    const [page, setPage] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const buscaRef = useRef(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editando, setEditando] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', subTitle: '', confirm: null });

    const buildParams = (overrides = {}) => ({
        page: page + 1,
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

    useEffect(() => {
        if (pagination?.current_page) {
            setPage(Math.max(0, pagination.current_page - 1));
        }
    }, [pagination?.current_page]);

    const handleBusca = ({ target }) => {
        const valor = target.value;
        setBusca(valor);
        setPage(0);
        clearTimeout(buscaRef.current);
        buscaRef.current = setTimeout(() => {
            dispatch(getAllEstabelecimentos(buildParams({ busca: valor || undefined, page: 1 })));
        }, 400);
    };

    const handlePerPage = (event) => {
        const valor = Number(event.target.value);
        setPerPage(valor);
        setPage(0);
        dispatch(getAllEstabelecimentos(buildParams({ per_page: valor, page: 1 })));
    };

    const handlePage = (_, newPage) => {
        setPage(newPage);
        dispatch(getAllEstabelecimentos(buildParams({ page: newPage + 1 })));
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
        dispatch(changeTitleAlert(`Estabelecimento ${est.nome_estabelecimento} excluido com sucesso!`));
        setConfirmDialog({
            isOpen: true,
            title: `Deseja excluir ${est.nome_estabelecimento}?`,
            subTitle: 'Esta acao nao podera ser desfeita',
            confirm: removeEstabelecimentoFetch(est.id),
        });
    };

    const handleSuccess = () => {
        setDialogOpen(false);
        carregar({ page: page + 1 });
    };

    return (
        <Box sx={modalFormRootSx}>
            <BaseCard title={`Estabelecimentos${pagination ? ` - ${pagination.total} registros` : ''}`}>
                <AlertModal />
                <Box
                    sx={{
                        '& > :not(style)': { m: 2 },
                        display: 'flex',
                        justifyContent: 'stretch',
                    }}
                >
                    <TextField
                        className="lg-search-field"
                        sx={{ width: '100%' }}
                        placeholder="Pesquisar por nome, responsavel ou CNAE"
                        value={busca}
                        onChange={handleBusca}
                        inputProps={{ autoComplete: 'off' }}
                    />
                    <Fab color="primary" onClick={handleNovo} aria-label="add" title="Novo estabelecimento">
                        <FeatherIcon icon="plus" />
                    </Fab>
                </Box>

                <TableContainer>
                    <Table sx={{ mt: 3 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell><Typography variant="h6" color="textSecondary">Estabelecimento</Typography></TableCell>
                                <TableCell><Typography variant="h6" color="textSecondary">Responsavel</Typography></TableCell>
                                <TableCell><Typography variant="h6" color="textSecondary">Endereco</Typography></TableCell>
                                <TableCell><Typography variant="h6" color="textSecondary">CNAE</Typography></TableCell>
                                <TableCell><Typography variant="h6" color="textSecondary">Cadastro</Typography></TableCell>
                                <TableCell align="center"><Typography variant="h6" color="textSecondary">Acoes</Typography></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {estabelecimentos.map((est) => (
                                <StyledTableRow key={est.id} hover>
                                    <TableCell>
                                        <Typography variant="h6" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                                            {trunc(est.nome_estabelecimento, 30)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                textTransform: 'uppercase',
                                                maxWidth: 240,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                display: 'block',
                                            }}
                                        >
                                            {trunc(est.nome_responsavel, 30)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                textTransform: 'uppercase',
                                                maxWidth: 240,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                display: 'block',
                                            }}
                                        >
                                            {trunc(est.endereco, 30)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{trunc(est.cnaes, 15)}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{formatDate(est.created_at)}</Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box
                                            sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                flexWrap: 'nowrap',
                                                whiteSpace: 'nowrap',
                                                '& button': { mx: 0.5, minWidth: 40 },
                                            }}
                                        >
                                            <Button onClick={() => handleEditar(est)} color="success" variant="contained" size="medium" title="Editar">
                                                <FeatherIcon icon="edit" width="20" height="20" />
                                            </Button>
                                            <Button onClick={() => handleExcluir(est)} color="error" variant="contained" size="medium" title="Excluir">
                                                <FeatherIcon icon="trash" width="20" height="20" />
                                            </Button>
                                        </Box>
                                    </TableCell>
                                </StyledTableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <TablePagination
                        component="div"
                        count={pagination?.total || 0}
                        page={page}
                        onPageChange={handlePage}
                        rowsPerPage={perPage}
                        onRowsPerPageChange={handlePerPage}
                        rowsPerPageOptions={PER_PAGE_OPTIONS}
                    />
                </TableContainer>

                <EstabelecimentoDialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    estabelecimento={editando}
                    onSuccess={handleSuccess}
                />

                <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
            </BaseCard>
        </Box>
    );
}
