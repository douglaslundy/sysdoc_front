import React, { useState, useEffect } from 'react';
import AlertModal from '../../messagesModal';
import { useDispatch, useSelector } from 'react-redux';
import ConfirmDialog from '../../confirmDialog';
import AnexosDoRegistro from '../_shared/AnexosDoRegistro';
import { Banner } from '../../ui/banner';
import { Button } from '../../ui/button';
import { Carregando } from '../../ui/carregando';
import { CampoSelecao, CampoTexto } from '../../ui/campos';
import CampoSecretariaObrigatorio, { useSecretariaObrigatoria } from '../../secretaria/CampoSecretariaObrigatorio';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../../ui/dialogo';
import { getTextOpenAi, showLetter, editLetter, addLetter } from '../../../store/ducks/letters';
import { closeLetterFormModal, changeTitleAlert } from '../../../store/ducks/Layout';
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

const TOM_DO_AVISO = { success: 'sucesso', warning: 'alerta', error: 'perigo', info: 'info' };

export default function LetterModal(props) {
    const [form, setForm] = useState({ sender: "", recipient: "", subject_matter: "", obs: "", summary: "" });
    const { sender, recipient, subject_matter, obs, summary } = form;
    const { letter, textOpenAi } = useSelector(state => state.letters);
    const { isOpenLetterFormModal } = useSelector(state => state.layout);
    const dispatch = useDispatch();

    const secretaria = useSecretariaObrigatoria({ ativo: !letter?.id });
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
        secretaria.limpar();
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
        dispatch(closeLetterFormModal());
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
        if (!secretaria.validar()) return;
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
        dispatch(addLetterFetch({ ...form, ...secretaria.payload() }, async () => {}, (dados) => {
            setIsSubmitting(false);
            secretaria.tratarErro({ response: { data: dados } });
        }));
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
        if (isOpenLetterFormModal && letter?.id) loadAttachments(letter.id);
        if (!isOpenLetterFormModal) setAttachments([]);
    }, [isOpenLetterFormModal, letter?.id]);

    useEffect(() => {
        if (!destinationUserId) return;
        const stillAvailable = destinationUsers.some((item) => String(item.id) === String(destinationUserId));
        if (!stillAvailable) {
            setDestinationUserId('');
        }
    }, [destinationUserId, destinationUsers]);

    const restantes = (valor, max) => (valor && valor.length > 0 ? `${max - valor.length} caracteres restantes` : undefined);

    return (
        <div>
            {props.children}
            <Dialogo aberto={Boolean(isOpenLetterFormModal)} aoFechar={cleanForm} tamanho="lg">
                <AlertModal />
                <DialogoCabecalho>{letter && letter.id ? "Editar Ofício" : "Enviar Ofício"}</DialogoCabecalho>
                {alertState.visible && (
                    <div className="mb-4">
                        <Banner tom={TOM_DO_AVISO[alertState.type]} onDispensar={() => setAlertState({ visible: false, type: 'success', message: '' })}>{alertState.message}</Banner>
                    </div>
                )}
                <form onSubmit={(e) => { e.preventDefault(); handleSaveData(); }}>
                    <div className="grid gap-4">
                        <CampoSecretariaObrigatorio controle={secretaria} id="letter-secretaria" />
                        <CampoTexto id="sender" label="Remetente" name="sender" value={sender || ''} onChange={changeItem} obrigatorio maxLength={50} dica={restantes(sender, 50)} className="uppercase" />
                        <CampoTexto id="recipient" label="Destinatário" name="recipient" value={recipient || ''} onChange={changeItem} obrigatorio maxLength={50} dica={restantes(recipient, 50)} className="uppercase" />
                        <CampoTexto id="subject_matter" label="Assunto" name="subject_matter" multiline rows={2} value={subject_matter || ''} onChange={changeItem} obrigatorio maxLength={100} dica={restantes(subject_matter, 100)} className="uppercase" />
                        <CampoTexto id="summary" label="Resumo" name="summary" multiline rows={2} value={summary || ''} onChange={changeItem} maxLength={500} dica={restantes(summary, 500)} className="uppercase" />
                        <CampoTexto id="obs" label="Campo destinado a IA" name="obs" multiline rows={10} value={obs || ''} disabled readOnly dica={obs ? `O modelo gerado pela IA possui ${obs.length} caracteres` : undefined} />
                    </div>

                    <AnexosDoRegistro
                        rotulo="do Ofício"
                        salvo={Boolean(letter?.id)}
                        anexos={attachments}
                        carregando={isAttachmentsLoading}
                        enviando={isAttachmentUploading}
                        pendentes={pendingFiles}
                        aoEnviar={handleUploadAttachment}
                        aoEscolherPendentes={handlePendingFiles}
                        aoBaixar={handleDownloadAttachment}
                        aoRemover={confirmDeleteAttachment}
                    />

                    {letter?.id && protocolDisabledReason && (
                        <div className="mt-4"><Banner tom={letter.has_open_protocol ? 'info' : 'alerta'}>{protocolDisabledReason}</Banner></div>
                    )}

                    <DialogoRodape>
                        <Button type="button" variant="outline" onClick={cleanForm} disabled={isSubmitting}>Cancelar</Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={openProtocolDialog}
                            disabled={Boolean(protocolDisabledReason) || isSubmitting || isAttachmentUploading || creatingProtocol}
                            title={protocolDisabledReason || 'Criar protocolo usando o PDF anexado ao ofício'}
                        >
                            {letter?.has_open_protocol ? 'Protocolo já criado' : 'Criar protocolo'}
                        </Button>
                        <Button type="button" variant="success" onClick={handleGetTextAI} disabled={isSubmitting}>Gerar um Modelo com IA</Button>
                        <Button type="submit" disabled={isSubmitting || isAttachmentUploading}>{isSubmitting ? 'Salvando...' : 'Gravar'}</Button>
                    </DialogoRodape>
                </form>
            </Dialogo>

            <Dialogo aberto={protocolDialogOpen} aoFechar={() => !creatingProtocol && setProtocolDialogOpen(false)} tamanho="md" elevado>
                <DialogoCabecalho>{`Criar protocolo pelo Ofício ${letter?.number ?? ''}`}</DialogoCabecalho>
                <div className="grid gap-4">
                    <p className="text-sm text-muted-foreground">
                        O mesmo PDF anexado ao ofício será vinculado ao protocolo. Primeiro escolha a secretaria de destino e, se quiser, selecione um usuário dessa secretaria.
                    </p>
                    <CampoSelecao id="letter-protocol-unit" label="Secretaria de destino" disabled={loadingUsers || creatingProtocol} value={destinationUnitId} onChange={(event) => setDestinationUnitId(event.target.value)}>
                        <option value="">Selecione</option>
                        {secretariatOptions.map((item) => (
                            <option key={item.id} value={item.id}>{item.nome}</option>
                        ))}
                    </CampoSelecao>
                    <CampoSelecao id="letter-protocol-user" label="Usuário de destino" disabled={loadingUsers || creatingProtocol} value={destinationUserId} onChange={(event) => setDestinationUserId(event.target.value)}>
                        <option value="">Todos da secretaria</option>
                        {destinationUsers.map((item) => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                    </CampoSelecao>
                    {loadingUsers && <Carregando />}
                </div>
                <DialogoRodape>
                    <Button type="button" variant="outline" onClick={() => setProtocolDialogOpen(false)} disabled={creatingProtocol}>Cancelar</Button>
                    <Button type="button" onClick={createProtocol} disabled={creatingProtocol || loadingUsers || !destinationUnitId}>
                        {creatingProtocol ? 'Criando...' : 'Criar protocolo'}
                    </Button>
                </DialogoRodape>
            </Dialogo>
            <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
        </div>
    );
}
