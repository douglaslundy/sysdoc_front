import React, { useEffect, useRef, useState } from 'react';
import {
    Box, Button, Chip, Fab, FormControl, InputLabel, MenuItem, Select,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, TextField, Typography, styled,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import BaseCard from '../baseCard/BaseCard';
import AlertModal from '../messagesModal';
import ConfirmDialog from '../confirmDialog';
import AlvaraDialog from '../modal/alvara';
import { getAllAlvaras, removeAlvaraFetch, downloadAlvaraPdf } from '../../store/fetchActions/alvaras';
import { changeTitleAlert } from '../../store/ducks/Layout';
import { modalFormRootSx } from '../modal/_shared/modalFormStyles';

const NIVEIS_COR = { '1': 'success', '2': 'warning', '3': 'error', 'N/A': 'default' };

const STATUS_OPTIONS = [
    'Não requerido', 'Dispensado', 'Protocolado', 'Em análise', 'Em exigência',
    'Vigente', 'Vencido', 'Em renovação',
    'Suspenso', 'Cassado', 'Cancelado', 'Cancelado de ofício', 'Interditado',
];

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

const trunc = (s, n = 30) => {
    if (!s) return '—';
    return s.length > n ? s.substring(0, n) + '…' : s;
};

export default function ListaAlvaras() {
    const dispatch = useDispatch();
    const { alvaras, pagination } = useSelector(state => state.alvaras);

    const [busca, setBusca] = useState('');
    const [nivelRisco, setNivelRisco] = useState('');
    const [statusFiltro, setStatusFiltro] = useState('');
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
        nivel_risco: nivelRisco || undefined,
        status: statusFiltro || undefined,
        ...overrides,
    });

    useEffect(() => {
        dispatch(getAllAlvaras({ page: 1, per_page: perPage }));
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
            dispatch(getAllAlvaras(buildParams({ busca: valor || undefined, page: 1 })));
        }, 400);
    };

    const handleNivelRisco = ({ target }) => {
        const valor = target.value;
        setNivelRisco(valor);
        setPage(0);
        dispatch(getAllAlvaras(buildParams({ nivel_risco: valor || undefined, page: 1 })));
    };

    const handleStatusFiltro = ({ target }) => {
        const valor = target.value;
        setStatusFiltro(valor);
        setPage(0);
        dispatch(getAllAlvaras(buildParams({ status: valor || undefined, page: 1 })));
    };

    const handlePerPage = (event) => {
        const valor = Number(event.target.value);
        setPerPage(valor);
        setPage(0);
        dispatch(getAllAlvaras(buildParams({ per_page: valor, page: 1 })));
    };

    const handlePage = (_, newPage) => {
        setPage(newPage);
        dispatch(getAllAlvaras(buildParams({ page: newPage + 1 })));
    };

    const handleNovo = () => {
        setEditando(null);
        setDialogOpen(true);
    };

    const handleEditar = (alvara) => {
        setEditando(alvara);
        setDialogOpen(true);
    };

    const handleExcluir = (alvara) => {
        dispatch(changeTitleAlert(`Alvará ${alvara.numero_alvara} excluído com sucesso!`));
        setConfirmDialog({
            isOpen: true,
            title: `Deseja excluir o alvará ${alvara.numero_alvara}?`,
            subTitle: 'Esta ação não poderá ser desfeita',
            confirm: removeAlvaraFetch(alvara.id),
        });
    };

    const handleSuccess = () => {
        setDialogOpen(false);
        dispatch(getAllAlvaras(buildParams()));
    };

    return (
        <Box sx={modalFormRootSx} className="queue-page alvaras-page">
        <BaseCard title={`Alvarás${pagination ? ` — ${pagination.total} registros` : ''}`}>
            <AlertModal />
            <Box className="queue-page__toolbar"
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'minmax(260px, 1fr) 160px 200px auto' },
                    alignItems: 'center',
                    gap: 1.5,
                    mb: 2,
                    mt: 1,
                }}
            >
                <TextField
                    className="lg-search-field"
                    sx={{ minWidth: 0, width: '100%' }}
                    placeholder="Pesquisar por número ou estabelecimento"
                    value={busca}
                    onChange={handleBusca}
                    inputProps={{ autoComplete: 'off' }}
                />
                <FormControl className="lg-search-field" sx={{ minWidth: 0, width: '100%' }}>
                    <InputLabel>Nível de Risco</InputLabel>
                    <Select value={nivelRisco} label="Nível de Risco" onChange={handleNivelRisco}>
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="1">1 — Baixo</MenuItem>
                        <MenuItem value="2">2 — Médio</MenuItem>
                        <MenuItem value="3">3 — Alto</MenuItem>
                        <MenuItem value="N/A">N/A</MenuItem>
                    </Select>
                </FormControl>
                <FormControl className="lg-search-field" sx={{ minWidth: 0, width: '100%' }}>
                    <InputLabel>Status</InputLabel>
                    <Select value={statusFiltro} label="Status" onChange={handleStatusFiltro}>
                        <MenuItem value="">Todos</MenuItem>
                        {STATUS_OPTIONS.map(s => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Fab className="queue-page__fab queue-page__fab--add" color="primary" onClick={handleNovo} size="medium" title="Novo alvará" sx={{ justifySelf: { xs: 'flex-end', md: 'center' } }}>
                    <FeatherIcon icon="plus" />
                </Fab>
            </Box>

            <TableContainer className="queue-page__table-wrap">
                <Table className="queue-page__table" sx={{ mt: 2, whiteSpace: 'nowrap', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                    <TableHead>
                        <TableRow>
                            <TableCell className="queue-page__th"><Typography variant="h6" color="textSecondary">Número</Typography></TableCell>
                            <TableCell className="queue-page__th"><Typography variant="h6" color="textSecondary">Estabelecimento</Typography></TableCell>
                            <TableCell className="queue-page__th"><Typography variant="h6" color="textSecondary">Risco</Typography></TableCell>
                            <TableCell className="queue-page__th"><Typography variant="h6" color="textSecondary">Status</Typography></TableCell>
                            <TableCell className="queue-page__th"><Typography variant="h6" color="textSecondary">Emissão</Typography></TableCell>
                            <TableCell className="queue-page__th"><Typography variant="h6" color="textSecondary">Vencimento</Typography></TableCell>
                            <TableCell className="queue-page__th"><Typography variant="h6" color="textSecondary">Contato</Typography></TableCell>
                            <TableCell align="center" className="queue-page__th"><Typography variant="h6" color="textSecondary">Ações</Typography></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {alvaras.map((alv) => (
                            <StyledTableRow key={alv.id} hover>
                                <TableCell>
                                    <Typography variant="h6" fontWeight={600} sx={{ textTransform: 'uppercase' }}>{alv.numero_alvara}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{ textTransform: 'uppercase' }}>
                                        {trunc(alv.estabelecimento?.nome_estabelecimento)}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={`Risco ${alv.nivel_risco}`}
                                        color={NIVEIS_COR[alv.nivel_risco] || 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{alv.status || '—'}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{formatDate(alv.data_alvara)}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{formatDate(alv.vencimento_alvara)}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {alv.contato || '—'}
                                    </Typography>
                                </TableCell>
                                <TableCell align="center">
                                    <Box className="queue-page__actions" sx={{ '& button': { mx: 0.5 } }}>
                                        <Button className="queue-page__action queue-page__action--success" onClick={() => handleEditar(alv)} color="success" variant="contained" size="small" title="Editar">
                                            <FeatherIcon icon="edit" width="18" height="18" />
                                        </Button>
                                        {alv.status === 'Vigente' && (
                                            <Button className="queue-page__action queue-page__action--info"
                                                onClick={() => dispatch(downloadAlvaraPdf(alv.id, alv.numero_alvara))}
                                                color="success"
                                                variant="contained"
                                                size="small"
                                                title="Baixar PDF"
                                            >
                                                <FeatherIcon icon="download" width="18" height="18" />
                                            </Button>
                                        )}
                                        <Button className="queue-page__action queue-page__action--danger" onClick={() => handleExcluir(alv)} color="error" variant="contained" size="small" title="Excluir">
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

            <AlvaraDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                alvara={editando}
                onSuccess={handleSuccess}
            />

            <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
        </BaseCard>
        </Box>
    );
}
