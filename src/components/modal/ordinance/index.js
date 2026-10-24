import React, { useState, useEffect } from 'react';
import AlertModal from '../../messagesModal';
import { useDispatch, useSelector } from 'react-redux';
import ConfirmDialog from '../../confirmDialog';
import AnexosDoRegistro from '../_shared/AnexosDoRegistro';
import { Banner } from '../../ui/banner';
import { Button } from '../../ui/button';
import { Carregando } from '../../ui/carregando';
import { CampoSelecao, CampoTexto } from '../../ui/campos';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../../ui/dialogo';
import { getTextOpenAi, showOrdinance, editOrdinance } from '../../../store/ducks/ordinances';
import { closeOrdinanceModal, changeTitleAlert } from '../../../store/ducks/Layout';
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

const TOM_DO_AVISO = { success: 'sucesso', warning: 'alerta', error: 'perigo', info: 'info' };

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
    const { isOpenOrdinanceModal } = useSelector(state => state.layout);
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
        dispatch(closeOrdinanceModal());
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
        if (isOpenOrdinanceModal && ordinance?.id) loadAttachments(ordinance.id);
        if (!isOpenOrdinanceModal) setAttachments([]);
    }, [isOpenOrdinanceModal, ordinance?.id]);

    const restantes = (valor, max) => (valor && valor.length > 0 ? `${max - valor.length} caracteres restantes` : undefined);

    return (
        <div>
            {props.children}
            <Dialogo aberto={Boolean(isOpenOrdinanceModal)} aoFechar={cleanForm} tamanho="xl">
                <AlertModal />
                <DialogoCabecalho>{ordinance && ordinance.id ? "Editar Portaria" : "Cadastrar Portaria"}</DialogoCabecalho>
                {alertState.visible && (
                    <div className="mb-4">
                        <Banner tom={TOM_DO_AVISO[alertState.type]} onDispensar={() => setAlertState({ visible: false, type: 'success', message: '' })}>{alertState.message}</Banner>
                    </div>
                )}
                <form onSubmit={(e) => { e.preventDefault(); handleSaveData(); }}>
                    <div className="grid gap-4">
                        <CampoSelecao id="ordinance-type" label="Tipo de Portaria" name="type" value={type} onChange={changeItem}>
                            {ordinanceTypes.map((item) => (<option key={item.id} value={item.id}>{item.name}</option>))}
                        </CampoSelecao>
                        <p className="text-sm"><strong>Normativa:</strong> use quando a portaria estabelecer regras gerais.<br /><strong>Ordinatória:</strong> use quando tratar de organização interna.</p>
                        <CampoTexto id="ordinance-title" label="Título" name="title" value={title || ''} onChange={changeItem} obrigatorio maxLength={255} dica={restantes(title, 255)} />
                        <CampoTexto id="ordinance-subject" label="Assunto" name="subject" value={subject || ''} onChange={changeItem} obrigatorio maxLength={255} dica={restantes(subject, 255)} />
                        <div className="grid gap-4 md:grid-cols-2">
                            <CampoTexto id="ordinance-signatory" label="Nome do Signatário" name="signatory_name" value={signatory_name || ''} onChange={changeItem} obrigatorio maxLength={150} dica={restantes(signatory_name, 150)} />
                            <CampoTexto id="ordinance-role" label="Cargo do Signatário" name="signatory_role" value={signatory_role || ''} onChange={changeItem} maxLength={150} dica={restantes(signatory_role, 150)} />
                        </div>
                        <CampoTexto id="ordinance-summary" label="Resumo" multiline rows={4} name="summary" value={summary || ''} onChange={changeItem} maxLength={1000} dica={restantes(summary, 1000)} />
                        <CampoTexto id="ordinance-legal" label="Fundamentação Legal" multiline rows={3} name="legal_basis" value={legal_basis || ''} onChange={changeItem} />
                        <CampoTexto id="ordinance-ai" label="Instruções adicionais para IA" multiline rows={2} name="additional_instructions" value={additional_instructions || ''} onChange={changeItem} />
                        <CampoTexto id="ordinance-content" label="Conteúdo da portaria" multiline rows={12} name="content" value={content || ''} onChange={changeItem} dica={content ? `O modelo gerado possui ${content.length} caracteres` : undefined} />
                        <CampoTexto id="ordinance-notes" label="Observações" multiline rows={3} name="notes" value={notes || ''} onChange={changeItem} />
                    </div>

                    <AnexosDoRegistro
                        rotulo="da Portaria"
                        salvo={Boolean(ordinance?.id)}
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
                        <Button type="button" variant="outline" onClick={cleanForm} disabled={isSubmitting}>Cancelar</Button>
                        <Button type="button" variant="success" onClick={handleGetTextAI} disabled={isSubmitting}>Gerar um Modelo com IA</Button>
                        <Button type="submit" disabled={isSubmitting || isAttachmentUploading}>{isSubmitting ? 'Salvando...' : 'Gravar'}</Button>
                    </DialogoRodape>
                </form>
            </Dialogo>
            <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
        </div>
    );
}
