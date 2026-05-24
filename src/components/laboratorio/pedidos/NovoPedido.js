import React, { useEffect, useState } from 'react';
import {
    Box, Button, Card, CardContent, Checkbox, Chip, Divider, FormControlLabel,
    Stack, TextField, Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { getClientsSelect } from '../../../store/fetchActions/clients';
import { getAllExames } from '../../../store/fetchActions/exames';
import { addPedidoFetch } from '../../../store/fetchActions/pedidosExame';
import InputSelectClient from '../../inputs/inputSelectClient';

const FORM_INICIAL = {
    client_id: '',
    medico_solicitante: '',
    data_pedido: new Date().toISOString().split('T')[0],
    data_coleta: '',
    observacoes: '',
    exames: [],
};

export default function NovoPedido() {
    const dispatch = useDispatch();
    const router   = useRouter();
    const { clients } = useSelector(state => state.clients);
    const { exames }  = useSelector(state => state.exames);

    const [form, setForm]         = useState(FORM_INICIAL);
    const [busca, setBusca]       = useState('');

    useEffect(() => {
        dispatch(getClientsSelect({ limit: 50 }));
        dispatch(getAllExames({ ativo: true, per_page: 100 }));
    }, []);

    const change = ({ target }) => setForm(f => ({ ...f, [target.name]: target.value }));

    const toggleExame = (exameId) => {
        setForm(f => ({
            ...f,
            exames: f.exames.includes(exameId)
                ? f.exames.filter(id => id !== exameId)
                : [...f.exames, exameId],
        }));
    };

    const examesFiltrados = exames.filter(e =>
        e.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        e.codigo?.toLowerCase().includes(busca.toLowerCase())
    );

    const handleSubmit = () => {
        dispatch(addPedidoFetch(form, () => router.push('/laboratorio/pedidos')));
    };

    return (
        <Card>
            <Box p={2}><Typography variant="h4">Novo Pedido de Exame</Typography></Box>
            <CardContent>
                <Stack spacing={3} maxWidth={700}>
                    <InputSelectClient
                        label="Paciente"
                        name="client_id"
                        clients={clients}
                        value={form.client_id}
                        setClient={(client) => setForm(f => ({ ...f, client_id: client?.id || '' }))}
                        wd="100%"
                    />

                    <TextField
                        className="lg-search-field"
                        label="Médico Solicitante"
                        name="medico_solicitante"
                        value={form.medico_solicitante}
                        onChange={change}
                        inputProps={{ maxLength: 100 }}
                    />

                    <Box display="flex" gap={2}>
                        <TextField className="lg-search-field" label="Data do Pedido" type="date" name="data_pedido" value={form.data_pedido} onChange={change} required InputLabelProps={{ shrink: true }} sx={{ flex: 1 }} />
                        <TextField className="lg-search-field" label="Data da Coleta" type="date" name="data_coleta" value={form.data_coleta} onChange={change} InputLabelProps={{ shrink: true }} sx={{ flex: 1 }} />
                    </Box>

                    <TextField className="lg-search-field" label="Observações" name="observacoes" value={form.observacoes} onChange={change} multiline rows={2} inputProps={{ maxLength: 500 }} />

                    <Divider />
                    <Typography variant="h6">Selecionar Exames</Typography>
                    <TextField className="lg-search-field" placeholder="Filtrar exames" value={busca} onChange={e => setBusca(e.target.value)} />

                    <Box sx={{ maxHeight: 260, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                        {examesFiltrados.map(exame => (
                            <FormControlLabel
                                key={exame.id}
                                control={<Checkbox checked={form.exames.includes(exame.id)} onChange={() => toggleExame(exame.id)} />}
                                label={<Box><Typography>{exame.nome}</Typography><Typography variant="caption" color="text.secondary">{exame.codigo}</Typography></Box>}
                                sx={{ display: 'flex', mb: 0.5 }}
                            />
                        ))}
                        {examesFiltrados.length === 0 && <Typography color="text.secondary" p={1}>Nenhum exame encontrado</Typography>}
                    </Box>

                    {form.exames.length > 0 && (
                        <Box>
                            <Typography variant="caption" color="text.secondary">{form.exames.length} exame(s) selecionado(s):</Typography>
                            <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                                {exames.filter(e => form.exames.includes(e.id)).map(e => (
                                    <Chip key={e.id} label={e.codigo} size="small" onDelete={() => toggleExame(e.id)} />
                                ))}
                            </Box>
                        </Box>
                    )}

                    <Box display="flex" gap={2}>
                        <Button variant="contained" onClick={handleSubmit} disabled={!form.client_id || form.exames.length === 0}>
                            Criar Pedido
                        </Button>
                        <Button variant="outlined" onClick={() => router.push('/laboratorio/pedidos')}>
                            Cancelar
                        </Button>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}
