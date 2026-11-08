import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Camera, Download, Paperclip, Trash2 } from 'lucide-react';
import { addFiscalizacaoFetch, editFiscalizacaoFetch } from '../../../store/fetchActions/fiscalizacoes';
import { getEstabelecimentosSelect } from '../../../store/fetchActions/estabelecimentos';
import {
    listFiscalizacaoAttachments,
    uploadFiscalizacaoAttachments,
    deleteFiscalizacaoAttachment,
    downloadFiscalizacaoAttachment,
} from '../../../services/fiscalizacaoAttachments';
import { Banner } from '../../ui/banner';
import { Button, buttonVariants } from '../../ui/button';
import { CaixaDeMarcacao } from '../../ui/caixa-de-marcacao';
import { FormularioModal } from '../../ui/formulario-modal';
import CampoSecretariaObrigatorio, { useSecretariaObrigatoria } from '../../secretaria/CampoSecretariaObrigatorio';

const RESULTADO_OPTIONS = ['Pendente de apuração', 'Conforme', 'Não conforme', 'Notificação', 'Auto de infração'];

const EMPTY = {
    estabelecimento_id: '',
    data_visita: '',
    resultado: 'Conforme',
    observacoes: '',
    visivel_ao_denunciante: false,
};

// Botão que abre o seletor de arquivos (rótulo + <input type="file"> escondido, acessível por teclado).
function BotaoDeArquivo({ icone: Icone, rotulo, disabled, ...props }) {
    return (
        <label className={`${buttonVariants({ variant: 'outline' })} cursor-pointer has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-primary/25 ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
            <Icone /> {rotulo}
            <input type="file" className="sr-only" disabled={disabled} {...props} />
        </label>
    );
}

export default function FiscalizacaoDialog({ open, onClose, fiscalizacao, onSuccess, onCreateSuccess }) {
    const dispatch = useDispatch();
    const { selectList } = useSelector(state => state.estabelecimentos);
    const [form, setForm] = useState(EMPTY);
    const [localError, setLocalError] = useState('');
    const secretaria = useSecretariaObrigatoria();
    const [attachments, setAttachments] = useState([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (open) {
            dispatch(getEstabelecimentosSelect());
            setLocalError('');
            secretaria.limpar();
            setForm(fiscalizacao
                ? {
                    estabelecimento_id: fiscalizacao.estabelecimento_id || '',
                    data_visita: fiscalizacao.data_visita?.substring(0, 10) || '',
                    resultado: fiscalizacao.resultado || 'Conforme',
                    observacoes: fiscalizacao.observacoes || '',
                    visivel_ao_denunciante: false,
                }
                : EMPTY
            );
            if (fiscalizacao?.id) {
                listFiscalizacaoAttachments(fiscalizacao.id).then(setAttachments).catch(() => setAttachments([]));
            } else {
                setAttachments([]);
            }
        }
    }, [open, fiscalizacao?.id]);

    const change = ({ target: { name, value } }) => setForm(f => ({ ...f, [name]: value }));
    const isDenuncia = fiscalizacao?.origem === 'peticao';

    const handleSalvar = () => {
        setLocalError('');
        const dados = { ...form, observacoes: form.observacoes || null };
        // Denúncia ainda sem estabelecimento cadastrado/visita: não envia campos vazios.
        if (!dados.estabelecimento_id) delete dados.estabelecimento_id;
        if (!dados.data_visita) delete dados.data_visita;
        // A caixa publica a própria observação desta gravação; nunca há um segundo texto.
        if (!isDenuncia || !dados.visivel_ao_denunciante) {
            delete dados.visivel_ao_denunciante;
        }
        if (fiscalizacao?.id) {
            dispatch(editFiscalizacaoFetch(fiscalizacao.id, dados, onSuccess, setLocalError));
        } else {
            if (!secretaria.validar()) return;
            dispatch(addFiscalizacaoFetch({ ...dados, ...secretaria.payload() }, onCreateSuccess || onSuccess, setLocalError, secretaria.tratarErro));
        }
    };

    const handleUpload = async (event) => {
        const input = event.target;
        const files = input.files;
        if (!files || files.length === 0 || !fiscalizacao?.id) return;
        setUploading(true);
        try {
            const result = await uploadFiscalizacaoAttachments(fiscalizacao.id, files);
            setAttachments((current) => [...result.attachments, ...current]);
        } catch (err) {
            setLocalError(err?.response?.data?.message || 'Erro ao enviar anexo.');
        } finally {
            setUploading(false);
            input.value = '';
        }
    };

    const handleRemoveAttachment = async (attachmentId) => {
        if (!fiscalizacao?.id) return;
        try {
            await deleteFiscalizacaoAttachment(fiscalizacao.id, attachmentId);
            setAttachments((current) => current.filter((a) => a.id !== attachmentId));
        } catch (err) {
            setLocalError(err?.response?.data?.message || 'Erro ao remover anexo.');
        }
    };

    const handleDownloadAttachment = async (attachment) => {
        if (!fiscalizacao?.id) return;
        try {
            await downloadFiscalizacaoAttachment(fiscalizacao.id, attachment);
        } catch (err) {
            setLocalError(err?.response?.data?.message || 'Erro ao baixar anexo.');
        }
    };

    const campos = useMemo(() => [
        { name: 'estabelecimento_id', label: 'Estabelecimento', required: !isDenuncia, options: selectList.map(est => ({ value: est.id, label: est.nome_estabelecimento })) },
        { name: 'data_visita', label: 'Data da Visita', type: 'date', required: !isDenuncia, span: 6 },
        { name: 'resultado', label: 'Resultado', required: true, span: 6, vazio: 'Selecione', options: RESULTADO_OPTIONS.map(r => ({ value: r, label: r })) },
        { name: 'observacoes', label: 'Observações (opcional)', rows: 3, max: 2000 },
    ], [isDenuncia, selectList]);

    return (
        <FormularioModal
            aberto={open}
            titulo={fiscalizacao?.id ? 'Editar Fiscalização' : 'Nova Fiscalização'}
            aoFechar={onClose}
            aoGravar={handleSalvar}
            campos={campos}
            valores={form}
            aoMudar={change}
            tamanho="md"
            antes={(
                <div className="mb-4 space-y-3">
                    {!fiscalizacao?.id && <CampoSecretariaObrigatorio controle={secretaria} id="fis-secretaria" />}
                    {localError && <Banner tom="perigo">{localError}</Banner>}
                    {fiscalizacao?.protocolo && <p className="text-sm font-bold">Protocolo: {fiscalizacao.protocolo}</p>}
                    {isDenuncia && (
                        <Banner tom="info">
                            <strong>Denúncia:</strong> {fiscalizacao.assunto || '—'}
                            {fiscalizacao.descricao_denuncia ? ` — ${fiscalizacao.descricao_denuncia}` : ''}
                            <br />
                            Local: {fiscalizacao.local_endereco || '—'}
                            {fiscalizacao.estabelecimento_nome_informado ? ` • Estabelecimento informado: ${fiscalizacao.estabelecimento_nome_informado}` : ''}
                            {fiscalizacao.denunciante_nome ? ` • Denunciante: ${fiscalizacao.denunciante_nome}` : ''}
                            {fiscalizacao.denunciante_contato ? ` (${fiscalizacao.denunciante_contato})` : ''}
                        </Banner>
                    )}
                </div>
            )}
            depois={(
                <div className="mt-4 space-y-4">
                    {isDenuncia && (
                        <CaixaDeMarcacao id="fis-visivel" marcado={form.visivel_ao_denunciante} aoMudar={(v) => setForm(f => ({ ...f, visivel_ao_denunciante: v }))}>
                            Visível ao denunciante
                        </CaixaDeMarcacao>
                    )}

                    {fiscalizacao?.id && (
                        <div>
                            <h3 className="mb-2 font-display text-base font-bold">Fotos e documentos</h3>
                            <div className="flex flex-wrap gap-2">
                                <BotaoDeArquivo icone={Camera} rotulo={uploading ? 'Enviando...' : 'Tirar foto'} disabled={uploading} accept="image/*" capture="environment" onChange={handleUpload} />
                                <BotaoDeArquivo icone={Paperclip} rotulo={uploading ? 'Enviando...' : 'Escolher arquivo'} disabled={uploading} multiple accept="image/*,application/pdf" onChange={handleUpload} />
                            </div>
                            <ul className="mt-3 divide-y divide-border">
                                {attachments.map((a) => (
                                    <li key={a.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                                        <span className="min-w-0 truncate">{a.original_name}</span>
                                        <span className="flex shrink-0 gap-1">
                                            <Button type="button" variant="ghost" size="icon-sm" title="Baixar" aria-label="Baixar" onClick={() => handleDownloadAttachment(a)}><Download /></Button>
                                            <Button type="button" variant="ghost" size="icon-sm" title="Remover" aria-label="Remover" onClick={() => handleRemoveAttachment(a.id)}><Trash2 /></Button>
                                        </span>
                                    </li>
                                ))}
                                {attachments.length === 0 && <li className="py-2 text-sm text-muted-foreground">Nenhum anexo ainda.</li>}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        />
    );
}
