import React, { useState, useEffect, useContext } from "react";
import {
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Button,
    styled,
    TableContainer,
    TablePagination,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Divider,
    Fab,
} from "@mui/material";

import BaseCard from "../baseCard/BaseCard";
import FeatherIcon from "feather-icons-react";
import { ActionCreateFab } from "../actions";
import QueueModal from "../modal/queue";
import QueueOutcomeModal from "../modal/outcomequeue";
import { modalFormRootSx, modalSecondaryButtonSx } from "../modal/_shared/modalFormStyles";
import { AuthContext } from "../../contexts/AuthContext";

import { useSelector, useDispatch } from 'react-redux';
import {
    getAllQueues,
    inactiveQueueFetch,
    viewQueueFetch,
    listQueueAttachments,
    uploadQueueAttachment,
    deleteQueueAttachment,
    downloadQueueAttachment
} from "../../store/fetchActions/queues";
import { getAllSpecialities } from "../../store/fetchActions/specialities";
import { showQueue } from "../../store/ducks/queues";
import { openModal } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";
import Select from '../inputs/selects';

import { parseISO, format } from 'date-fns';
import AlertModal from "../messagesModal";

import protocolPDF from "../../reports/protocol"
import generateQueuePDF from "../../reports/queues"
import { addAlertMessage, addMessage } from "../../store/ducks/Layout";
import { api } from "../../services/api";

const StyledTableRow = styled(TableRow)(() => ({
    '& td': {
        background: 'var(--queue-row-bg)',
        borderTop: '0.5px solid var(--lg-border)',
        borderBottom: '0.5px solid var(--lg-border)',
        paddingTop: 12,
        paddingBottom: 12,
        color: 'var(--queue-text-primary)',
    },
    '& td:first-of-type': {
        borderLeft: '0.5px solid var(--lg-border)',
        borderTopLeftRadius: 14,
        borderBottomLeftRadius: 14,
    },
    '& td:last-of-type': {
        borderRight: '0.5px solid var(--lg-border)',
        borderTopRightRadius: 14,
        borderBottomRightRadius: 14,
    },
    '&:last-child td, &:last-child th': {
        border: 0,
    },
    '&:hover td': {
        background: 'var(--queue-row-hover)',
    },
}));

export default () => {
    const controlHeight = 48;
    const controlSx = {
        height: `${controlHeight}px`,
        "& .MuiInputBase-root": { height: `${controlHeight}px` },
    };
    const selectControlSx = {
        ...controlSx,
        "& .MuiSelect-select": {
            display: "flex",
            alignItems: "center",
            minHeight: "unset",
            height: `${controlHeight}px`,
            boxSizing: "border-box",
            fontSize: "10px",
        },
    };
    const fabControlSx = {
        width: `${controlHeight}px`,
        height: `${controlHeight}px`,
        minHeight: `${controlHeight}px`,
    };

    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: 'Deseja realmente excluir',
        subTitle: 'Esta ação não poderá ser desfeita',
        confirm: null,
        onConfirm: null,
    });
    const [viewQueue, setViewQueue] = useState(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const [isAttachmentsLoading, setIsAttachmentsLoading] = useState(false);
    const [isAttachmentUploading, setIsAttachmentUploading] = useState(false);

    const dispatch = useDispatch();
    const { queues, pagination } = useSelector(state => state.queues);
    const { specialities } = useSelector(state => state.specialities);
    const [searchValue, setSearchValue] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [option, setOption] = useState('add'); // Você já tem esse estado definido
    const [speci, setSpeci] = useState('');
    const [done, setDone] = useState(0);
    const [urgency, setUrgency] = useState(2);
    const { user, profile } = useContext(AuthContext);

    const changeSpeci = ({ target }) => {
        setSpeci(target.value)
        setPage(0)
    }

    const dataDone = [
        {
            'id': 0,
            'name': 'NÃO'
        },
        {
            'id': 1,
            'name': 'SIM'
        },
        {
            'id': 2,
            'name': 'TODOS'
        }
    ]

    const dataUrgency = [
        {
            'id': 0,
            'name': 'NÃO'
        },
        {
            'id': 1,
            'name': 'SIM'
        },
        {
            'id': 2,
            'name': 'TODOS'
        }
    ]

    const storeDone = Object.values({ ...dataDone }).map(item => ({
        id: item.id,
        name: item.name,
    }));

    const changeDone = ({ target }) => {
        setDone(target.value)
        setPage(0)
    }

    const storeUrgency = Object.values({ ...dataUrgency }).map(item => ({
        id: item.id,
        name: item.name,
    }));

    const changeUrgency = ({ target }) => {
        setUrgency(target.value)
        setPage(0)
    }


    useEffect(() => {
        dispatch(getAllSpecialities());
    }, [dispatch]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearch(searchValue);
            setPage(0);
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchValue]);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        dispatch(getAllQueues({
            page: page + 1,
            per_page: rowsPerPage,
            search: debouncedSearch || undefined,
            speciality_id: speci || undefined,
            done,
            urgency,
        }));
    }, [dispatch, page, rowsPerPage, debouncedSearch, speci, done, urgency]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const HandleDoneQueue = (queue) => {
        dispatch(showQueue(queue));
        setOption('outcome');
        dispatch(openModal());
    };

    const HandleAddQueue = () => {
        setOption('add');
        dispatch(openModal());
    };

    const handlePrintList = async () => {
        setIsPrinting(true);
        try {
            const baseParams = { per_page: 100 };
            if (debouncedSearch) baseParams.search        = debouncedSearch;
            if (speci)           baseParams.speciality_id = speci;
            baseParams.done    = done;
            baseParams.urgency = urgency;

            // Busca a primeira página para saber o total
            const first = await api.get('/queues', { params: { ...baseParams, page: 1 } });
            const firstData = first.data?.data || first.data || [];
            const total     = first.data?.meta?.total ?? firstData.length;
            const lastPage  = Math.ceil(total / 100);

            // Busca as páginas restantes em paralelo
            const rest = lastPage > 1
                ? await Promise.all(
                    Array.from({ length: lastPage - 1 }, (_, i) =>
                        api.get('/queues', { params: { ...baseParams, page: i + 2 } })
                            .then(r => r.data?.data || r.data || [])
                    )
                )
                : [];

            const data = [...firstData, ...rest.flat()];

            const specialityName = speci
                ? (specialities.find(s => s.id === speci || s.id === Number(speci))?.name ?? null)
                : null;

            await generateQueuePDF(data, {
                search: debouncedSearch || null,
                specialityName,
                done,
                urgency,
            });
        } catch (err) {
            console.error('[handlePrintList]', err);
            const msg = err?.response?.data?.message || err?.message || 'Erro desconhecido';
            dispatch(addAlertMessage(`Erro ao gerar o PDF: ${msg}`));
        } finally {
            setIsPrinting(false);
        }
    };

    const searchQueues = ({ target }) => {
        setSearchValue(target.value);
    };

    const HandleInactiveQueue = (queue) => {
        dispatch(inactiveQueueFetch(queue));
    };

    const loadQueueAttachments = async (queueId) => {
        setIsAttachmentsLoading(true);
        try {
            const res = await listQueueAttachments(queueId);
            setAttachments(res.data || []);
        } catch (error) {
            dispatch(addAlertMessage(error?.response?.data?.message || 'Erro ao carregar anexos da fila.'));
        } finally {
            setIsAttachmentsLoading(false);
        }
    };

    const handleViewQueue = (queueId) => {
        dispatch(viewQueueFetch(queueId, async (data) => {
            setViewQueue(data);
            await loadQueueAttachments(data.id);
        }));
    };

    const handleUploadAttachment = async (event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = '';

        if (!files.length || !viewQueue?.id) {
            return;
        }

        setIsAttachmentUploading(true);
        try {
            await uploadQueueAttachment(viewQueue.id, files);
            dispatch(addMessage(files.length > 1 ? 'Anexos enviados com sucesso.' : 'Anexo enviado com sucesso.'));
            await loadQueueAttachments(viewQueue.id);
        } catch (error) {
            dispatch(addAlertMessage(error?.response?.data?.message || 'Erro ao enviar anexo.'));
        } finally {
            setIsAttachmentUploading(false);
        }
    };

    const handleDeleteAttachment = async (attachmentId) => {
        if (!viewQueue?.id) {
            return;
        }

        try {
            await deleteQueueAttachment(viewQueue.id, attachmentId);
            dispatch(addMessage('Anexo removido com sucesso.'));
            await loadQueueAttachments(viewQueue.id);
        } catch (error) {
            dispatch(addAlertMessage(error?.response?.data?.message || 'Erro ao remover anexo.'));
        }
    };

    const confirmDeleteAttachment = (attachment) => {
        setConfirmDialog({
            ...confirmDialog,
            isOpen: true,
            title: `Deseja realmente excluir o anexo "${attachment.original_name}"?`,
            subTitle: 'Esta acao nao podera ser desfeita.',
            onConfirm: () => handleDeleteAttachment(attachment.id),
            confirm: null,
        });
    };

    const handleDownloadAttachment = async (attachment) => {
        if (!viewQueue?.id) {
            return;
        }

        try {
            await downloadQueueAttachment(viewQueue.id, attachment);
        } catch (error) {
            dispatch(addAlertMessage(error?.response?.data?.message || 'Erro ao baixar anexo.'));
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes <= 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
        const value = bytes / (1024 ** idx);
        return `${value.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
    };

    return (
        <>
        <Box sx={modalFormRootSx} className="queue-page queue-main-page">
        <BaseCard title={`Você possui ${pagination?.total ?? queues.length} registros cadastrados`}>
            <AlertModal />
            {option === 'outcome' ? <QueueOutcomeModal /> : <QueueModal />}

            <Box sx={{
                '& > :not(style)': { mb: 0, mt: 2 },
                'display': 'flex',
                'justify-content': 'space-between',
                gap: 1,
                flexWrap: 'wrap',
            }}
                className="queue-page__toolbar"
            >

                <TextField
                    className="lg-search-field"
                    sx={{ flex: 1, minWidth: 280, ...controlSx }}
                    placeholder="Pesquisar por Nome / CPF / CNS"
                    name="search"
                    value={searchValue}
                    onChange={searchQueues}
                />

                <Select
                    label="Especialidade"
                    name="speci"
                    value={speci}
                    store={specialities}
                    changeItem={changeSpeci}
                    valueDefault="TODAS"
                    wd={"18%"}
                    size="small"
                    labelSx={{ fontSize: "12px" }}
                    selectSx={selectControlSx}
                    menuItemSx={{ fontSize: "10px" }}
                />

                <Select
                    label="Urgente?"
                    name="urgency"
                    value={urgency}
                    store={storeUrgency}
                    changeItem={changeUrgency}
                    wd={"10%"}
                    size="small"
                    labelSx={{ fontSize: "12px" }}
                    selectSx={selectControlSx}
                    menuItemSx={{ fontSize: "10px" }}
                />
                <Select
                    label="Realizado?"
                    name="done"
                    value={done}
                    store={storeDone}
                    changeItem={changeDone}
                    wd={"10%"}
                    size="small"
                    labelSx={{ fontSize: "12px" }}
                    selectSx={selectControlSx}
                    menuItemSx={{ fontSize: "10px" }}
                />

                {/* <Select
                    label="Ano"
                    name="year"
                    value={year}
                    store={transformedYears}
                    changeItem={changeYear}
                    wd={"20%"}
                /> */}

                <Fab
                    onClick={handlePrintList}
                    color="success"
                    aria-label="imprimir"
                    title="Imprimir listagem filtrada"
                    disabled={isPrinting}
                    sx={fabControlSx}
                    className="queue-page__fab queue-page__fab--print"
                >
                    <FeatherIcon icon={isPrinting ? 'loader' : 'printer'} />
                </Fab>

                <ActionCreateFab onClick={() => { HandleAddQueue() }} title="inserir na fila" sx={fabControlSx} className="queue-page__fab queue-page__fab--add" />
            </Box>

            <TableContainer className="queue-page__table-wrap">

                <Table
                    aria-label="simple table"
                    className="queue-page__table"
                    sx={{
                        mt: 3,
                        whiteSpace: "nowrap",
                        borderCollapse: 'separate',
                        borderSpacing: '0 10px',
                    }}
                >
                    <TableHead>

                        <TableRow>

                            <TableCell className="queue-page__th">
                                <Typography color="textSecondary" variant="h6">
                                    POSIÇÃO
                                </Typography>

                                <Typography color="textSecondary" variant="h6">
                                    Cadastrador
                                </Typography>

                                <Typography color="textSecondary" variant="h6">
                                    Data / URGENTE
                                </Typography>
                            </TableCell>

                            <TableCell className="queue-page__th">
                                <Typography color="textSecondary" variant="h6">
                                    Cidadão
                                </Typography>
                                <Typography color="textSecondary" variant="h6">
                                    Mãe
                                </Typography>
                                <Typography color="textSecondary" variant="h6">
                                    CPF / CNS / Telefone
                                </Typography>
                            </TableCell>

                            <TableCell className="queue-page__th">
                                <Typography color="textSecondary" variant="h6">
                                    Especialidade
                                </Typography>
                                <Typography color="textSecondary" variant="h6">
                                    Observação
                                </Typography>
                            </TableCell>

                            <TableCell className="queue-page__th">
                                <Typography color="textSecondary" variant="h6">
                                    Realizado?
                                </Typography>
                                <Typography color="textSecondary" variant="h6">
                                    Data
                                </Typography>
                            </TableCell>

                            <TableCell align="center" className="queue-page__th">
                                <Typography color="textSecondary" variant="h6">
                                    Ações
                                </Typography>
                            </TableCell>

                        </TableRow>

                    </TableHead>

                    {queues.length >= 1 ?

                        <TableBody>
                            {queues.map((queue, index) => (

                                    <StyledTableRow key={queue.id} hover>
                                        <TableCell>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <Box>
                                                    <Typography
                                                        variant="h4"
                                                        sx={{
                                                            fontWeight: "600",
                                                            fontSize: "30px",
                                                        }}
                                                    >
                                                        {queue && queue.position}
                                                    </Typography>

                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "13px",
                                                        }}
                                                    >
                                                        {queue.user && queue.user.name}
                                                        {/* {queue.created_at && format(parseISO(queue.created_at), 'dd/MM/yyyy HH:mm:ss')} */}

                                                    </Typography>

                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "13px",
                                                        }}
                                                    >
                                                        <span> {queue.created_at && format(parseISO(queue.created_at), 'dd/MM/yyyy')} / <strong style={{ color: 'var(--lg-text-primary)' }}>{queue.urgency == 1 ? 'URGENTE' : 'ROTINA'}</strong> </span>
                                                        {/* {queue.created_at && format(parseISO(queue.created_at), 'dd/MM/yyyy HH:mm:ss')} */}

                                                    </Typography>

                                                </Box>
                                            </Box>

                                        </TableCell>

                                        <TableCell>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "left"
                                                }}
                                            >
                                                <Box>
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            fontWeight: "600",
                                                            fontSize: "16px",
                                                        }}
                                                    >
                                                        {queue?.client && queue?.client?.name.substring(0, 30).toUpperCase()}
                                                    </Typography>

                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "13px",
                                                        }}
                                                    >
                                                        {queue?.client?.mother && queue?.client?.mother.substring(0, 30).toUpperCase()}
                                                    </Typography>


                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "13px",
                                                        }}
                                                    >
                                                        {queue?.client && queue?.client.cpf} / {queue?.client && queue?.client?.cns} / {queue?.client && queue?.client?.phone}
                                                    </Typography>
                                                </Box>

                                            </Box>

                                        </TableCell>

                                        <TableCell>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "left"
                                                }}
                                            >
                                                <Box>
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            fontWeight: "600",
                                                            fontSize: "16px",
                                                        }}
                                                    >
                                                        {queue?.speciality && queue?.speciality?.name.substring(0, 30).toUpperCase()}
                                                    </Typography>

                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "13px",
                                                        }}
                                                    >
                                                        {queue.obs && queue.obs.substring(0, 30).toUpperCase()}
                                                    </Typography>

                                                </Box>

                                            </Box>

                                        </TableCell>

                                        <TableCell>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "left"
                                                }}
                                            >
                                                <Box>
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            fontWeight: "600",
                                                            fontSize: "16px",
                                                        }}
                                                    >
                                                        {queue.done == 0 ? 'NÃO' : 'SIM'}
                                                    </Typography>

                                                    <Typography
                                                        color="textSecondary"
                                                        sx={{
                                                            fontSize: "13px",
                                                        }}
                                                    >
                                                        {queue.date_of_realized && format(parseISO(queue.date_of_realized), 'dd/MM/yyyy')}
                                                    </Typography>

                                                </Box>

                                            </Box>

                                        </TableCell>

                                        <TableCell align="center">
                                            <Box sx={{ "& button": { mx: 1 } }} className="queue-page__actions">

                                                {Number(queue?.attachments_count || 0) > 0 && (
                                                    <Button
                                                        title={`${queue.attachments_count} anexo(s)`}
                                                        color="secondary"
                                                        size="medium"
                                                        variant="contained"
                                                        disabled
                                                        sx={{ height: `${controlHeight}px`, minWidth: `${controlHeight}px` }}
                                                        className="queue-page__action queue-page__action--muted"
                                                    >
                                                        <FeatherIcon icon="paperclip" width="20" height="20" />
                                                    </Button>
                                                )}

                                                <Button title="Visualizar" onClick={() => handleViewQueue(queue.id)} color="info" size="medium" variant="contained" sx={{ height: `${controlHeight}px`, minWidth: `${controlHeight}px` }} className="queue-page__action queue-page__action--info">
                                                    <FeatherIcon icon="eye" width="20" height="20" />
                                                </Button>

                                                <Button title="Imprimir Comprovante" onClick={() => { protocolPDF(queue) }} color="success" size="medium" variant="contained" aria-label="add" sx={{ height: `${controlHeight}px`, minWidth: `${controlHeight}px` }} className="queue-page__action queue-page__action--success">
                                                    <FeatherIcon icon="printer" width="20" height="20" />
                                                </Button>

                                                <Button title="Informar Desfecho" onClick={() => { HandleDoneQueue(queue) }} color="primary" size="medium" variant="contained" disabled={queue.done == '1'} sx={{ height: `${controlHeight}px`, minWidth: `${controlHeight}px` }} className="queue-page__action queue-page__action--primary">
                                                    <FeatherIcon icon="book-open" width="20" height="20" />
                                                </Button>

                                                <Button title="Excluir da fila" onClick={() => { HandleInactiveQueue(queue) }} color="error" size="medium" variant="contained" disabled={true} sx={{ height: `${controlHeight}px`, minWidth: `${controlHeight}px` }} className="queue-page__action queue-page__action--danger">
                                                    <FeatherIcon icon="trash" width="20" height="20" />
                                                </Button>

                                            </Box>
                                        </TableCell>

                                    </StyledTableRow>
                                ))}
                        </TableBody>

                        :

                        <TableCell align="center">
                            Nenhum registro encontrado!
                        </TableCell>

                    }

                </Table>

                <TablePagination
                    className="queue-page__pagination"
                    component="div"
                    count={pagination?.total ?? queues.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>
            <ConfirmDialog
                confirmDialog={confirmDialog}
                setConfirmDialog={setConfirmDialog} />

        </BaseCard >
        </Box>

        {/* Dialog de visualização do registro de fila */}
        <Dialog
            className="queue-page__dialog"
            open={!!viewQueue}
            onClose={() => {
                setViewQueue(null);
                setAttachments([]);
            }}
            PaperProps={{ sx: { width: '90%', maxWidth: '90%', height: '98vh', overflowY: 'auto' } }}
        >
            <DialogTitle>
                Registro de Fila - Posição {viewQueue?.position}
                {viewQueue?.urgency == 1 && (
                    <Chip label="URGENTE" color="error" size="small" sx={{ ml: 1 }} />
                )}
            </DialogTitle>
            <DialogContent dividers>
                {viewQueue && (
                    <Box display="flex" flexDirection="column" gap={1.5}>
                        <Box>
                            <Typography variant="caption" color="text.secondary">CIDADÃO</Typography>
                            <Typography variant="h6" fontWeight={600}>{viewQueue.client?.name?.toUpperCase() ?? '—'}</Typography>
                        </Box>
                        {viewQueue.client?.mother && (
                            <Box>
                                <Typography variant="caption" color="text.secondary">MÃE</Typography>
                                <Typography>{viewQueue.client.mother.toUpperCase()}</Typography>
                            </Box>
                        )}
                        <Box display="flex" gap={4}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">CPF</Typography>
                                <Typography>{viewQueue.client?.cpf ?? '—'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">CNS</Typography>
                                <Typography>{viewQueue.client?.cns ?? '—'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">TELEFONE</Typography>
                                <Typography>{viewQueue.client?.phone ?? '—'}</Typography>
                            </Box>
                        </Box>
                        <Divider />
                        <Box>
                            <Typography variant="caption" color="text.secondary">ESPECIALIDADE</Typography>
                            <Typography fontWeight={600}>{viewQueue.speciality?.name?.toUpperCase() ?? '—'}</Typography>
                        </Box>
                        {viewQueue.obs && (
                            <Box>
                                <Typography variant="caption" color="text.secondary">OBSERVAÇÃO</Typography>
                                <Typography>{viewQueue.obs}</Typography>
                            </Box>
                        )}
                        <Divider />
                        <Box display="flex" gap={4}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">DATA DE ENTRADA</Typography>
                                <Typography>{viewQueue.created_at ? format(parseISO(viewQueue.created_at), 'dd/MM/yyyy HH:mm') : '—'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">CADASTRADO POR</Typography>
                                <Typography>{viewQueue.user?.name ?? '—'}</Typography>
                            </Box>
                        </Box>
                        <Box display="flex" gap={4}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">REALIZADO</Typography>
                                <Chip
                                    label={viewQueue.done == 1 ? 'SIM' : 'NÃO'}
                                    color={viewQueue.done == 1 ? 'success' : 'default'}
                                    size="small"
                                />
                            </Box>
                            {viewQueue.done == 1 && viewQueue.date_of_realized && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">DATA DE REALIZAÇÃO</Typography>
                                    <Typography>{format(parseISO(viewQueue.date_of_realized), 'dd/MM/yyyy')}</Typography>
                                </Box>
                            )}
                        </Box>
                        <Divider />
                        <Box>
                            <Typography variant="caption" color="text.secondary">ANEXOS DO PEDIDO</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Cada registro da fila pode receber multiplos arquivos (PDF, JPG, JPEG e PNG).
                            </Typography>
                            <Box mt={1} mb={1}>
                                <Button component="label" variant="outlined" size="small" disabled={isAttachmentUploading} sx={{ height: `${controlHeight}px` }}>
                                    {isAttachmentUploading ? 'Enviando...' : 'Enviar Anexo(s) (PDF/JPG/PNG)'}
                                    <input hidden type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleUploadAttachment} />
                                </Button>
                            </Box>
                            {isAttachmentsLoading && (
                                <Typography color="text.secondary">Carregando anexos...</Typography>
                            )}
                            {!isAttachmentsLoading && attachments.length === 0 && (
                                <Typography color="text.secondary">Nenhum anexo enviado.</Typography>
                            )}
                            {!isAttachmentsLoading && attachments.length > 0 && attachments.map((attachment) => (
                                <Box key={attachment.id} display="flex" alignItems="center" justifyContent="space-between" py={0.8}>
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{attachment.original_name}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {attachment.mime_type} | {formatBytes(attachment.size_bytes)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ "& button": { ml: 1 } }}>
                                        <Button variant="outlined" size="small" onClick={() => handleDownloadAttachment(attachment)} sx={{ height: `${controlHeight}px` }}>
                                            Baixar
                                        </Button>
                                        <Button variant="outlined" color="error" size="small" onClick={() => confirmDeleteAttachment(attachment)} sx={{ height: `${controlHeight}px` }}>
                                            Remover
                                        </Button>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'flex-end', px: 3, pb: 2.2 }}>
                <Button onClick={() => setViewQueue(null)} variant="outlined" sx={{ ...modalSecondaryButtonSx, height: `${controlHeight}px` }}>Fechar</Button>
            </DialogActions>
        </Dialog>
        </>
    );
};
