import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import {
    Alert, Button, Chip, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle, Divider, Grid, MenuItem,
    Select, Stack, TextField, Typography,
} from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import BaseCard from '../../baseCard/BaseCard';
import AlertModal from '../../messagesModal';
import { api } from '../../../services/api';
import { turnResultadoModal } from '../../../store/ducks/Layout';
import { clearResultado } from '../../../store/ducks/resultadoExames';
import { salvarCamposFetch, liberarResultadoFetch } from '../../../store/fetchActions/resultadoExames';
import { getAllPedidos } from '../../../store/fetchActions/pedidosExame';
import {
    modalBackdropSx,
    modalFormRootSx,
    modalPrimaryButtonSx,
    modalSecondaryButtonSx,
    modalShellSx,
} from '../_shared/modalFormStyles';

const STATUS_COR = {
    normal: 'success', baixo: 'info', alto: 'error',
    critico: 'secondary', indefinido: 'default',
};

export default function ResultadoModal(props) {
    const dispatch = useDispatch();
    const { isOpenResultadoModal } = useSelector(state => state.layout);
    const { resultado } = useSelector(state => state.resultadoExames);

    const [valoresCampos, setValoresCampos] = useState({});
    const [openConfirm, setOpenConfirm] = useState(false);
    const [credenciais, setCredenciais] = useState(null);

    useEffect(() => {
        if (resultado && resultado.campos) {
            const init = {};
            resultado.campos.forEach(rc => {
                init[rc.exame_campo_id] = {
                    exame_campo_id: rc.exame_campo_id,
                    exame_id:       rc.exame_id,
                    valor_numerico: rc.valor_numerico ?? '',
                    valor_texto:    rc.valor_texto ?? '',
                    observacao:     rc.observacao ?? '',
                };
            });
            setValoresCampos(init);
        }
    }, [resultado?.id]);

    const setCampoValor = (campoId, exameId, field, value) => {
        setValoresCampos(prev => ({
            ...prev,
            [campoId]: { ...prev[campoId], exame_campo_id: campoId, exame_id: exameId, [field]: value },
        }));
    };

    const buildPayload = () => Object.values(valoresCampos).filter(c => c.exame_campo_id);

    const handleDownloadPdf = async () => {
        if (!resultado?.id) return;
        try {
            const res = await api.get(`/laboratorio/resultados/${resultado.id}/pdf`, { responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = `laudo-${resultado.protocolo || resultado.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            // erro tratado pelo interceptor global do api.js
        }
    };

    const handleClose = () => {
        setValoresCampos({});
        setOpenConfirm(false);
        dispatch(clearResultado());
        dispatch(turnResultadoModal());
    };

    const handleSalvar = () => {
        dispatch(salvarCamposFetch(resultado.id, buildPayload()));
    };

    const handleLiberar = () => {
        dispatch(liberarResultadoFetch(resultado.id, (data) => {
            setOpenConfirm(false);
            setCredenciais({ protocolo: data.protocolo, senha: data.senha });
            dispatch(getAllPedidos());
        }));
    };

    const getRef = (campo) => {
        const refs = campo.referencias || [];
        return refs.find(r => r.perfil === 'geral') || refs[0] || null;
    };

    const examesGrouped = resultado?.pedido?.exames || [];
    const jaLiberado = !!resultado?.data_liberacao;

    const temCampoPreenchido = Object.values(valoresCampos).some(c =>
        (c.valor_numerico !== '' && c.valor_numerico !== null && c.valor_numerico !== undefined) ||
        (c.valor_texto && c.valor_texto.trim() !== '')
    );

    const temCampoSalvo = (resultado?.campos?.length ?? 0) > 0;

    return (
        <div>
            {props.children}
            <Modal keepMounted open={isOpenResultadoModal} onClose={handleClose} slotProps={{ backdrop: { sx: modalBackdropSx } }}>
                <Box sx={{ ...modalShellSx, ...modalFormRootSx }}>
                    <AlertModal />
                    <Grid container spacing={0}>
                        <Grid item xs={12}>
                            <BaseCard
                                title={`Resultado — ${resultado?.pedido?.cliente?.name || '...'}`}
                                action={
                                    jaLiberado && (
                                        <Box display="flex" gap={1} alignItems="center">
                                            <Chip label={`Protocolo: ${resultado.protocolo}`} color="success" size="small" />
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<FeatherIcon icon="download" size={14} />}
                                                onClick={handleDownloadPdf}
                                            >
                                                PDF
                                            </Button>
                                        </Box>
                                    )
                                }
                            >
                                {jaLiberado && (
                                    <Alert severity="success" sx={{ mb: 2 }}>
                                        Resultado liberado em {resultado.data_liberacao
                                            ? new Date(resultado.data_liberacao).toLocaleString('pt-BR')
                                            : '—'}.
                                    </Alert>
                                )}

                                {examesGrouped.map(exame => {
                                    const camposAtivos = exame.campos_ativos || exame.camposAtivos || [];
                                    return (
                                        <Box key={exame.id} mb={4}>
                                            <Typography variant="h6" color="primary" gutterBottom>
                                                {exame.nome}
                                            </Typography>
                                            <Stack spacing={2}>
                                                {camposAtivos.map(campo => {
                                                    const val = valoresCampos[campo.id] || {};
                                                    const ref = getRef(campo);
                                                    const rcSalvo = resultado.campos?.find(rc => rc.exame_campo_id === campo.id);

                                                    return (
                                                        <Box key={campo.id} display="flex" alignItems="center" gap={2} flexWrap="wrap">
                                                            <Typography sx={{ minWidth: 160, fontWeight: 500 }}>
                                                                {campo.nome}
                                                                {campo.unidade && (
                                                                    <Typography component="span" variant="caption" color="text.secondary" ml={0.5}>
                                                                        ({campo.unidade})
                                                                    </Typography>
                                                                )}
                                                            </Typography>

                                                            {campo.tipo_valor === 'numerico' && (
                                                                <TextField
                                                                    size="small"
                                                                    type="number"
                                                                    value={val.valor_numerico ?? ''}
                                                                    onChange={e => setCampoValor(campo.id, exame.id, 'valor_numerico', e.target.value)}
                                                                    disabled={jaLiberado}
                                                                    inputProps={{ max: 99999999999, step: 'any' }}
                                                                    sx={{ width: 120 }}
                                                                />
                                                            )}
                                                            {campo.tipo_valor === 'texto' && (
                                                                <TextField
                                                                    size="small"
                                                                    value={val.valor_texto ?? ''}
                                                                    onChange={e => setCampoValor(campo.id, exame.id, 'valor_texto', e.target.value)}
                                                                    disabled={jaLiberado}
                                                                    sx={{ flex: 1, minWidth: 200 }}
                                                                />
                                                            )}
                                                            {campo.tipo_valor === 'booleano' && (
                                                                <Select
                                                                    size="small"
                                                                    value={val.valor_texto ?? ''}
                                                                    onChange={e => setCampoValor(campo.id, exame.id, 'valor_texto', e.target.value)}
                                                                    disabled={jaLiberado}
                                                                    sx={{ width: 160 }}
                                                                >
                                                                    <MenuItem value="">—</MenuItem>
                                                                    <MenuItem value="Reagente">Reagente</MenuItem>
                                                                    <MenuItem value="Não Reagente">Não Reagente</MenuItem>
                                                                </Select>
                                                            )}
                                                            {campo.tipo_valor === 'selecao' && (
                                                                <Select
                                                                    size="small"
                                                                    value={val.valor_texto ?? ''}
                                                                    onChange={e => setCampoValor(campo.id, exame.id, 'valor_texto', e.target.value)}
                                                                    disabled={jaLiberado}
                                                                    sx={{ minWidth: 140 }}
                                                                >
                                                                    <MenuItem value="">—</MenuItem>
                                                                    {(campo.opcoes_selecao || []).map(op => (
                                                                        <MenuItem key={op} value={op}>{op}</MenuItem>
                                                                    ))}
                                                                </Select>
                                                            )}

                                                            {ref && (
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Ref:{' '}
                                                                    {ref.valor_min !== null && ref.valor_max !== null
                                                                        ? `${ref.valor_min} – ${ref.valor_max}`
                                                                        : ref.valor_texto || '—'}
                                                                </Typography>
                                                            )}

                                                            {rcSalvo?.status_referencia && (
                                                                <Chip
                                                                    label={rcSalvo.status_referencia}
                                                                    color={STATUS_COR[rcSalvo.status_referencia] || 'default'}
                                                                    size="small"
                                                                />
                                                            )}
                                                        </Box>
                                                    );
                                                })}
                                            </Stack>
                                            <Divider sx={{ mt: 2 }} />
                                        </Box>
                                    );
                                })}

                                {!jaLiberado && (
                                    <Box mt={2}>
                                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                            <Button
                                                variant="outlined"
                                                onClick={handleSalvar}
                                                disabled={!temCampoPreenchido}
                                                sx={modalSecondaryButtonSx}
                                            >
                                                Salvar Rascunho
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="success"
                                                onClick={() => setOpenConfirm(true)}
                                                disabled={!temCampoSalvo}
                                                title={!temCampoSalvo ? 'Salve o rascunho antes de liberar' : ''}
                                                sx={modalPrimaryButtonSx}
                                            >
                                                Liberar Resultado
                                            </Button>
                                            <Button variant="outlined" onClick={handleClose} sx={modalSecondaryButtonSx}>
                                                Fechar
                                            </Button>
                                        </Box>
                                        {!temCampoSalvo && temCampoPreenchido && (
                                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1, mt: 0.5, display: 'block' }}>
                                                Salve o rascunho para habilitar a liberação.
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                                {jaLiberado && (
                                    <Box mt={2}>
                                        <Button variant="outlined" onClick={handleClose} sx={modalSecondaryButtonSx}>
                                            Fechar
                                        </Button>
                                    </Box>
                                )}
                            </BaseCard>
                        </Grid>
                    </Grid>
                </Box>
            </Modal>

            <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
                <DialogTitle>Confirmar Liberação</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Ao liberar, o resultado ficará disponível para o paciente via protocolo gerado automaticamente. Esta ação não pode ser desfeita.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirm(false)}>Cancelar</Button>
                    <Button variant="contained" color="success" onClick={handleLiberar}>
                        Confirmar Liberação
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={!!credenciais} onClose={() => setCredenciais(null)}>
                <DialogTitle>Resultado Liberado — Dados para o Paciente</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Anote as informações abaixo e repasse ao paciente. A senha não poderá ser recuperada depois.
                    </DialogContentText>
                    <Box display="flex" flexDirection="column" gap={1.5}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" sx={{ minWidth: 80, fontWeight: 600 }}>Protocolo:</Typography>
                            <Chip label={credenciais?.protocolo} color="primary" />
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" sx={{ minWidth: 80, fontWeight: 600 }}>Senha:</Typography>
                            <Chip label={credenciais?.senha} color="warning" />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" onClick={() => setCredenciais(null)}>Entendido</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

