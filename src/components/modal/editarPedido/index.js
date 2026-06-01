import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import {
    Box, Button, Stack, TextField, FormControl, InputLabel, Select,
    MenuItem, Divider, Typography, Checkbox, FormControlLabel, Chip, Alert,
} from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import { updatePedidoFetch } from '../../../store/fetchActions/pedidosExame';
import { getAllExames } from '../../../store/fetchActions/exames';
import { getAllMedicos } from '../../../store/fetchActions/medicosSolicitantes';
import { modalPrimaryButtonSx, modalSecondaryButtonSx } from '../_shared/modalFormStyles';

const STATUS_BLOQUEADO = ['liberado', 'cancelado'];

const initFromPedido = (pedido) => ({
    medico_solicitante_id: pedido?.medico_solicitante?.id || '',
    data_pedido: pedido?.data_pedido || '',
    data_coleta: pedido?.data_coleta || '',
    observacoes: pedido?.observacoes || '',
    exames: pedido?.exames?.map(e => e.id) || [],
});

export default function EditarPedidoDialog({ open, onClose, pedido }) {
    const dispatch = useDispatch();
    const { exames } = useSelector(state => state.exames);
    const { medicos } = useSelector(state => state.medicosSolicitantes);

    const [form, setForm] = useState(initFromPedido(pedido));
    const [buscaExame, setBuscaExame] = useState('');

    useEffect(() => {
        if (open) {
            dispatch(getAllExames({ ativo: true, per_page: 200 }));
            dispatch(getAllMedicos({ all: true, ativo: true }));
        }
    }, [open]);

    useEffect(() => {
        setForm(initFromPedido(pedido));
        setBuscaExame('');
    }, [pedido?.id]);

    const bloqueado = STATUS_BLOQUEADO.includes(pedido?.status);

    const change = ({ target }) => setForm(f => ({ ...f, [target.name]: target.value }));

    const toggleExame = (exameId) => {
        setForm(f => ({
            ...f,
            exames: f.exames.includes(exameId)
                ? f.exames.filter(id => id !== exameId)
                : [...f.exames, exameId],
        }));
    };

    const medicosAtivos = medicos.filter(m => m.ativo);

    const examesFiltrados = exames.filter(e =>
        e.nome?.toLowerCase().includes(buscaExame.toLowerCase()) ||
        e.codigo?.toLowerCase().includes(buscaExame.toLowerCase())
    );

    const handleSave = () => {
        dispatch(updatePedidoFetch(pedido.id, form, () => onClose()));
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FeatherIcon icon="edit-2" size={20} />
                Editar Pedido de Exame
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2.5}>
                    {bloqueado && (
                        <Alert severity="warning">
                            Pedidos com status <strong>{pedido?.status}</strong> não podem ser editados.
                        </Alert>
                    )}

                    <FormControl fullWidth disabled={bloqueado}>
                        <InputLabel>Médico Solicitante</InputLabel>
                        <Select
                            name="medico_solicitante_id"
                            value={form.medico_solicitante_id}
                            label="Médico Solicitante"
                            onChange={change}
                        >
                            <MenuItem value=""><em>Nenhum</em></MenuItem>
                            {medicosAtivos.map(m => (
                                <MenuItem key={m.id} value={m.id}>
                                    {m.nome}{m.crm ? ` — CRM ${m.crm}${m.uf_crm ? '/' + m.uf_crm : ''}` : ''}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box display="flex" gap={2}>
                        <TextField
                            label="Data do Pedido"
                            name="data_pedido"
                            type="date"
                            value={form.data_pedido}
                            onChange={change}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            disabled={bloqueado}
                        />
                        <TextField
                            label="Data da Coleta"
                            name="data_coleta"
                            type="date"
                            value={form.data_coleta}
                            onChange={change}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            disabled={bloqueado}
                        />
                    </Box>

                    <TextField
                        label="Observações"
                        name="observacoes"
                        value={form.observacoes}
                        onChange={change}
                        multiline
                        rows={2}
                        fullWidth
                        disabled={bloqueado}
                        inputProps={{ maxLength: 500 }}
                    />

                    <Divider />
                    <Typography variant="h6">Exames</Typography>

                    <TextField
                        size="small"
                        placeholder="Filtrar exames por nome ou código"
                        value={buscaExame}
                        onChange={e => setBuscaExame(e.target.value)}
                        disabled={bloqueado}
                        fullWidth
                    />

                    <Box sx={{ maxHeight: 220, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                        {examesFiltrados.map(exame => (
                            <FormControlLabel
                                key={exame.id}
                                control={
                                    <Checkbox
                                        checked={form.exames.includes(exame.id)}
                                        onChange={() => toggleExame(exame.id)}
                                        disabled={bloqueado}
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography>{exame.nome}</Typography>
                                        <Typography variant="caption" color="text.secondary">{exame.codigo}</Typography>
                                    </Box>
                                }
                                sx={{ display: 'flex', mb: 0.5 }}
                            />
                        ))}
                        {examesFiltrados.length === 0 && (
                            <Typography color="text.secondary" p={1}>Nenhum exame encontrado</Typography>
                        )}
                    </Box>

                    {form.exames.length > 0 && (
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                {form.exames.length} exame(s) selecionado(s):
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                                {exames.filter(e => form.exames.includes(e.id)).map(e => (
                                    <Chip
                                        key={e.id}
                                        label={e.codigo}
                                        size="small"
                                        onDelete={bloqueado ? undefined : () => toggleExame(e.id)}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'flex-end', px: 3, pb: 2.4, gap: 1.2 }}>
                <Button variant="outlined" onClick={onClose} sx={modalSecondaryButtonSx}>
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    color="warning"
                    onClick={handleSave}
                    disabled={bloqueado}
                    sx={modalPrimaryButtonSx}
                >
                    Salvar Alterações
                </Button>
            </DialogActions>
        </Dialog>
    );
}

