import React, { useState, useEffect } from 'react';
import AlertModal from '../../messagesModal';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import {
    Grid,
    Stack,
    TextField,
    Alert,
    Button,
    Typography,
    Divider,
    Box as MuiBox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
} from "@mui/material";
import BaseCard from "../../baseCard/BaseCard";
import ConfirmDialog from '../../confirmDialog';
import { getTextOpenAi, showLetter, editLetter } from '../../../store/ducks/letters';
import { closeModal, changeTitleAlert } from '../../../store/ducks/Layout';
import {
    modalFormRootSx,
    modalPrimaryButtonSx,
    modalSecondaryButtonSx,
    modalShellSx,
} from '../_shared/modalFormStyles';
import {
    editLetterFetch,
    addLetterFetch,
    getTextAI,
    listLetterAttachments,
    uploadLetterAttachment,
    deleteLetterAttachment,
    downloadLetterAttachment,
    getAllLetters
} from '../../../store/fetchActions/letter';
import { api } from '../../../services/api';
import { parseCookies } from 'nookies';

export default function LetterModal(props) {
    const [form, setForm] = useState({ sender: "", recipient: "", subject_matter: "", obs: "", summary: "" });
    const { sender, recipient, subject_matter, obs, summary } = form;
    const { letter, textOpenAi } = useSelector(state => state.letters);
    const { isOpenModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();

    const [alertState, setAlertState] = useState({ visible: false, type: 'success', message: '' });
    const [attachments, setAttachments] = useState([]);
    const [isAttachmentsLoading, setIsAttachmentsLoading] = useState(false);
    const [isAttachmentUploading, setIsAttachmentUploading] = useState(false);
    const [pendingFiles, setPendingFiles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [protocolDialogOpen, setProtocolDialogOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [units, setUnits] = useState([]);
    const [destinationUnitId, setDestinationUnitId] = useState('');
    const [destinationUserId, setDestinationUserId] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [creatingProtocol, setCreatingProtocol] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        subTitle: '',
        confirm: null,
        onConfirm: null,
    });

    const changeItem = ({ target }) => setForm({ ...form, [target.name]: target.value });

    const cleanForm = () => {
        setForm({ sender: "", recipient: "", subject_matter: "", obs: "", summary: "" });
        setAlertState({ visible: false, type: 'success', message: '' });
        setAttachments([]);
        setPendingFiles([]);
        setIsSubmitting(false);
        setProtocolDialogOpen(false);
        setUnits([]);
        setDestinationUnitId('');
        setDestinationUserId('');
        dispatch(getTextOpenAi(""));
        dispatch(closeModal());
        dispatch(showLetter({}));
    };

    const cookies = parseCookies();
    const currentUserId = cookies['sysvendas.id'];
    const currentUsername = cookies['sysvendas.username'];

    const loadAttachments = async (letterId) => {
        setIsAttachmentsLoading(true);
        try {
            const res = await listLetterAttachments(letterId);
            const items = res.data || [];
            setAttachments(items);
            if (letter?.id) {
                const updated = { ...letter, attachments_count: items.length };
                dispatch(editLetter(updated));
                dispatch(showLetter(updated));
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
        if (letter && letter.id) {
            dispatch(changeTitleAlert(`O Ofício ${form.number} foi atualizado com sucesso!`));
            dispatch(editLetterFetch(form, () => {
                setAlertState({ visible: true, type: 'success', message: 'Cadastro atualizado com sucesso.' });
                setIsSubmitting(false);
            }));
            return;
        }

        dispatch(changeTitleAlert('O Ofício foi cadastrado com sucesso!'));
        dispatch(addLetterFetch(form, async () => {}));
    };

    const handleGetTextAI = () => dispatch(getTextAI(form));

    const handlePendingFiles = (event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = '';
        if (files.length) setPendingFiles(files);
    };

    const handleUploadAttachment = async (event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = '';
        if (!files.length || !letter?.id) return;
        setIsAttachmentUploading(true);
        try {
            await uploadLetterAttachment(letter.id, files);
            setAlertState({ visible: true, type: 'success', message: files.length > 1 ? 'Anexos enviados com sucesso.' : 'Anexo enviado com sucesso.' });
            await loadAttachments(letter.id);
            dispatch(getAllLetters());
        } catch (error) {
            setAlertState({ visible: true, type: 'error', message: error?.response?.data?.message || 'Erro ao enviar anexo.' });
        } finally {
            setIsAttachmentUploading(false);
        }
    };

    const handleDeleteAttachment = async (attachmentId) => {
        if (!letter?.id) return;
        try {
            await deleteLetterAttachment(letter.id, attachmentId);
            setAlertState({ visible: true, type: 'success', message: 'Anexo removido com sucesso.' });
            await loadAttachments(letter.id);
            dispatch(getAllLetters());
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
        if (!letter?.id) return;
        try {
            await downloadLetterAttachment(letter.id, attachment);
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

    const isPdfAttachment = (attachment) => {
        const mimeType = String(attachment?.mime_type || '').toLowerCase();
        const fileName = String(attachment?.original_name || '').toLowerCase();
        return mimeType.includes('pdf') || fileName.endsWith('.pdf');
    };

    const hasPdfAttachment = attachments.some(isPdfAttachment);
    const hasPendingPdf = pendingFiles.some((file) => {
        const mimeType = String(file?.type || '').toLowerCase();
        const fileName = String(file?.name || '').toLowerCase();
        return mimeType === 'application/pdf' || fileName.endsWith('.pdf');
    });
    const protocolDisabledReason = letter.has_open_protocol
        ? `Já existe um protocolo aberto vinculado${letter.open_protocol_number ? `: ${letter.open_protocol_number}` : '.'}`
        : !(hasPdfAttachment || hasPendingPdf)
        ? 'Anexe um PDF válido ao ofício antes de criar o protocolo.'
        : '';

    const secretariatOptions = units.filter((unit) => unit?.ativo !== false && unit?.tipo === 'secretaria');
    const destinationUsers = users.filter((item) => {
        if (!destinationUnitId) return false;
        const links = Array.isArray(item?.protocol_units)
            ? item.protocol_units
            : Array.isArray(item?.protocolUnits)
                ? item.protocolUnits
                : [];
        return links.some((link) => {
            if (link?.ativo === false) return false;
            const linkedUnitId = String(link?.protocol_organizational_unit_id ?? link?.unit?.id ?? '');
            return linkedUnitId === String(destinationUnitId);
        });
    });

    const openProtocolDialog = async () => {
        if (letter?.has_open_protocol) {
            setAlertState({ visible: true, type: 'warning', message: protocolDisabledReason });
            return;
        }

        if (!hasPdfAttachment && !hasPendingPdf && letter?.id) {
            try {
                const res = await listLetterAttachments(letter.id);
                const refreshedAttachments = Array.isArray(res.data) ? res.data : [];
                setAttachments(refreshedAttachments);

                if (!refreshedAttachments.some(isPdfAttachment)) {
                    setAlertState({ visible: true, type: 'warning', message: 'Anexe um PDF válido ao ofício antes de criar o protocolo.' });
                    return;
                }
            } catch (error) {
                setAlertState({ visible: true, type: 'error', message: error?.response?.data?.message || 'Não foi possível validar os anexos do ofício.' });
                return;
            }
        }

        if (!letter?.id && !hasPendingPdf) {
            setAlertState({ visible: true, type: 'warning', message: 'Anexe um PDF válido ao ofício antes de criar o protocolo.' });
            return;
        }

        setProtocolDialogOpen(true);
        if (users.length > 0 && units.length > 0) return;
        setLoadingUsers(true);
        try {
            const [usersResponse, unitsResponse] = await Promise.all([
                api.get('/users'),
                api.get('/protocolos/unidades-organizacionais'),
            ]);
            const fetchedUsers = (Array.isArray(usersResponse.data) ? usersResponse.data : []).filter((item) => item.active);
            const fetchedUnits = Array.isArray(unitsResponse.data) ? unitsResponse.data : [];
            setUsers(fetchedUsers);
            setUnits(fetchedUnits);
        } catch (error) {
            setAlertState({ visible: true, type: 'error', message: error?.response?.data?.message || 'Não foi possível carregar os destinatários.' });
        } finally {
            setLoadingUsers(false);
        }
    };

    const persistLetterForProtocol = async () => {
        const payload = {
            ...form,
            id_user: currentUserId,
        };

        let savedLetter = letter;

        if (letter?.id) {
            const { data } = await api.put(`/letters/${letter.id}`, {
                ...payload,
                id: letter.id,
            });
            savedLetter = data?.letter || { ...letter, ...form };
            dispatch(editLetter(savedLetter));
            dispatch(showLetter(savedLetter));
        } else {
            const { data } = await api.post('/letters', payload);
            savedLetter = data?.letter;
            if (savedLetter) {
                savedLetter = {
                    ...savedLetter,
                    user: savedLetter.user || { name: currentUsername },
                };
                dispatch(addLetter(savedLetter));
                dispatch(showLetter(savedLetter));
            }
        }

        if (!savedLetter?.id) {
            throw new Error('Não foi possível salvar o ofício antes de gerar o protocolo.');
        }

        if (pendingFiles.length > 0) {
            await uploadLetterAttachment(savedLetter.id, pendingFiles);
            setPendingFiles([]);
            await loadAttachments(savedLetter.id);
        }

        return savedLetter;
    };

    const createProtocol = async () => {
        if (!destinationUnitId || creatingProtocol || isAttachmentUploading || isSubmitting) return;
        setCreatingProtocol(true);
        try {
            const savedLetter = await persistLetterForProtocol();
            const { data } = await api.post(`/letters/${savedLetter.id}/protocol`, {
                destino_unit_id: destinationUnitId,
                destino_user_id: destinationUserId || null,
            });
            const updated = {
                ...savedLetter,
                has_open_protocol: true,
                open_protocol_id: data?.protocol?.id,
                open_protocol_number: data?.protocol?.numero,
            };
            dispatch(editLetter(updated));
            dispatch(showLetter(updated));
            setProtocolDialogOpen(false);
            setDestinationUnitId('');
            setDestinationUserId('');
            setAlertState({
                visible: true,
                type: 'success',
                message: `${data?.message || 'Protocolo criado com sucesso.'} Número: ${data?.protocol?.numero || '-'}`,
            });
        } catch (error) {
            setAlertState({
                visible: true,
                type: 'error',
                message: error?.response?.data?.message || error?.message || 'Não foi possível criar o protocolo.',
            });
        } finally {
            setCreatingProtocol(false);
        }
    };

    useEffect(() => {
        if (letter && letter.id) setForm(letter);
    }, [letter]);

    useEffect(() => {
        setForm((prev) => ({ ...prev, obs: textOpenAi }));
    }, [textOpenAi]);

    useEffect(() => {
        const finalizeCreate = async () => {
            if (!isSubmitting || !letter?.id) return;
            if (pendingFiles.length > 0) {
                try {
                    await uploadLetterAttachment(letter.id, pendingFiles);
                    setPendingFiles([]);
                    setAlertState({ visible: true, type: 'success', message: 'Cadastro e anexos salvos com sucesso.' });
                } catch (error) {
                    setAlertState({ visible: true, type: 'warning', message: error?.response?.data?.message || 'Cadastro salvo, mas houve erro no upload.' });
                }
            } else {
                setAlertState({ visible: true, type: 'success', message: 'Cadastro salvo com sucesso.' });
            }
            await loadAttachments(letter.id);
            dispatch(getAllLetters());
            setIsSubmitting(false);
        };
        finalizeCreate();
    }, [letter?.id]);

    useEffect(() => {
        if (isOpenModal && letter?.id) loadAttachments(letter.id);
        if (!isOpenModal) setAttachments([]);
    }, [isOpenModal, letter?.id]);

    useEffect(() => {
        if (!destinationUserId) return;
        const stillAvailable = destinationUsers.some((item) => String(item.id) === String(destinationUserId));
        if (!stillAvailable) {
            setDestinationUserId('');
        }
    }, [destinationUserId, destinationUsers]);

    return (
        <div>
            {props.children}
            <Modal keepMounted open={isOpenModal} onClose={cleanForm}>
                <Box className="lab-letter-modal-shell" sx={{ ...modalShellSx, ...modalFormRootSx }}>
                    <AlertModal />
                    <Grid container spacing={0}>
                        <Grid item xs={12} lg={12}>
                            <BaseCard title={letter && letter.id ? "Editar Ofício" : "Enviar Ofício"}>
                                {alertState.visible && (
                                    <Alert sx={{ mb: 2 }} variant="filled" severity={alertState.type} onClose={() => setAlertState({ visible: false, type: 'success', message: '' })}>
                                        {alertState.message}
                                    </Alert>
                                )}

                                <Stack spacing={3}>
                                    <TextField className="lg-search-field" id="sender" label={sender && sender.length > 0 ? `Remetente: ${50 - sender.length} caracteres restantes` : 'Remetente'} variant="outlined" name="sender" value={sender || ''} onChange={changeItem} required inputProps={{ style: { textTransform: "uppercase" }, maxLength: 50 }} />
                                    <TextField className="lg-search-field" id="recipient" label={recipient && recipient.length > 0 ? `Destinatário: ${50 - recipient.length} caracteres restantes` : 'Destinatário'} variant="outlined" name="recipient" value={recipient || ''} onChange={changeItem} required inputProps={{ style: { textTransform: "uppercase" }, maxLength: 50 }} />
                                    <TextField className="lg-search-field" id="subject_matter" label={subject_matter && subject_matter.length > 0 ? `Assunto: ${100 - subject_matter.length} caracteres restantes` : 'Assunto'} variant="outlined" name="subject_matter" multiline value={subject_matter || ''} onChange={changeItem} required inputProps={{ style: { textTransform: "uppercase" }, maxLength: 100 }} />
                                    <TextField className="lg-search-field" id="summary" label={summary && summary.length > 0 ? `Resumo: ${500 - summary.length} caracteres restantes` : 'Resumo'} multiline rows={2} value={summary || ''} name="summary" onChange={changeItem} inputProps={{ style: { textTransform: "uppercase" }, maxLength: 500 }} />
                                    <TextField className="lg-search-field" id="obs" label={obs ? `O modelo gerado pela IA possui ${obs.length} caracteres` : 'Campo destinado a IA'} multiline rows={10} value={obs || ''} disabled name="obs" />
                                </Stack>

                                <br />
                                <Divider />
                                <MuiBox mt={2.5} mb={1}>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Anexos do Ofício</Typography>
                                    {letter?.id ? (
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
                                            <Typography variant="body2" color="text.secondary">Selecione os anexos agora e clique em Gravar. O sistema salva o ofício e envia os arquivos em seguida.</Typography>
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

                                {letter?.id && protocolDisabledReason && (
                                    <Alert severity={letter.has_open_protocol ? 'info' : 'warning'} sx={{ mt: 2 }}>
                                        {protocolDisabledReason}
                                    </Alert>
                                )}

                                <Box sx={{ mt: 2.2, display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
                                    <Button onClick={handleSaveData} variant="contained" sx={modalPrimaryButtonSx} disabled={isSubmitting || isAttachmentUploading}>
                                        {isSubmitting ? 'Salvando...' : 'Gravar'}
                                    </Button>
                                    <Button onClick={handleGetTextAI} variant="contained" color="success" sx={modalPrimaryButtonSx} disabled={isSubmitting}>Gerar um Modelo com IA</Button>
                                    <Button
                                        onClick={openProtocolDialog}
                                        variant="contained"
                                        disabled={Boolean(protocolDisabledReason) || isSubmitting || isAttachmentUploading || creatingProtocol}
                                        title={protocolDisabledReason || 'Criar protocolo usando o PDF anexado ao ofício'}
                                    >
                                        {letter?.has_open_protocol ? 'Protocolo já criado' : 'Criar protocolo'}
                                    </Button>
                                    <Button onClick={cleanForm} variant="outlined" sx={modalSecondaryButtonSx} disabled={isSubmitting}>Cancelar</Button>
                                </Box>
                            </BaseCard>
                        </Grid>
                    </Grid>
                </Box>
            </Modal>
            <Dialog
                open={protocolDialogOpen}
                onClose={() => !creatingProtocol && setProtocolDialogOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Criar protocolo pelo Ofício {letter?.number}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            O mesmo PDF anexado ao ofício será vinculado ao protocolo. Primeiro escolha a secretaria de destino e, se quiser, selecione um usuário dessa secretaria.
                        </Typography>
                        <FormControl fullWidth disabled={loadingUsers || creatingProtocol}>
                            <InputLabel id="letter-protocol-unit-label">Secretaria de destino</InputLabel>
                            <Select
                                labelId="letter-protocol-unit-label"
                                label="Secretaria de destino"
                                value={destinationUnitId}
                                onChange={(event) => setDestinationUnitId(event.target.value)}
                            >
                                {secretariatOptions.map((item) => (
                                    <MenuItem key={item.id} value={item.id}>{item.nome}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth disabled={loadingUsers || creatingProtocol}>
                            <InputLabel id="letter-protocol-destination-label">Usuário de destino</InputLabel>
                            <Select
                                labelId="letter-protocol-destination-label"
                                label="Usuário de destino"
                                value={destinationUserId}
                                onChange={(event) => setDestinationUserId(event.target.value)}
                            >
                                <MenuItem value="">Todos da secretaria</MenuItem>
                                {destinationUsers.map((item) => (
                                    <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {loadingUsers && <CircularProgress size={24} />}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="outlined"
                        onClick={() => setProtocolDialogOpen(false)}
                        disabled={creatingProtocol}
                        sx={modalSecondaryButtonSx}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={createProtocol}
                        disabled={creatingProtocol || loadingUsers || !destinationUnitId}
                    >
                        {creatingProtocol ? 'Criando...' : 'Criar protocolo'}
                    </Button>
                </DialogActions>
            </Dialog>
            <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
        </div>
    );
}
