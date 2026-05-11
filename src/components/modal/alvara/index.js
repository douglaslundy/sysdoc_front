import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import {
    Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography,
} from '@mui/material';
import { addAlvaraFetch, editAlvaraFetch } from '../../../store/fetchActions/alvaras';
import { getEstabelecimentosSelect } from '../../../store/fetchActions/estabelecimentos';

const STATUS_OPTIONS = [
    'Não requerido', 'Dispensado', 'Protocolado', 'Em análise', 'Em exigência',
    'Deferido', 'Indeferido', 'Vigente', 'A vencer', 'Vencido', 'Em renovação',
    'Suspenso', 'Cassado', 'Cancelado', 'Cancelado de ofício', 'Interditado',
];

const EMPTY = {
    estabelecimento_id: '',
    nivel_risco: '',
    status: 'Não requerido',
    data_alvara: '',
    vencimento_alvara: '',
    contato: '',
};

export default function AlvaraDialog({ open, onClose, alvara, onSuccess }) {
    const dispatch = useDispatch();
    const { selectList } = useSelector(state => state.estabelecimentos);
    const [form, setForm] = useState(EMPTY);

    useEffect(() => {
        if (open) {
            dispatch(getEstabelecimentosSelect());
            setForm(alvara
                ? {
                    estabelecimento_id: alvara.estabelecimento_id || '',
                    nivel_risco:        alvara.nivel_risco || '',
                    status:             alvara.status || 'Não requerido',
                    data_alvara:        alvara.data_alvara?.substring(0, 10) || '',
                    vencimento_alvara:  alvara.vencimento_alvara?.substring(0, 10) || '',
                    contato:            alvara.contato || '',
                }
                : EMPTY
            );
        }
    }, [open, alvara?.id]);

    const change = ({ target }) => setForm(f => ({ ...f, [target.name]: target.value }));

    const handleSalvar = () => {
        const dados = {
            ...form,
            vencimento_alvara: form.vencimento_alvara || null,
            contato: form.contato || null,
        };
        if (alvara?.id) {
            dispatch(editAlvaraFetch(alvara.id, dados, onSuccess));
        } else {
            dispatch(addAlvaraFetch(dados, onSuccess));
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { width: '90%', maxWidth: '90%', height: '98vh', overflowY: 'auto' } }}
        >
            <DialogTitle>
                {alvara?.id
                    ? `Editar Alvará — ${alvara.numero_alvara}`
                    : 'Novo Alvará'
                }
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 1 }}>
                    <Stack spacing={2}>
                        {alvara?.id && (
                            <Typography variant="body2" color="textSecondary">
                                Número: <strong>{alvara.numero_alvara}</strong> (gerado automaticamente, não editável)
                            </Typography>
                        )}

                        <FormControl fullWidth required>
                            <InputLabel>Estabelecimento</InputLabel>
                            <Select
                                name="estabelecimento_id"
                                value={form.estabelecimento_id}
                                label="Estabelecimento"
                                onChange={change}
                                disabled={!!alvara?.id}
                            >
                                {selectList.map(est => (
                                    <MenuItem key={est.id} value={est.id}>
                                        {est.nome_estabelecimento}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth required>
                            <InputLabel>Nível de Risco</InputLabel>
                            <Select
                                name="nivel_risco"
                                value={form.nivel_risco}
                                label="Nível de Risco"
                                onChange={change}
                            >
                                <MenuItem value="1">1 — Baixo</MenuItem>
                                <MenuItem value="2">2 — Médio</MenuItem>
                                <MenuItem value="3">3 — Alto</MenuItem>
                                <MenuItem value="N/A">N/A</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                name="status"
                                value={form.status}
                                label="Status"
                                onChange={change}
                            >
                                {STATUS_OPTIONS.map(s => (
                                    <MenuItem key={s} value={s}>{s}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Data do Alvará"
                            name="data_alvara"
                            type="date"
                            value={form.data_alvara}
                            onChange={change}
                            required
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            disabled={!!alvara?.id}
                            helperText={!alvara?.id ? 'O número será gerado automaticamente com base na data' : ''}
                        />

                        <TextField
                            label="Vencimento (opcional)"
                            name="vencimento_alvara"
                            type="date"
                            value={form.vencimento_alvara}
                            onChange={change}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            label="Contato (opcional)"
                            name="contato"
                            value={form.contato}
                            onChange={change}
                            fullWidth
                            inputProps={{ autoComplete: 'off', maxLength: 1000 }}
                        />
                    </Stack>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="outlined">Cancelar</Button>
                <Button onClick={handleSalvar} variant="contained">Gravar</Button>
            </DialogActions>
        </Dialog>
    );
}
