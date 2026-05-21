import React, { useEffect, useState } from 'react';
import {
    Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions,
    DialogContent, DialogContentText, DialogTitle, Divider, MenuItem,
    Select, Stack, TextField, Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import FeatherIcon from 'feather-icons-react';
import { getResultado, salvarCamposFetch, liberarResultadoFetch } from '../../../store/fetchActions/resultadoExames';

const STATUS_COR = { normal: 'success', baixo: 'info', alto: 'error', critico: 'secondary', indefinido: 'default' };

export default function PreencherResultado() {
    const dispatch = useDispatch();
    const router   = useRouter();
    const { resultadoId } = router.query;
    const { resultado } = useSelector(state => state.resultadoExames);

    const [valoresCampos, setValoresCampos] = useState({});
    const [openConfirm, setOpenConfirm]     = useState(false);
    const [protocoloGerado, setProtocoloGerado] = useState(null);

    useEffect(() => {
        if (resultadoId) dispatch(getResultado(resultadoId));
    }, [resultadoId]);

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

    const handleSalvar = () => {
        dispatch(salvarCamposFetch(resultado.id, buildPayload()));
    };

    const handleLiberar = () => {
        dispatch(liberarResultadoFetch(resultado.id, (data) => {
            setProtocoloGerado(data.protocolo);
            setOpenConfirm(false);
        }));
    };

    const examesGrouped = resultado?.pedido?.exames || [];
    const jaLiberado    = !!resultado?.data_liberacao;

    const getRef = (campo) => {
        const refs = campo.referencias || [];
        return refs.find(r => r.perfil === 'geral') || refs[0] || null;
    };

    if (!resultado || !resultado.id) {
        return <Card><CardContent><Typography color="text.secondary">Carregando resultado...</Typography></CardContent></Card>;
    }

    return (
        <Card>
            <Box p={2} display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Box>
                    <Button size="small" startIcon={<FeatherIcon icon="arrow-left" size={14} />} onClick={() => router.push('/laboratorio/pedidos')}>
                        Voltar
                    </Button>
                    <Typography variant="h4" component="span" ml={2}>
                        Resultado — {resultado.pedido?.cliente?.name || '—'}
                    </Typography>
                </Box>
                {jaLiberado ? (
                    <Box display="flex" gap={1}>
                        <Chip label={`Protocolo: ${resultado.protocolo}`} color="success" />
                        <Button
                            variant="outlined"
                            startIcon={<FeatherIcon icon="download" size={16} />}
                            href={`${process.env.NEXT_PUBLIC_API_URL}/laboratorio/resultados/${resultado.id}/pdf`}
                            target="_blank"
                        >
                            Baixar PDF
                        </Button>
                    </Box>
                ) : (
                    <Box display="flex" gap={1}>
                        <Button variant="outlined" onClick={handleSalvar}>Salvar Rascunho</Button>
                        <Button variant="contained" color="success" onClick={() => setOpenConfirm(true)}>Liberar Resultado</Button>
                    </Box>
                )}
            </Box>

            {jaLiberado && (
                <Box px={3} pb={1}>
                    <Alert severity="success">
                        Resultado liberado em {resultado.data_liberacao ? new Date(resultado.data_liberacao).toLocaleString('pt-BR') : '—'}.
                        {protocoloGerado && ` Protocolo: ${protocoloGerado}`}
                    </Alert>
                </Box>
            )}

            <CardContent>
                {examesGrouped.map(exame => {
                    const camposAtivos = exame.campos_ativos || exame.camposAtivos || [];
                    return (
                        <Box key={exame.id} mb={4}>
                            <Typography variant="h6" color="primary" gutterBottom>{exame.nome}</Typography>
                            <Stack spacing={2}>
                                {camposAtivos.map(campo => {
                                    const val = valoresCampos[campo.id] || {};
                                    const ref = getRef(campo);
                                    const rcSalvo = resultado.campos?.find(rc => rc.exame_campo_id === campo.id);

                                    return (
                                        <Box key={campo.id} display="flex" alignItems="center" gap={2} flexWrap="wrap">
                                            <Typography sx={{ minWidth: 160, fontWeight: 500 }}>
                                                {campo.nome}
                                                {campo.unidade && <Typography component="span" variant="caption" color="text.secondary" ml={0.5}>({campo.unidade})</Typography>}
                                            </Typography>

                                            {campo.tipo_valor === 'numerico' && (
                                                <TextField
                                className="lg-search-field"
                                size="small"
                                                    type="number"
                                                    value={val.valor_numerico ?? ''}
                                                    onChange={e => setCampoValor(campo.id, exame.id, 'valor_numerico', e.target.value)}
                                                    disabled={jaLiberado}
                                                    sx={{ width: 120 }}
                                                />
                                            )}
                                            {campo.tipo_valor === 'texto' && (
                                                <TextField
                                className="lg-search-field"
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
                                                    sx={{ width: 120 }}
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
                                                    {(campo.opcoes_selecao || []).map(op => <MenuItem key={op} value={op}>{op}</MenuItem>)}
                                                </Select>
                                            )}

                                            {ref && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Ref: {ref.valor_min !== null ? `${ref.valor_min} – ${ref.valor_max}` : ref.valor_texto || '—'}
                                                </Typography>
                                            )}

                                            {rcSalvo && (
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
            </CardContent>

            {/* Confirmação de liberação */}
            <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
                <DialogTitle>Confirmar Liberação</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Ao liberar, o resultado ficará disponível para o paciente via protocolo e senha gerados automaticamente. Esta ação não pode ser desfeita.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirm(false)}>Cancelar</Button>
                    <Button variant="contained" color="success" onClick={handleLiberar}>Confirmar Liberação</Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
}



