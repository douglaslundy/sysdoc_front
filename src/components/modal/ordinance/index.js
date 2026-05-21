import React, { useState, useEffect } from 'react';
import AlertModal from '../../messagesModal';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import { Grid, Stack, TextField, Alert, Button, FormControl, InputLabel, Select, MenuItem, Typography, Divider, Box as MuiBox } from "@mui/material";
import BaseCard from "../../baseCard/BaseCard";
import ConfirmDialog from '../../confirmDialog';
import { getTextOpenAi, showOrdinance, editOrdinance } from '../../../store/ducks/ordinances';
import { closeModal, changeTitleAlert } from '../../../store/ducks/Layout';
import {
    editOrdinanceFetch,
    addOrdinanceFetch,
    getTextAIOrdinance,
    listOrdinanceAttachments,
    uploadOrdinanceAttachment,
    deleteOrdinanceAttachment,
    downloadOrdinanceAttachment,
    getAllOrdinances
} from '../../../store/fetchActions/ordinances';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: "90%",
    height: "98%",
    bgcolor: 'background.paper',
    border: '0px solid #000',
    boxShadow: 24,
    p: 4,
    overflow: "scroll",
};

const ordinanceTypes = [
    { id: 'normativa', name: 'Normativa' },
    { id: 'ordinatoria', name: 'Ordinatória' },
];

export default function OrdinanceModal(props) {
    const [form, setForm] = useState({
        type: "normativa",
        title: "",
        subject: "",
        summary: "",
        content: "",
        legal_basis: "",
        signatory_name: "",
        signatory_role: "",
        notes: "",
        additional_instructions: ""
    });

    const { type, title, subject, summary, content, legal_basis, signatory_name, signatory_role, notes, additional_instructions } = form;
    const { ordinance, textOpenAi } = useSelector(state => state.ordinances);
    const { isOpenModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();

    const [alertState, setAlertState] = useState({ visible: false, type: 'success', message: '' });
    const [attachments, setAttachments] = useState([]);
    const [isAttachmentsLoading, setIsAttachmentsLoading] = useState(false);
    const [isAttachmentUploading, setIsAttachmentUploading] = useState(false);
    const [pendingFiles, setPendingFiles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        subTitle: '',
        confirm: null,
        onConfirm: null,
    });

    const changeItem = ({ target }) => setForm({ ...form, [target.name]: target.value });

    const cleanForm = () => {
        setForm({
            type: "normativa",
            title: "",
            subject: "",
            summary: "",
            content: "",
            legal_basis: "",
            signatory_name: "",
            signatory_role: "",
            notes: "",
            additional_instructions: ""
        });
        setAlertState({ visible: false, type: 'success', message: '' });
        setPendingFiles([]);
        setAttachments([]);
        setIsSubmitting(false);
        dispatch(getTextOpenAi(""));
        dispatch(closeModal());
        dispatch(showOrdinance({}));
    };

    const loadAttachments = async (ordinanceId) => {
        setIsAttachmentsLoading(true);
        try {
            const res = await listOrdinanceAttachments(ordinanceId);
            const items = res.data || [];
            setAttachments(items);
            if (ordinance?.id) {
                const updated = { ...ordinance, attachments_count: items.length };
                dispatch(editOrdinance(updated));
                dispatch(showOrdinance(updated));
            }
        } catch (error) {
            setAlertState({ visible: true, type: 'warning', message: error?.response?.data?.message || 'Erro ao carregar anexos.' });
        } finally {
            setIsAttachmentsLoading(false);
        }
    };

    const handleSaveData = async () => {
        if (isSubmitting || isAttachmentUploading) return;
        setIsSubmitting(true);
        if (ordinance && ordinance.id) {
            dispatch(changeTitleAlert(`A Portaria ${form.number} foi atualizada com sucesso!`));
            dispatch(editOrdinanceFetch(form, () => {
                setAlertState({ visible: true, type: 'success', message: 'Cadastro atualizado com sucesso.' });
                setIsSubmitting(false);
            }));
            return;
        }
        dispatch(changeTitleAlert('A Portaria foi cadastrada com sucesso!'));
        dispatch(addOrdinanceFetch(form, async () => {}));
    };

    const handleGetTextAI = () => dispatch(getTextAIOrdinance(form));

    const handlePendingFiles = (event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = '';
        if (files.length) setPendingFiles(files);
    };

    const handleUploadAttachment = async (event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = '';
        if (!files.length || !ordinance?.id) return;
        setIsAttachmentUploading(true);
        try {
            await uploadOrdinanceAttachment(ordinance.id, files);
            setAlertState({ visible: true, type: 'success', message: files.length > 1 ? 'Anexos enviados com sucesso.' : 'Anexo enviado com sucesso.' });
            await loadAttachments(ordinance.id);
            dispatch(getAllOrdinances());
        } catch (error) {
            setAlertState({ visible: true, type: 'error', message: error?.response?.data?.message || 'Erro ao enviar anexo.' });
        } finally {
            setIsAttachmentUploading(false);
        }
    };

    const handleDeleteAttachment = async (attachmentId) => {
        if (!ordinance?.id) return;
        try {
            await deleteOrdinanceAttachment(ordinance.id, attachmentId);
            setAlertState({ visible: true, type: 'success', message: 'Anexo removido com sucesso.' });
            await loadAttachments(ordinance.id);
            dispatch(getAllOrdinances());
        } catch (error) {
            setAlertState({ visible: true, type: 'error', message: error?.response?.data?.message || 'Erro ao remover anexo.' });
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
        if (!ordinance?.id) return;
        try {
            await downloadOrdinanceAttachment(ordinance.id, attachment);
        } catch (error) {
            setAlertState({ visible: true, type: 'error', message: error?.response?.data?.message || 'Erro ao baixar anexo.' });
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
        if (ordinance && ordinance.id) setForm({ ...ordinance, additional_instructions: ordinance.additional_instructions || "" });
    }, [ordinance]);

    useEffect(() => {
        setForm(prev => ({ ...prev, content: textOpenAi }));
    }, [textOpenAi]);

    useEffect(() => {
        const finalizeCreate = async () => {
            if (!isSubmitting || !ordinance?.id) return;
            if (pendingFiles.length > 0) {
                try {
                    await uploadOrdinanceAttachment(ordinance.id, pendingFiles);
                    setPendingFiles([]);
                    setAlertState({ visible: true, type: 'success', message: 'Cadastro e anexos salvos com sucesso.' });
                } catch (error) {
                    setAlertState({ visible: true, type: 'warning', message: error?.response?.data?.message || 'Cadastro salvo, mas houve erro no upload.' });
                }
            } else {
                setAlertState({ visible: true, type: 'success', message: 'Cadastro salvo com sucesso.' });
            }
            await loadAttachments(ordinance.id);
            dispatch(getAllOrdinances());
            setIsSubmitting(false);
        };
        finalizeCreate();
    }, [ordinance?.id]);

    useEffect(() => {
        if (isOpenModal && ordinance?.id) loadAttachments(ordinance.id);
        if (!isOpenModal) setAttachments([]);
    }, [isOpenModal, ordinance?.id]);

    return (
        <div>
            {props.children}
            <Modal keepMounted open={isOpenModal} onClose={cleanForm}>
                <Box sx={style}>
                    <AlertModal />
                    <Grid container spacing={0}>
                        <Grid item xs={12} lg={12}>
                            <BaseCard title={ordinance && ordinance.id ? "Editar Portaria" : "Cadastrar Portaria"}>
                                {alertState.visible && (
                                    <Alert sx={{ mb: 2 }} variant="filled" severity={alertState.type} onClose={() => setAlertState({ visible: false, type: 'success', message: '' })}>
                                        {alertState.message}
                                    </Alert>
                                )}

                                <Stack spacing={3}>
                                    <FormControl className="lg-search-field" fullWidth>
                                        <InputLabel id="type-label">Tipo de Portaria</InputLabel>
                                        <Select labelId="type-label" name="type" value={type} label="Tipo de Portaria" onChange={changeItem}>
                                            {ordinanceTypes.map((item) => (<MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>))}
                                        </Select>
                                    </FormControl>
                                    <Typography variant="body2"><strong>Normativa:</strong> use quando a portaria estabelecer regras gerais.<br /><strong>Ordinatória:</strong> use quando tratar de organização interna.</Typography>
                                    <TextField className="lg-search-field" label={title && title.length > 0 ? `Título: ${255 - title.length} caracteres restantes` : 'Título'} name="title" value={title || ''} onChange={changeItem} required inputProps={{ maxLength: 255 }} />
                                    <TextField className="lg-search-field" label={subject && subject.length > 0 ? `Assunto: ${255 - subject.length} caracteres restantes` : 'Assunto'} name="subject" value={subject || ''} onChange={changeItem} required inputProps={{ maxLength: 255 }} />
                                    <TextField className="lg-search-field" label={signatory_name && signatory_name.length > 0 ? `Signatário: ${150 - signatory_name.length} caracteres restantes` : 'Nome do Signatário'} name="signatory_name" value={signatory_name || ''} onChange={changeItem} required inputProps={{ maxLength: 150 }} />
                                    <TextField className="lg-search-field" label={signatory_role && signatory_role.length > 0 ? `Cargo: ${150 - signatory_role.length} caracteres restantes` : 'Cargo do Signatário'} name="signatory_role" value={signatory_role || ''} onChange={changeItem} inputProps={{ maxLength: 150 }} />
                                    <TextField className="lg-search-field" label={summary && summary.length > 0 ? `Resumo: ${1000 - summary.length} caracteres restantes` : 'Resumo'} multiline rows={4} value={summary || ''} name="summary" onChange={changeItem} inputProps={{ maxLength: 1000 }} />
                                    <TextField className="lg-search-field" label="Fundamentação Legal" multiline rows={3} value={legal_basis || ''} name="legal_basis" onChange={changeItem} />
                                    <TextField className="lg-search-field" label="Instruções adicionais para IA" multiline rows={2} value={additional_instructions || ''} name="additional_instructions" onChange={changeItem} />
                                    <TextField className="lg-search-field" label={content ? `O modelo gerado possui ${content.length} caracteres` : 'Conteúdo da portaria'} multiline rows={12} value={content || ''} name="content" onChange={changeItem} />
                                    <TextField className="lg-search-field" label="Observações" multiline rows={3} value={notes || ''} name="notes" onChange={changeItem} />
                                </Stack>

                                <br />
                                <Divider />
                                <MuiBox mt={2.5} mb={1}>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Anexos da Portaria</Typography>
                                    {ordinance?.id ? (
                                        <>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Este registro aceita múltiplos anexos (PDF, JPG, JPEG e PNG).</Typography>
                                            <Button component="label" variant="outlined" size="small" disabled={isAttachmentUploading}>
                                                {isAttachmentUploading ? 'Enviando...' : 'Enviar Anexo(s)'}
                                                <input hidden type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleUploadAttachment} />
                                            </Button>
                                            <MuiBox mt={1.5}>
                                                {isAttachmentsLoading && <Typography color="text.secondary">Carregando anexos...</Typography>}
                                                {!isAttachmentsLoading && attachments.length === 0 && <Typography color="text.secondary">Nenhum anexo enviado.</Typography>}
                                                {!isAttachmentsLoading && attachments.map((attachment) => (
                                                    <MuiBox key={attachment.id} display="flex" alignItems="center" justifyContent="space-between" py={0.7}>
                                                        <MuiBox>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{attachment.original_name}</Typography>
                                                            <Typography variant="caption" color="text.secondary">{attachment.mime_type} | {formatBytes(attachment.size_bytes)}</Typography>
                                                        </MuiBox>
                                                        <MuiBox sx={{ "& button": { ml: 1 } }}>
                                                            <Button variant="outlined" size="small" onClick={() => handleDownloadAttachment(attachment)}>Baixar</Button>
                                                            <Button variant="outlined" color="error" size="small" onClick={() => confirmDeleteAttachment(attachment)}>Remover</Button>
                                                        </MuiBox>
                                                    </MuiBox>
                                                ))}
                                            </MuiBox>
                                        </>
                                    ) : (
                                        <>
                                            <Typography variant="body2" color="text.secondary">Selecione os anexos agora e clique em Gravar. O sistema salva a portaria e envia os arquivos em seguida.</Typography>
                                            <MuiBox mt={1}>
                                                <Button component="label" variant="outlined" size="small">
                                                    Selecionar Anexo(s) (PDF/JPG/PNG)
                                                    <input hidden type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handlePendingFiles} />
                                                </Button>
                                                {pendingFiles.length > 0 && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.8 }}>{pendingFiles.length} arquivo(s) pronto(s) para envio após salvar.</Typography>}
                                            </MuiBox>
                                        </>
                                    )}
                                </MuiBox>

                                <Box sx={{ "& button": { mx: 1 } }}>
                                    <Button onClick={handleSaveData} variant="contained" disabled={isSubmitting || isAttachmentUploading}>
                                        {isSubmitting ? 'Salvando...' : 'Gravar'}
                                    </Button>
                                    <Button onClick={handleGetTextAI} variant="contained" color="success" disabled={isSubmitting}>Gerar um Modelo com IA</Button>
                                    <Button onClick={cleanForm} variant="outlined" disabled={isSubmitting}>Cancelar</Button>
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
