import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
} from '@mui/material';
import { upsertDailyStatusFetch } from '../../../store/fetchActions/medicineDailyStatuses';

const EMPTY = {
    medicine_item_id: '',
    reference_date: '',
    availability_status: 'available',
    available_quantity: '',
    restock_forecast_date: '',
    public_note: '',
};

export default function MedicineDailyStatusDialog({ open, onClose, onSuccess }) {
    const dispatch = useDispatch();
    const { medicines } = useSelector(state => state.medicines);
    const [form, setForm] = useState(EMPTY);

    useEffect(() => {
        if (open) {
            setForm({ ...EMPTY, reference_date: new Date().toISOString().slice(0, 10) });
        }
    }, [open]);

    const change = ({ target }) => setForm(f => ({ ...f, [target.name]: target.value }));

    const save = () => {
        dispatch(upsertDailyStatusFetch({
            ...form,
            available_quantity: form.available_quantity === '' ? null : Number(form.available_quantity),
            restock_forecast_date: form.restock_forecast_date || null,
            public_note: form.public_note || null,
        }, onSuccess));
    };

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{ sx: { width: '90%', maxWidth: '700px' } }}>
            <DialogTitle>Atualizar Status Diário</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 1 }}>
                    <Stack spacing={2}>
                        <FormControl fullWidth required>
                            <InputLabel>Medicamento</InputLabel>
                            <Select name="medicine_item_id" value={form.medicine_item_id} label="Medicamento" onChange={change}>
                                {medicines.map((m) => (
                                    <MenuItem key={m.id} value={m.id}>{m.active_ingredient} ({m.internal_code})</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField name="reference_date" label="Data de Referência" type="date" value={form.reference_date} onChange={change} InputLabelProps={{ shrink: true }} fullWidth required />
                        <FormControl fullWidth required>
                            <InputLabel>Disponibilidade</InputLabel>
                            <Select name="availability_status" value={form.availability_status} label="Disponibilidade" onChange={change}>
                                <MenuItem value="available">Disponível</MenuItem>
                                <MenuItem value="unavailable">Indisponível</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField name="available_quantity" type="number" label="Quantidade Disponível" value={form.available_quantity} onChange={change} fullWidth />
                        <TextField name="restock_forecast_date" label="Previsão de Reposição" type="date" value={form.restock_forecast_date} onChange={change} InputLabelProps={{ shrink: true }} fullWidth />
                        <TextField name="public_note" label="Observação Pública" value={form.public_note} onChange={change} fullWidth />
                    </Stack>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="outlined">Cancelar</Button>
                <Button onClick={save} variant="contained">Salvar</Button>
            </DialogActions>
        </Dialog>
    );
}
