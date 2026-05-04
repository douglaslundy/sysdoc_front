import React, { useEffect, useState } from 'react';
import {
    Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
    DialogTitle, Divider, FormControlLabel, IconButton, MenuItem, Select,
    Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, TextField, Typography, FormControl, InputLabel,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import FeatherIcon from 'feather-icons-react';
import { getCamposDoExame, addCampoFetch, editCampoFetch, removeCampoFetch, reordenarCamposFetch } from '../../../store/fetchActions/exameCampos';
import { showCampo } from '../../../store/ducks/exameCampos';
import { api } from '../../../services/api';
import { addAlertMessage, addMessage, turnAlert } from '../../../store/ducks/Layout';

const CAMPO_INICIAL = { nome: '', descricao: '', tipo_valor: 'numerico', unidade: '', opcoes_selecao: [], obrigatorio: true, ativo: true };
const REF_INICIAL   = { perfil: 'geral', valor_min: '', valor_max: '', valor_texto: '', descricao: '' };

const PERFIS = ['geral', 'adulto_m', 'adulto_f', 'crianca', 'idoso', 'gestante'];
const TIPOS  = ['numerico', 'texto', 'booleano', 'selecao'];

export default function GerenciarCampos() {
    const dispatch = useDispatch();
    const router   = useRouter();
    const { id: exameId } = router.query;
    const { campos } = useSelector(state => state.exameCampos);

    const [campoForm, setCampoForm]     = useState(CAMPO_INICIAL);
    const [campoEditId, setCampoEditId] = useState(null);
    const [openCampo, setOpenCampo]     = useState(false);
    const [openRef, setOpenRef]         = useState(false);
    const [refCampoId, setRefCampoId]   = useState(null);
    const [referencias, setReferencias] = useState([]);
    const [refForm, setRefForm]         = useState(REF_INICIAL);
    const [refEditId, setRefEditId]     = useState(null);

    useEffect(() => {
        if (exameId) dispatch(getCamposDoExame(exameId));
    }, [exameId]);

    const changeCampo = ({ target }) => setCampoForm(f => ({ ...f, [target.name]: target.value }));

    const handleSalvarCampo = () => {
        if (campoEditId) {
            dispatch(editCampoFetch(exameId, campoEditId, campoForm, () => setOpenCampo(false)));
        } else {
            dispatch(addCampoFetch(exameId, campoForm, () => setOpenCampo(false)));
        }
    };

    const handleMoverCampo = (index, dir) => {
        const reordenados = [...campos];
        const alvo = index + dir;
        if (alvo < 0 || alvo >= reordenados.length) return;
        [reordenados[index], reordenados[alvo]] = [reordenados[alvo], reordenados[index]];
        const novaOrdem = reordenados.map(c => c.id);
        dispatch(reordenarCamposFetch(exameId, novaOrdem));
    };

    const abrirReferencias = async (campoId) => {
        setRefCampoId(campoId);
        try {
            const res = await api.get(`/laboratorio/campos/${campoId}/referencias`);
            setReferencias(res.data);
        } catch {
            setReferencias([]);
        }
        setRefForm(REF_INICIAL);
        setRefEditId(null);
        setOpenRef(true);
    };

    const handleSalvarRef = async () => {
        try {
            if (refEditId) {
                const res = await api.put(`/laboratorio/campos/${refCampoId}/referencias/${refEditId}`, refForm);
                setReferencias(refs => refs.map(r => r.id === refEditId ? res.data.referencia : r));
            } else {
                const res = await api.post(`/laboratorio/campos/${refCampoId}/referencias`, refForm);
                setReferencias(refs => [res.data.referencia, ...refs]);
            }
            dispatch(addMessage('Referência salva!'));
            dispatch(turnAlert());
            setRefForm(REF_INICIAL);
            setRefEditId(null);
        } catch (e) {
            dispatch(addAlertMessage(e?.response?.data?.message || 'Erro ao salvar referência'));
        }
    };

    const handleRemoverRef = async (refId) => {
        try {
            await api.delete(`/laboratorio/campos/${refCampoId}/referencias/${refId}`);
            setReferencias(refs => refs.filter(r => r.id !== refId));
        } catch {
            dispatch(addAlertMessage('Erro ao remover referência'));
        }
    };

    return (
        <Card>
            <Box p={2} display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                    <Button size="small" startIcon={<FeatherIcon icon="arrow-left" size={14} />} onClick={() => router.push('/laboratorio/exames')}>
                        Voltar
                    </Button>
                    <Typography variant="h4" component="span" ml={2}>Campos do Exame</Typography>
                </Box>
                <Button variant="contained" startIcon={<FeatherIcon icon="plus" size={16} />} onClick={() => { setCampoForm(CAMPO_INICIAL); setCampoEditId(null); setOpenCampo(true); }}>
                    Novo Campo
                </Button>
            </Box>
            <CardContent sx={{ pt: 0 }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Ordem</TableCell>
                                <TableCell>Nome</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Unidade</TableCell>
                                <TableCell align="center">Status</TableCell>
                                <TableCell align="center">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {campos.map((campo, idx) => (
                                <TableRow key={campo.id} hover>
                                    <TableCell>
                                        <IconButton size="small" onClick={() => handleMoverCampo(idx, -1)} disabled={idx === 0}><FeatherIcon icon="chevron-up" size={14} /></IconButton>
                                        <IconButton size="small" onClick={() => handleMoverCampo(idx, 1)} disabled={idx === campos.length - 1}><FeatherIcon icon="chevron-down" size={14} /></IconButton>
                                    </TableCell>
                                    <TableCell>
                                        <Typography>{campo.nome}</Typography>
                                        {campo.descricao && <Typography variant="caption" color="text.secondary">{campo.descricao}</Typography>}
                                    </TableCell>
                                    <TableCell><Chip label={campo.tipo_valor} size="small" /></TableCell>
                                    <TableCell>{campo.unidade || '—'}</TableCell>
                                    <TableCell align="center">
                                        <Chip label={campo.ativo ? 'Ativo' : 'Inativo'} color={campo.ativo ? 'success' : 'error'} size="small" />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton size="small" title="Editar" onClick={() => { setCampoForm({ nome: campo.nome, descricao: campo.descricao || '', tipo_valor: campo.tipo_valor, unidade: campo.unidade || '', opcoes_selecao: campo.opcoes_selecao || [], obrigatorio: campo.obrigatorio, ativo: campo.ativo }); setCampoEditId(campo.id); setOpenCampo(true); }}>
                                            <FeatherIcon icon="edit-2" size={14} />
                                        </IconButton>
                                        <IconButton size="small" title="Referências" onClick={() => abrirReferencias(campo.id)}>
                                            <FeatherIcon icon="sliders" size={14} />
                                        </IconButton>
                                        <IconButton size="small" color="error" title="Remover" onClick={() => dispatch(removeCampoFetch(exameId, campo.id))}>
                                            <FeatherIcon icon="trash-2" size={14} />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {campos.length === 0 && (
                                <TableRow><TableCell colSpan={6} align="center"><Typography color="text.secondary">Nenhum campo cadastrado</Typography></TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>

            {/* Modal - Campo */}
            <Dialog open={openCampo} onClose={() => setOpenCampo(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{campoEditId ? 'Editar Campo' : 'Novo Campo'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <TextField label="Nome" name="nome" value={campoForm.nome} onChange={changeCampo} required inputProps={{ maxLength: 100 }} />
                        <TextField label="Descrição" name="descricao" value={campoForm.descricao} onChange={changeCampo} inputProps={{ maxLength: 200 }} />
                        <Box display="flex" gap={2}>
                            <FormControl fullWidth>
                                <InputLabel>Tipo de Valor</InputLabel>
                                <Select name="tipo_valor" value={campoForm.tipo_valor} label="Tipo de Valor" onChange={changeCampo}>
                                    {TIPOS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <TextField label="Unidade" name="unidade" value={campoForm.unidade} onChange={changeCampo} inputProps={{ maxLength: 30 }} sx={{ flex: 1 }} />
                        </Box>
                        {campoForm.tipo_valor === 'selecao' && (
                            <TextField
                                label="Opções (separadas por vírgula)"
                                value={campoForm.opcoes_selecao?.join(', ') || ''}
                                onChange={e => setCampoForm(f => ({ ...f, opcoes_selecao: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                            />
                        )}
                        <Box display="flex" gap={2}>
                            <FormControlLabel control={<Switch checked={campoForm.obrigatorio} onChange={e => setCampoForm(f => ({ ...f, obrigatorio: e.target.checked }))} />} label="Obrigatório" />
                            <FormControlLabel control={<Switch checked={campoForm.ativo} onChange={e => setCampoForm(f => ({ ...f, ativo: e.target.checked }))} />} label="Ativo" />
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCampo(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSalvarCampo}>Salvar</Button>
                </DialogActions>
            </Dialog>

            {/* Modal - Referências */}
            <Dialog open={openRef} onClose={() => setOpenRef(false)} maxWidth="md" fullWidth>
                <DialogTitle>Valores de Referência</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <Box display="flex" gap={2} flexWrap="wrap">
                            <FormControl sx={{ minWidth: 140 }}>
                                <InputLabel>Perfil</InputLabel>
                                <Select value={refForm.perfil} label="Perfil" onChange={e => setRefForm(f => ({ ...f, perfil: e.target.value }))}>
                                    {PERFIS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <TextField label="Valor Mín" type="number" value={refForm.valor_min} onChange={e => setRefForm(f => ({ ...f, valor_min: e.target.value }))} sx={{ width: 110 }} />
                            <TextField label="Valor Máx" type="number" value={refForm.valor_max} onChange={e => setRefForm(f => ({ ...f, valor_max: e.target.value }))} sx={{ width: 110 }} />
                            <TextField label="Valor Texto" value={refForm.valor_texto} onChange={e => setRefForm(f => ({ ...f, valor_texto: e.target.value }))} sx={{ flex: 1, minWidth: 140 }} />
                            <Button variant="contained" onClick={handleSalvarRef}>{refEditId ? 'Atualizar' : 'Adicionar'}</Button>
                            {refEditId && <Button onClick={() => { setRefForm(REF_INICIAL); setRefEditId(null); }}>Cancelar</Button>}
                        </Box>
                        <Divider />
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Perfil</TableCell>
                                    <TableCell>Mín</TableCell>
                                    <TableCell>Máx</TableCell>
                                    <TableCell>Texto</TableCell>
                                    <TableCell align="center">Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {referencias.map(ref => (
                                    <TableRow key={ref.id}>
                                        <TableCell><Chip label={ref.perfil} size="small" /></TableCell>
                                        <TableCell>{ref.valor_min ?? '—'}</TableCell>
                                        <TableCell>{ref.valor_max ?? '—'}</TableCell>
                                        <TableCell>{ref.valor_texto || '—'}</TableCell>
                                        <TableCell align="center">
                                            <IconButton size="small" onClick={() => { setRefForm({ perfil: ref.perfil, valor_min: ref.valor_min ?? '', valor_max: ref.valor_max ?? '', valor_texto: ref.valor_texto || '', descricao: ref.descricao || '' }); setRefEditId(ref.id); }}>
                                                <FeatherIcon icon="edit-2" size={14} />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleRemoverRef(ref.id)}>
                                                <FeatherIcon icon="trash-2" size={14} />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {referencias.length === 0 && (
                                    <TableRow><TableCell colSpan={5} align="center"><Typography color="text.secondary">Nenhuma referência cadastrada</Typography></TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRef(false)}>Fechar</Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
}
