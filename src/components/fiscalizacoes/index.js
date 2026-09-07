import React, { useEffect, useRef, useState } from 'react';
import {
    Box, Fab, FormControl, InputLabel, MenuItem, Select,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, TextField, Typography, styled, Button,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import BaseCard from '../baseCard/BaseCard';
import AlertModal from '../messagesModal';
import ConfirmDialog from '../confirmDialog';
import FiscalizacaoDialog from '../modal/fiscalizacao';
import { getAllFiscalizacoes, removeFiscalizacaoFetch } from '../../store/fetchActions/fiscalizacoes';
import { changeTitleAlert } from '../../store/ducks/Layout';
import { modalFormRootSx } from '../modal/_shared/modalFormStyles';

const RESULTADO_OPTIONS = ['Conforme', 'Não conforme', 'Notificação', 'Auto de infração'];
const RESULTADO_COR = {
    'Conforme': 'success',
    'Não conforme': 'warning',
    'Notificação': 'warning',
    'Auto de infração': 'error',
};
const PER_PAGE_OPTIONS = [10, 25, 50, 100];

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

const formatDate = (s) => {
    if (!s) return '—';
    const [y, m, d] = s.substring(0, 10).split('-');
    return `${d}/${m}/${y}`;
};

export default function ListaFiscalizacoes() {
    const dispatch = useDispatch();
    const { fiscalizacoes, pagination } = useSelector(state => state.fiscalizacoes);

    const [busca, setBusca] = useState('');
    const [resultadoFiltro, setResultadoFiltro] = useState('');
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
        resultado: resultadoFiltro || undefined,
        ...overrides,
    });

    useEffect(() => {
        dispatch(getAllFiscalizacoes({ page: 1, per_page: perPage }));
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
            dispatch(getAllFiscalizacoes(buildParams({ busca: valor || undefined, page: 1 })));
        }, 400);
    };

    const handleResultadoFiltro = ({ target }) => {
        const valor = target.value;
        setResultadoFiltro(valor);
        setPage(0);
        dispatch(getAllFiscalizacoes(buildParams({ resultado: valor || undefined, page: 1 })));
    };

    const handlePerPage = (event) => {
        const valor = Number(event.target.value);
        setPerPage(valor);
        setPage(0);
        dispatch(getAllFiscalizacoes(buildParams({ per_page: valor, page: 1 })));
    };

    const handlePage = (_, newPage) => {
        setPage(newPage);
        dispatch(getAllFiscalizacoes(buildParams({ page: newPage + 1 })));
    };

    const handleNovo = () => {
        setEditando(null);
        setDialogOpen(true);
    };

    const handleEditar = (fiscalizacao) => {
        setEditando(fiscalizacao);
        setDialogOpen(true);
    };

    const handleExcluir = (fiscalizacao) => {
        dispatch(changeTitleAlert('Fiscalização excluída com sucesso!'));
        setConfirmDialog({
            isOpen: true,
            title: `Deseja excluir esta fiscalização de ${fiscalizacao.estabelecimento?.nome_estabelecimento}?`,
            subTitle: 'Esta ação não poderá ser desfeita',
            confirm: removeFiscalizacaoFetch(fiscalizacao.id),
        });
    };

    const handleSuccess = () => {
        setDialogOpen(false);
        dispatch(getAllFiscalizacoes(buildParams()));
    };

    // Apos criar, mantem o dialogo aberto em modo edicao (em vez de fechar)
    // para que o fiscal consiga anexar fotos/documentos na mesma sessao,
    // sem precisar reabrir o registro recem-criado.
    const handleCreateSuccess = (criada) => {
        setEditando(criada);
        dispatch(getAllFiscalizacoes(buildParams()));
    };

    return (
        <Box sx={modalFormRootSx} className="queue-page fiscalizacoes-page">
        <BaseCard title={`Fiscalizações${pagination ? ` — ${pagination.total} registros` : ''}`}>
            <AlertModal />
            <Box className="queue-page__toolbar"
                sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 2, mt: 1 }}
            >
                <TextField
                    className="lg-search-field"
                    sx={{ flex: '1 1 320px', minWidth: 260 }}
                    placeholder="Pesquisar por estabelecimento"
                    value={busca}
                    onChange={handleBusca}
                    inputProps={{ autoComplete: 'off' }}
                />
                <FormControl className="lg-search-field" sx={{ flex: '0 1 220px', minWidth: 180 }}>
                    <InputLabel>Resultado</InputLabel>
                    <Select value={resultadoFiltro} label="Resultado" onChange={handleResultadoFiltro}>
                        <MenuItem value="">Todos</MenuItem>
                        {RESULTADO_OPTIONS.map(r => (
                            <MenuItem key={r} value={r}>{r}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Fab className="queue-page__fab queue-page__fab--add" color="primary" onClick={handleNovo} size="medium" title="Nova fiscalização" sx={{ flex: '0 0 48px', ml: { xs: 0, md: 'auto' } }}>
                    <FeatherIcon icon="plus" />
                </Fab>
            </Box>

            <TableContainer className="queue-page__table-wrap">
                <Table className="queue-page__table" sx={{ mt: 2, whiteSpace: 'nowrap', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                    <TableHead>
                        <TableRow>
                            <TableCell className="queue-page__th"><Typography variant="h6" color="textSecondary">Estabelecimento</Typography></TableCell>
                            <TableCell className="queue-page__th"><Typography variant="h6" color="textSecondary">Data</Typography></TableCell>
                            <TableCell className="queue-page__th"><Typography variant="h6" color="textSecondary">Resultado</Typography></TableCell>
                            <TableCell className="queue-page__th"><Typography variant="h6" color="textSecondary">Fiscal</Typography></TableCell>
                            <TableCell align="center" className="queue-page__th"><Typography variant="h6" color="textSecondary">Ações</Typography></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {fiscalizacoes.map((f) => (
                            <StyledTableRow key={f.id} hover>
                                <TableCell>
                                    <Typography variant="body2" sx={{ textTransform: 'uppercase' }}>
                                        {f.estabelecimento?.nome_estabelecimento || '—'}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{formatDate(f.data_visita)}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{
                                        display: 'inline-block', px: 1.2, py: 0.4, borderRadius: 1,
                                        bgcolor: `${RESULTADO_COR[f.resultado] || 'default'}.main`, color: '#fff',
                                    }}>
                                        <Typography variant="caption" fontWeight={600}>{f.resultado}</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{f.fiscal?.name || '—'}</Typography>
                                </TableCell>
                                <TableCell align="center">
                                    <Box className="queue-page__actions" sx={{ '& button': { mx: 0.5 } }}>
                                        <Button className="queue-page__action queue-page__action--success" onClick={() => handleEditar(f)} color="success" variant="contained" size="small" title="Editar">
                                            <FeatherIcon icon="edit" width="18" height="18" />
                                        </Button>
                                        <Button className="queue-page__action queue-page__action--danger" onClick={() => handleExcluir(f)} color="error" variant="contained" size="small" title="Excluir">
                                            <FeatherIcon icon="trash" width="18" height="18" />
                                        </Button>
                                    </Box>
                                </TableCell>
                            </StyledTableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    className="queue-page__pagination"
                    component="div"
                    count={pagination?.total || 0}
                    page={page}
                    onPageChange={handlePage}
                    rowsPerPage={perPage}
                    onRowsPerPageChange={handlePerPage}
                    rowsPerPageOptions={PER_PAGE_OPTIONS}
                />
            </TableContainer>

            <FiscalizacaoDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                fiscalizacao={editando}
                onSuccess={handleSuccess}
                onCreateSuccess={handleCreateSuccess}
            />

            <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
        </BaseCard>
        </Box>
    );
}
