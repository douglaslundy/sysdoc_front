import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import {
    modalFormRootSx,
    modalPrimaryButtonSx,
    modalSecondaryButtonSx,
    modalShellSx,
} from '../_shared/modalFormStyles';
import Modal from '@mui/material/Modal';
import BaseCard from '../../baseCard/BaseCard';
import {
    Grid,
    Stack,
    TextField,
    Alert,
    Button,
    FormGroup,
    FormControlLabel,
    Switch,
    Typography,
    Divider,
    Box as MuiBox
} from "@mui/material";
import ConfirmDialog from '../../confirmDialog';
import { showQueue, editQueue } from '../../../store/ducks/queues';
import { closeModal, changeTitleAlert } from '../../../store/ducks/Layout';
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
    const controlHeight = 40;
    const controlSx = {
        "& .MuiInputBase-root": { height: `${controlHeight}px` },
    };
    const selectControlSx = {
        "& .MuiInputBase-root": { height: `${controlHeight}px` },
        "& .MuiSelect-select": {
            display: "flex",
            alignItems: "center",
            minHeight: "unset",
            height: `${controlHeight}px`,
            boxSizing: "border-box",
        },
    };
    const buttonSx = { height: `${controlHeight}px` };


    const [form, setForm] = useState({
        client: "",
        speciality: "",
        urgency: false,
        obs: "",
    });

    const { speciality, obs } = form;
    const { queue } = useSelector(state => state.queues);
    const { isOpenModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();
    const { clients } = useSelector(state => state.clients);
    const { specialities } = useSelector(state => state.specialities);

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
        dispatch(closeModal());
        dispatch(showQueue({}));
    }


    const handleSaveData = async () => {
        if (isSubmittingQueue || isAttachmentUploading) {
            return;
        }
        queue && queue.id ? handlePutData() : handlePostData()
    }

    const handlePostData = async () => {
        setIsSubmittingQueue(true);
        dispatch(changeTitleAlert(`A especialidade foi inserida com sucesso na fila!`));
        dispatch(addQueueFetch(form, {
            closeOnSuccess: false,
            showGlobalAlert: false,
            showGlobalMessage: false,
            cleanForm,
            onSuccess: async (createdQueue) => {
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
                        message: 'Cadastro salvo. Agora voce pode anexar arquivos e gerar o recibo.'
                    });
                }

                await loadQueueAttachments(createdQueue.id);
                await syncQueueSnapshot(createdQueue.id);
                setIsSubmittingQueue(false);
            },
            onError: () => {
                setAlertState({
                    visible: true,
                    type: 'error',
                    message: 'Nao foi possivel salvar o cadastro na fila. Verifique os dados e tente novamente.'
                });
                setIsSubmittingQueue(false);
            },
        }));
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
                setIsSubmittingQueue(false);
            },
            onError: () => {
                setAlertState({
                    visible: true,
                    type: 'error',
                    message: 'Nao foi possivel atualizar o cadastro da fila. Verifique os dados e tente novamente.'
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
            subTitle: 'Esta acao nao podera ser desfeita.',
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

    const formatBytes = (bytes) => {
        if (!bytes || bytes <= 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
        const value = bytes / (1024 ** idx);
        return `${value.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
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
        if (isOpenModal && queue?.id) {
            loadQueueAttachments(queue.id);
        }
        if (!isOpenModal) {
            setAttachments([]);
        }
    }, [isOpenModal, queue?.id]);


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
        if (isOpenModal === true) {
            if (clients.length <= 0) {
                dispatch(getClientsSelect({ limit: 50 }));
                dispatch(getAllSpecialities());
            }
        }

        if (isOpenModal === false) {
            setClient({});
            // cleanForm();
        }

    }, [isOpenModal]);

    return (
        <div>
            {props.children}
            <Modal
                keepMounted
                open={isOpenModal}
                onClose={handleClose}
                aria-labelledby="keep-mounted-modal-title"
                aria-describedby="keep-mounted-modal-description"
            >
                <Box className="queue-modal-shell" sx={{ ...modalShellSx, ...modalFormRootSx }}>

                    <Grid container spacing={0}>
                        <Grid item xs={12} lg={12}>
                            <BaseCard title={queue && queue.id ? "Editar Fila" : "Cadastrar na Fila"}>
                                {alertState.visible && (
                                    <Alert
                                        sx={{ mb: 2 }}
                                        variant="filled"
                                        severity={alertState.type}
                                        onClose={() => setAlertState({ visible: false, type: 'success', message: '' })}
                                    >
                                        {alertState.message}
                                    </Alert>
                                )}

                                {/* <FormGroup > */}
                                <Stack spacing={3}>

                                    {
                                        isOpenModal &&

                                        <InputSelectClient
                                            id="client"
                                            label="Selecione o cliente"
                                            name="client"
                                            clients={clients}
                                            value={form.client}
                                            setClient={setClient}
                                            wd="100%"
                                        />

                                    }
                                    <Select
                                        value={speciality}
                                        label={'Especialidade'}
                                        name={'speciality'}
                                        store={specialities}
                                        changeItem={changeItem}
                                        wd={"100%"}
                                        selectSx={selectControlSx}
                                    />

                                    <FormGroup>
                                    <FormControlLabel control={<Switch checked={form.urgency}
                                            onClick={handleIsUrgency} />} label={form.urgency ? "Est\u00e1 como Urgente" : "N\u00e3o est\u00e1 como urgente"} />
                                    </FormGroup>

                                    <TextField
                                        id="Obs"
                                        label={obs && obs.length > 0 ? `Observa\u00e7\u00f5es: ${200 - obs.length} caracteres restantes` : 'Observa\u00e7\u00f5es'}
                                        multiline
                                        rows={2}
                                        sx={controlSx}
                                        value={obs ? obs : ''}
                                        name="obs"
                                        // disabled={queue?.id ? true : false}
                                        onChange={changeItem}
                                        inputProps={{
                                            style: {
                                                textTransform: "uppercase"
                                            },
                                            maxLength: 200
                                        }}
                                    />

                                </Stack>
                                {/* </FormGroup> */}
                                <br />

                                <Divider />
                                <MuiBox mt={2.5} mb={1}>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                        Anexos do Pedido
                                    </Typography>
                                    {queue?.id ? (
                                        <>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                Este registro aceita multiplos anexos (PDF, JPG, JPEG e PNG).
                                            </Typography>
                                            <Button component="label" variant="outlined" size="small" disabled={isAttachmentUploading} sx={{ mt: 0.5, ...buttonSx }}>
                                                {isAttachmentUploading ? 'Enviando...' : 'Enviar Anexo(s)'}
                                                <input hidden type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleUploadAttachment} />
                                            </Button>

                                            <MuiBox mt={1.5}>
                                                {isAttachmentsLoading && (
                                                    <Typography color="text.secondary">Carregando anexos...</Typography>
                                                )}
                                                {!isAttachmentsLoading && attachments.length === 0 && (
                                                    <Typography color="text.secondary">Nenhum anexo enviado.</Typography>
                                                )}
                                                {!isAttachmentsLoading && attachments.map((attachment) => (
                                                    <MuiBox key={attachment.id} display="flex" alignItems="center" justifyContent="space-between" py={0.7}>
                                                        <MuiBox>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {attachment.original_name}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {attachment.mime_type} | {formatBytes(attachment.size_bytes)}
                                                            </Typography>
                                                        </MuiBox>
                                                        <MuiBox sx={{ "& button": { ml: 1 } }}>
                                                            <Button variant="outlined" size="small" onClick={() => handleDownloadAttachment(attachment)} sx={buttonSx}>
                                                                Baixar
                                                            </Button>
                                                            <Button variant="outlined" color="error" size="small" onClick={() => confirmDeleteAttachment(attachment)} sx={buttonSx}>
                                                                Remover
                                                            </Button>
                                                        </MuiBox>
                                                    </MuiBox>
                                                ))}
                                            </MuiBox>
                                        </>
                                    ) : (
                                        <>
                                            <Typography variant="body2" color="text.secondary">
                                                Selecione os anexos agora e clique em Gravar. O sistema salva o registro e envia os arquivos em seguida.
                                            </Typography>
                                            <MuiBox mt={1}>
                                                <Button component="label" variant="outlined" size="small" sx={buttonSx}>
                                                    Selecionar Anexo(s) (PDF/JPG/PNG)
                                                    <input hidden type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handlePendingFiles} />
                                                </Button>
                                                {pendingFiles.length > 0 && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.8 }}>
                                                        {pendingFiles.length} arquivo(s) pronto(s) para envio apos salvar.
                                                    </Typography>
                                                )}
                                            </MuiBox>
                                        </>
                                    )}
                                </MuiBox>

                                <Box sx={{ mt: 2.2, display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
                                    <Button onClick={handleSaveData} variant="contained" sx={{ ...modalPrimaryButtonSx, ...buttonSx }} disabled={isSubmittingQueue || isAttachmentUploading}>
                                        {isSubmittingQueue ? 'Salvando...' : 'Gravar'}
                                    </Button>

                                    {queue?.id && (
                                        <Button onClick={() => protocolPDF(queue)} variant="contained" color="success" sx={{ ...modalPrimaryButtonSx, ...buttonSx }}>
                                            Gerar Recibo
                                        </Button>
                                    )}

                                    <Button onClick={() => { cleanForm() }} variant="outlined" sx={{ ...modalSecondaryButtonSx, ...buttonSx }} disabled={isSubmittingQueue}>
                                        Cancelar
                                    </Button>
                                </Box>
                            </BaseCard>
                        </Grid>
                    </Grid>

                </Box>
            </Modal>
            <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
        </div>
    );
}




