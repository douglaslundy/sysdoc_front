import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Dialog from '@mui/material/Dialog';
import {
    Alert, Box, Button, Checkbox, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack, TextField,
    Typography, List, ListItem, ListItemText, IconButton,
} from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import { modalBackdropSx, modalFormRootSx, modalPrimaryButtonSx, modalSecondaryButtonSx } from '../_shared/modalFormStyles';
import { addFiscalizacaoFetch, editFiscalizacaoFetch } from '../../../store/fetchActions/fiscalizacoes';
import { getEstabelecimentosSelect } from '../../../store/fetchActions/estabelecimentos';
import {
    listFiscalizacaoAttachments,
    uploadFiscalizacaoAttachments,
    deleteFiscalizacaoAttachment,
    downloadFiscalizacaoAttachment,
} from '../../../services/fiscalizacaoAttachments';
import BaseCard from '../../baseCard/BaseCard';

const RESULTADO_OPTIONS = ['Pendente de apuração', 'Conforme', 'Não conforme', 'Notificação', 'Auto de infração'];

const EMPTY = {
    estabelecimento_id: '',
    data_visita: '',
    resultado: 'Conforme',
    observacoes: '',
    visivel_ao_denunciante: false,
    mensagem_publica: '',
};

export default function FiscalizacaoDialog({ open, onClose, fiscalizacao, onSuccess, onCreateSuccess }) {
    const dispatch = useDispatch();
    const { selectList } = useSelector(state => state.estabelecimentos);
    const [form, setForm] = useState(EMPTY);
    const [localError, setLocalError] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (open) {
            dispatch(getEstabelecimentosSelect());
            setLocalError('');
            setForm(fiscalizacao
                ? {
                    estabelecimento_id: fiscalizacao.estabelecimento_id || '',
                    data_visita: fiscalizacao.data_visita?.substring(0, 10) || '',
                    resultado: fiscalizacao.resultado || 'Conforme',
                    observacoes: fiscalizacao.observacoes || '',
                    visivel_ao_denunciante: false,
                    mensagem_publica: '',
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

    const change = ({ target }) => setForm(f => ({ ...f, [target.name]: target.value }));
    const isDenuncia = fiscalizacao?.origem === 'denuncia';

    const handleSalvar = () => {
        setLocalError('');
        const dados = { ...form, observacoes: form.observacoes || null };
        // Denúncia ainda sem estabelecimento cadastrado/visita: não envia campos vazios.
        if (!dados.estabelecimento_id) delete dados.estabelecimento_id;
        if (!dados.data_visita) delete dados.data_visita;
        if (!isDenuncia || !dados.visivel_ao_denunciante) {
            delete dados.visivel_ao_denunciante;
            delete dados.mensagem_publica;
        }
        if (fiscalizacao?.id) {
            dispatch(editFiscalizacaoFetch(fiscalizacao.id, dados, onSuccess, setLocalError));
        } else {
            dispatch(addFiscalizacaoFetch(dados, onCreateSuccess || onSuccess, setLocalError));
        }
    };

    const handleUpload = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0 || !fiscalizacao?.id) return;
        setUploading(true);
        try {
            const result = await uploadFiscalizacaoAttachments(fiscalizacao.id, files);
            setAttachments((current) => [...result.attachments, ...current]);
        } catch (err) {
            setLocalError(err?.response?.data?.message || 'Erro ao enviar anexo.');
        } finally {
            setUploading(false);
            event.target.value = '';
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

    return (
        <Dialog
            open={open}
            onClose={onClose}
            scroll="paper"
            slotProps={{ backdrop: { sx: modalBackdropSx } }}
            PaperProps={{
                className: 'fiscalizacao-dialog-shell',
                sx: {
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    maxHeight: '92vh',
                    width: 'min(700px, 96vw)',
                },
            }}
        >
            <Box sx={{ ...modalFormRootSx, overflowY: 'auto', p: 3.2 }}>
                <BaseCard title={fiscalizacao?.id ? 'Editar Fiscalização' : 'Nova Fiscalização'}>
                    <Stack spacing={2}>
                        {localError && (
                            <Alert severity="error" variant="filled">{localError}</Alert>
                        )}

                        {fiscalizacao?.protocolo && (
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                Protocolo: {fiscalizacao.protocolo}
                            </Typography>
                        )}

                        {isDenuncia && (
                            <Alert severity="info">
                                <strong>Denúncia:</strong> {fiscalizacao.assunto || '—'}
                                {fiscalizacao.descricao_denuncia ? ` — ${fiscalizacao.descricao_denuncia}` : ''}
                                <br />
                                Local: {fiscalizacao.local_endereco || '—'}
                                {fiscalizacao.estabelecimento_nome_informado ? ` • Estabelecimento informado: ${fiscalizacao.estabelecimento_nome_informado}` : ''}
                                {fiscalizacao.denunciante_nome ? ` • Denunciante: ${fiscalizacao.denunciante_nome}` : ''}
                                {fiscalizacao.denunciante_contato ? ` (${fiscalizacao.denunciante_contato})` : ''}
                            </Alert>
                        )}

                        <FormControl fullWidth required={!isDenuncia}>
                            <InputLabel>Estabelecimento</InputLabel>
                            <Select
                                name="estabelecimento_id"
                                value={form.estabelecimento_id}
                                label="Estabelecimento"
                                onChange={change}
                            >
                                {selectList.map(est => (
                                    <MenuItem key={est.id} value={est.id}>
                                        {est.nome_estabelecimento}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Data da Visita"
                            name="data_visita"
                            type="date"
                            value={form.data_visita}
                            onChange={change}
                            required={!isDenuncia}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />

                        <FormControl fullWidth required>
                            <InputLabel>Resultado</InputLabel>
                            <Select
                                name="resultado"
                                value={form.resultado}
                                label="Resultado"
                                onChange={change}
                            >
                                {RESULTADO_OPTIONS.map(r => (
                                    <MenuItem key={r} value={r}>{r}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Observações (opcional)"
                            name="observacoes"
                            value={form.observacoes}
                            onChange={change}
                            fullWidth
                            multiline
                            minRows={3}
                            inputProps={{ maxLength: 2000 }}
                        />

                        {isDenuncia && (
                            <>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={form.visivel_ao_denunciante}
                                            onChange={(event) => setForm(f => ({ ...f, visivel_ao_denunciante: event.target.checked }))}
                                        />
                                    }
                                    label="Informar ao denunciante"
                                />
                                {form.visivel_ao_denunciante && (
                                    <TextField
                                        label="Mensagem visível ao denunciante"
                                        name="mensagem_publica"
                                        value={form.mensagem_publica}
                                        onChange={change}
                                        fullWidth
                                        multiline
                                        minRows={2}
                                        inputProps={{ maxLength: 1000 }}
                                    />
                                )}
                            </>
                        )}

                        {fiscalizacao?.id && (
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                    Fotos e documentos
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                                    <Button
                                        component="label"
                                        variant="outlined"
                                        disabled={uploading}
                                        startIcon={<FeatherIcon icon="camera" width="18" height="18" />}
                                    >
                                        {uploading ? 'Enviando...' : 'Tirar foto'}
                                        <input
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            capture="environment"
                                            onChange={handleUpload}
                                        />
                                    </Button>
                                    <Button
                                        component="label"
                                        variant="outlined"
                                        disabled={uploading}
                                        startIcon={<FeatherIcon icon="paperclip" width="18" height="18" />}
                                    >
                                        {uploading ? 'Enviando...' : 'Escolher arquivo'}
                                        <input
                                            type="file"
                                            hidden
                                            multiple
                                            accept="image/*,application/pdf"
                                            onChange={handleUpload}
                                        />
                                    </Button>
                                </Stack>
                                <List dense>
                                    {attachments.map((a) => (
                                        <ListItem
                                            key={a.id}
                                            secondaryAction={
                                                <>
                                                    <IconButton edge="end" onClick={() => handleDownloadAttachment(a)} title="Baixar" sx={{ mr: 0.5 }}>
                                                        <FeatherIcon icon="download" width="16" height="16" />
                                                    </IconButton>
                                                    <IconButton edge="end" onClick={() => handleRemoveAttachment(a.id)} title="Remover">
                                                        <FeatherIcon icon="trash" width="16" height="16" />
                                                    </IconButton>
                                                </>
                                            }
                                        >
                                            <ListItemText primary={a.original_name} />
                                        </ListItem>
                                    ))}
                                    {attachments.length === 0 && (
                                        <ListItem>
                                            <ListItemText primary="Nenhum anexo ainda." primaryTypographyProps={{ color: 'textSecondary' }} />
                                        </ListItem>
                                    )}
                                </List>
                            </Box>
                        )}
                    </Stack>
                    <Box sx={{ display: 'flex', gap: 1, mt: 2.2, justifyContent: 'flex-end' }}>
                        <Button onClick={onClose} variant="outlined" sx={modalSecondaryButtonSx}>Cancelar</Button>
                        <Button onClick={handleSalvar} variant="contained" sx={{ ...modalPrimaryButtonSx, flex: '0 0 auto', width: 'auto', px: 2.2 }}>Gravar</Button>
                    </Box>
                </BaseCard>
            </Box>
        </Dialog>
    );
}
