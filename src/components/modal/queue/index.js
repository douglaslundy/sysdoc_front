import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Banner } from '../../ui/banner';
import { Button } from '../../ui/button';
import { CampoTexto } from '../../ui/campos';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../../ui/dialogo';
import { Interruptor } from '../../ui/interruptor';
import CampoSecretariaObrigatorio, { useSecretariaObrigatoria } from '../../secretaria/CampoSecretariaObrigatorio';
import AnexosDoRegistro from '../_shared/AnexosDoRegistro';
import ConfirmDialog from '../../confirmDialog';
import { showQueue, editQueue } from '../../../store/ducks/queues';
import { closeQueueModal, changeTitleAlert } from '../../../store/ducks/Layout';
import { editQueueFetch, addQueueFetch } from '../../../store/fetchActions/queues';
import {
    listQueueAttachments,
    uploadQueueAttachment,
    deleteQueueAttachment,
    downloadQueueAttachment,
    getQueueById
} from '../../../store/fetchActions/queues';
import InputSelectClient from '../../inputs/inputSelectClient';
import { getClientsSelect } from '../../../store/fetchActions/clients';
import { getAllSpecialities } from '../../../store/fetchActions/specialities';
import Select from '../../inputs/selects';
import protocolPDF from "../../../reports/protocol";
export default function QueueModal(props) {


    const [form, setForm] = useState({
        client: "",
        speciality: "",
        urgency: false,
        obs: "",
    });

    const { speciality, obs } = form;
    const { queue } = useSelector(state => state.queues);
    const { isOpenQueueModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();
    const secretaria = useSecretariaObrigatoria();
    const { clients } = useSelector(state => state.clients);
    const { specialities } = useSelector(state => state.specialities);
    const { specialityOptions } = useSelector(state => state.queues);

    const isEditingExistingQueue = Boolean(form?.id);

    const selectableSpecialities = specialityOptions.length === 0
        ? specialities
        : specialities.filter((s) => {
            const opt = specialityOptions.find((o) => o.id === s.id);
            if (!opt) return false;
            return isEditingExistingQueue ? (opt.can_edit || s.id === form.speciality) : opt.can_insert;
        });

    const [cli, setClient] = useState([]);

    const [alertState, setAlertState] = useState({
        visible: false,
        type: 'success',
        message: '',
    });
    const [attachments, setAttachments] = useState([]);
    const [isAttachmentsLoading, setIsAttachmentsLoading] = useState(false);
    const [isAttachmentUploading, setIsAttachmentUploading] = useState(false);
    const [pendingFiles, setPendingFiles] = useState([]);
    const [isSubmittingQueue, setIsSubmittingQueue] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        subTitle: '',
        confirm: null,
        onConfirm: null,
    });

    const syncQueueSnapshot = async (queueId) => {
        try {
            const res = await getQueueById(queueId);
            const updatedQueue = res.data;

            dispatch(showQueue(updatedQueue));
            dispatch(editQueue(updatedQueue));

            setForm((prev) => ({
                ...prev,
                ...updatedQueue,
                client: updatedQueue.id_client ?? prev.client,
                speciality: updatedQueue.id_specialities ?? prev.speciality,
                urgency: Boolean(updatedQueue.urgency),
                obs: updatedQueue.obs ?? '',
            }));
        } catch (error) {
            // Não deixar essa atualização em segundo plano travar o modal (ver handlePostData/handlePutData,
            // que sempre liberam isSubmittingQueue em um finally mesmo se esta chamada falhar).
        }
    };


    const handleIsUrgency = () => {
        setForm({ ...form, urgency: !form.urgency })
    }

    const changeItem = ({ target }) => {
        setForm({ ...form, [target.name]: target.value });
    };


    const cleanForm = () => {
        setForm({
            client: "",
            speciality: "",
            urgency: false,
            obs: "",
        });
        setAlertState({ visible: false, type: 'success', message: '' });
        setPendingFiles([]);
        secretaria.limpar();
        dispatch(closeQueueModal());
        dispatch(showQueue({}));
    }


    const handleSaveData = async () => {
        if (isSubmittingQueue || isAttachmentUploading) {
            return;
        }
        queue && queue.id ? handlePutData() : handlePostData()
    }

    const handlePostData = async () => {
        if (!secretaria.validar()) return;
        setIsSubmittingQueue(true);
        dispatch(changeTitleAlert(`A especialidade foi inserida com sucesso na fila!`));
        dispatch(addQueueFetch({ ...form, ...secretaria.payload() }, {
            closeOnSuccess: false,
            showGlobalAlert: false,
            showGlobalMessage: false,
            cleanForm,
            onSuccess: async (createdQueue) => {
                try {
                    setAlertState({
                        visible: true,
                        type: 'success',
                        message: 'Cadastro salvo com sucesso.'
                    });
                    dispatch(showQueue(createdQueue));
                    dispatch(editQueue(createdQueue));
                    setForm((prev) => ({
                        ...prev,
                        ...createdQueue,
                        client: createdQueue.id_client,
                        speciality: createdQueue.id_specialities,
                        urgency: Boolean(createdQueue.urgency),
                        obs: createdQueue.obs ?? '',
                    }));

                    if (pendingFiles.length > 0) {
                        try {
                            await uploadQueueAttachment(createdQueue.id, pendingFiles);
                            setAlertState({
                                visible: true,
                                type: 'success',
                                message: pendingFiles.length > 1
                                    ? 'Cadastro e anexos salvos com sucesso.'
                                    : 'Cadastro e anexo salvo com sucesso.'
                            });
                            setPendingFiles([]);
                        } catch (error) {
                            setAlertState({
                                visible: true,
                                type: 'warning',
                                message: error?.response?.data?.message || 'Cadastro salvo, mas houve erro ao enviar anexo(s).'
                            });
                        }
                    } else {
                        setAlertState({
                            visible: true,
                            type: 'success',
                            message: 'Cadastro salvo. Agora você pode anexar arquivos e gerar o recibo.'
                        });
                    }

                    await loadQueueAttachments(createdQueue.id);
                    await syncQueueSnapshot(createdQueue.id);
                } catch (error) {
                    // O registro já foi criado com sucesso (estamos no onSuccess) — uma falha aqui é só na
                    // atualização da tela, nunca deve deixar o modal preso sem poder salvar/cancelar de novo.
                    setAlertState({
                        visible: true,
                        type: 'warning',
                        message: 'Cadastro salvo, mas houve um erro ao atualizar as informações na tela.'
                    });
                } finally {
                    setIsSubmittingQueue(false);
                }
            },
            onError: () => {
                setAlertState({
                    visible: true,
                    type: 'error',
                    message: 'Não foi possível salvar o cadastro na fila. Verifique os dados e tente novamente.'
                });
                setIsSubmittingQueue(false);
            },
        }, secretaria.tratarErro));
    };

    const handlePutData = async () => {
        setIsSubmittingQueue(true);
        dispatch(changeTitleAlert(`A especialidade foi atualizada com sucesso!`));
        dispatch(editQueueFetch(form, {
            closeOnSuccess: false,
            showGlobalAlert: false,
            showGlobalMessage: false,
            cleanForm,
            onSuccess: async (updatedQueue) => {
                try {
                    setAlertState({
                        visible: true,
                        type: 'success',
                        message: 'Cadastro atualizado com sucesso.'
                    });
                    dispatch(showQueue(updatedQueue));
                    dispatch(editQueue(updatedQueue));
                    setForm((prev) => ({
                        ...prev,
                        ...updatedQueue,
                        client: updatedQueue.id_client ?? prev.client,
                        speciality: updatedQueue.id_specialities ?? prev.speciality,
                        urgency: Boolean(updatedQueue.urgency),
                        obs: updatedQueue.obs ?? '',
                    }));
                    await loadQueueAttachments(updatedQueue.id);
                } catch (error) {
                    // O registro já foi atualizado com sucesso (estamos no onSuccess) — uma falha aqui é só na
                    // atualização da tela, nunca deve deixar o modal preso sem poder salvar/cancelar de novo.
                    setAlertState({
                        visible: true,
                        type: 'warning',
                        message: 'Cadastro atualizado, mas houve um erro ao atualizar as informações na tela.'
                    });
                } finally {
                    setIsSubmittingQueue(false);
                }
            },
            onError: () => {
                setAlertState({
                    visible: true,
                    type: 'error',
                    message: 'Não foi possível atualizar o cadastro da fila. Verifique os dados e tente novamente.'
                });
                setIsSubmittingQueue(false);
            },
        }));
    };

    const handleClose = () => {
        cleanForm();
    };

    const loadQueueAttachments = async (queueId) => {
        setIsAttachmentsLoading(true);
        try {
            const res = await listQueueAttachments(queueId);
            setAttachments(res.data || []);
        } catch (error) {
            setAlertState({
                visible: true,
                type: 'warning',
                message: error?.response?.data?.message || 'Erro ao carregar anexos da fila.'
            });
        } finally {
            setIsAttachmentsLoading(false);
        }
    };

    const handleUploadAttachment = async (event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = '';

        if (!files.length || !queue?.id) {
            return;
        }

        setIsAttachmentUploading(true);
        try {
            await uploadQueueAttachment(queue.id, files);
            setAlertState({
                visible: true,
                type: 'success',
                message: files.length > 1 ? 'Anexos enviados com sucesso.' : 'Anexo enviado com sucesso.'
            });
            await loadQueueAttachments(queue.id);
            await syncQueueSnapshot(queue.id);
        } catch (error) {
            setAlertState({
                visible: true,
                type: 'error',
                message: error?.response?.data?.message || 'Erro ao enviar anexo.'
            });
        } finally {
            setIsAttachmentUploading(false);
        }
    };

    const handlePendingFiles = (event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = '';
        if (!files.length) {
            return;
        }
        setPendingFiles(files);
    };

    const handleDeleteAttachment = async (attachmentId) => {
        if (!queue?.id) {
            return;
        }

        try {
            await deleteQueueAttachment(queue.id, attachmentId);
            setAlertState({
                visible: true,
                type: 'success',
                message: 'Anexo removido com sucesso.'
            });
            await loadQueueAttachments(queue.id);
            await syncQueueSnapshot(queue.id);
        } catch (error) {
            setAlertState({
                visible: true,
                type: 'error',
                message: error?.response?.data?.message || 'Erro ao remover anexo.'
            });
        }
    };

    const confirmDeleteAttachment = (attachment) => {
        setConfirmDialog({
            ...confirmDialog,
            isOpen: true,
            title: `Deseja realmente excluir o anexo "${attachment.original_name}"?`,
            subTitle: 'Esta ação não poderá ser desfeita.',
            onConfirm: () => handleDeleteAttachment(attachment.id),
            confirm: null,
        });
    };

    const handleDownloadAttachment = async (attachment) => {
        if (!queue?.id) {
            return;
        }

        try {
            await downloadQueueAttachment(queue.id, attachment);
        } catch (error) {
            setAlertState({
                visible: true,
                type: 'error',
                message: error?.response?.data?.message || 'Erro ao baixar anexo.'
            });
        }
    };

    useEffect(() => {
        if (queue && queue.id) {
            setForm((prev) => ({
                ...prev,
                ...queue,
                client: queue.id_client ?? prev.client,
                speciality: queue.id_specialities ?? prev.speciality,
                urgency: Boolean(queue.urgency),
                obs: queue.obs ?? '',
            }));
        }
    }, [queue]);

    useEffect(() => {
        if (isOpenQueueModal && queue?.id) {
            loadQueueAttachments(queue.id);
        }
        if (!isOpenQueueModal) {
            setAttachments([]);
        }
    }, [isOpenQueueModal, queue?.id]);


    useEffect(() => {
        if (!cli?.id) {
            return;
        }

        setForm((prev) => ({
            ...prev,
            client: cli.id
        }));
    }, [cli?.id]);



    useEffect(() => {
        if (isOpenQueueModal === true) {
            if (clients.length <= 0) {
                dispatch(getClientsSelect({ limit: 50 }));
                dispatch(getAllSpecialities());
            }
        }

        if (isOpenQueueModal === false) {
            setClient({});
            // cleanForm();
        }

    }, [isOpenQueueModal]);

    const fechaBanner = () => setAlertState({ visible: false, type: 'success', message: '' });
    const tomDoAlerta = { success: 'sucesso', warning: 'alerta', error: 'perigo' }[alertState.type] || 'info';

    return (
        <div>
            {props.children}
            <Dialogo aberto={Boolean(isOpenQueueModal)} aoFechar={handleClose} tamanho="lg">
                <DialogoCabecalho>{queue && queue.id ? "Editar Fila" : "Cadastrar na Fila"}</DialogoCabecalho>

                {alertState.visible && (
                    <div className="mb-4">
                        <Banner tom={tomDoAlerta} onDispensar={fechaBanner}>{alertState.message}</Banner>
                    </div>
                )}

                <div className="grid gap-5">
                    {!(queue && queue.id) && <CampoSecretariaObrigatorio controle={secretaria} id="fila-secretaria" />}
                    {isOpenQueueModal && (
                        <InputSelectClient
                            id="client"
                            label="Selecione o cliente"
                            name="client"
                            clients={clients}
                            value={form.client}
                            setClient={setClient}
                            wd="100%"
                        />
                    )}
                    <Select
                        value={speciality}
                        label={'Especialidade'}
                        name={'speciality'}
                        store={selectableSpecialities}
                        changeItem={changeItem}
                        wd={"100%"}
                    />

                    <Interruptor id="fila-urgente" marcado={form.urgency} aoMudar={handleIsUrgency}>
                        {form.urgency ? "Está como Urgente" : "Não está como urgente"}
                    </Interruptor>

                    <CampoTexto
                        id="Obs"
                        label={obs && obs.length > 0 ? `Observações: ${200 - obs.length} caracteres restantes` : 'Observações'}
                        multiline
                        rows={2}
                        className="uppercase"
                        value={obs ? obs : ''}
                        name="obs"
                        onChange={changeItem}
                        maxLength={200}
                    />
                </div>

                <AnexosDoRegistro
                    rotulo="do Pedido"
                    registro="o registro"
                    salvo={Boolean(queue?.id)}
                    anexos={attachments}
                    carregando={isAttachmentsLoading}
                    enviando={isAttachmentUploading}
                    pendentes={pendingFiles}
                    aoEnviar={handleUploadAttachment}
                    aoEscolherPendentes={handlePendingFiles}
                    aoBaixar={handleDownloadAttachment}
                    aoRemover={confirmDeleteAttachment}
                />

                <DialogoRodape>
                    <Button variant="outline" onClick={() => { cleanForm() }} disabled={isSubmittingQueue}>
                        Cancelar
                    </Button>
                    {queue?.id && (
                        <Button variant="success" onClick={() => protocolPDF(queue)}>
                            Gerar Recibo
                        </Button>
                    )}
                    <Button onClick={handleSaveData} disabled={isSubmittingQueue || isAttachmentUploading}>
                        {isSubmittingQueue ? 'Salvando...' : 'Gravar'}
                    </Button>
                </DialogoRodape>
            </Dialogo>
            <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
        </div>
    );
}
