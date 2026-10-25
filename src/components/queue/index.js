import React, { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import { BookOpen, Eye, Paperclip, Printer, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { CampoDeBusca } from "../ui/campo-de-busca";
import { Dado } from "../ui/dado";
import { DataTable } from "../ui/data-table";
import { Dialogo, DialogoCabecalho, DialogoRodape } from "../ui/dialogo";
import { Paginacao } from "../ui/paginacao";
import { Pilula } from "../ui/pilula";
import AnexosDoRegistro from "../modal/_shared/AnexosDoRegistro";

import QueueActionsGroup from "./QueueActionsGroup";
import QueueModal from "../modal/queue";
import QueueOutcomeModal from "../modal/outcomequeue";
import { AuthContext } from "../../contexts/AuthContext";
import TreatmentPlanPanel from "./TreatmentPlanPanel";

import { useSelector, useDispatch } from 'react-redux';
import {
    getAllQueues,
    inactiveQueueFetch,
    viewQueueFetch,
    listQueueAttachments,
    uploadQueueAttachment,
    deleteQueueAttachment,
    downloadQueueAttachment,
    getQueueSpecialityOptions
} from "../../store/fetchActions/queues";
import { getAllSpecialities } from "../../store/fetchActions/specialities";
import { showQueue } from "../../store/ducks/queues";
import { openQueueModal, openOutcomeQueueModal } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";
import BlockingErrorDialog from "../messagesModal/BlockingErrorDialog";
import Select from '../inputs/selects';
import {
    DEFAULT_DONE_SORT,
    DONE_SORT_FIELDS,
    SORT_DIRECTIONS,
    defaultDoneRange,
    doneByName,
    firstColumnDate,
    isDoneFilter,
    rangeParams,
    sortParams,
} from './queueDates';

import { parseISO, format } from 'date-fns';
import AlertModal from "../messagesModal";

import protocolPDF from "../../reports/protocol"
import generateQueuePDF from "../../reports/queues"
import { addAlertMessage, addMessage } from "../../store/ducks/Layout";
import { api } from "../../services/api";

export default () => {
    const [blockingError, setBlockingError] = useState('');
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
    const router = useRouter();
    const { queues, pagination } = useSelector(state => state.queues);
    const { specialities } = useSelector(state => state.specialities);
    const { specialityOptions } = useSelector(state => state.queues);
    const { isOpenQueueModal, isOpenOutcomeQueueModal } = useSelector(state => state.layout);

    const viewableSpecialities = specialityOptions.length > 0
        ? specialities.filter((s) => specialityOptions.some((opt) => opt.id === s.id && opt.can_view))
        : specialities;

    const canEditSpeciality = (specialityId) => {
        if (specialityOptions.length === 0) return true;
        const opt = specialityOptions.find((o) => o.id === specialityId);
        return opt ? opt.can_edit : false;
    };
    const [searchValue, setSearchValue] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [speci, setSpeci] = useState('');
    const [done, setDone] = useState(0);
    const [urgency, setUrgency] = useState(2);
    const [sortBy, setSortBy] = useState(DEFAULT_DONE_SORT.sortBy);
    const [sortDir, setSortDir] = useState(DEFAULT_DONE_SORT.sortDir);
    const [doneFrom, setDoneFrom] = useState(() => defaultDoneRange().from);
    const [doneTo, setDoneTo] = useState(() => defaultDoneRange().to);
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

    const changeSortBy = ({ target }) => {
        setSortBy(target.value)
        setPage(0)
    }

    const changeDoneFrom = (value) => {
        setDoneFrom(value)
        setPage(0)
    }

    const changeDoneTo = (value) => {
        setDoneTo(value)
        setPage(0)
    }

    const changeSortDir = ({ target }) => {
        setSortDir(target.value)
        setPage(0)
    }

    const changeUrgency = ({ target }) => {
        setUrgency(target.value)
        setPage(0)
    }


    useEffect(() => {
        dispatch(getAllSpecialities());
    }, [dispatch]);

    useEffect(() => {
        dispatch(getQueueSpecialityOptions());
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

    // Parâmetros da listagem com os filtros atuais (usados ao carregar e ao recarregar após uma baixa).
    const buildListParams = () => ({
        page: page + 1,
        per_page: rowsPerPage,
        search: debouncedSearch || undefined,
        speciality_id: speci || undefined,
        done,
        urgency,
        ...sortParams(done, sortBy, sortDir),
        ...rangeParams(done, doneFrom, doneTo),
    });

    useEffect(() => {
        dispatch(getAllQueues(buildListParams()));
    }, [dispatch, page, rowsPerPage, debouncedSearch, speci, done, urgency, sortBy, sortDir, doneFrom, doneTo]);

    // Depois de gravar uma baixa, recarrega do servidor com o filtro atual: o item some da lista de
    // pendentes (ou entra na de realizados) em vez de ficar na tela com o status antigo.
    const reloadQueues = () => dispatch(getAllQueues(buildListParams()));

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const HandleDoneQueue = (queue) => {
        dispatch(showQueue(queue));
        dispatch(openOutcomeQueueModal());
    };

    const HandleAddQueue = () => {
        dispatch(openQueueModal());
    };

    const handlePrintList = async () => {
        setIsPrinting(true);
        try {
            const baseParams = { per_page: 100 };
            if (debouncedSearch) baseParams.search        = debouncedSearch;
            if (speci)           baseParams.speciality_id = speci;
            baseParams.done    = done;
            baseParams.urgency = urgency;
            Object.assign(baseParams, sortParams(done, sortBy, sortDir), rangeParams(done, doneFrom, doneTo));

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
        dispatch(inactiveQueueFetch(queue, { onError: setBlockingError }));
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

    const colunas = [
        {
            chave: 'posicao',
            titulo: 'Posição / Cadastrador / Data',
            render: (queue) => (
                <div className="min-w-[160px]">
                    <p className="font-display text-3xl leading-none font-semibold">{queue.position}</p>
                    <p className="mt-1 text-[13px] text-muted-foreground">{queue.user && queue.user.name}</p>
                    <p className="text-[13px] text-muted-foreground">
                        <span> {isDoneFilter(done) && 'Baixa: '}{firstColumnDate(queue, done)} / <strong className="text-foreground">{queue.urgency == 1 ? 'URGENTE' : 'ROTINA'}</strong> </span>
                        {isDoneFilter(done) && (
                            <span className="block">
                                Baixa por: <strong className="text-foreground">{doneByName(queue) || '—'}</strong>
                            </span>
                        )}
                    </p>
                </div>
            ),
        },
        {
            chave: 'cidadao',
            titulo: 'Cidadão / Mãe / CPF / CNS / Telefone',
            render: (queue) => (
                <div className="min-w-[200px]">
                    <p className="font-semibold">{queue?.client && queue?.client?.name.substring(0, 30).toUpperCase()}</p>
                    <p className="text-[13px] text-muted-foreground">{queue?.client?.mother && queue?.client?.mother.substring(0, 30).toUpperCase()}</p>
                    <p className="text-[13px] text-muted-foreground">
                        {queue?.client && queue?.client.cpf} / {queue?.client && queue?.client?.cns} / {queue?.client && queue?.client?.phone}
                    </p>
                </div>
            ),
        },
        {
            chave: 'especialidade',
            titulo: 'Especialidade / Observação',
            render: (queue) => (
                <div className="min-w-[160px]">
                    <p className="font-semibold">{queue?.speciality && queue?.speciality?.name.substring(0, 30).toUpperCase()}</p>
                    <p className="text-[13px] text-muted-foreground">{queue.obs && queue.obs.substring(0, 30).toUpperCase()}</p>
                </div>
            ),
        },
        {
            chave: 'realizado',
            titulo: 'Realizado? / Data',
            render: (queue) => (
                <div>
                    <p className="font-semibold">{queue.done == 0 ? 'NÃO' : 'SIM'}</p>
                    <p className="text-[13px] text-muted-foreground">{queue.date_of_realized && format(parseISO(queue.date_of_realized), 'dd/MM/yyyy')}</p>
                </div>
            ),
        },
        {
            chave: 'acoes',
            titulo: 'Ações',
            render: (queue) => (
                <div className="flex flex-wrap gap-2">
                    {Number(queue?.attachments_count || 0) > 0 && (
                        <Button variant="outline" size="icon-sm" title={`${queue.attachments_count} anexo(s)`} aria-label={`${queue.attachments_count} anexo(s)`} disabled>
                            <Paperclip />
                        </Button>
                    )}
                    <Button variant="secondary" size="icon-sm" title="Visualizar" aria-label="Visualizar" onClick={() => handleViewQueue(queue.id)}>
                        <Eye />
                    </Button>
                    <Button variant="success" size="icon-sm" title="Imprimir Comprovante" aria-label="Imprimir Comprovante" onClick={() => { protocolPDF(queue) }}>
                        <Printer />
                    </Button>
                    <Button size="icon-sm" title="Informar Desfecho" aria-label="Informar Desfecho" onClick={() => { HandleDoneQueue(queue) }} disabled={queue.done == '1' || !canEditSpeciality(queue.id_specialities)}>
                        <BookOpen />
                    </Button>
                    <Button variant="destructive" size="icon-sm" title="Excluir da fila" aria-label="Excluir da fila" onClick={() => { HandleInactiveQueue(queue) }} disabled>
                        <Trash2 />
                    </Button>
                </div>
            ),
        },
    ];

    const fechaVisualizacao = () => {
        setViewQueue(null);
        setAttachments([]);
    };

    return (
        <div className="ui-reset queue-page queue-main-page">
            <Card>
                <CardHeader>
                    <CardTitle>{`Você possui ${pagination?.total ?? queues.length} registros cadastrados`}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <AlertModal />
                    {isOpenOutcomeQueueModal && <QueueOutcomeModal onSaved={reloadQueues} />}
                    <BlockingErrorDialog
                        open={Boolean(blockingError)}
                        title="Não foi possível concluir a operação"
                        message={blockingError}
                        onClose={() => setBlockingError('')}
                    />
                    {isOpenQueueModal && <QueueModal />}

                    <div className="flex flex-wrap items-end gap-3">
                        <CampoDeBusca
                            rotulo="Pesquisar fila"
                            placeholder="Pesquisar por Nome / CPF / CNS"
                            name="search"
                            value={searchValue}
                            onChange={searchQueues}
                        />

                        <Select label="Especialidade" name="speci" value={speci} store={viewableSpecialities} changeItem={changeSpeci} valueDefault="TODAS" wd="200px" />
                        <Select label="Urgente?" name="urgency" value={urgency} store={storeUrgency} changeItem={changeUrgency} wd="120px" />
                        <Select label="Realizado?" name="done" value={done} store={storeDone} changeItem={changeDone} wd="130px" />

                        {isDoneFilter(done) && (
                            <>
                                <Select label="Ordenar por" name="sortBy" value={sortBy} store={DONE_SORT_FIELDS} changeItem={changeSortBy} wd="160px" />
                                <Select label="Ordem" name="sortDir" value={sortDir} store={SORT_DIRECTIONS} changeItem={changeSortDir} wd="140px" />
                            </>
                        )}

                        <QueueActionsGroup
                            isDone={isDoneFilter(done)}
                            doneFrom={doneFrom}
                            doneTo={doneTo}
                            onChangeFrom={changeDoneFrom}
                            onChangeTo={changeDoneTo}
                            onPrint={handlePrintList}
                            isPrinting={isPrinting}
                            onAdd={() => { HandleAddQueue() }}
                            onAgenda={() => router.push('/queue/agenda-tratamentos')}
                        />
                    </div>

                    <div>
                        <DataTable
                            rotulo="Fila de especialidades"
                            colunas={colunas}
                            linhas={queues}
                            chaveDaLinha={(queue) => queue.id}
                            vazio="Nenhum registro encontrado!"
                        />
                        <Paginacao
                            total={pagination?.total ?? queues.length}
                            pagina={page}
                            porPagina={rowsPerPage}
                            aoMudarPagina={setPage}
                            aoMudarPorPagina={(n) => { setRowsPerPage(n); setPage(0); }}
                        />
                    </div>
                    <ConfirmDialog
                        confirmDialog={confirmDialog}
                        setConfirmDialog={setConfirmDialog} />
                </CardContent>
            </Card>

            {/* Dialog de visualização do registro de fila */}
            <Dialogo aberto={Boolean(viewQueue)} aoFechar={fechaVisualizacao} tamanho="xl">
                <DialogoCabecalho>
                    Registro de Fila - Posição {viewQueue?.position}
                    {viewQueue?.urgency == 1 && (
                        <span className="ml-2 align-middle"><Pilula tom="perigo">URGENTE</Pilula></span>
                    )}
                </DialogoCabecalho>
                {viewQueue && (
                    <div className="grid gap-4">
                        <Dado rotulo="CIDADÃO"><span className="text-base font-semibold">{viewQueue.client?.name?.toUpperCase() ?? '—'}</span></Dado>
                        {viewQueue.client?.mother && <Dado rotulo="MÃE">{viewQueue.client.mother.toUpperCase()}</Dado>}
                        <div className="flex flex-wrap gap-x-8 gap-y-3">
                            <Dado rotulo="CPF">{viewQueue.client?.cpf ?? '—'}</Dado>
                            <Dado rotulo="CNS">{viewQueue.client?.cns ?? '—'}</Dado>
                            <Dado rotulo="TELEFONE">{viewQueue.client?.phone ?? '—'}</Dado>
                        </div>
                        <hr className="border-border" />
                        <div>
                            <Dado rotulo="ESPECIALIDADE"><span className="font-semibold">{viewQueue.speciality?.name?.toUpperCase() ?? '—'}</span></Dado>
                            {viewQueue.speciality?.allows_session_scheduling && (
                                <TreatmentPlanPanel
                                    queueId={viewQueue.id}
                                    speciality={viewQueue.speciality}
                                    onChanged={() => dispatch(getAllQueues({
                                        page: page + 1,
                                        per_page: rowsPerPage,
                                        search: debouncedSearch || undefined,
                                        speciality_id: speci || undefined,
                                        done,
                                        urgency,
                                    }))}
                                />
                            )}
                        </div>
                        {viewQueue.obs && <Dado rotulo="OBSERVAÇÃO">{viewQueue.obs}</Dado>}
                        <hr className="border-border" />
                        <div className="flex flex-wrap gap-x-8 gap-y-3">
                            <Dado rotulo="DATA DE ENTRADA">{viewQueue.created_at ? format(parseISO(viewQueue.created_at), 'dd/MM/yyyy HH:mm') : '—'}</Dado>
                            <Dado rotulo="CADASTRADO POR">{viewQueue.user?.name ?? '—'}</Dado>
                        </div>
                        <div className="flex flex-wrap gap-x-8 gap-y-3">
                            <Dado rotulo="REALIZADO">
                                <Pilula tom={viewQueue.done == 1 ? 'sucesso' : 'neutro'}>{viewQueue.done == 1 ? 'SIM' : 'NÃO'}</Pilula>
                            </Dado>
                            {viewQueue.done == 1 && viewQueue.date_of_realized && (
                                <Dado rotulo="DATA DE REALIZAÇÃO">{format(parseISO(viewQueue.date_of_realized), 'dd/MM/yyyy')}</Dado>
                            )}
                        </div>
                        <AnexosDoRegistro
                            rotulo="do Pedido"
                            salvo
                            anexos={attachments}
                            carregando={isAttachmentsLoading}
                            enviando={isAttachmentUploading}
                            pendentes={[]}
                            aoEnviar={handleUploadAttachment}
                            aoBaixar={handleDownloadAttachment}
                            aoRemover={confirmDeleteAttachment}
                        />
                    </div>
                )}
                <DialogoRodape>
                    <Button variant="outline" onClick={() => setViewQueue(null)}>Fechar</Button>
                </DialogoRodape>
            </Dialogo>
        </div>
    );
};
